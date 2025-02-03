(function () {
    // Function to log debug messages if debugging is enabled.
    function logDebug(...args) {
        const debug = false;  // Set to true to enable debug logging
        if (debug) {
            console.debug(...args);
        }
    }

    // Prevents script from running multiple times.
    if (window.hasRun) {
        logDebug("Script has already run, exiting...");
        return;
    }
    window.hasRun = true;

    logDebug("Script started and running for the first time.");

    /**
     * Selectors for identifying the "New Message" button.
     * This covers various layouts or attributes of the button.
     */
    const newMessageButtonSelectors = [
        "button[data-testid='send-button']",                            // By 'data-testid' attribute
        "button.mb-1.me-1.bg-black.text-white.rounded-full",            // By multiple CSS classes
        "div.flex.items-end button:last-child",                         // Last button in a flex container
        "button > svg.icon-2xl",                                        // Button with an SVG icon
        "button[type='button'][data-testid='send-button']",             // By type and 'data-testid' attributes
        "button[data-testid='send-button'] svg.icon-2xl",               // SVG icon inside the button
        "button.bg-black.text-white.rounded-full",                      // Button by classes
        "button[aria-label][data-testid='send-button']",                // By aria-label and data-testid attributes
        "button svg[width='32'][height='32'][viewBox='0 0 32 32']",     // Specific SVG inside the button
        "button svg[aria-hidden='true']",                               // SVG with aria-hidden
        "button > svg",                                                 // Simple SVG inside button
        "div.chat-footer button:last-child",                            // Last button in chat footer
        "div.message-actions button[type='submit']",                    // Submit button in message actions
    ];

    logDebug("New Message Button Selectors initialized:", newMessageButtonSelectors);

    /**
     * Selectors for identifying the "Edit Message" button.
     * Like `newMessageButtonSelectors`, it covers different possible layouts.
     */
    const editMessageButtonSelectors = [
        "button.btn.btn-primary",                                       // By button's primary class
        "button[as='button'].btn-primary",                              // By attribute and class
        "button.btn.relative.btn-primary",                              // Relative positioning and primary class
        "div.flex.justify-end > button.btn-primary",                    // Button inside a flex container
        "button.btn-primary > div.flex.items-center.justify-center",    // Button containing a flex div
        "button[as='button'].btn.relative.btn-primary",                 // Attribute and classes combined
        "div.flex.justify-end > button:last-child",                     // Last button in the container
        "button.btn-primary[as='button']",                              // Primary class with specific attribute
        "button.btn-primary[style*='background-color']",                // Button styled by background color
        "button.btn.btn-primary.relative",                              // Button by class names
        "button[aria-label='Save']",                                    // Button with "Save" label
    ];

    logDebug("Edit Message Button Selectors initialized:", editMessageButtonSelectors);

    /**
     * Inserts a line break into a text field or contenteditable element.
     * @param {HTMLElement} inputField - The active element for inserting the line break.
     */
    function insertLineBreak(inputField) {
        logDebug("Attempting to insert line break. Element:", inputField);

        if (!inputField) {
            console.warn("No input field provided, aborting line break insertion.");
            return;
        }

        const tagName = inputField.tagName.toLowerCase();
        logDebug("Input field tagName:", tagName);

        // Handle textarea and input elements
        if (inputField.tagName.toLowerCase() === 'textarea' || inputField.tagName.toLowerCase() === 'input') {
            logDebug('Inserting a line break into an input or textarea.');

            // Insert the line break at the cursor position
            const cursorPos = inputField.selectionStart;
            const text = inputField.value;

            logDebug("Current cursor position:", cursorPos, "Current text length:", text.length);

            inputField.value = `${text.slice(0, cursorPos)}\n${text.slice(cursorPos)}`;
            inputField.selectionStart = inputField.selectionEnd = cursorPos + 1;

            logDebug("Line break inserted. Updated text:", inputField.value);

            // Trigger input event to ensure UI updates
            const event = new Event('input', { bubbles: true });
            inputField.dispatchEvent(event);
            logDebug("Input event dispatched after line break insertion.");

        } else if (inputField.isContentEditable) {
            // Handle contenteditable elements
            logDebug('Inserting a line break into a contenteditable element.');

            const selection = window.getSelection();
            if (!selection.rangeCount) {
                console.warn("No range found in selection, aborting line break insertion.");
                return;
            }

            const range = selection.getRangeAt(0);
            logDebug("Current selection range:", range);

            const br = document.createElement("br");

            // Insert the <br> tag at the cursor position
            range.deleteContents();
            range.insertNode(br);
            range.setStartAfter(br);
            range.setEndAfter(br);

            logDebug("Line break (<br>) inserted at cursor position.");

            // Update the cursor position
            selection.removeAllRanges();
            selection.addRange(range);
            logDebug("Cursor position updated after line break insertion.");
        }
    }

    /**
     * Searches for the closest "Send" or "Edit" button in parent containers.
     * This function traverses up the DOM tree from the active element and attempts to find 
     * the closest button that matches either the "Edit Message" or "New Message" selectors.
     * The search is limited by the maximum number of levels specified by `maxSearchLevels`.
     * 
     * @param {HTMLElement} activeElement - The currently active element.
     * @returns {HTMLElement|null} - The matched button (either "Edit Message" or "New Message") or null if none is found.
     */
    function findClosestButton(activeElement) {
        logDebug("Starting search for closest button. Active element:", activeElement);

        let parent = activeElement;
        const maxSearchLevels = 10;  // Limit the search depth in the DOM tree
        let currentLevel = 0;

        let matchingButton = null;
        let buttonType = '';  // To store the type of button found: 'EditMessage' or 'NewMessage'
        let totalMatches = 0;  // To track the number of matches found during traversal

        // Traverse up the DOM tree to find a button within the specified number of levels
        while (parent && currentLevel < maxSearchLevels) {
            currentLevel++;
            logDebug(`Searching at level ${currentLevel}. Current parent element:`, parent);

            // Check for "Edit Message" buttons in the current parent element
            editMessageButtonSelectors.forEach((selector, index) => {
                const button = parent.querySelector(selector);
                if (button) {
                    logDebug(`Found "Edit Message" button using selector [${index}]: ${selector}.`);
                    matchingButton = button;
                    buttonType = 'EditMessage';
                    totalMatches++;
                }
            });

            // Check for "New Message" buttons in the current parent element
            newMessageButtonSelectors.forEach((selector, index) => {
                const button = parent.querySelector(selector);
                if (button && button.matches('button[data-testid="send-button"]')) {
                    logDebug(`Found "New Message" button using selector [${index}]: ${selector}.`);
                    matchingButton = button;
                    buttonType = 'NewMessage';
                    totalMatches++;
                }
            });

            // If a matching button was found, return the one with the highest matches
            if (matchingButton) {
                logDebug(`Found button with highest matches (${totalMatches}). Type: ${buttonType}`);
                return matchingButton;
            }

            // Move up the DOM tree to the parent element and continue searching
            parent = parent.parentElement;
        }

        // Log a warning if no matching button was found after the search
        console.warn('Button not found after checking parent elements.');
        return null;
    }

    /**
     * Simulates a mouse click on the button by dispatching mouse events.
     * @param {HTMLElement} button - The button element to be clicked.
     */
    function simulateMouseClick(button) {
        if (button) {
            logDebug('Simulating mouse click on the button.', button);

            const mousedownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            const mouseupEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });

            // Dispatch events to simulate the mouse click
            button.dispatchEvent(mousedownEvent);
            button.dispatchEvent(mouseupEvent);
            button.dispatchEvent(clickEvent);

            logDebug("Mouse click simulation completed for the button:", button);
        } else {
            console.warn("Button for click simulation not found.");
        }
    }

    // MutationObserver to detect dynamic appearance of buttons
    const observer = new MutationObserver(() => {
        logDebug("MutationObserver detected changes in the DOM. Checking for buttons...");

        // Combine all valid CSS selectors into one query
        const cssSelectors = [
            ...newMessageButtonSelectors,
            ...editMessageButtonSelectors
        ].filter(selector => !selector.includes(":contains")); // Exclude unsupported selectors

        const combinedSelectors = cssSelectors.join(", ");
        let button = document.querySelector(combinedSelectors);

        if (!button) {
            // Fallback: Check for buttons by text content (if no match found with CSS selectors)
            const buttons = document.querySelectorAll("button");
            for (const btn of buttons) {
                if (btn.textContent.trim() === "Send" || btn.textContent.trim() === "Надіслати") {
                    button = btn;
                    break;
                }
            }
        }

        if (button) {
            logDebug("Button detected dynamically:", button);
            observer.disconnect(); // Stop observing once the button is found
        }
    });

    // Start observing the DOM for changes
    observer.observe(document.body, { childList: true, subtree: true });
    logDebug("MutationObserver initialized to detect dynamic button appearance.");


    /**
     * Keydown event handler to intercept Enter, Ctrl+Enter, and Shift+Enter key presses.
     * - Sends the message if Ctrl+Enter is pressed by finding and simulating a click on the send button.
     * - Inserts a line break when Enter or Shift+Enter is pressed in a contenteditable element or textarea.
     * - Prevents the default behavior to handle these key actions manually.
     * @param {KeyboardEvent} event - The keyboard event triggered by pressing a key.
     */
    document.addEventListener('keydown', function (event) {
        // Define the keys that are monitored by this event listener
        const allowedKeys = ['Enter', 'Control', 'Shift'];

        // Ignore other key presses and handle only specified key actions
        if (!allowedKeys.includes(event.key)) {
            return; // Ignore all other key presses
        }

        // Get the active element to process it
        const activeElement = document.activeElement;

        logDebug(`Keydown event detected. Key: ${event.key}, CtrlKey: ${event.ctrlKey}, ShiftKey: ${event.shiftKey}, AltKey: ${event.altKey}`);

        // If Ctrl+Enter is pressed, send the message by simulating a click on the send button
        if (event.key === 'Enter' && event.ctrlKey) {
            event.preventDefault();
            logDebug("Ctrl+Enter detected, preparing to send the message.");

            // Search for the closest send button and simulate a mouse click
            const button = findClosestButton(activeElement);
            if (button) {
                simulateMouseClick(button);
            } else {
                console.warn("Message send button not found.");
            }
        }
        // If Enter or Shift+Enter is pressed, insert a line break manually using insertLineBreak
        else if (event.key === 'Enter' && !event.ctrlKey && !event.altKey && !event.__isSimulated) {
            event.preventDefault();
            logDebug("Enter or Shift+Enter detected, inserting line break manually.");

            // If the active element is contenteditable, simulate Shift+Enter to insert a line break
            if (activeElement && activeElement.isContentEditable) {
                const shiftEnterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    shiftKey: true,
                    bubbles: true,
                    cancelable: true
                });

                // Set a flag to avoid cyclic behavior
                Object.defineProperty(shiftEnterEvent, '__isSimulated', { value: true });

                event.target.dispatchEvent(shiftEnterEvent);  // Simulate Shift+Enter key press
            } else if (activeElement.tagName.toLowerCase() === 'textarea' || activeElement.tagName.toLowerCase() === 'input') {
                insertLineBreak(activeElement);  // For textarea or input elements
            }
        }
    }, true);

    logDebug("Event listener for keydown events initialized.");
})();
