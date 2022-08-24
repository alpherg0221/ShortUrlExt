chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
        // ブロックルールを無効化
        await chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: ["ruleset_1"]
        });
    },
    {
        'urls': ['<all_urls>'],
        'types': ['main_frame']
    },
);

chrome.webRequest.onHeadersReceived.addListener(
    async function (details) {
        // 300番台かチェック
        if (Math.floor(details.statusCode / 100) === 3) {
            // Todo:ブロックルールに正規表現を使って短縮URLに絞る
            // ブロックルールを有効化
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                enableRulesetIds: ["ruleset_1"]
            });

            // 遷移先URLを取得
            let [dest] = details.responseHeaders.filter(header => header.name === "location");

            // 現在のタブ (リダイレクトがブロックされた) を取得
            let [tabBlocked] = await chrome.tabs.query({active: true, currentWindow: true});
            // 現在のタブ (リダイレクトがブロックされた) を削除
            await chrome.tabs.remove(tabBlocked.id);

            // 確認ページを開く
            await chrome.tabs.create({url: `./confirm/confirm.html#${dest.value}`});
        }
    },
    {
        'urls': ['<all_urls>'],
        'types': ['main_frame']
    },
    ['responseHeaders']
);