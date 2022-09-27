import {shortUrlRegExp} from "./shortUrlRegExp.js";
import {Whitelist} from "./whitelist/whitelist.js";

chrome.webRequest.onHeadersReceived.addListener(async details => {
    // 300番台かチェック
    if (Math.floor(details.statusCode / 100) === 3) {
        // 現在のタブ (リダイレクトがブロックされた) を取得
        let [tabBlocked] = await chrome.tabs.query({active: true, currentWindow: true});

        // ブロックされたURLを取得
        let blockedUrl = details.url;

        // ブロックされたURLが短縮URLだった場合の処理
        if (shortUrlRegExp.test(blockedUrl)) {
            if (tabBlocked.url === "") {
                // about:blankならタブを閉じる
                await chrome.tabs.remove(tabBlocked.id);
            } else {
                // それ以外なら読み込みを停止
                await chrome.tabs.discard(tabBlocked.id);
            }

            // Todo:絶対URLで取得する (現在は相対URLの場合もある)
            // 遷移先URLを取得
            let [dest] = details.responseHeaders.filter(header => header.name === "location");
            let domain = (new URL(dest.value)).hostname;

            if ((await Whitelist.getWhitelist()).includes(domain)) {
                // whitelistに遷移先URLが含まれればそのまま遷移
                await chrome.tabs.create({url: dest.value});
            } else {
                // whitelistに遷移先URLが含まれなければ確認ページを開く
                await chrome.tabs.create({url: `./confirm/confirm.html#${dest.value}`});
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