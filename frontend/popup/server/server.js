// デフォルトのサーバ名
const defaultServerName = "mws2022.pfpfdev.net";

// 右上の戻るボタン
const backButton = document.getElementById("back_button");
backButton.onclick = () => {
    location.href = "../popup.html";
};

// checkアイコン
const icon = document.getElementById("icon");
// checkテキスト
const checkText = document.getElementById("check_label");

// 保存されているサーバ名を取得
const serverName = await getServerName();

// テキストフィールド要素を取得
const serverInput = document.getElementById("server_input");

// テキストフィールドの中身を保存されているサーバ名に設定
serverInput.value = serverName;

// MDCのテキストフィールドのインスタンスを生成
const serverIn = new mdc.textField.MDCTextField(document.querySelector(".mdc-text-field"));

// デフォルトに戻すボタン
const defaultButton = document.getElementById("default");
defaultButton.onclick = async () => {
    serverInput.value = defaultServerName;
};

// 保存ボタン
const saveButton = document.getElementById("save");
saveButton.onclick = async () => {
    try {
        await fetch(`https://${serverInput.value}/docs/`);
        await setServerName(serverInput.value);
        location.href = "../popup.html";
    } catch (e) {
        icon.innerText = "warning";
        icon.style.color = "#EA4335";
        checkText.innerText = "サーバに到達できません";
        checkText.style.color = "red";
    }
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