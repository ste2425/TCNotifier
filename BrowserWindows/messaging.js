/**
 * Emit a event from the render thread to the preload
 * @param {string} channel 
 * @param {any} [data] 
 */
export function emitToPreload(channel, data) {
    window.postMessage({
        channel,
        data
    }, '*');
} 

/**
 * @param {Object.<string, Function>} handlers 
 */
export function registerHandlers(handlers) {
    window.addEventListener('message', (e) => {
        const {
            channel,
            data
        } = e.data;

        if (channel in handlers)
            handlers[channel](data);
    });
}