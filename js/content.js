(function () {
    // Prevents script from running multiple times.
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

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
        "button svg[width='32'][height='32'][viewBox='0 0 32 32']"      // Specific SVG inside the button
    ];

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
        "button.btn.btn-primary.relative"                               // Button by class names
    ];

    /**
     * Inserts a line break into a text field or contenteditable element.
     * @param {HTMLElement} inputField - The active element for inserting the line break.
     */
    function insertLineBreak(inputField) {
        if (!inputField) return;

        // Handle textarea and input elements
        if (inputField.tagName.toLowerCase() === 'textarea' || inputField.tagName.toLowerCase() === 'input') {
            console.debug('Inserting a line break into an input or textarea.');

            // Insert the line break at the cursor position
            const cursorPos = inputField.selectionStart;
            const text = inputField.value;

            inputField.value = `${text.slice(0, cursorPos)}\n${text.slice(cursorPos)}`;
            inputField.selectionStart = inputField.selectionEnd = cursorPos + 1;

            // Trigger input event to ensure UI updates
            const event = new Event('input', { bubbles: true });
            inputField.dispatchEvent(event);

        } else if (inputField.isContentEditable) {
            // Handle contenteditable elements
            console.debug('Inserting a line break into a contenteditable element.');

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const br = document.createElement("br");

            // Insert the <br> tag at the cursor position
            range.deleteContents();
            range.insertNode(br);
            range.setStartAfter(br);
            range.setEndAfter(br);

            // Update the cursor position
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    /**
     * Searches for the closest "Send" or "Edit" button in parent containers.
     * @param {HTMLElement} activeElement - The currently active element.
     * @returns {HTMLElement|null} - The matched button or null if none is found.
     */
    function findClosestButton(activeElement) {
        let parent = activeElement;
        const maxSearchLevels = 5;
        let currentLevel = 0;

        let matchingButton = null;
        let buttonType = '';  // 'EditMessage' or 'NewMessage'
        let totalMatches = 0;

        console.debug('Searching for the closest button in parent elements.');

        // Traverse up the DOM tree to find a button
        while (parent && currentLevel < maxSearchLevels) {
            currentLevel++;
            console.debug(`Searching at level ${currentLevel}.`);

            // Check for "Edit Message" buttons
            editMessageButtonSelectors.forEach((selector, index) => {
                const button = parent.querySelector(selector);
                if (button) {
                    console.debug(`Found "Edit Message" button using selector ${selector}.`);
                    matchingButton = button;
                    buttonType = 'EditMessage';
                    totalMatches++;
                }
            });

            // Check for "New Message" buttons
            newMessageButtonSelectors.forEach((selector, index) => {
                const button = parent.querySelector(selector);
                if (button) {
                    console.debug(`Found "New Message" button using selector ${selector}.`);
                    matchingButton = button;
                    buttonType = 'NewMessage';
                    totalMatches++;
                }
            });

            if (matchingButton) {
                console.debug(`Found button with highest matches (${totalMatches}). Type: ${buttonType}`);
                return matchingButton;
            }

            parent = parent.parentElement; // Move up to the parent element
        }

        console.warn('Button not found after checking parent elements.');
        return null;
    }

    /**
     * Simulates a mouse click on the button by dispatching mouse events.
     * @param {HTMLElement} button - The button element to be clicked.
     */
    function simulateMouseClick(button) {
        if (button) {
            console.debug('Simulating mouse click on the button.');

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

            console.debug("Mouse click simulation completed.");
        } else {
            console.warn("Button for click simulation not found.");
        }
    }

    /**
     * Keydown event handler to intercept Enter and Ctrl+Enter key presses.
     * - Inserts a line break if Enter is pressed without Ctrl/Alt.
     * - Sends the message if Ctrl+Enter is pressed.
     */
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const activeElement = document.activeElement;

            // Insert a line break on Enter without Ctrl or Alt
            if (!event.ctrlKey && !event.altKey) {
                event.preventDefault();
                console.debug("Inserting line break into active element.");
                insertLineBreak(activeElement);
            }

            // Send the message on Ctrl+Enter
            if (event.ctrlKey) {
                event.preventDefault();
                console.debug("Searching for the send button with Ctrl+Enter.");

                const button = findClosestButton(activeElement);
                if (button) {
                    simulateMouseClick(button);
                } else {
                    console.warn("Message send button not found.");
                }
            }
        }
    }, true);
})();
