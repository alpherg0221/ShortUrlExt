import {Whitelist} from "../whitelist/whitelist.js";
import {Blacklist} from "../blacklist/blacklist.js";

// Rippleクラス
const Ripple = mdc.ripple.MDCRipple;

// 現在開いているタブのドメインを取得
const [currentTab] = await chrome.tabs.query({active: true, currentWindow: true});
const domain = (new URL(currentTab.url)).hostname;

// Whitelist_editボタン
const whitelistEditButton = document.getElementById("whitelist_edit");
whitelistEditButton.onclick = async () => {
    // whitelistページに移動
    await chrome.tabs.create({url: '../whitelist/editor/whitelistEditor.html'});
};
Ripple.attachTo(whitelistEditButton);

// Blacklist_editボタン
const blacklistEditButton = document.getElementById("blacklist_edit");
blacklistEditButton.onclick = async () => {
    // whitelistページに移動
    await chrome.tabs.create({url: '../blacklist/editor/blacklistEditor.html'});
};
Ripple.attachTo(blacklistEditButton);

// whitelist_addボタン
const whitelistAddButton = document.getElementById("whitelist_add");
const whitelistAddButtonText = document.getElementById("whitelist_add_text");
whitelistAddButton.onclick = async () => {
    await Whitelist.add(domain);
    whitelistAddButton.disabled = true;
    whitelistAddButtonText.innerText = "ホワイトリスト追加済み";
};
Ripple.attachTo(whitelistAddButton);

if (await Whitelist.includeDomain(domain)) {
    whitelistAddButton.disabled = true;
    whitelistAddButtonText.innerText = "ホワイトリスト追加済み";
}

if (await Blacklist.includeDomain(domain)) {
    whitelistAddButton.disabled = true;
    whitelistAddButtonText.innerText = "ブラックリスト追加済み"
}

