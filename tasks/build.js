const ElectronStore = require('electron-store');

const { EventEmitter } = require('events');
const { TeamCity } = require('../TeamCity');

/**
 * @typedef { Object} BuildRunningInfo
 * @property {number} percentageComplete
 * @property {number} elapsedSeconds
 * @property {number} estimatedTotalSeconds
 * @property {string} currentStageText
 */

 /**
  * @typedef {Object} BuildTriggered
  * @property {string} type
  * @property {{ username: string }} user
  */

/**
 * @typedef {Object} BuildLastChanges
 * @property {{ username:string }[]} change
 */

/**
 * A build object recieved from TeamCity
 * @typedef {Object} Build
 * @property {number} id
 * @property {string} number
 * @property {string} status
 * @property {string} state
 * @property {string} branchName
 * @property {BuildRunningInfo} [runningInfo]
 * @property {BuildTriggered} triggered
 * @property {BuildLastChanges} lastChanges
 */

const runningStates = {
    stopped: 'stopped',
    waiting: 'waiting',
    running: 'running'
}

const buildWatcherEvents = {
    stateChange: 'stateChange',
    buildCheck: 'buildCheck'
};

module.exports.buildWatcherEvents = buildWatcherEvents;

module.exports.runningStates = runningStates;

module.exports.BuildWatcher = class extends EventEmitter {
    #state = runningStates.stopped;
    #timeoutId;
    /** @type {TeamCity} */
    #client;

    /** @type {string[]} */
    #buildTypeIds = [];

    /** @type {string[]} */
    #username = [];

    /** @type {number[]} */
    #trackingBuildIds = []

    /**
     * @param {TeamCity} client 
     * @param {ElectronStore} store
     */
    constructor(client, store) {
        super();

        /** @type {{ selectedProjects: string[], selectedUsers: string[] }} */
        // @ts-ignore
        const config = store.get('buildConfig');

        if (config) {
            this.#buildTypeIds = config.selectedProjects;
            this.#username = config.selectedUsers;
        }

        this.#client = client;
    }

    get state() {
        return this.#state;
    }

    /**
     * @r
     */
    async checkBuilds() {
        this.setState(runningStates.running);

        const tcCalls = this.#buildTypeIds
            .map(id => this.#client.builds(id));

        /** @type {Build[]} */
        const builds = (await Promise.all(tcCalls)).flat();

        const aggregatedBuilds = this._aggregateBuids(builds);

        this.emit(buildWatcherEvents.buildCheck, aggregatedBuilds);

        if (this.#state === runningStates.stopped)
            return;

        this.setState(runningStates.waiting);
        this.#timeoutId = setTimeout(() => {
            this.checkBuilds();
        }, 10000);
    }

    /**
     * @param {Build[]} builds 
     * @returns {{ started: Build[], running: Build[], run: Build[] }}
     */
    _aggregateBuids(builds) {
        /** @type {{ started: Build[], running: Build[], run: Build[] }} */
        const init = {
            running: [],
            run: [],
            started: []
        };

        const aggregated = builds.reduce((accu, cur) => {
            const isRunning = cur.state === 'running',
                isTracking = this.#trackingBuildIds.indexOf(cur.id) !== -1;

            // Don't care for this build as not triggered by a user we want
            if (!this._filterByUser(cur))
                return accu;
                
            if (!isRunning && isTracking) {
                accu.run.push(cur);

                this.#trackingBuildIds.splice(this.#trackingBuildIds.indexOf(cur.id), 1);

            } else if (isRunning && !isTracking) {
                accu.started.push(cur);

                this.#trackingBuildIds.push(cur.id);
            } else if (isRunning) {
                accu.running.push(cur);
            }

            return accu;
        }, init);

        return aggregated;
    }

    /**
     * @param {Build} build 
     * @returns {boolean}
     */
    _filterByUser(build) {
        const username = build.triggered?.user?.username ||
            build.lastChanges.change[0]?.username,
            usernamesSet = !!this.#username.length;

        return !usernamesSet || (username && this.#username.indexOf(username.toLowerCase()) !== -1);
    }

    setState(state) {
        if (this.#state === state)
            return;

        const oldState = this.#state;
        this.#state = state;
            
        this.emit(buildWatcherEvents.stateChange, {
            from: oldState,
            to: state
        });
    }

    start() {
        this.checkBuilds();
    }

    stop() {
        clearTimeout(this.#timeoutId);
        this.setState(runningStates.stopped);
    }
}
