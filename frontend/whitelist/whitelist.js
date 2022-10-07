export class Whitelist {

    // whitelistが存在すればwhitelistのArrayを返し，なければ空のArrayを返すメソッド
    static async getWhitelist() {
        const whitelistObj = await chrome.storage.local.get("whitelist");
        if (Array.isArray(whitelistObj.whitelist)) {
            return whitelistObj.whitelist;
        } else {
            return Array();
        }
    }

    // whitelistに値を追加するメソッド
    static async add(newValue) {
        // whitelistを取得
        const whitelist = await Whitelist.getWhitelist();
        // 取得したwhitelistに値が含まれていなければ追加
        if (!await Whitelist.includeDomain(newValue)) {
            try {
                // ドメインのページを取得
                const fetchData = await fetch(`http://${newValue}`);
                // ページ内容が取得できればページタイトルも一緒に保存
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
                // ホワイトリストに追加
                whitelist.push({"domain": newValue, "title": pageDom.title});
            } catch (e) {
                // ホワイトリストに追加
                whitelist.push({"domain": newValue, "title": ""});
            } finally {
                // whitelistを更新
                await chrome.storage.local.set({"whitelist": whitelist});
            }
        }
    }

    // whitelistから値を削除するメソッド
    static async delete(deleteValue) {
        // whitelistを取得
        let whitelist = await Whitelist.getWhitelist();
        // 取得したwhitelistに値が含まれていれば削除
        if (whitelist.some(e => e.domain === deleteValue)) whitelist = whitelist.filter(e => e.domain !== deleteValue);
        // whitelistを更新
        await chrome.storage.local.set({"whitelist": whitelist});
    }

    // whitelistに入っているか確認するメソッド
    static async includeDomain(domain) {
        // whitelistを取得
        let whitelist = await Whitelist.getWhitelist();
        // 取得したwhitelistに値が含まれていればtrue
        return whitelist.some(e => e.domain === domain);
    }
}