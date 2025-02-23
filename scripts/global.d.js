globalThis.Prompt = class {
    /**
    * ⚠️ **Warning:** This class dynamically creates and manipulates DOM elements.  
    * Ensure proper cleanup to avoid memory leaks.
    * 
    * ## 🏗️ Class: `Prompt`
    * A draggable, customizable prompt window that can contain multiple nodes.
    * 
    * ## 🏷️ Constructor:
    * @param {{ Title: string, Nodes: HTMLElement[] }} [Prompt={ Title: "", Nodes: [] }]  
    * The prompt configuration, including a title and an array of nodes to display.
    * 
    * @param {[string, Object<string, string>]} [Style=["", {}]]  
    * The styling configuration. If `Style[0]` is `"self"`, styles apply to the prompt itself;  
    * otherwise, `Style[0]` is used as a selector for styling a specific child element.
    * 
    * ## 📜 Properties:
    * - **Title** (`string`) - The title of the prompt.
    * - **Nodes** (`HTMLElement[]`) - The elements inside the prompt.
    * - **Style** (`[string, Object<string, string>]`) - The style configuration.
    * - **Prompt** (`HTMLElement | null`) - The created prompt element.
    * 
    * ## 🛠️ Methods:
    * 
    * ### 🔹 `Append(): HTMLElement`
    * Creates and appends the prompt to the document body.
    * - Adds a draggable top bar.
    * - Applies styles based on the `Style` property.
    * - Appends `Nodes` inside the `.Content` container.
    * - Returns the created prompt element.
    * 
    * ### 🔹 `Remove(): void`
    * Removes the prompt from the document if it exists.
    * 
    * ## ✨ Example Usage:
    * ```js
    * const MyPrompt = new Prompt(
    *     { Title: "Example", Nodes: [document.createElement("p")] },
    *     ["self", { backgroundColor: "blue", color: "white" }]
    * );
    * MyPrompt.Append();
    * ```
    */
    constructor(Prompt = { Title: "", Nodes: [] }, Style = ["", {}]) {
        this.Title = Prompt.Title;
        this.Nodes = Prompt.Nodes;
        this.Style = Style;
        this.Prompt = null;
    }

    Append() {
        const Prompt = document.createElement("div")
        Prompt.setAttribute("class", "Prompt");
        if (this.Style[0] === undefined || this.Style[0] === "self") Object.keys(this.Style[1]).forEach(Key => Prompt.style[Key] = this.Style[1][Key]);

        Prompt.innerHTML = `
            <div class="Topbar">
                <span>${this.Title}</span>
                <span button>X</span>
            </div>
            <div class="Content"></div>
        `;

        document.body.appendChild(Prompt);
        this.Prompt = Prompt;

        Prompt.setAttribute("style", `
            position: absolute;
            left: ${window.innerWidth / 2}px;
            top: ${window.innerHeight / 2}px;
        `);

        this.Style[0] ? this.Style[0] !== "self" ? Object.keys(this.Style[1]).forEach(Key => Prompt.querySelector(this.Style[0]).style[Key] = this.Style[1][Key]) : "" : "";
        Prompt.querySelector("span[button]").addEventListener("click", () => Prompt.remove());

        this.Nodes.forEach(Node => {
            if (!(Node instanceof HTMLElement)) return;
            this.Prompt.querySelector(".Content").appendChild(Node);
        });

        let Dragging = false;
        let StartX = 0;
        let StartY = 0;

        Prompt.querySelector(".Topbar").addEventListener("mousedown", (Event) => {
            Dragging = true;
            StartX = Event.clientX - parseInt(Prompt.style.left);
            StartY = Event.clientY - parseInt(Prompt.style.top);
        });

        document.addEventListener("mousemove", (Event) => {
            if (!Dragging) return;
            Prompt.style.left = `${Event.clientX - StartX}px`;
            Prompt.style.top = `${Event.clientY - StartY}px`;
        });

        document.addEventListener("mouseup", () => Dragging = false);

        return Prompt;
    }

    Remove() {
        if (!this.Prompt) return;
        this.Prompt.remove();
    }
}

/**
 * ⚠️ **Warning:** This function will **not** output anything unless the length is a power of **2**.
 * 
 * 🏷️ Parameters:
 * - **Length** (`number`) - The length of the UUID to generate.
 * 
 * 📤 Returns:
 * - `string` - The generated UUID.
 * 
 * ✨ Examples:
 * - `Uuid(8)  => "4cd5-2155"`
 * - `Uuid(16) => "3db3a8a1-ab27deee"`
 * 
 * 🔧 Format:
 * - `"${"x".repeat(Length / 2)}-${"x".repeat(Length / 2)}"`
 */
globalThis.Uuid = (Length = 16) => {
    if ((Length & (Length - 1)) !== 0 || Length < 2) return "";

    return Array.from({ length: Length }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).reduce((Acc, Char, Index) =>
        Acc + (Index && Index % (Length / 2) === 0 ? "-" : "") + Char, ""
    );
};

Element.prototype.WaitForChild = function (Selector, Timeout = 5000) {
    return new Promise((Resolve, Reject) => {
        let Element = this.querySelector(Selector);
        if (Element) return Resolve(Element);

        let Observer = new MutationObserver(() => {
            Element = this.querySelector(Selector);
            if (Element) {
                Observer.disconnect();
                Resolve(Element);
            }
        });

        Observer.observe(this, { childList: true, subtree: true });

        setTimeout(() => {
            Observer.disconnect();
            Reject(new Error(`WaitForChild: '${Selector}' not found within ${Timeout}ms`));
        }, Timeout);
    });
};

Element.prototype.FindFirstChild = function (Selector) {
    return this.querySelector(Selector) || null;
};

Element.prototype.querySelectorLimit = function(Selector, Limit = -1) {
    const Elements = Array.from(this.querySelectorAll(Selector));
    return Elements.length >= Limit ? Elements.slice(0, Limit) : Elements;
};

Element.prototype.GetDescendants = function() {
    return this.querySelectorAll("*");
};

Element.prototype.querySelectorChildren = function(Selector) {
    let Children = [];
    Array.from(this.children).forEach(Child => {
        if (Child.matches(Selector)) Children.push(Child);
    });
    return Children;
}