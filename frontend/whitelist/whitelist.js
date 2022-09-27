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
        if (!whitelist.includes(newValue)) whitelist.push(newValue);
        // whitelistを更新
        await chrome.storage.local.set({"whitelist": whitelist});
    }

    // whitelistから値を削除するメソッド
    static async delete(deleteValue) {
        // whitelistを取得
        let whitelist = await Whitelist.getWhitelist();
        // 取得したwhitelistに値が含まれていれば削除
        if (whitelist.includes(deleteValue)) whitelist = whitelist.filter(e => e !== deleteValue);
        // whitelistを更新
        await chrome.storage.local.set({"whitelist": whitelist});
    }
}