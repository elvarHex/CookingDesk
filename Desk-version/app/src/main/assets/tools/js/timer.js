// Initial check for display inside a popup/iframe
if (window.location.search.includes('popup=1')) {
    const style = document.createElement('style');
    style.textContent = `
        .status-bar { display: none !important; }
        .timer-container { height: 100vh !important; }
    `;
    document.head.appendChild(style);
}

// Timer Logic and Management
let totalSeconds = 0;
let interval = null;
let running = false;

const display = document.getElementById("timerDisplay");
const startStopBtn = document.getElementById("startStopBtn");
const cancelBtn = document.getElementById("cancelBtn");
const alarm = document.getElementById("alarmSound");

function formatTime(sec){
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateDisplay(){
    display.textContent = formatTime(totalSeconds);
}

function openPopup(){
    document.getElementById("popupOverlay").style.display = "flex";
}

function setTime(){
    const h = parseInt(document.getElementById("hours").value) || 0;
    const m = parseInt(document.getElementById("minutes").value) || 0;
    const s = parseInt(document.getElementById("seconds").value) || 0;

    totalSeconds = h * 3600 + m * 60 + s;
    updateDisplay();
    document.getElementById("popupOverlay").style.display = "none";
}

function toggleTimer(){
    if(totalSeconds === 0) return;

    if(!running){
        interval = setInterval(() => {
            if(totalSeconds > 0){
                totalSeconds--;
                updateDisplay();
            } else {
                clearInterval(interval);
                running = false;
                startStopBtn.textContent = "Start";
                startStopBtn.classList.remove("btn-danger");

                alarm.play();

                cancelBtn.classList.add("blink-yellow");
            }
        }, 1000);

        running = true;
        startStopBtn.textContent = "Stop";
        startStopBtn.classList.add("btn-danger");

    } else {
        clearInterval(interval);
        running = false;
        startStopBtn.textContent = "Start";
        startStopBtn.classList.remove("btn-danger");
    }
}

function resetTimer(){
    clearInterval(interval);
    totalSeconds = 0;
    running = false;
    updateDisplay();
    startStopBtn.textContent = "Start";
    startStopBtn.classList.remove("btn-danger");

    alarm.pause();
    alarm.currentTime = 0;

    cancelBtn.classList.remove("blink-yellow");
}

updateDisplay();