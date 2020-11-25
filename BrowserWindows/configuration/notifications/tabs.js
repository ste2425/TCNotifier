import { select } from '../../domHelper.js';

export function nextTab(selector) {
    const tabs = select(`${selector} .nav-link`);

    const activeTab = tabs.findIndex(x => x.classList.contains('active'));

    if (activeTab === tabs.length -1)
        return;

    if (activeTab === -1) {
        tabs[0].Tab.show();
    } else {
        tabs[activeTab + 1].Tab.show();
    }
}

export function previousTab(selector) {
    const tabs = select(`${selector} .nav-link`);

    const activeTab = tabs.findIndex(x => x.classList.contains('active'));

    if (activeTab === 0)
        return;

    if (activeTab === -1) 
        tabs[0].Tab.show();
    else
        tabs[activeTab - 1].Tab.show();
}

export function tabMovingForward(currentTab, nextTab) {
    return !!(currentTab.compareDocumentPosition(nextTab) & Node.DOCUMENT_POSITION_FOLLOWING);
}