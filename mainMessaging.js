const { BrowserWindow, ipcMain } = require('electron');
const { EventEmitter } = require('events');

class Events extends EventEmitter {}

const eventsInstance = new Events();

/**
 * Initializes the main messaging module by listening to messages from the
 * ipcMain module.
 */
module.exports.initializeMessages = function () {
    ipcMain.on('message', (e, { channel, data }) => {
        eventsInstance.emit(channel, data);
    });
}

/**
 * Will emit a message on a specific channel to a specific window
 * @param {number} windowId 
 * @param {string} channel 
 * @param {any} data 
 */
module.exports.emitToWindow = function (windowId, channel, data) {
    const window = BrowserWindow.fromId(windowId);

    emit(window, channel, data);
}

/**
 * Emits a message on a specific channel to all open windows
 * @param {string} channel 
 * @param {any} data 
 */
module.exports.emitToAllWindows = function (channel, data) {
    const windows = BrowserWindow.getAllWindows();

    windows.forEach(w => emit(w, channel, data));
}

/**
 * Will emit a message on a specific channel to the focused window
 * @param {string} channel 
 * @param {any} data 
 */
module.exports.emitToFocusedWindow = function (channel, data) {
    const window = BrowserWindow.getFocusedWindow();

    emit(window, channel, data);
}

/**
 * Emits events recieved from any renderer thread
 */
module.exports.events = eventsInstance;

function emit(window, channel, data) {
    if (window) {        
        window.webContents.send('message', {
            channel,
            data
        });
    }
}