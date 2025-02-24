// global.d.ts
interface Element {
    /**
     * Waits for a child element matching the given selector.
     * @param {string} Selector - The CSS selector of the child element.
     * @param {number} [Timeout=5000] - The timeout in milliseconds.
     * @returns {Promise<Element>} - Resolves with the found child element.
     */
    WaitForChild(Selector: string, Timeout?: number): Promise<Element>;

    /**
     * Finds the first child element matching the given selector.
     * @param {string} Selector - The CSS selector of the child element.
     * @returns {HTMLElement | null} - The first found child element, or null if not found.
     */
    FindFirstChild(Selector: string): HTMLElement | null;

    /**
     * Finds all child elements matching the given selector.
     * @returns {Array<HTMLElement>} - An array of found child elements.
     */
    GetDescendants(): Array<HTMLElement>;

    /**
     * Finds all child elements matching the given selector.
     * @param {string} Selector - The CSS selector of the child elements.
     * @param {number} Limit - The number of child elements to return.
     * @returns {Array<HTMLElement>} - An array of found child elements, or null if not found.
     */
    querySelectorLimit(Selector: string, Limit: number): Array<HTMLElement>;

    /**
     * @param {string} Selector - The CSS selector of the child elements.
     * @returns {Array<HTMLElement>} - An array of found child elements, or null if not found.
     */
    querySelectorChildren(Selector: string): Array<HTMLElement>;
}