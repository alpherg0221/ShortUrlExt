import {Whitelist} from "../whitelist.js";

// ホワイトリストの表を動的に生成する
window.addEventListener("DOMContentLoaded", async () => {
    // tbodyの要素を取得
    let tbody = document.getElementById("tbody");

    // whitelistの配列を取得
    let whitelist = await Whitelist.getWhitelist();

    for (let i = 0; i < whitelist.length; i++) {
        // tr要素を，id="tr${i}"として作成
        let tr = document.createElement("tr");
        tr.id = `tr${i}`;

        // ドメイン名を表示する
        let td_domain = document.createElement("td");
        td_domain.innerHTML = whitelist[i];
        // trにtd要素を追加
        tr.appendChild(td_domain);

        let button = await Button(
            "削除",
            "delete",
            () => {
                // 内部のホワイトリストから削除
                Whitelist.delete(whitelist[i]);
                // 画面上から削除
                let target = document.getElementById(`tr${i}`);
                tbody.removeChild(target);
            }
        )
        tr.appendChild(button);

        // tbodyにtr要素を追加
        tbody.appendChild(tr);
    }
});

// ボタンを作る関数
async function Button(text, icon, onClick) {
    let td_button = document.createElement("td");
    let button = document.createElement("button");
    let buttonText = document.createElement("span");
    let buttonIcon = document.createElement("i");
    let buttonRipple = document.createElement("span");

    button.className = "mdc-button mdc-button--raised mdc-button--leading";
    button.id = "deleteButton";
    button.onclick = onClick;

    buttonText.className = "mdc-button__label";
    buttonText.textContent = text;

    buttonIcon.className = "material-icons mdc-button__icon";
    buttonIcon.ariaHidden = "true";
    buttonIcon.textContent = icon;

    buttonRipple.className = "mdc-button__ripple";

    // ボタンとtd要素を追加
    button.appendChild(buttonRipple);
    button.appendChild(buttonIcon);
    button.appendChild(buttonText);
    td_button.appendChild(button);

    return td_button;
}