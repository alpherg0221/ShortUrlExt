chrome.runtime.onMessage.addListener(
    function (message) {
        alert(message.message);
        console.log(message.message)
    }
);