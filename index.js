/*
    Communication is based through a preload script.
    It is isolated from the renderer thread and main thread but can receive messages from both.
    These messages are via IPC Messages and postMessage:

        Main <- IPC Message -> | Preload | <- message events (postMessage) -> Renderer
*/

const { 
    app,
    ipcMain,
    BrowserWindow,
    Notification
} = require('electron');
const path = require('path');
const keytar = require('keytar');

const { BuildWatcher, buildWatcherEvents, runningStates } = require('./tasks/build');

/** @type {BuildWatcher} */
let watcher;

function setupWatcher() {
    watcher.stop();

    watcher
        .removeAllListeners(buildWatcherEvents.stateChange)
        .removeAllListeners(buildWatcherEvents.buildCheck)
        .on(buildWatcherEvents.stateChange, function ({ from, to }) {
            if (from === runningStates.stopped && to === runningStates.running) {
                const notification = {
                    title: 'state change',
                    body: 'Started watching for builds'
                };
            
                new Notification(notification).show();
            }
        })
        .on(buildWatcherEvents.buildCheck, function (data) {
            notificationsWindow.webContents.send('buildNotification', data);
        });

    setTimeout(() => watcher.start(), 1000);
}

app.setAppUserModelId(process.execPath);

const { TeamCity } = require('./TeamCity');

const store = new (require('electron-store'))();

/** @type {TeamCity} */
let client;

let window;
let notificationsWindow;

function displayNotifications() {

    if (!notificationsWindow) {
        notificationsWindow = new BrowserWindow({
            frame: true,
            backgroundColor: 'white', // set colour to enable font anti-aliasing
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                enableRemoteModule: false,
                contextIsolation: true,
                sandbox: true
            }
        });
        
        notificationsWindow.webContents.loadFile('BrowserWindows/notification/notification.html');
    }

    notificationsWindow.showInactive();
    window.close();
}


async function getProjects() {
    const projects = await client.projects();
    
    emitMessageToWindow('projectList', projects.data);
}

// message received from the preload script
const preloadMessageHandlers = {
    saveBuildConfig(e, data) {
        store.set({
            buildConfig: data
        });

        displayNotifications();
    },
    async getUsers() {
        const users = await client.getUsers();

        const mappedUsers = await Promise
            .all(users.map(user => {
                return client.getUserProperty(user.username, 'plugin:vcs:anyVcs:anyVcsRoot')
                    .then((properties = '') => {
                        user.vcsUsernames = properties.split('\n');

                        return user;
                    });
            }));

        emitMessageToWindow('userList', mappedUsers);
    },
    async saveConfig(e, data) {
        const { tcURL, tcToken } = data;

        await keytar.setPassword('tc-api-url', 'tcnotifier', tcURL);
        await keytar.setPassword('tc-api-token', 'tcnotifier', tcToken);
        
        client =  new TeamCity(tcURL);//'https://teamcity.cluster.build.ngiris.io/');
        client.setToken(tcToken);

        watcher = new BuildWatcher(client, store);
        setupWatcher();

        if(!store.has('buildConfig'))
            window.webContents.loadFile('BrowserWindows/configuration/notifications/notificationConfig.html');
        else
            displayNotifications();
    },
    async getProjects () {
        try {
            await getProjects();
        } catch(error) {      
            if ('response' in error) {
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else {
                console.log(error);
            }
        }
    }
}

async function onReady() {
    window = new BrowserWindow({
        backgroundColor: 'white', // set colour to enable font anti-aliasing
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            enableRemoteModule: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    window.loadFile('BrowserWindows/loading.html');

    window.webContents.toggleDevTools();

    for (let handler in preloadMessageHandlers)
        ipcMain.on(handler, preloadMessageHandlers[handler]);

    const loadedConfig = await loadConfig();

    if (!loadedConfig)
        window.webContents.loadFile('BrowserWindows/configuration/teamcity/teamcity.html');
    else if(!store.has('buildConfig'))
        window.webContents.loadFile('BrowserWindows/configuration/notifications/notificationConfig.html');
    else {
        displayNotifications();
        watcher = new BuildWatcher(client, store);
        setupWatcher();
       // checkBuilds();
        //setTimeout(() => 
        //showNotification('Running'), 1000);
    }
}

app.on('ready', onReady);

function emitMessageToWindow(channel, data) {
    if (window)
        window.webContents.send(channel, data);
}

async function loadConfig() {
    const [apiURL, token] = await Promise.all([
        keytar.getPassword('tc-api-url', 'tcnotifier'),
        keytar.getPassword('tc-api-token', 'tcnotifier')
    ]);

    if (!apiURL || !token)
        return false;

    client =  new TeamCity(apiURL);//'https://teamcity.cluster.build.ngiris.io/');
    client.setToken(token);

    return true;
}