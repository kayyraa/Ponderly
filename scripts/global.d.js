import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const FirebaseConfig = {
    apiKey: "AIzaSyD8LIavdnXAqr1qyP3QhQnOyKUG2Wzxu78",
    authDomain: "ponderly-c53bd.firebaseapp.com",
    projectId: "ponderly-c53bd",
    storageBucket: "ponderly-c53bd.firebasestorage.app",
    messagingSenderId: "54154169059",
    appId: "1:54154169059:web:5ea45ad56ab47c5b7f93d6"
};

export const GithubStorageConfig = {
    Token: "",
    StorageOwner: "kayyraa",
    StorageName: "DirectStorage"
};

export const App = initializeApp(FirebaseConfig);
export const Analytics = getAnalytics(App);
export const Db = Firestore.getFirestore(App);

globalThis.Topbar = document.querySelector(".Topbar");
globalThis.Content = document.querySelector(".Content");
globalThis.Posts = document.querySelector(".Posts");

globalThis.Pagination = Topbar.querySelector(".Pagination");
globalThis.Filters = document.querySelector(".Filters");
globalThis.PostAttachmentContainer = document.querySelector(".PostAttachmentContainer");

globalThis.FollowingLabel = document.querySelector(".FollowingLabel");

globalThis.UsernameLabels = document.querySelectorAll(".UsernameLabel");
globalThis.ProfileImageLabels = document.querySelectorAll(".ProfileImageLabel");

globalThis.ProfileImageInput = document.querySelector(".ProfileImageInput");
globalThis.PostTitleInput = document.querySelector(".PostTitleInput");
globalThis.PostContentInput = document.querySelector(".PostContentInput");
globalThis.AttachmentInput = document.querySelector(".AttachmentInput");

globalThis.AccountButton = document.querySelector(".AccountButton");
globalThis.UploadProfileImageButton = document.querySelector(".UploadProfileImageButton");
globalThis.PublishPostButton = document.querySelector(".PublishPostButton");

globalThis.GithubStorage = class {
	constructor(Document) {
		this.File = Document || null;
	}

	async Upload(Path = "") {
		if (!this.File) throw new Error("No file provided for upload.");
		const FileContent = await this.ReadFileAsBase64(this.File);

		const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;
		const Data = {
			message: "Upload file to repo",
			content: FileContent
		};

		const Response = await fetch(Url, {
			method: "PUT",
			headers: {
				"Authorization": `Bearer ${GithubStorageConfig.Token}`,
				"Accept": "application/vnd.github.v3+json"
			},
			body: JSON.stringify(Data)
		});

		const Result = await Response.json();
		if (!Response.ok) console.error("Upload failed:", Result);
	}

	async Download(Path) {
		const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;

		const Response = await fetch(Url, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${GithubStorageConfig.Token}`,
				"Accept": "application/vnd.github.v3+json"
			}
		});

		if (Response.ok) {
			const Result = await Response.json();
			const FileContent = atob(Result.content);
			const Blob = new Blob([FileContent], { type: "application/octet-stream" });
			return new File([Blob], Path.split("/").pop(), { type: Blob.type });
		} else {
			const ErrorData = await Response.json();
			console.error("Failed to fetch file:", ErrorData);
			throw new Error(ErrorData.message || "File fetch failed");
		}
	}

	async ReadFileAsBase64(File) {
		return new Promise((Resolve, Reject) => {
			const Reader = new FileReader();
			Reader.onload = () => Resolve(Reader.result.split(",")[1]);
			Reader.onerror = Reject;
			Reader.readAsDataURL(File);
		});
	}
}

globalThis.Datastore = class {
    constructor(Collection = "") { this.Collection = Collection }

    async AppendDocument(DocumentData) {
        if (!this.Collection) return;
        const DocRef = await Firestore.addDoc(Firestore.collection(Db, this.Collection), DocumentData);
        return DocRef.id;
    }

    async GetDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        const Snapshot = await Firestore.getDoc(DocRef);

        if (Snapshot.exists()) {
            return [{ id: Snapshot.id, ...Snapshot.data() }];
        }
        return null;
    }

    async UpdateDocument(DocumentId, DocumentData) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.updateDoc(DocRef, DocumentData);
    }

    async DeleteDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.deleteDoc(DocRef);
    }

    async GetDocuments(Query = {}) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        let QueryRef = CollectionRef;
        Object.entries(Query).forEach(([Key, Value]) => {
            QueryRef = Firestore.query(QueryRef, Firestore.where(Key, "==", Value));
        });
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentsByField(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, "==", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    OnSnapshot(Callback) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        Firestore.onSnapshot(CollectionRef, (Snapshot) => {
            Callback(Snapshot);
        });
    }
}

await new Datastore("Secrets").GetDocument("Token").then((Document) => GithubStorageConfig.Token = Document[0].Value);

globalThis.Prompt = class {
    /**
    * ⚠️ **Warning:** This class dynamically creates and manipulates DOM elements.  
    * Ensure proper cleanup to avoid memory leaks.
    * 
    * 🏗️ Class: `Prompt`
    * A draggable, customizable prompt window that can contain multiple nodes.
    * 
    * 🏷️ Constructor:
    * @param {{ Title: string, Nodes: HTMLElement[] }} [Prompt={ Title: "", Nodes: [] }]  
    * The prompt configuration, including a title and an array of nodes to display.
    * 
    * @param {[string, Object<string, string>]} [Style=["", {}]]  
    * The styling configuration. If `Style[0]` is `"self"`, styles apply to the prompt itself;  
    * otherwise, `Style[0]` is used as a selector for styling a specific child element.
    * 
    * 📜 Properties:
    * - **Title** (`string`) - The title of the prompt.
    * - **Nodes** (`HTMLElement[]`) - The elements inside the prompt.
    * - **Style** (`[string, Object<string, string>]`) - The style configuration.
    * - **Prompt** (`HTMLElement | null`) - The created prompt element.
    * 
    * 🛠️ Methods:
    * 
    * 🔹 `Append(): HTMLElement`
    * Creates and appends the prompt to the document body.
    * - Adds a draggable top bar.
    * - Applies styles based on the `Style` property.
    * - Appends `Nodes` inside the `.Content` container.
    * - Returns the created prompt element.
    * 
    * 🔹 `Remove(): void`
    * Removes the prompt from the document if it exists.
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

globalThis.Format = class {
    constructor(Value = 0, Plugins = {}) {
        this.Value = Value;
        this.Plugins = Plugins;
    }

    Time() {
        if (!this.Plugins["Time"]) return;
        const Format = this.Plugins["Time"].Format;
        const Time = this.Value;

        const DateObj = new Date(parseInt(Time) * 1000);
        const Now = new Date();
        const DiffInSeconds = Math.floor((Now - DateObj) / 1000);

        const Values = {
            Seconds: DiffInSeconds,
            Minutes: Math.floor(DiffInSeconds / 60),
            Hours: Math.floor(DiffInSeconds / 3600),
            Days: Math.floor(DiffInSeconds / 86400),
            Weeks: Math.floor(DiffInSeconds / 604800),
            Months: Math.floor(DiffInSeconds / 2592000),
            Years: Math.floor(DiffInSeconds / 31536000)
        };

        const Units = Format.split(">").map(Unit => Unit.trim()).filter(Unit => Unit in Values);

        let SelectedUnit = "Seconds";
        for (let I = 0; I < Units.length; I++) {
            if (Values[Units[I]] >= 1) SelectedUnit = Units[I];
            else break;
        }

        const Value = Values[SelectedUnit];
        const Label = `${SelectedUnit.replace(SelectedUnit[SelectedUnit.length - 1], "")}${Value > 1 ? "s" : ""}`;

        return `${Value} ${Label.toLowerCase()} ${Format.split(" ")[1]}`;
    }

    Currency() {
        if (!this.Plugins["Currency"]) return;
        const Currency = this.Plugins["Currency"].Format.split("+");
        const Value = this.Value;

        return new Intl.NumberFormat(Currency[0], {
            style: "currency",
            currency: Currency[1],
            minimumFractionDigits: Currency[2]
        }).format(Value);
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

globalThis.MarkdownStyles = {
    Math: {
        fontFamily: "CambriaMath"
   }
}; 