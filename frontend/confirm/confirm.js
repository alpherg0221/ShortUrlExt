// #移行の文字列を取得
import {Whitelist} from "../whitelist/whitelist.js";

// 遷移先URL
const srcURL = window.location.hash.substring(1);
// URLエンコードした遷移先URL
const encodedDest = encodeURIComponent(srcURL);

// サークルインジケータ
const circularProgress = document.querySelector('.progress');

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

// destからドメインを取得
const domain = (new URL(destURL)).hostname;

// ホワイトリストに入っているか確認
if (await Whitelist.includeDomain(domain)) {
    location.href = destURL;
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
        await Whitelist.add(domain);
        if (await Whitelist.includeDomain(domain)) {
            dialog.open();
        } else {
            alert("登録に失敗しました");
        }
    };

    // Google透明性レポートボタン
    const googleButton = document.getElementById("google_button");
    googleButton.href = `https://transparencyreport.google.com/safe-browsing/search?url=${encodedDestURL}&hl=ja-jp`;

    // Norton Safe Webボタン
    const nortonButton = document.getElementById("norton_button");
    nortonButton.href = `https://safeweb.norton.com/report/show?url=${encodedDestURL}`;

    // Kaspersky Threat Intelligence Portalボタン
    const kasperskyButton = document.getElementById("kaspersky_button");
    kasperskyButton.href = `https://opentip.kaspersky.com/${encodedDestURL}/?tab=lookup`

    // ダイアログを取得
    const dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
    dialog.listen('MDCDialog:closing', () => {
        window.location.href = destURL;
    });

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
    const descElem = document.getElementById("description");
    descElem.textContent = "電気通信大学は、武蔵野の緑溢れる東京都調布市にある国立大学です。「総合コミュニケーション科学」の創造と「Unique & Exciting Campus」の実現を目指します。";
}

async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}