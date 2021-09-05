const WATCH_MINUTES = 60;
const BREAK_MINUTES = 15;

const overlayDiv = document.createElement("div");
overlayDiv.setAttribute("id", "video-timer-overlay");

const indicatorDiv = document.createElement("div");
indicatorDiv.setAttribute("id", "video-timer-indicator");

const coffeeIcon = document.createElement("div");
coffeeIcon.setAttribute("id", "video-timer-coffee-icon");
coffeeIcon.innerHTML = "&#x2615;";
coffeeIcon.addEventListener("click", displayDialog);

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
const lastDate = localStorage.getItem("videoTimer.lastDate");
if (!lastDate || lastDate !== todayString) {
    // 当日初回起動の場合、視聴可能状態から開始
    displayIndicator(resetRemainSecondsOfWatch());
}
localStorage.setItem("videoTimer.lastDate", todayString);

setInterval(function () {
    const remainSecondsOfWatch = localStorage.getItem("videoTimer.remainSecondsOfWatch");
    const breakStartDateTime = localStorage.getItem("videoTimer.breakStartDateTime");
    if (breakStartDateTime != null) {
        const remainSecondsOfBreak = BREAK_MINUTES * 60 - Math.floor((Date.now() - Number(breakStartDateTime)) / 1000);
        if (remainSecondsOfBreak <= 0) {
            // 休憩終了＆視聴可能状態開始
            displayIndicator(resetRemainSecondsOfWatch());
        } else {
            // 休憩中
            displayOverlay(remainSecondsOfBreak);
        }
    } else if (remainSecondsOfWatch != null) {
        if (remainSecondsOfWatch <= 0) {
            // 視聴可能状態終了＆休憩開始
            startBreak();
        } else {
            // 視聴可能状態
            displayIndicator(remainSecondsOfWatch);
            const video = document.getElementsByTagName("video")[0];
            if (video != null && !video.paused) {
                // 再生中
                localStorage.setItem("videoTimer.remainSecondsOfWatch", remainSecondsOfWatch - 1);
            }
        }
    }
}, 1000);

function resetRemainSecondsOfWatch() {
    localStorage.removeItem("videoTimer.breakStartDateTime");
    const remainSecondsOfWatch = WATCH_MINUTES * 60;
    localStorage.setItem("videoTimer.remainSecondsOfWatch", remainSecondsOfWatch);
    return remainSecondsOfWatch;
}

function displayIndicator(remainSecondsOfWatch) {
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
    displayOverlay(BREAK_MINUTES * 60);
    localStorage.removeItem("videoTimer.remainSecondsOfWatch");
    localStorage.setItem("videoTimer.breakStartDateTime", Date.now());
}

function displayOverlay(remainSecondsOfBreak) {
    hideDialog();
    if (document.getElementById("video-timer-indicator")) {
        indicatorDiv.parentNode.removeChild(indicatorDiv);
    }
    overlayDiv.innerText = `休憩時間 残り ${formatTime(remainSecondsOfBreak)}`;
    if (!document.getElementById("video-timer-overlay")) {
        document.body.appendChild(overlayDiv);
    }
    const video = document.getElementsByTagName("video")[0];
    if (video != null && !video.paused) {
        video.pause();
    }
    document.body.classList.add("stop-scrolling");
}

function displayDialog() {
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
