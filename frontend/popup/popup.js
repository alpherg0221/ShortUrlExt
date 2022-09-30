// Whitelist_editボタン
let whitelistEditButton = document.getElementById("whitelist_edit");
whitelistEditButton.onclick = async () => {
    // whitelistページに移動
    await chrome.tabs.create({url: '../whitelist/editor/whitelistEditor.html'});
};