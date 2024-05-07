// Global variable that keeps track of the extension state (enabled/disabled)
let extensionEnabled = true;

// Function to be executed when the background script is loaded
chrome.runtime.onInstalled.addListener(() => {
    // Set the icon when installing the extension
    updateIcon();
});

// Handler for clicking the extension icon in the browser bar
chrome.action.onClicked.addListener((tab) => {
    // Invert extension state
    extensionEnabled = !extensionEnabled;
    // Update the icon and send a message to the content script
    updateIcon().then(() => {
        sendMessageToContentScript(tab);
    }).catch(error => {
        console.error('Error updating the icon:', error);
    });
});

// Function for sending a message to the content script
function sendMessageToContentScript(tab) {
    if (tab.url && (tab.url.includes("chat.openai.com") || tab.url.includes("chatgpt.com"))) {
        chrome.tabs.sendMessage(tab.id, {enabled: extensionEnabled});
    }
}

// Tab update handler
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.includes("chat.openai.com") || tab.url.includes("chatgpt.com"))) {
        // Injecting content script if the extension is enabled
        if (extensionEnabled) {
            chrome.scripting.executeScript({
                target: {tabId: tabId},
                files: ["js/content.js"]
            });
        }
    }
});

// Function for updating the extension icon
function updateIcon() {
    return new Promise((resolve, reject) => {
        if (!chrome.action) {
            console.error("chrome.action is not defined.");
            reject(new Error("chrome.action is not defined."));
            return;
        }

        // Define the path to the icon depending on the extension state
        const iconSuffix = extensionEnabled ? "" : "_gray";
        const iconPath = size => `../icons/icon${size}${iconSuffix}.png`;

        // Set icon
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
