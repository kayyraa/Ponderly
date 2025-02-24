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

export const Topbar = document.querySelector(".Topbar");
export const Content = document.querySelector(".Content");
export const Posts = document.querySelector(".Posts");

export const Pagination = Topbar.querySelector(".Pagination");
export const PostAttachmentContainer = document.querySelector(".PostAttachmentContainer");

export const UsernameLabel = document.querySelector(".UsernameLabel");
export const ProfileImageLabels = document.querySelectorAll(".ProfileImageLabel");

export const ProfileImageInput = document.querySelector(".ProfileImageInput");
export const PostTitleInput = document.querySelector(".PostTitleInput");
export const PostContentInput = document.querySelector(".PostContentInput");
export const AttachmentInput = document.querySelector(".AttachmentInput");

export const UploadProfileImageButton = document.querySelector(".UploadProfileImageButton");
export const PublishPostButton = document.querySelector(".PublishPostButton");

export class GithubStorage {
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
			const FileContent = atob(Result.content); // Decode Base64 content
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

export class Storage {
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

await new Storage("Secrets").GetDocument("Token").then((Document) => GithubStorageConfig.Token = Document[0].Value);