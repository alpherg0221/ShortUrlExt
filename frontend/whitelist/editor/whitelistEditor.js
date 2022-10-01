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
        td_domain.style.verticalAlign = "middle";
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

    document.querySelectorAll(".mdc-icon-button").forEach((e) => {
        const iconButtonRipple = new mdc.ripple.MDCRipple(e);
        iconButtonRipple.unbounded = true;
    });
});

// ボタンを作る関数
async function Button(text, icon, onClick) {
    let tdButton = document.createElement("td");
    let button = document.createElement("button");
    let buttonRipple = document.createElement("span");

    tdButton.style.textAlign = "center";

    button.className = "mdc-icon-button material-icons mdc-ripple-surface";
    button.id = "deleteButton";
    button.onclick = onClick;
    button.textContent = icon;

    buttonRipple.className = "mdc-button__ripple";

    // ボタンとtd要素を追加
    button.appendChild(buttonRipple);
    tdButton.appendChild(button);

    return tdButton;
}