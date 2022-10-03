export class Blacklist {

    // blacklistが存在すればblacklistのArrayを返し，なければ空のArrayを返すメソッド
    static async getBlacklist() {
        const blacklistObj = await chrome.storage.local.get("blacklist");
        if (Array.isArray(blacklistObj.blacklist)) {
            return blacklistObj.blacklist;
        } else {
            return Array();
        }
    }

    // blacklistに値を追加するメソッド
    static async add(newValue) {
        // blacklistを取得
        const blacklist = await Blacklist.getBlacklist();
        // 取得したblacklistに値が含まれていなければ追加
        if (!await Blacklist.includeDomain(newValue)) {
            // ドメインのページを取得
            const fetchData = await fetch(`http://${newValue}`);
            // 404 Not Foundでなければページタイトルも一緒に保存
            if (Math.floor(fetchData.status / 100) !== 4) {
                // 文字コードを取得
                const detected = window.Encoding.detect(new Uint8Array(await fetchData.clone().arrayBuffer()));
                // 文字コードを変換
                let charset = "";
                switch (detected) {
                    case "UTF8":
                        charset = "UTF-8";
                        break;
                    case "SJIS":
                        charset = "Shift_JIS";
                        break;
                    case "EUCJP":
                        charset = "EUC-JP";
                        break;
                    case "JIS":
                        charset = "ISO-2022-JP";
                        break;
                }
                const decodedData = new TextDecoder(charset).decode(await fetchData.arrayBuffer());
                const pageDom = new DOMParser().parseFromString(decodedData, 'text/html');
                // ブラックリストに追加
                blacklist.push({"domain": newValue, "title": pageDom.title});
            } else {
                // ブラックリストに追加
                blacklist.push({"domain": newValue, "title": ""});
            }
        }
        // blacklistを更新
        await chrome.storage.local.set({"blacklist": blacklist});
    }

    // blacklistから値を削除するメソッド
    static async delete(deleteValue) {
        // blacklistを取得
        let blacklist = await Blacklist.getBlacklist();
        // 取得したblacklistに値が含まれていれば削除
        if (blacklist.some(e => e.domain === deleteValue)) blacklist = blacklist.filter(e => e.domain !== deleteValue);
        // blacklistを更新
        await chrome.storage.local.set({"blacklist": blacklist});
    }

    // blacklistに入っているか確認するメソッド
    static async includeDomain(domain) {
        // blacklistを取得
        let blacklist = await Blacklist.getBlacklist();
        // 取得したblacklistに値が含まれていればtrue
        return blacklist.some(e => e.domain === domain);
    }
}