const { expect } = require('chai');
const { BuildWatcher, buildWatcherEvents, runningStates } = require('../tasks/build');
const { TeamCity } = require('../TeamCity');
const ElectronStore = require('electron-store');
const sinon = require('sinon');

describe('Build Task', () => {
    /** @type {BuildWatcher} */
    let taskToTest;
    /** @type {TeamCity} */
    let client;
    /** @type {{ selectedProjects: string[], selectedUsers: string[] }} */
    let config;

    beforeEach(() => {
        config = { selectedProjects: [], selectedUsers: [] };
        client = {
            builds() { return Promise.resolve([]); }
        };
        const store = {
            get() { return config; }
        };
        taskToTest = new BuildWatcher(client, store);
    });

    it('should create', () => {
        expect(taskToTest).to.exist;
    });

    it('should default state to stopped', () => {
        expect(taskToTest.state).to.equal(runningStates.stopped);
    });

    describe('setState', () => {
        it('should not emit change event if already on that state', () => {
            taskToTest.setState(runningStates.running);

            const spy = sinon.spy();

            taskToTest.on(buildWatcherEvents.stateChange, spy);

            taskToTest.setState(runningStates.running);

            sinon.assert.notCalled(spy);
        });

        it('should set the state', () => {
            taskToTest.setState(runningStates.running);

            expect(taskToTest.state).to.equal(runningStates.running);
        });

        it('should emit change event with previous value', () => {
            const spy = sinon.spy();

            taskToTest.on(buildWatcherEvents.stateChange, spy);

            taskToTest.setState(runningStates.running);

            sinon.assert.calledOnceWithExactly(spy, {
                from: runningStates.stopped,
                to: runningStates.running
            });
        });
    });

    describe('stop', () => {
        const sandbox = sinon.createSandbox();
        /** @type {sinon.SinonStub} */
        let setTimoutStub;
        /** @type {sinon.SinonStub} */
        let clearTimeoutStub;

        beforeEach(() => {            
            setTimoutStub = sandbox.stub(global, 'setTimeout').returns(55);
            clearTimeoutStub = sandbox.stub(global, 'clearTimeout');
        });

        afterEach(() => sandbox.restore());

        it('should clear any pending timeouts with correct timeoutId', async () => {     
            config.selectedProjects.push(10);

            await taskToTest.checkBuilds();

            taskToTest.stop();

            sinon.assert.calledOnceWithExactly(clearTimeoutStub, 55);
        });

        it('should set the state to stopped', () => {
            taskToTest.setState(runningStates.running);

            taskToTest.stop();

            expect(taskToTest.state).to.equal(runningStates.stopped);
        });
    });

    describe('checkBuilds', () => {
        const sandbox = sinon.createSandbox();
        /** @type {sinon.SinonStub} */
        let setTimoutStub;
        /** @type {sinon.SinonStub} */
        let buildsStub;

        beforeEach(() => {
            setTimoutStub = sandbox.stub(global, 'setTimeout');
            buildsStub = sandbox.stub(client, 'builds');

            buildsStub.resolves([]);
        });

        afterEach(() => sandbox.restore());

        it('should make an api call for every build type id', async () => {
            config.selectedProjects.push(...[10, 20, 30, 40, 50]);

            await taskToTest.checkBuilds();

            expect(buildsStub.callCount, "Expected number of API calls to match number of build type ids").to.equal(5);
        });

        it('should set the state to running before API calls are made', async () => {
            config.selectedProjects.push(10);

            // Should already be set by the time this API call is made
            buildsStub.callsFake(function () {
                expect(taskToTest.state).to.equal(runningStates.running);

                return Promise.resolve([]);
            });

            await taskToTest.checkBuilds();

        });

        it('should trigger the check build check in 10 seconds', async () => {            
            config.selectedProjects.push(10);

            await taskToTest.checkBuilds();

            const timeoutTime = setTimoutStub.firstCall.lastArg;

            expect(timeoutTime, 'Expected timeout time to be 10 seconds').to.equal(10000);
        });

        it('should not trigger the next build check if the state is stopped', async () => {
            config.selectedProjects.push(10);

            buildsStub.callsFake(function () {
                taskToTest.setState(runningStates.stopped);

                return Promise.resolve([]);
            });

            await taskToTest.checkBuilds();

            sinon.assert.notCalled(setTimoutStub);
        });

        it('should set the state to waiting when the next build check is waiting', async () => {
            config.selectedProjects.push(10);

            await taskToTest.checkBuilds();

            expect(taskToTest.state).to.equal(runningStates.waiting);
        });

        it('should filter builds where they where not triggered by configured usernames', async () => {
            const projectOneTestData = {
                id: 10,
                builds: [
                    getBuild(100, 'running', '', { triggeredUsername: 'u1' }),                    
                    getBuild(101, 'finished', '', { triggeredUsername: 'unkown' }),       
                    getBuild(102, 'finished', '', { triggeredUsername: '' }),  
                    getBuild(103, 'finished', '', {})
                ]
            };
            const projectTwoTestData = {
                id: 20,
                builds: [
                    getBuild(200, 'running', '', { triggeredUsername: 'u1' }),
                    getBuild(201, 'running', '', { triggeredUsername: 'unkown' }),
                    getBuild(202, 'running', '', { triggeredUsername: '' }),  
                    getBuild(203, 'finished', '', {})
                ]
            };

            config.selectedProjects.push(...[
                projectOneTestData.id,
                projectTwoTestData.id
            ]);
            config.selectedUsers.push(...['u1', 'u2', 'u3']);

            buildsStub.onCall(0).resolves(projectOneTestData.builds);
            buildsStub.onCall(1).resolves(projectTwoTestData.builds);

            taskToTest.on(buildWatcherEvents.buildCheck, function(data) {
                const buildIds = [...data.started, ...data.running, ...data.run]
                    .map(x => x.id);

                expect(buildIds).to.eql([100, 200]);
            });

            await taskToTest.checkBuilds();
        });

        it('should filter builds where the last change was not triggered by configured usernames', async () => {
            const projectOneTestData = {
                id: 10,
                builds: [
                    getBuild(100, 'running', 'u1'),                    
                    getBuild(101, 'finished', 'unkown'),       
                    getBuild(101, 'finished', '')
                ]
            };
            const projectTwoTestData = {
                id: 20,
                builds: [
                    getBuild(200, 'running', 'u1'),
                    getBuild(201, 'running', 'unkown'),
                    getBuild(202, 'running', '')
                ]
            };

            config.selectedProjects.push(...[
                projectOneTestData.id,
                projectTwoTestData.id
            ]);
            config.selectedUsers.push(...['u1', 'u2', 'u3']);

            buildsStub.onCall(0).resolves(projectOneTestData.builds);
            buildsStub.onCall(1).resolves(projectTwoTestData.builds);

            taskToTest.on(buildWatcherEvents.buildCheck, function(data) {
                const buildIds = [...data.started, ...data.running, ...data.run]
                    .map(x => x.id);

                expect(buildIds).to.eql([100, 200]);
            });

            await taskToTest.checkBuilds();
        });

        it('should group builds as run that are no longer running and were being tracked', async () => {
            // tet
        });

        it('should group builds as started that are running and not being tracked', async () => {

        });

        it('should track builds that are running and not being tracked', async () => {

        });

        it('shou;d group builds as running that are running and are being tracked', async () => {

        });
    });
});

function getBuild(id, state, lastChangeUsername, { triggeredType, triggeredUsername } = {}) {
    const triggered = {
        type: triggeredType || 'user'
    };

    if (triggeredUsername)
        triggered.user = {
            username: triggeredUsername
        };

    return {
        id,
        number: '',
        status: '',
        state: state,
        branchName: '',
        runningInfo: {},
        triggered,
        lastChanges: {
            change: [{
                username: lastChangeUsername
            }]
        }
    }
}