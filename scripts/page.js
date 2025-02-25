import * as Api from "./api.js";

Api.Topbar.querySelectorAll("input").forEach(Input => Input.addEventListener("focus", () => Api.Content.style.opacity = "0.5"));
Api.Topbar.querySelectorAll("input").forEach(Input => Input.addEventListener("blur", () => Api.Content.style.opacity = ""));

const User = JSON.parse(localStorage.getItem("User"));

const PostStorage = new Api.Storage("Posts");

await PostStorage.GetDocuments().then((Documents) => {
    Array.from(Api.Posts.children).forEach((Child) => {
        if (Child.classList.contains("Post")) {
            Child.remove();
        }
    });

    Documents.forEach(async (Document) => {
        const AuthorDocuments = await new Api.Storage("Users").GetDocumentsByField("Username", Document.Author);
        const AuthorDocument = AuthorDocuments[0];

        const Post = document.createElement("div");
        Post.innerHTML = `
            <div>
                <div>
                    <img src="${AuthorDocument.ProfileImage || "../images/Default.svg"}">
                    <a>${Document.Author}</a>
                    <div style="padding-top: 0; padding-bottom: 0; font-size: 16px; background-color: rgba(255, 255, 255, 0.125)" class="FollowButton" button>Follow</div>
                    ·
                    <span class="Timestamp">${new Format(Document.Timestamp, { Time: { Format: "Seconds>Minutes>Hours>Days>Weeks>Months>Years> ago" } }).Time()}</span>
                </div>
                <header style="cursor: pointer;">${Document.Title}</header>
                <span class="ContentLabel"></span>
                <div class="AttachmentContainer"></div>
            </div>
            <div style="display: none" class="Comments">
                <div style="order: -9999999999">
                    <input class="CommentInput" type="text" placeholder="Write a comment...">
                    <button class="PublishCommentButton">Publish Comment</button>
                </div>
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
                <div style="cursor: pointer;" tooltip="Comments" class="CommentsButton">
                    <img src="images/Comments.svg">
                    <span>${Document.Comments.length}</span>
                </div>
            </div>
        `;
        Post.classList.add("Post");
        Post.setAttribute("Author", Document.Author);
        Api.Posts.appendChild(Post);

        const AttachmentContainer = Post.querySelector(".AttachmentContainer");
        const CommentsContainer = Post.querySelector(".Comments");

        const CommentInput = Post.querySelector(".CommentInput");

        const ContentLabel = Post.querySelector(".ContentLabel");

        const FollowButton = Post.querySelector(".FollowButton");
        const PublishCommentButton = Post.querySelector(".PublishCommentButton");
        const CommentsButton = Post.querySelector(".CommentsButton");
        const UpvoteButton = Post.querySelector(".UpvoteButton");
        const DownvoteButton = Post.querySelector(".DownvoteButton");

        const Followers = AuthorDocument.Followers || [];
        const Comments = Document.Comments || [];
        const Upvotes = Document.Upvotes || [];
        const Downvotes = Document.Downvotes || [];

        if (Document.Author === User.Username) FollowButton.style.display = "none";

        if (Followers.includes(User.Username)) {
            FollowButton.innerHTML = "Unfollow";
            FollowButton.setAttribute("active", "");
            Post.style.order = Post.style.order + 1;
        } else {
            FollowButton.innerHTML = "Follow";
            FollowButton.removeAttribute("active");
        }

        Post.style.order = Post.style.order - Comments.length - Upvotes.length + Downvotes.length;

        FollowButton.onclick = async () => {
            if (FollowButton.hasAttribute("active")) {
                FollowButton.removeAttribute("active");
                FollowButton.innerHTML = "Follow";
                Followers.splice(Followers.indexOf(User.Username), 1);
            } else {
                FollowButton.setAttribute("active", "");
                FollowButton.innerHTML = "Unfollow";
                Followers.push(User.Username);
            }

            await new Api.Storage("Users").UpdateDocument(AuthorDocument.id, { Followers: Followers });

            Array.from(Api.Posts.children).forEach(Post => {
                if (Post.getAttribute("Author") !== AuthorDocument.Username) return;
                const PostFollowButton = Post.querySelector(".FollowButton");
                if (Followers.includes(User.Username)) {
                    PostFollowButton.setAttribute("active", "");
                    PostFollowButton.innerHTML = "Unfollow";
                } else {
                    PostFollowButton.removeAttribute("active");
                    PostFollowButton.innerHTML = "Follow";
                }
            });
        };

        const UpdateUI = () => {
            const IsUpvoted = Upvotes.includes(User.Username);
            const IsDownvoted = Downvotes.includes(User.Username);

            UpvoteButton.style.backgroundColor = IsUpvoted ? "rgba(72, 148, 253, 0.125)" : "";
            UpvoteButton.querySelector("span").style.color = IsUpvoted ? "rgb(72, 148, 253)" : "";
            UpvoteButton.querySelector("img").style.filter = IsUpvoted
                ? "brightness(0) saturate(100%) invert(47%) sepia(40%) saturate(1850%) hue-rotate(196deg) brightness(104%) contrast(98%)"
                : "";

            DownvoteButton.style.backgroundColor = IsDownvoted ? "rgba(255, 40, 40, 0.125)" : "";
            DownvoteButton.querySelector("span").style.color = IsDownvoted ? "rgb(255, 40, 40)" : "";
            DownvoteButton.querySelector("img").style.filter = IsDownvoted
                ? "brightness(0) saturate(100%) invert(30%) sepia(53%) saturate(6213%) hue-rotate(346deg) brightness(106%) contrast(107%)"
                : "";

            UpvoteButton.querySelector("span").innerHTML = `Upvote · ${Upvotes.length}`;
            DownvoteButton.querySelector("span").innerHTML = Downvotes.length;

            Comments.forEach(async (Comment) => {
                const AuthorDocuments = await new Api.Storage("Users").GetDocumentsByField("Username", Comment.Author);
                const AuthorDocument = AuthorDocuments[0];

                const CommentElement = document.createElement("div");
                CommentElement.innerHTML = `
                    <div>
                        <img src="${AuthorDocument.ProfileImage || "../images/Default.svg"}">
                        <a>${Comment.Author}</a>
                        ·
                        <span class="Timestamp">${new Format(parseInt(Comment.Timestamp), { Time: { Format: "Seconds>Minutes>Hours>Days>Weeks>Months>Years> ago" } }).Time()}</span>
                    </div>
                    <span>${Comment.Content}</span>
                `;
                CommentElement.style.order = -Comment.Timestamp;
                CommentsContainer.appendChild(CommentElement);
            });

            CommentsButton.querySelector("span").innerHTML = Comments.length;
        };

        let Markdown = "";
        const ConvertToSuperscript = (Text) => {
            const Regex = /([a-zA-Z0-9]+)\[(\d+)\]/g;
            return Text.replace(Regex, (Match, Base, Exponent) => {
                return `<span class="math">${Base}</span><sup class="math">${Exponent}</sup>`;
            });
        };

        Document.Content.split(" ").forEach(Word => {
            if (Word === "/f") {
                Markdown = "Math";
                return;
            }
            if (Word === "/r") {
                Markdown = "";
                return;
            }

            Word = ConvertToSuperscript(Word);

            const Node = document.createElement("span");
            Node.innerHTML = Word;
            ContentLabel.appendChild(Node);

            if (Markdown && MarkdownStyles[Markdown]) {
                Object.keys(MarkdownStyles[Markdown]).forEach(Key => {
                    Node.style[Key] = MarkdownStyles[Markdown][Key];
                });

                const InnerElements = Node.querySelectorAll(".math");
                InnerElements.forEach(InnerElement => {
                    Object.keys(MarkdownStyles[Markdown]).forEach(Key => {
                        InnerElement.style[Key] = MarkdownStyles[Markdown][Key];
                    });
                });
            }
        });

        PublishCommentButton.addEventListener("click", async () => {
            const Content = CommentInput.value;
            if (!Content) return;

            const Comment = {
                Author: User.Username,
                Timestamp: Math.floor(Date.now() / 1000),
                Content: Content,
            };
            Comments.push(Comment);
            CommentInput.value = "";

            await PostStorage.UpdateDocument(Document.id, { Comments: Comments });
        });

        UpvoteButton.addEventListener("click", async () => {
            if (!User) return;

            const IsUpvoted = Upvotes.includes(User.Username);
            const IsDownvoted = Downvotes.includes(User.Username);

            if (IsUpvoted) {
                Upvotes.splice(Upvotes.indexOf(User.Username), 1);
            } else {
                Upvotes.push(User.Username);
                if (IsDownvoted) {
                    Downvotes.splice(Downvotes.indexOf(User.Username), 1);
                }
            }

            await PostStorage.UpdateDocument(Document.id, { Upvotes, Downvotes });
            UpdateUI();
        });

        DownvoteButton.addEventListener("click", async () => {
            if (!User) return;

            const IsDownvoted = Downvotes.includes(User.Username);
            const IsUpvoted = Upvotes.includes(User.Username);

            if (IsDownvoted) {
                Downvotes.splice(Downvotes.indexOf(User.Username), 1);
            } else {
                Downvotes.push(User.Username);
                if (IsUpvoted) {
                    Upvotes.splice(Upvotes.indexOf(User.Username), 1);
                }
            }

            await PostStorage.UpdateDocument(Document.id, { Upvotes, Downvotes });
            UpdateUI();
        });

        CommentsButton.addEventListener("click", () => {
            CommentsContainer.style.display = getComputedStyle(CommentsContainer).display === "none" ? "" : "none";
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

    localStorage.setItem("User", JSON.stringify({
        Username: JSON.parse(localStorage.getItem("User")).Username,
        Password: JSON.parse(localStorage.getItem("User")).Password,
        ProfileImage: `https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true`
    }));
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

    await PostStorage.AppendDocument(Post);
    location.reload();
});

const UserDocuments = await new Api.Storage("Users").GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username);
const UserDocument = UserDocuments[0];

document.querySelectorAll(".Account").forEach(Label => {
    Label.innerHTML = `${UserDocument[Label.getAttribute("href")][Label.getAttribute("prop")]}${Label.getAttribute("suffix") || ""}`;
});

const FollowingSet = new Set();
const Documents = await PostStorage.GetDocuments();

await Promise.all(Documents.map(async (Document) => {
    const AuthorDocuments = await new Api.Storage("Users").GetDocumentsByField("Username", Document.Author);
    const AuthorDocument = AuthorDocuments[0];
    if (AuthorDocument.Followers.includes(UserDocument.Username)) FollowingSet.add(Document.Author);
}));

Api.FollowingLabel.innerHTML = `${FollowingSet.size} Following`;