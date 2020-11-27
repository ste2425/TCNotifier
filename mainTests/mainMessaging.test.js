const mainMessaging = require('../mainMessaging');
const sinon = require('sinon');
const { ipcMain, BrowserWindow } = require('electron');
const { expect } = require('chai');


describe('Build Task', () => {
    const sandbox = sinon.createSandbox();
    
    /** @type {sinon.SinonStub} */
    let ipcMainStub;

    afterEach(() => sandbox.restore());

    beforeEach(() => {
        ipcMainStub = sandbox.stub(ipcMain, 'on');
    });

    describe('initializeMessages', () => {
        it('should listen to messages of the correct type from ipcMain', () => {
            mainMessaging.initializeMessages();

            sinon.assert.calledOnce(ipcMainStub);
            const type = ipcMainStub.firstCall.args[0];

            expect(type).to.equal('message');
        });

        describe('events', () => {
            it('should emit events on the correct channel based on messages recieves from ipcMain', () => {
                mainMessaging.initializeMessages();

                const ipcMainHandler = ipcMainStub.firstCall.args[1];

                const eventHandler = sinon.spy();

                mainMessaging.events.on('testChannel', eventHandler);

                ipcMainHandler({}, { channel: 'testChannel', data: 50 });

                sinon.assert.calledOnceWithExactly(eventHandler, 50);
            });
        });
    });
    
    describe('emitToWindow', () => {
        /** @type {sinon.SinonStub} */
        let bwFromIdStub;

        beforeEach(() => bwFromIdStub = sandbox.stub(BrowserWindow, 'fromId'));

        it('should emit to correct window', () => {
            bwFromIdStub.returns(getFakeWindow());

            mainMessaging.emitToWindow(10, 'testChannel', {});

            sinon.assert.calledOnceWithExactly(bwFromIdStub, 10);
        });

        it('should emit message in correct structure', () => {
            const fakeWindow = getFakeWindow();

            bwFromIdStub.returns(fakeWindow);

            mainMessaging.emitToWindow(0, 'testChannel', {
                test: 'data'
            });

            sinon.assert.calledOnceWithExactly(fakeWindow.webContents.send, 'message', {
                channel: 'testChannel',
                data: {
                    test: 'data'
                }
            });
        });
    });

    describe('emitToAllWindows', () => {
        /** @type {sinon.SinonStub} */
        let bwGetAllWindowsStub;

        beforeEach(() => bwGetAllWindowsStub = sandbox.stub(BrowserWindow, 'getAllWindows'));

        it('should emit message against all windows', () => {
            const windows = [getFakeWindow(), getFakeWindow(), getFakeWindow()];

            bwGetAllWindowsStub.returns(windows);

            mainMessaging.emitToAllWindows('testChannel', {});

            windows.forEach(w => {
                sinon.assert.calledOnce(w.webContents.send);
            });
        });

        it('should emit message in correct structure', () => {
            const windows = [getFakeWindow(), getFakeWindow(), getFakeWindow()];

            bwGetAllWindowsStub.returns(windows);

            mainMessaging.emitToAllWindows('testChannel', {
                someData: 'to be tested'
            });

            windows.forEach(w => {
                sinon.assert.calledOnceWithExactly(w.webContents.send, 'message', {
                    channel: 'testChannel',
                    data: {
                        someData: 'to be tested'
                    }
                });
            });
        });
    });

    describe('emitToFocusedWindow', () => {
        /** @type {sinon.SinonStub} */
        let bwGetFocusedWindowStub;

        beforeEach(() => bwGetFocusedWindowStub = sandbox.stub(BrowserWindow, 'getFocusedWindow'));

        it('should emit message against correct window', () => {
            const window = getFakeWindow();

            bwGetFocusedWindowStub.returns(window);

            mainMessaging.emitToFocusedWindow('testChannel', {});

            sinon.assert.calledOnce(window.webContents.send);
        });

        it('should emit message in correct structure', () => {
            const window = getFakeWindow();

            bwGetFocusedWindowStub.returns(window);

            mainMessaging.emitToFocusedWindow('testChannel', {
                testData: 'My Data'
            });

            sinon.assert.calledOnceWithExactly(window.webContents.send, 'message', {
                channel: 'testChannel',
                data: {
                    testData: 'My Data'
                }
            });
        });
    });
});

function getFakeWindow() {
    return {
        webContents: {
            send: sinon.spy()
        }
    }
}