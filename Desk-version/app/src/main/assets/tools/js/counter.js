// Initial check for popup mode (hides the status bar if 'popup=1' is present in the URL)
if (window.location.search.includes('popup=1')) {
    const style = document.createElement('style');
    style.textContent = `
        .status-bar { display: none !important; }
        .counter-container { height: 100vh !important; }
    `;
    document.head.appendChild(style);
}

// Counter Logic
let counter = 0;
let step = 1;
let maxLimit = 0;
let minLimit = 0;

const counterValue = document.getElementById("counterValue");
const increaseBtn = document.getElementById("increaseBtn");
const decreaseBtn = document.getElementById("decreaseBtn");
const popupOverlay = document.getElementById("popupOverlay");

function updateDisplay() {
    counterValue.textContent = counter;
    counterValue.classList.remove("limit-warning", "limit-exceeded");

    if (maxLimit !== 0 && counter >= maxLimit) {
        counterValue.classList.add("limit-exceeded");
    } else if (maxLimit !== 0 && counter >= maxLimit - step) {
        counterValue.classList.add("limit-warning");
    }

    if (minLimit !== 0 && counter <= minLimit) {
        counterValue.classList.add("limit-exceeded");
    } else if (minLimit !== 0 && counter <= minLimit + step) {
        counterValue.classList.add("limit-warning");
    }
}

increaseBtn.onclick = () => {
    counter += step;
    updateDisplay();
};

decreaseBtn.onclick = () => {
    counter -= step;
    updateDisplay();
};

function openPopup() {
    document.getElementById("stepInput").value = step;
    document.getElementById("maxInput").value = maxLimit;
    document.getElementById("minInput").value = minLimit;
    popupOverlay.style.display = "flex";
}

function applySettings() {
    step = parseInt(document.getElementById("stepInput").value) || 1;
    maxLimit = parseInt(document.getElementById("maxInput").value) || 0;
    minLimit = parseInt(document.getElementById("minInput").value) || 0;
    popupOverlay.style.display = "none";
    updateDisplay();
}

function resetCounter() {
    counter = 0;
    updateDisplay();
}

updateDisplay();