chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
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
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                enableRulesetIds: ["ruleset_1"]
            });
            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                //chrome.tabs.sendMessage(tabId, {message: details.responseHeaders}, null);
            });
        }
    },
    {
        'urls': ['<all_urls>'],
        'types': ['main_frame']
    },
    ['responseHeaders']
);