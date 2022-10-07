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
    static async add(domain, title="") {
        // blacklistを取得
        const blacklist = await Blacklist.getBlacklist();
        // 取得したblacklistに値が含まれていなければ追加
        if (!await Blacklist.includeDomain(domain)) {
            blacklist.push({"domain": domain, "title": title});
            // blacklistを更新
            await chrome.storage.local.set({"blacklist": blacklist});
        }
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