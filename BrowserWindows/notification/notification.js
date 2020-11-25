import { registerHandlers } from '../messaging.js';
import { select, create } from '../domHelper.js';

// handlers received from preload
const messageHandlers = {
    buildNotification: (data) => {
        console.log('DATA')
        const dataEl = select('.data');

        data.started.forEach(build => {
            const username = build.triggered.user?.username ||
                build.lastChanges.change[0]?.username;

            const text = create('p')
                .text(`Build Started: ${build.number} by ${username} on branch ${build.branchName}`);

            dataEl.append(text.el);
        });

        data.run.forEach(build => {
            const username = build.triggered.user?.username ||
                build.lastChanges.change[0]?.username;

            const text = create('p')
                .text(`Build finished ${build.status} : ${build.number} by ${username} on branch ${build.branchName}`);

            dataEl.append(text.el);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {    
    registerHandlers(messageHandlers);
});