import {shortUrlRegExp} from "./shortUrlRegExp.js";

chrome.webRequest.onHeadersReceived.addListener(async details => {
    // 300番台かチェック
    if (Math.floor(details.statusCode / 100) === 3) {
        // ブロックされたURLを取得
        const blockedUrl = details.url;

        // 現在のタブ (リダイレクトがブロックされた) を取得
        const [tabBlocked] = await chrome.tabs.query({url: blockedUrl, currentWindow: true});
        // 上手く取れなかったときに備えてもう一回
        if (tabBlocked === void 0) {
            [tabBlocked] = await chrome.tabs.query({url: blockedUrl, currentWindow: true});
        }

        // ブロックされたURLが短縮URLだった場合の処理
        if (shortUrlRegExp.test(blockedUrl)) {
            // confirmページを開く
            await chrome.tabs.create({url: `./confirm/confirm.html#${blockedUrl}`});
            if (tabBlocked.url === "") {
                // about:blankならタブを閉じる
                await chrome.tabs.remove(tabBlocked.id);
            } else {
                // それ以外なら読み込みを停止
                await chrome.tabs.discard(tabBlocked.id);
            }
        }
    }
}, {
    'urls': ['<all_urls>'], 'types': ['main_frame']
}, ['responseHeaders']);

let lifeline;

keepAlive();

chrome.runtime.onConnect.addListener(port => {
    if (port.name === 'keepAlive') {
        lifeline = port;
        setTimeout(keepAliveForced, 25e3);
        port.onDisconnect.addListener(keepAliveForced);
    }
});

function keepAliveForced() {
    lifeline?.disconnect();
    lifeline = null;
    keepAlive();
}

async function keepAlive() {
    if (lifeline) return;
    for (const tab of await chrome.tabs.query({url: '*://*/*'})) {
        try {
            await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: () => chrome.runtime.connect({name: 'keepAlive'}),
            });
            chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
            return;
        } catch (e) {
        }
    }
    chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId, info) {
    if (info.url && /^(file|https?):/.test(info.url)) {
        keepAlive();
    }
}