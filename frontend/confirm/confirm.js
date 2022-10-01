// #移行の文字列を取得
import {Whitelist} from "../whitelist/whitelist.js";

// 遷移先URL
const dest = window.location.hash.substring(1);
// URLエンコードした遷移先URL
const encodedDest = encodeURIComponent(dest);

// サークルインジケータ
const circularProgress = document.querySelector('.progress');

// ボタンの適用
await setButton();

setTimeout(() => {
    circularProgress.remove();
}, 4000);

async function setButton() {
    // OKボタン
    const okButton = document.getElementById("ok");
    okButton.onclick = () => window.location.href = dest;

    // Cancelボタン
    const cancelButton = document.getElementById("cancel");
    cancelButton.onclick = () => window.open("about:blank", "_self").close();

    // Whitelist_moveボタン
    const whitelistMoveButton = document.getElementById("whitelist_move");
    whitelistMoveButton.onclick = async () => {
        // destからドメインを取得
        const domain = (new URL(dest)).hostname;

        // whitelistに現在のdestのドメインをセット
        await Whitelist.add(domain);
        if ((await Whitelist.getWhitelist()).includes(domain)) {
            dialog.open();
        } else {
            alert("登録に失敗しました");
        }
    };

    // Google透明性レポートボタン
    const googleButton = document.getElementById("google_button");
    googleButton.href = `https://transparencyreport.google.com/safe-browsing/search?url=${encodedDest}&hl=ja-jp`;

    // Norton Safe Webボタン
    const nortonButton = document.getElementById("norton_button");
    nortonButton.href = `https://safeweb.norton.com/report/show?url=${encodedDest}`;

    // Kaspersky Threat Intelligence Portalボタン
    const kasperskyButton = document.getElementById("kaspersky_button");
    kasperskyButton.href = `https://opentip.kaspersky.com/${encodedDest}/?tab=lookup`

    // ダイアログを取得
    const dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
    dialog.listen('MDCDialog:closing', () => {
        window.location.href = dest;
    });

    // Rippleの適用
    const Ripple = mdc.ripple.MDCRipple;
    Ripple.attachTo(okButton);
    Ripple.attachTo(cancelButton);
    Ripple.attachTo(whitelistMoveButton);
}

async function setInfo() {
    // ページタイトル要素
    const titleElem = document.getElementById("title");
    // URL要素
    const destElem = document.getElementById("dest");
    // ページの説明要素
    const deskElem = document.getElementById("description");
    // サムネイル要素
    const thumbnailImg = document.getElementById("thumbnail_img");
}