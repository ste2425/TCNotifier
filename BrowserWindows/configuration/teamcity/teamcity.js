import { emitToPreload, registerHandlers } from '../../messaging.js';

const preloadMessageHandlers = {
    saveConfigResponse() {
        document.querySelector('[type="submit"]').removeAttribute('disabled');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onLoad();

    registerHandlers(preloadMessageHandlers);
});


function onLoad() {
    document.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();

        document.querySelector('[type="submit"]').setAttribute('disabled', 'disabled');

        const data = new FormData(e.target);

        emitToPreload('saveConfig', {
            tcURL: data.get('tcURL'),
            tcToken: data.get('tcToken')
        });
    });
}
