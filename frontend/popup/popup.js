import {Whitelist} from "../whitelist/whitelist.js";

// 現在開いているタブのドメインを取得
const [currentTab] = await chrome.tabs.query({active: true, currentWindow: true});
const domain = (new URL(currentTab.url)).hostname;

// Whitelist_editボタン
const whitelistEditButton = document.getElementById("whitelist_edit");
whitelistEditButton.onclick = async () => {
    // whitelistページに移動
    await chrome.tabs.create({url: '../whitelist/editor/whitelistEditor.html'});
};

// whitelist_addボタン
const whitelistAddButton = document.getElementById("whitelist_add");
// whitelist_addボタンのテキスト
const whitelistAddButtonText = document.getElementById("whitelist_add_text");

if (await Whitelist.checkDomain(domain)) {
    whitelistAddButton.disabled = true;
    whitelistAddButtonText.innerText = "ホワイトリスト追加済み";
}

whitelistAddButton.onclick = async () => {
    await Whitelist.add(domain);
    whitelistAddButton.disabled = true;
    whitelistAddButtonText.innerText = "ホワイトリスト追加済み";
};