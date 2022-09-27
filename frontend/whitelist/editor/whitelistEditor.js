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

        // ボタンを表示する
        let td_button = document.createElement("td");
        let button = document.createElement("button");
        // 削除ボタンをクリックしたときの動作
        button.onclick = () => {
            // 内部のホワイトリストから削除
            Whitelist.delete(whitelist[i]);
            // 画面上から削除
            let target = document.getElementById(`tr${i}`);
            tbody.removeChild(target);
        }
        button.innerHTML = "削除"
        // ボタンとtd要素を追加
        td_button.appendChild(button);
        tr.appendChild(td_button);

        // tbodyにtr要素を追加
        tbody.appendChild(tr);
    }
});
