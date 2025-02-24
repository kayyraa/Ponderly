import * as Api from "./api.js";

Api.Topbar.querySelectorAll("input").forEach(Input => Input.addEventListener("focus", () => Api.Content.style.opacity = "0.5"));
Api.Topbar.querySelectorAll("input").forEach(Input => Input.addEventListener("blur", () => Api.Content.style.opacity = ""));

const User = JSON.parse(localStorage.getItem("User"));

const PostStorage = new Api.Storage("Posts");
await PostStorage.GetDocuments().then((Documents) => {
    Array.from(Api.Posts.children).forEach((Child) => Child.classList.contains("Post") ? Child.remove() : "");
    Documents.forEach(async (Document) => {
        const AuthorDocuments = await new Api.Storage("Users").GetDocumentsByField("Username", Document.Author);
        const AuthorDocument = AuthorDocuments[0];

        const Post = document.createElement("div");
        Post.innerHTML = `
            <div>
                <div>
                    <img src="${AuthorDocument.ProfileImage || "../images/Default.svg"}">
                    <span>${Document.Author}</span>
                    ·
                    <span class="Timestamp">${new Format(Document.Timestamp, { Time: { Format: "Seconds>Minutes>Hours>Days>Weeks>Months>Years> ago" } }).Time()}</span>
                </div>
                <header style="cursor: pointer;">${Document.Title}</header>
                <span>${Document.Content}</span>
                <div class="AttachmentContainer"></div>
            </div>
            <div>
                <div class="Vote">
                    <div class="UpvoteButton">
                        <img src="images/ArrowUp.svg">
                        <span>Upvote · ${Document.Upvotes.length}</span>
                    </div>
                    <div tooltip="Downvote" class="DownvoteButton">
                        <img src="images/ArrowDown.svg">
                        <span>${Document.Downvotes.length}</span>
                    </div>
                </div>
                <div style="cursor: pointer;" tooltip="Comments" class="Comments">
                    <img src="images/Comments.svg">
                    <span>${Document.Comments.length}</span>
                </div>
                <div style="cursor: pointer;" tooltip="Shares" class="Shares">
                    <img src="images/Shares.svg">
                    <span>${Document.Shares.length}</span>
                </div>
            </div>
        `;
        Post.style.order = -Document.Timestamp;
        Post.classList.add("Post");
        Api.Posts.appendChild(Post);

        const AttachmentContainer = Post.querySelector(".AttachmentContainer");

        const CommentsButton = Post.querySelector(".Comments");
        const SharesButton = Post.querySelector(".Shares");

        const UpvoteButton = Post.querySelector(".UpvoteButton");
        const DownvoteButton = Post.querySelector(".DownvoteButton");

        const Upvotes = Document.Upvotes || [];
        const Downvotes = Document.Downvotes || [];

        const UpdateUI = () => {
            UpvoteButton.style.backgroundColor = Upvotes.includes(User.Username) ? "rgba(72, 148, 253, 0.125)" : "";
            UpvoteButton.querySelector("span").style.color = Upvotes.includes(User.Username) ? "rgb(72, 148, 253)" : "";
            UpvoteButton.querySelector("img").style.filter = Upvotes.includes(User.Username)
                ? "brightness(0) saturate(100%) invert(47%) sepia(40%) saturate(1850%) hue-rotate(196deg) brightness(104%) contrast(98%)"
                : "";

            DownvoteButton.style.backgroundColor = Downvotes.includes(User.Username) ? "rgba(255, 40, 40, 0.125)" : "";
            DownvoteButton.querySelector("span").style.color = Downvotes.includes(User.Username) ? "rgb(255, 40, 40)" : "";
            DownvoteButton.querySelector("img").style.filter = Downvotes.includes(User.Username)
                ? "brightness(0) saturate(100%) invert(30%) sepia(53%) saturate(6213%) hue-rotate(346deg) brightness(106%) contrast(107%)"
                : "";

            UpvoteButton.querySelector("span").innerHTML = `Upvote · ${Upvotes.length}`;
            DownvoteButton.querySelector("span").innerHTML = Downvotes.length;
        };

        UpvoteButton.addEventListener("click", async () => {
            if (!User) return;

            if (Upvotes.includes(User.Username)) {
                Upvotes.splice(Upvotes.indexOf(User.Username), 1);
            } else {
                Upvotes.push(User.Username);
                const DownvoteIndex = Downvotes.indexOf(User.Username);
                if (DownvoteIndex !== -1) Downvotes.splice(DownvoteIndex, 1);
            }

            await new Api.Storage("Posts").UpdateDocument(Document.id, { Upvotes, Downvotes });
            UpdateUI();
        });

        DownvoteButton.addEventListener("click", async () => {
            if (!User) return;

            if (Downvotes.includes(User.Username)) {
                Downvotes.splice(Downvotes.indexOf(User.Username), 1);
            } else {
                Downvotes.push(User.Username);
                const UpvoteIndex = Upvotes.indexOf(User.Username);
                if (UpvoteIndex !== -1) Upvotes.splice(UpvoteIndex, 1);
            }

            await new Api.Storage("Posts").UpdateDocument(Document.id, { Upvotes, Downvotes });
            UpdateUI();
        });

        UpdateUI();

        Document.Attachments.forEach(Attachment => {
            if (Attachment.Type === "Image") {
                AttachmentContainer.innerHTML += `<img class="Attachment" src="${Attachment.Url}">`;
            }
        });

        document.querySelectorAll("[tooltip]").forEach(Node => {
            tippy(Node, { content: Node.getAttribute("tooltip") });
        });
    });
});

Array.from(Api.Pagination.children).forEach(Node => {
    if (!Node.hasAttribute("href")) return;
    Node.addEventListener("click", () => {
        Array.from(Api.Pagination.children).forEach(Node => Node.removeAttribute("selected"));
        Node.setAttribute("selected", "");

        Array.from(Api.Content.children).forEach(Node => Node.style.display = "none");
        Api.Content.querySelector(`[href="${Node.getAttribute("href")}"]`).style.display = "";
    });
});

Api.ProfileImageLabels.forEach(Image => Image.src = JSON.parse(localStorage.getItem("User")).ProfileImage);

let ProfileImageFile;
Api.ProfileImageInput.addEventListener("change", () => {
    ProfileImageFile = Api.ProfileImageInput.files[0];
});

Api.UploadProfileImageButton.addEventListener("click", async () => {
    if (!ProfileImageFile) return;

    const Path = `ponderly/${Uuid(8)}.${ProfileImageFile.name.split(".")[1]}`;
    await new Api.GithubStorage(ProfileImageFile).Upload(Path);

    const NewUser = {
        Username: JSON.parse(localStorage.getItem("User")).Username,
        Password: JSON.parse(localStorage.getItem("User")).Password,
        ProfileImage: `https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true`
    };
    localStorage.setItem("User", JSON.stringify(NewUser));
    const Documents = await new Api.Storage("Users").GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username);

    await new Api.Storage("Users").UpdateDocument(Documents[0].id, { ProfileImage: `https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true` });
    location.reload();
});

const Attachments = [];
Api.AttachmentInput.addEventListener("change", async () => {
    const File = Api.AttachmentInput.files[0];

    const Path = `ponderly/${Uuid(8)}.${File.name.split(".")[1]}`;
    await new Api.GithubStorage(File).Upload(Path);

    Attachments.push({ Type: "Image", Url: `https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true` });
    Api.AttachmentInput.value = "";

    Api.PostAttachmentContainer.innerHTML += `<img style="max-width: 10em; max-height: 10em;" src="https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true">`;
});

Api.PublishPostButton.addEventListener("click", async () => {
    const Title = Api.PostTitleInput.value;
    const Content = Api.PostContentInput.value;
    if (!Title || !Content) return;

    const Post = {
        Author: JSON.parse(localStorage.getItem("User")).Username,
        Title: Title,
        Content: Content,
        Upvotes: [],
        Downvotes: [],
        Comments: [],
        Shares: [],
        Attachments: Attachments,
        Timestamp: Math.floor(Date.now() / 1000)
    };

    await new Api.Storage("Posts").AppendDocument(Post);
    location.reload();
});