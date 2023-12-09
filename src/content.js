const WATCH_MINUTES = 40;
const BREAK_MINUTES = 10;

const overlayDiv = document.createElement("div");
overlayDiv.setAttribute("id", "video-timer-overlay");

const indicatorDiv = document.createElement("div");
indicatorDiv.setAttribute("id", "video-timer-indicator");

const coffeeIcon = document.createElement("div");
coffeeIcon.setAttribute("id", "video-timer-coffee-icon");
coffeeIcon.innerHTML = "&#x2615;";
coffeeIcon.addEventListener("click", showDialog);

const dialogDiv = document.createElement("div");
dialogDiv.setAttribute("id", "video-timer-dialog");
dialogDiv.innerText = "今すぐ休憩しますか？";

const okButton = document.createElement("div");
okButton.setAttribute("id", "video-timer-ok-button");
okButton.setAttribute("class", "video-timer-button");
okButton.innerText = "する";
okButton.addEventListener("click", startBreak);

const cancelButton = document.createElement("div");
cancelButton.setAttribute("id", "video-timer-cancel-button");
cancelButton.setAttribute("class", "video-timer-button");
cancelButton.innerText = "しない";
cancelButton.addEventListener("click", hideDialog);

const todayString = new Date(Date.now()).toDateString();
chrome.storage.local.get(["videoTimer_lastDate"], result => {
    const lastDate = result.videoTimer_lastDate;
    if (!lastDate || lastDate !== todayString) {
        // 当日初回起動の場合、視聴可能状態から開始
        showDialog(resetRemainSecondsOfWatch());
    }
});
chrome.storage.local.set({ "videoTimer_lastDate": todayString });

// 休憩中はキー入力を無効化する
document.addEventListener("keydown", event => {
    if (document.getElementById("video-timer-overlay")) {
        event.preventDefault();
    }
}, true);

setInterval(function () {
    chrome.storage.local.get(["videoTimer_remainSecondsOfWatch", "videoTimer_breakStartDateTime"], result => {
        const remainSecondsOfWatch = result.videoTimer_remainSecondsOfWatch;
        const breakStartDateTime = result.videoTimer_breakStartDateTime;
        if (breakStartDateTime != null) {
            const remainSecondsOfBreak = BREAK_MINUTES * 60 - Math.floor((Date.now() - Number(breakStartDateTime)) / 1000);
            if (remainSecondsOfBreak <= 0) {
                // 休憩終了＆視聴可能状態開始
                showIndicator(resetRemainSecondsOfWatch());
            } else {
                // 休憩中
                showOverlay(remainSecondsOfBreak);
            }
        } else if (remainSecondsOfWatch != null) {
            if (remainSecondsOfWatch <= 0) {
                // 視聴可能状態終了＆休憩開始
                startBreak();
            } else {
                // 視聴可能状態
                showIndicator(remainSecondsOfWatch);
                if (isAnyVideoPlaying()) {
                    // 再生中
                    chrome.storage.local.set({ "videoTimer_remainSecondsOfWatch": remainSecondsOfWatch - 1 });
                }
            }
        }
    });
}, 1000);

function resetRemainSecondsOfWatch() {
    chrome.storage.local.remove(["videoTimer_breakStartDateTime"]);
    const remainSecondsOfWatch = WATCH_MINUTES * 60;
    chrome.storage.local.set({ "videoTimer_remainSecondsOfWatch": remainSecondsOfWatch });
    return remainSecondsOfWatch;
}

function showIndicator(remainSecondsOfWatch) {
    if (document.getElementById("video-timer-overlay")) {
        overlayDiv.parentNode.removeChild(overlayDiv);
    }
    document.body.classList.remove("stop-scrolling");
    overlayDiv.innerText = "";
    indicatorDiv.innerHTML = `視聴可能時間 残り ${formatTime(remainSecondsOfWatch)}&nbsp;`;
    indicatorDiv.appendChild(coffeeIcon);
    if (!document.getElementById("video-timer-indicator")) {
        document.body.appendChild(indicatorDiv);
    }
}

function startBreak() {
    showOverlay(BREAK_MINUTES * 60);
    chrome.storage.local.remove(["videoTimer_remainSecondsOfWatch"]);
    chrome.storage.local.set({ "videoTimer_breakStartDateTime": Date.now() });
}

function showOverlay(remainSecondsOfBreak) {
    hideDialog();
    if (document.getElementById("video-timer-indicator")) {
        indicatorDiv.parentNode.removeChild(indicatorDiv);
    }
    overlayDiv.innerText = `休憩時間 残り ${formatTime(remainSecondsOfBreak)}`;
    if (!document.getElementById("video-timer-overlay")) {
        document.body.appendChild(overlayDiv);
    }
    const videos = document.getElementsByTagName("video");
    for (var i = 0; i < videos.length; i++) {
        if (!videos[i].paused) {
            videos[i].pause();
        }
    }
    document.body.classList.add("stop-scrolling");
}

function showDialog() {
    if (!document.getElementById("video-timer-dialog")) {
        document.body.appendChild(dialogDiv);
        dialogDiv.appendChild(okButton);
        dialogDiv.appendChild(cancelButton);
    }
}

function hideDialog() {
    if (document.getElementById("video-timer-dialog")) {
        dialogDiv.parentNode.removeChild(dialogDiv);
    }
}

function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}分${("0" + (seconds % 60)).slice(-2)}秒`;
}

function isAnyVideoPlaying() {
    const videos = document.getElementsByTagName("video");
    for (var i = 0; i < videos.length; i++) {
        if (!videos[i].paused) {
            return true;
        }
    }
    return false;
}