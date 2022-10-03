// #移行の文字列を取得
import {Whitelist} from "../whitelist/whitelist.js";
import {Blacklist} from "../blacklist/blacklist.js";

// 遷移先URL
const srcURL = window.location.hash.substring(1);
// URLエンコードした遷移先URL
const encodedDest = encodeURIComponent(srcURL);

// サークルインジケータ
const circularProgress = document.querySelector('.progress');

// ダイアログ
const dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
const dialogContent = document.getElementById("my-dialog-content");

// thumbnailのトークン生成
const thumbnailToken = await sha256(srcURL);

// サムネイルの適用
setThumbnail();

// URLの確認
const dest = await (await fetch(`http://35.213.23.228/trace?url=${encodedDest}`)).json();
const destURL = dest["term_url"];
const decodedDestURL = decodeURIComponent(destURL);
const encodedDestURL = encodeURIComponent(destURL);
const info = dest["info"];
const title = info["title"];
const description = info["description"];

// destからドメインを取得
const domain = (new URL(destURL)).hostname;

// ホワイトリストに入っているか確認
if (await Whitelist.includeDomain(domain)) {
    location.href = destURL;
}

// ブラックリストに入っているか確認
if (await Blacklist.includeDomain(domain)) {
    dialogContent.innerHTML = "このページはブラックリストに入っています．確認ページを閉じます．";
    dialog.listen('MDCDialog:closing', async () => await closeConfirmPage());
    dialog.open()
}

// TODO: GSB 取ってくる処理
const API_KEY = "AIzaSyDOAevlLjP864d5SRqJ_T8MqGo6LKos434";
const requestBody = {
    "client": {
        "clientId": "mws2022",
        "clientVersion": "1.0.0"
    },
    "threatInfo": {
        "threatTypes": [
            "THREAT_TYPE_UNSPECIFIED",
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        "platformTypes":    [
            "PLATFORM_TYPE_UNSPECIFIED",
            "WINDOWS",
            "LINUX",
            "ANDROID",
            "OSX",
            "IOS",
            "ANY_PLATFORM",
        ],
        "threatEntryTypes": ["URL"],
        "threatEntries": [
            {"url": `${destURL}`},
        ]
    }
};
const gsbResponse = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
});
const gsbResponseJson = await gsbResponse.json();

// TODO: 取ってきた
const gsbIcon = document.getElementById("gsb");
if (Object.keys(gsbResponseJson).length === 0 && gsbResponseJson.constructor === Object) {
    gsbIcon.innerText = "done";
    gsbIcon.style.color = "#34A853";
} else {
    gsbIcon.innerText = "warning";
    gsbIcon.style.color = "#EA4335";
}

// ボタンの適用
await setButton();

// 取得した情報の適用
setInfo();

circularProgress.remove();

async function setButton() {
    // OKボタン
    const okButton = document.getElementById("ok");
    okButton.onclick = () => window.location.href = destURL;

    // Cancelボタン
    const cancelButton = document.getElementById("cancel");
    cancelButton.onclick = () => window.open("about:blank", "_self").close();

    // Whitelist_moveボタン
    const whitelistMoveButton = document.getElementById("whitelist_move");
    whitelistMoveButton.onclick = async () => {
        // whitelistに現在のdestのドメインをセット
        if (!await Blacklist.includeDomain(domain)) {
            await Whitelist.add(domain);
            if (!await Whitelist.includeDomain(domain)){
                alert("登録に失敗しました");
            }
            dialogContent.innerHTML = "ホワイトリストに登録しました．移動します．";
            dialog.listen('MDCDialog:closing', () => {
                window.location.href = destURL;
            });
            dialog.open();
        } else {
            dialogContent.innerHTML = "このページはブラックリストに登録されているため，ホワイトリストに登録できません．";
            dialog.open();
        }
    };

    // Blacklist_addボタン
    const blacklistAddButton = document.getElementById("blacklist_add");
    blacklistAddButton.onclick = async () => {
        // blacklistに現在のdestのドメインをセット
        if (!await Whitelist.includeDomain(domain)) {
            await Blacklist.add(domain);
            if (!await Blacklist.includeDomain(domain)) {
                alert("登録に失敗しました");
            }
            dialogContent.innerHTML = "ブラックリストに登録しました．確認ページを閉じます．";
            dialog.listen('MDCDialog:closing', async () => await closeConfirmPage());
            dialog.open()
        } else {
            dialogContent.innerHTML = "このページはホワイトリストに登録されているため，ブラックリストに登録できません．";
            dialog.open();
        }
    }

    // Google透明性レポートボタン
    const googleButton = document.getElementById("google_button");
    googleButton.href = `https://transparencyreport.google.com/safe-browsing/search?url=${encodedDestURL}&hl=ja-jp`;

    // Norton Safe Webボタン
    const nortonButton = document.getElementById("norton_button");
    nortonButton.href = `https://safeweb.norton.com/report/show?url=${encodedDestURL}`;

    // Kaspersky Threat Intelligence Portalボタン
    const kasperskyButton = document.getElementById("kaspersky_button");
    kasperskyButton.href = `https://opentip.kaspersky.com/${encodedDestURL}/?tab=lookup`

    // サムネイル要素
    const thumbnailImg = document.getElementById("thumbnail_img");
    thumbnailImg.style.cursor = "pointer";
    thumbnailImg.onclick = async () => {
        thumbnailImg.src = `http://35.213.23.228/thumbnail?token=${thumbnailToken}&size=1200`;
        thumbnailImg.style.cursor = "auto";
        thumbnailImg.onclick = null;
    };

    // Rippleの適用
    const Ripple = mdc.ripple.MDCRipple;
    Ripple.attachTo(okButton);
    Ripple.attachTo(cancelButton);
    Ripple.attachTo(whitelistMoveButton);
}

async function setThumbnail() {
    // サムネイル要素
    const thumbnailImg = document.getElementById("thumbnail_img");
    thumbnailImg.src = `http://35.213.23.228/thumbnail?token=${thumbnailToken}&size=400`;
}

async function setInfo() {
    // ページタイトル要素
    const titleElem = document.getElementById("title");
    titleElem.textContent = title;
    // URL要素
    const destElem = document.getElementById("dest");
    destElem.textContent = decodedDestURL;
    // ページの説明要素
    const descriptionElem = document.getElementById("description");
    descriptionElem.textContent = description;
}

async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function closeConfirmPage() {
    let [confirmPage] = await chrome.tabs.query({active: true, currentWindow: true});
    await chrome.tabs.remove(confirmPage.id);
}