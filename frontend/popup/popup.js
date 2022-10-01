// Whitelist_editボタン
let whitelistEditButton = document.getElementById("whitelist_edit");
whitelistEditButton.onclick = async () => {
    // whitelistページに移動
    await chrome.tabs.create({url: '../whitelist/editor/whitelistEditor.html'});
};

// helpボタン
let helpButton = document.getElementById("help");
helpButton.onclick = async () => {
    await chrome.tabs.create({url: '../help/help.html'});
};