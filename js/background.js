// Keeps track of the extension state (enabled/disabled).
let extensionEnabled = true;

/**
 * Handles installation or update events for the extension.
 * It sets the initial state and icon when the extension is installed or updated.
 */
chrome.runtime.onInstalled.addListener(() => {
    updateIcon();
});

/**
 * Toggles the extension's state (enabled/disabled) when the action button is clicked.
 * Updates the icon and notifies the content script about the state change.
 * 
 * @param {Tab} tab - The current active tab when the extension icon is clicked.
 */
chrome.action.onClicked.addListener((tab) => {
    extensionEnabled = !extensionEnabled;

    updateIcon()
        .then(() => {
            sendMessageToContentScript(tab);
        })
        .catch(error => {
            console.error('Error updating the icon:', error);
        });
});

/**
 * Sends the current state of the extension to the content script.
 * Only sends messages if the tab URL contains "chat.openai.com" or "chatgpt.com".
 * 
 * @param {Tab} tab - The current tab where the content script will receive the message.
 */
function sendMessageToContentScript(tab) {
    if (tab.url && (tab.url.includes("chat.openai.com") || tab.url.includes("chatgpt.com"))) {
        chrome.tabs.sendMessage(tab.id, { enabled: extensionEnabled });
    }
}

/**
 * Injects the content script into the page when the tab is updated.
 * Only injects if the tab is on a supported domain (e.g., "chat.openai.com").
 * 
 * @param {number} tabId - The ID of the tab being updated.
 * @param {object} changeInfo - Information about the tab's state.
 * @param {Tab} tab - The tab object for the updated tab.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.includes("chat.openai.com") || tab.url.includes("chatgpt.com"))) {
        if (extensionEnabled) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["js/content.js"]
            });
        }
    }
});

/**
 * Updates the extension's icon based on its current state (enabled or disabled).
 * 
 * @returns {Promise} - Resolves when the icon is updated or rejects if an error occurs.
 */
function updateIcon() {
    return new Promise((resolve, reject) => {
        if (!chrome.action) {
            console.error("chrome.action is not defined.");
            reject(new Error("chrome.action is not defined."));
            return;
        }

        // Determine the icon based on the state of the extension.
        const iconSuffix = extensionEnabled ? "" : "_gray";
        const iconPath = size => `../icons/icon${size}${iconSuffix}.png`;

        // Update the extension's icon.
        chrome.action.setIcon({
            path: {
                "16": iconPath(16),
                "48": iconPath(48),
                "128": iconPath(128)
            }
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to set icon:', chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError.message);
                return;
            }
            resolve();
        });
    });
}
