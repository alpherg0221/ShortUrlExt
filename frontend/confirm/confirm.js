// #移行の文字列を取得
import {Whitelist} from "../whitelist/whitelist.js";
import {Blacklist} from "../blacklist/blacklist.js";

class Confirm {
    // 初期化
    constructor(dest, serverName) {
        // サークルインジケータ
        this.circularProgress = document.querySelector('.progress');
        // ダイアログ
        this.dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
        this.dialogContent = document.getElementById("my-dialog-content");
        // サーバ名
        this.serverName = serverName;
        // dest
        this.dest = dest;
    }

    // URLの情報を取得
    async fetchUrlInfo() {
        // URLの確認
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);
        try {
            this.dest = await fetch(`https://${this.serverName}/trace?url=${this.dest}`, {signal: controller.signal});
        } catch (e) {
            this.dialogContent.innerHTML = "エラーが発生しました．ページをリロードします．";
            this.dialog.listen('MDCDialog:closing', async () => await this.reloadConfirmPage());
            this.dialog.open();
            return false;
        }
        clearTimeout(timer);

        // 500が返ってきたときの処理
        if (this.dest.status === 500) {
            this.dialogContent.innerHTML = "エラーが発生しました．ページをリロードします．";
            this.dialog.listen('MDCDialog:closing', async () => await this.reloadConfirmPage());
            this.dialog.open();
            return false;
        }

        return true;
    }

    // 帰ってきた情報の取り出し
    async getUrlInfo() {
        this.destJson = await this.dest.json();
        this.destURL = this.destJson["term_url"];
        this.decodedDestURL = decodeURIComponent(this.destURL);
        this.encodedDestURL = encodeURIComponent(this.destURL);
        this.info = this.destJson["info"];
        this.title = this.info["title"];
        this.description = this.info["description"];
        this.thumbnailToken = this.destJson["thumbnail"];
        this.domain = (new URL(this.destURL)).hostname;
    }

    // ホワイトリスト・ブラックリストに入っているか確認
    async includeDomain() {
        // ホワイトリストに入っているか確認
        if (await Whitelist.includeDomain(this.domain)) {
            location.href = this.destURL;
            return false;
        }

        // ブラックリストに入っているか確認
        if (await Blacklist.includeDomain(this.domain)) {
            this.dialogContent.innerHTML = "このページはブラックリスト登録済みのため，確認ページを閉じます<br>右上のポップアップからブラックリストを編集できます";
            this.dialog.listen('MDCDialog:closing', async () => await this.closeConfirmPage());
            this.dialog.open();
            return false;
        }

        return true;
    }

    // GSB
    async GSB() {
        // GSB取ってくる処理
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
                "platformTypes": [
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
                    {"url": `${this.destURL}`},
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

        // 取ってきた後の処理
        const gsbIcon = document.getElementById("gsb");
        // アイコンの設定
        if (Object.keys(gsbResponseJson).length === 0 && gsbResponseJson.constructor === Object) {
            gsbIcon.innerText = "done";
            gsbIcon.style.color = "#34A853";
        } else {
            gsbIcon.innerText = "warning";
            gsbIcon.style.color = "#EA4335";
        }
    }

    // ボタンの設定
    async setButton() {
        // OKボタン
        const okButton = document.getElementById("ok");
        okButton.onclick = () => window.location.href = this.destURL;

        // Cancelボタン
        const cancelButton = document.getElementById("cancel");
        cancelButton.onclick = async () => await this.closeConfirmPage();

        // Whitelist_moveボタン
        const whitelistMoveButton = document.getElementById("whitelist_move");
        whitelistMoveButton.onclick = async () => {
            // whitelistに現在のdestのドメインをセット
            if (!await Blacklist.includeDomain(this.domain)) {
                await Whitelist.add(this.domain);
                if (!await Whitelist.includeDomain(this.domain)) {
                    alert("登録に失敗しました");
                }
                this.dialogContent.innerHTML = "ホワイトリストに登録しました．移動します．";
                this.dialog.listen('MDCDialog:closing', () => window.location.href = this.destURL);
                this.dialog.open();
            } else {
                this.dialogContent.innerHTML = "このページはブラックリストに登録されているため，ホワイトリストに登録できません．";
                this.dialog.open();
            }
        };

        // Blacklist_addボタン
        const blacklistAddButton = document.getElementById("blacklist_add");
        blacklistAddButton.onclick = async () => {
            // blacklistに現在のdestのドメインをセット
            if (!await Whitelist.includeDomain(this.domain)) {
                this.dialogContent.innerHTML = "ブラックリストに登録しました．確認ページを閉じます．";
                this.dialog.listen('MDCDialog:closing', async () => {
                    await Blacklist.add(this.domain);
                    if (!await Blacklist.includeDomain(this.domain)) {
                        alert("登録に失敗しました");
                    }
                    await this.closeConfirmPage()
                });
                this.dialog.open();
            } else {
                this.dialogContent.innerHTML = "このページはホワイトリストに登録されているため，ブラックリストに登録できません．";
                this.dialog.open();
            }
        }

        // Google透明性レポートボタン
        const googleButton = document.getElementById("google_button");
        googleButton.href = `https://transparencyreport.google.com/safe-browsing/search?url=${this.encodedDestURL}&hl=ja-jp`;

        // Norton Safe Webボタン
        const nortonButton = document.getElementById("norton_button");
        nortonButton.href = `https://safeweb.norton.com/report/show?url=${this.encodedDestURL}`;

        // Kaspersky Threat Intelligence Portalボタン
        const kasperskyButton = document.getElementById("kaspersky_button");
        kasperskyButton.href = `https://opentip.kaspersky.com/${this.encodedDestURL}/?tab=lookup`;

        // サムネイル要素
        const thumbnailImg = document.getElementById("thumbnail_img");
        thumbnailImg.style.cursor = "pointer";
        thumbnailImg.onclick = async () => {
            thumbnailImg.src = `https://${this.serverName}/thumbnail?token=${this.thumbnailToken}&size=1200`;
            thumbnailImg.style.cursor = "auto";
            thumbnailImg.onclick = null;
        };

        // Rippleの適用
        const Ripple = mdc.ripple.MDCRipple;
        Ripple.attachTo(okButton);
        Ripple.attachTo(cancelButton);
        Ripple.attachTo(whitelistMoveButton);
    }

    // 取ってきた情報の設定
    async setInfo() {
        // ページタイトル要素
        const titleElem = document.getElementById("title");
        titleElem.textContent = this.title;
        // URL要素
        const destElem = document.getElementById("dest");
        destElem.textContent = this.decodedDestURL;
        // ページの説明要素
        const descriptionElem = document.getElementById("description");
        descriptionElem.textContent = this.description;
    }

    // 取ってきたサムネイルの設定
    async setThumbnail() {
        // サムネイル要素
        const thumbnailImg = document.getElementById("thumbnail_img");
        thumbnailImg.src = `https://${this.serverName}/thumbnail?token=${this.thumbnailToken}&size=400`;
    }

    // サークルインジケータを消す
    async display() {
        this.circularProgress.remove();
    }

    // ページを閉じる処理
    async closeConfirmPage() {
        let [confirmPage] = await chrome.tabs.query({active: true, currentWindow: true});
        await chrome.tabs.remove(confirmPage.id);
    }

    // ページをリロードする処理
    async reloadConfirmPage() {
        let [confirmPage] = await chrome.tabs.query({active: true, currentWindow: true});
        await chrome.tabs.create({url: location.href});
        await chrome.tabs.remove(confirmPage.id);
    }
}

// デフォルトで接続するサーバ
const defaultServerName = "mws2022.pfpfdev.net";

// 保存されているサーバ名を取得
async function getServerName() {
    const serverObj = await chrome.storage.local.get("server");
    if (serverObj.server === void 0) {
        return defaultServerName;
    }
    return serverObj.server;
}

// main部分

// 遷移先URL
const srcURL = window.location.hash.substring(1);
// URLエンコードした遷移先URL
const encodedDest = encodeURIComponent(srcURL);

// サーバー名
const serverName = await getServerName();

// confirmクラス
const confirm = new Confirm(encodedDest, serverName);
// URLの情報を取得
const fetchUrlInfoResult = await confirm.fetchUrlInfo();

if (fetchUrlInfoResult) {
    // 帰ってきた情報の取り出し
    await confirm.getUrlInfo();

    // ホワイトリスト・ブラックリストに入っているか確認
    if (await confirm.includeDomain()) {
        // GSBの取得
        await confirm.GSB();
        // ボタンの設定
        await confirm.setButton();
        // 取得した情報の設定
        await confirm.setInfo();
        // 取得したサムネイルの設定
        await confirm.setThumbnail();
        // 確認ページを表示
        await confirm.display();
    }
}

async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}