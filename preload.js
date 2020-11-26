/*
    The preload script becomes your bridge between the main process and renderer process

    It can communicate with the main process through IPC messages,
    it can communicate with the renderer process through postMessage

    It cannot access global variables,
    It cannot access the same window object,
    it cannot access the same session storage, indexDB etc
*/

const { ipcRenderer } = require('electron');

function onLoad() {
    window.addEventListener('message', (e) => {
        const {
            channel,
            data
        } = e.data;

        ipcRenderer.send('message', {
            channel,
            data
        });
    });

    ipcRenderer.on('message', (e, payload) => {
        const { 
            channel,
            data
        } = payload;

        window.postMessage({
            channel,
            data
        }, '*');
    });
}

process.once('loaded', onLoad);
