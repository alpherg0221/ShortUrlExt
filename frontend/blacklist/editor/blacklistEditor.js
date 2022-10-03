import {Blacklist} from "../blacklist.js";

// ホワイトリストの表を動的に生成する
window.addEventListener("DOMContentLoaded", async () => {
    // tbodyの要素を取得
    let tbody = document.getElementById("tbody");

    // whitelistの配列を取得
    let blacklist = await Blacklist.getBlacklist();

    for (let i = 0; i < blacklist.length; i++) {
        // tr要素を，id="tr${i}"として作成
        let tr = document.createElement("tr");
        tr.id = `tr${i}`;

        // タイトルを表示する
        let tdTitle = document.createElement("td");
        tdTitle.style.verticalAlign = "middle";
        tdTitle.innerHTML = blacklist[i].title;

        // ドメイン名を表示する
        let tdDomain = document.createElement("td");
        tdDomain.style.verticalAlign = "middle";
        tdDomain.innerHTML = blacklist[i].domain;

        // trにtd要素を追加
        tr.appendChild(tdTitle);
        tr.appendChild(tdDomain);

        let button = await Button(
            "削除",
            "delete",
            () => {
                // 内部のホワイトリストから削除
                Blacklist.delete(blacklist[i].domain);
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