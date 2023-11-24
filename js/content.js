(function () {
    // Check if this script has been executed before to avoid reinitialization
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    // Function for inserting a line break into a text field
    function insertLineBreak(textarea) {
        const cursorPos = textarea.selectionStart;
        const text = textarea.value;
        const newText = text.slice(0, cursorPos) + "\n" + text.slice(cursorPos);
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
    }

    // Variable tracking the extension state (enabled/disabled)
    let isEnabled = true;

    // Handler of messages from the background script
    chrome.runtime.onMessage.addListener(function (request) {
        if (request.enabled !== undefined) {
            isEnabled = request.enabled;
        }
    });

    // Keystroke handler
    document.addEventListener('keydown', function (event) {
        if (!isEnabled) return;

        if (event.key === 'Enter' && (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea')) {
            event.stopImmediatePropagation();

            // If the Enter key is pressed and the extension is enabled
            if (event.ctrlKey) {
                event.preventDefault();

                // Check if the "Save & Submit" button is in the same block as the cursor
                let container = event.target.closest('.w-full');
                let primaryButtonInSameBlock = container ? container.querySelector('.btn-primary') : null;

                let buttonToClick = primaryButtonInSameBlock && primaryButtonInSameBlock.textContent.includes('Save & Submit')
                    ? primaryButtonInSameBlock
                    : document.querySelector('[data-testid="send-button"]');

                if (buttonToClick) {
                    buttonToClick.click();
                }
            } else if (!event.altKey) {
                event.preventDefault();
                // Insert a line break in a text field
                insertLineBreak(event.target);
            }
        }
    }, true);


})();

