
/**
 * Emit a event from the render thread to the preload
 * @param {string} channel 
 * @param {any} [payload] 
 */
export function emitToPreload(channel, payload) {
    window.postMessage({
        channel,
        payload
    }, '*');
} 

/**
 * @param {Object.<string, Function>} handlers 
 */
export function registerHandlers(handlers) {
    window.addEventListener('message', (e) => {
        const {
            channel,
            payload
        } = e.data;

        if (channel in handlers)
            handlers[channel](payload);
    });
}