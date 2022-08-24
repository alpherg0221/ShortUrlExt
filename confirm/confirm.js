// #移行の文字列を取得
let dest = window.location.hash.substring(1);

// aタグ (id=dest) を取得
let destElem = document.getElementById("dest");

// aタグのhrefと表示する文字を書き換え
destElem.setAttribute("href", dest);
destElem.innerText = dest;