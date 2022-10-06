const defaultServerName = "mws2022.pfpfdev.net";

const backButton = document.getElementById("back_button");
backButton.onclick = () => {
    location.href = "../popup.html";
};

// checkアイコン
const icon = document.getElementById("icon");
// checkテキスト
const checkText = document.getElementById("check_label");

const serverInput = document.getElementById("server_input");
serverInput.value = await getServerName();
const serverIn = new mdc.textField.MDCTextField(document.querySelector(".mdc-text-field"));

const defaultButton = document.getElementById("default");
defaultButton.onclick = async () => {
    serverInput.value = defaultServerName;
};

const saveButton = document.getElementById("save");
saveButton.onclick = async () => {
    const serverName = serverInput.value;
    await setServerName(serverName);
    location.href = "../popup.html";
};

async function getServerName() {
    const serverObj = await chrome.storage.local.get("server");
    if (serverObj.server === void 0) {
        return defaultServerName;
    }
    return serverObj.server;
}

async function setServerName(serverName) {
    await chrome.storage.local.set({"server": serverName});
}