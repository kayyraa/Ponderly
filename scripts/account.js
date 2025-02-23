import * as Api from "./api.js";

const Storage = new Api.Storage("Users");
Api.UsernameLabel.addEventListener("click", async () => {
    const UsernameInput = document.createElement("input");
    UsernameInput.placeholder = "Username";
    UsernameInput.type = "text";
    UsernameInput.setAttribute("value", localStorage.getItem("User") ? JSON.parse(localStorage.getItem("User")).Username : "");

    const PasswordInput = document.createElement("input");
    PasswordInput.placeholder = "Password";
    PasswordInput.type = "text";
    PasswordInput.setAttribute("value", localStorage.getItem("User") ? JSON.parse(localStorage.getItem("User")).Password : "");

    const Submit = document.createElement("button");
    Submit.textContent = "Submit";

    const ChangePassword = document.createElement("button");
    ChangePassword.textContent = "Change Password";
    ChangePassword.style.display = localStorage.getItem("User") ? "" : "none";

    const LogOut = document.createElement("button");
    LogOut.textContent = "Log Out";
    LogOut.style.backgroundColor = "rgb(200, 0, 0)";
    LogOut.style.display = localStorage.getItem("User") ? "" : "none";

    new Prompt({
        Title: "Account",
        Nodes: [UsernameInput, PasswordInput, Submit, ChangePassword, LogOut]
    }, [".Content", {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",

        justifyContent: "center",

        margin: "0",

        width: "calc(100% - 2em)",
        height: "calc(100% - 2em)"
    }]).Append();

    LogOut.addEventListener("click", () => {
        localStorage.removeItem("User");
        location.reload();
    });

    let ChangingPassword = false;
    Submit.addEventListener("click", async () => {
        if (ChangingPassword) {
            const NewPassword = PasswordInput.value.trim();
            if (!NewPassword) return;

            await Storage.GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username).then(async (Document) => {
                await Storage.UpdateDocument(Document[0].id, { Password: NewPassword });
                localStorage.removeItem("User");
                location.reload();
            });
        }

        if (ChangingPassword) return;

        const Username = UsernameInput.value.trim();
        const Password = PasswordInput.value.trim();
        if (!Username || !Password) return;

        const User = { Username, Password, ProfileImage: "../images/Default.svg" };

        const Documents = await Storage.GetDocumentsByField("Username", User.Username);
        if (Documents.length > 0) {
            if (Documents[0].Password === Password) {
                localStorage.setItem("User", JSON.stringify(User));
                location.reload();
            }
        } else {
            await Storage.AppendDocument(User);
            localStorage.setItem("User", JSON.stringify(User));
            location.reload();
        }
    });

    ChangePassword.addEventListener("click", () => {
        ChangingPassword = true;

        Submit.innerHTML = "Confirm Changes";
        PasswordInput.placeholder = "New Password";
        PasswordInput.setAttribute("value", "");
        PasswordInput.focus();
    });
});

(async () => {
    if (localStorage.getItem("User")) {
        const ParsedUser = JSON.parse(localStorage.getItem("User"));
        const Documents = await Storage.GetDocumentsByField("Username", ParsedUser.Username);

        if (Documents.length > 0) Api.UsernameLabel.innerHTML = `<img src="${Documents[0].ProfileImage || "../images/Default.svg"}">`;
        else {
            localStorage.removeItem("User");
            location.reload();
        }
    } else Api.UsernameLabel.innerHTML = "Sign In";
})();