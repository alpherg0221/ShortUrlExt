chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
        /*
        // ブロックルールを無効化
        await chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: ["ruleset_1"]
        });
        */
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
            // 現在のタブ (リダイレクトがブロックされた) を取得
            let [tabBlocked] = await chrome.tabs.query({active: true, currentWindow: true});

            // about:blankならタブを閉じる
            // それ以外なら読み込みを停止
            if (tabBlocked.url === "") {
                await chrome.tabs.remove(tabBlocked.id);
            } else {
                await chrome.tabs.discard(tabBlocked.id);
            }

            // Todo:絶対URLで取得する (現在は相対URLの場合もある)
            // 遷移先URLを取得
            let [dest] = details.responseHeaders.filter(header => header.name === "location");

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