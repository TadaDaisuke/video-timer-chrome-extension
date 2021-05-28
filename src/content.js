const WATCH_MINUTES = 60;
const BREAK_MINUTES = 15;

const overlayDiv = document.createElement("div");
overlayDiv.setAttribute("id", "video-timer-overlay");
overlayDiv.setAttribute("class", "video-timer-overlay");

const indicatorDiv = document.createElement("div");
indicatorDiv.setAttribute("id", "video-timer-indicator");
indicatorDiv.setAttribute("class", "video-timer-indicator");

const todayString = new Date(Date.now()).toDateString();
const lastDate = localStorage.getItem("videoTimer.lastDate");
if (!lastDate || lastDate !== todayString) {
    // 前回から日付が変わっていたら、視聴可能残り時間を初期化する
    resetRemainSecondsOfWatch();
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
            displayOverlay(BREAK_MINUTES * 60);
            resetBreakStartDateTime();
        } else {
            // 視聴可能状態
            displayIndicator(remainSecondsOfWatch);
            const video = document.getElementsByTagName("video")[0];
            if (video != null && !video.paused) {
                // 再生中
                localStorage.setItem("videoTimer.remainSecondsOfWatch", remainSecondsOfWatch - 1);
            }
        }
    } else {
        // 初期状態
        resetRemainSecondsOfWatch();
        displayIndicator(remainSecondsOfWatch);
    }
}, 1000);

function resetRemainSecondsOfWatch() {
    localStorage.removeItem("videoTimer.breakStartDateTime");
    var remainSecondsOfWatch = WATCH_MINUTES * 60;
    localStorage.setItem("videoTimer.remainSecondsOfWatch", remainSecondsOfWatch);
    return remainSecondsOfWatch;
}

function displayIndicator(remainSecondsOfWatch) {
    if (document.getElementById("video-timer-overlay")) {
        overlayDiv.parentNode.removeChild(overlayDiv);
    }
    document.body.classList.remove("stop-scrolling");
    overlayDiv.innerText = "";
    indicatorDiv.innerText = `視聴可能時間 残り ${formatTime(remainSecondsOfWatch)}`;
    if (!document.getElementById("video-timer-indicator")) {
        document.body.appendChild(indicatorDiv);
    }
}

function resetBreakStartDateTime() {
    localStorage.removeItem("videoTimer.remainSecondsOfWatch");
    localStorage.setItem("videoTimer.breakStartDateTime", Date.now());
}

function displayOverlay(remainSecondsOfBreak) {
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

function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}分${("0" + (seconds % 60)).slice(-2)}秒`;
}
