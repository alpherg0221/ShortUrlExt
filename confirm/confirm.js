// #移行の文字列を取得
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