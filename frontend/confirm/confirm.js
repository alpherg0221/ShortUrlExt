// #移行の文字列を取得
import {Whitelist} from "../whitelist/whitelist.js";

let dest = window.location.hash.substring(1);

// h3タグ (id=dest) を取得
let destElem = document.getElementById("dest");
// h3タグの表示する文字を書き換え
destElem.innerText = dest;

// OKボタン
let okButton = document.getElementById("ok");
okButton.onclick = () => window.location.href = dest;

// Cancelボタン
let cancelButton = document.getElementById("cancel");
cancelButton.onclick = () => {
    window.open("about:blank", "_self").close();
};

// Thumbnailのimg
let thumbnailImg = document.getElementById("thumbnail_img");

// Thumbnailボタン
let thumbnailButton = document.getElementById("thumbnail_img");
thumbnailButton.onclick = async () => {
    thumbnailImg.src = `https://capture.heartrails.com/400x400/cool/shorten?${dest}`;
    thumbnailButton.onclick = null;
};

// Whitelist_moveボタン
let whitelistMoveButton = document.getElementById("whitelist_move");
whitelistMoveButton.onclick = async () => {
    // destからドメインを取得
    let domain = (new URL(dest)).hostname;

    // whitelistに現在のdestのドメインをセット
    await Whitelist.add(domain);
    if ((await Whitelist.getWhitelist()).includes(domain)) {
        alert("ホワイトリストに登録しました．移動します．");
        window.location.href = dest;
    } else {
        alert("登録に失敗しました");
    }
}