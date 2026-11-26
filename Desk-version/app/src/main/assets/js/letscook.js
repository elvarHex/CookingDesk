// js/letscook.js
const STORAGE_KEY = "cook_data";
let steps = [], current = 0, recipeId = null, source = null;

const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const loadingOverlay = document.getElementById("loadingOverlay");

function showError(err) {
    errorText.textContent = "ERROR: [" + err + "]";
    errorModal.classList.add("show");
    toggleLoader(false);
}

function handleReload() {
    toggleLoader(true);
    location.reload();
}

function toggleLoader(show) {
    if(show) loadingOverlay.classList.add("show");
    else loadingOverlay.classList.remove("show");
}

window.addEventListener('error', function(event) {
    if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK' || event.target.tagName === 'IMG')) {
        const fileName = event.target.src || event.target.href;
        showError("Missing file: " + fileName.split('/').pop());
    } else {
        showError(event.message);
    }
}, true);

window.addEventListener('unhandledrejection', function(event) {
    showError("Loading error: " + (event.reason.message || event.reason));
});

async function loadRecipe(){
    const params = new URLSearchParams(location.search);
    recipeId = params.get("id");
    source = params.get("source");

    if(!recipeId) return;

    toggleLoader(true);
    try {
        const recipe = await APIBridge.getById(recipeId, source);

        if(!recipe) throw new Error("Could not retrieve recipe data.");

        let recipeSteps = recipe.steps || [];
        if (recipeSteps.length === 0 && recipe.instructions) {
            recipeSteps = recipe.instructions.split(/\r?\n/).filter(s => s.trim().length > 3);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            id: recipeId,
            source: source,
            steps: recipeSteps,
            video: recipe.video || "",
            index: 0
        }));
        render();
    } catch(e) {
        showError(e.message || e);
    } finally {
        toggleLoader(false);
    }
}

function render(){
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if(!dataStr) return;
    const data = JSON.parse(dataStr);

    steps = data.steps;
    current = data.index;

    document.getElementById("stepBox").textContent = steps[current] || "Instructions not available.";
    document.getElementById("prevBtn").style.display = current > 0 ? "flex" : "none";

    const nextBtn = document.getElementById("nextBtn");
    if(current >= steps.length - 1 || steps.length === 0){
        nextBtn.textContent = "✔";
        nextBtn.onclick = exitRecipeNoConfirm;
    } else {
        nextBtn.innerHTML = '<img src="img/right.svg">';
        nextBtn.onclick = next;
    }

    const btnVideo = document.getElementById("videoBtn");
    const videoUrl = data.video || "";
    if(videoUrl) {
        btnVideo.style.display = "flex";
        btnVideo.onclick = () => openVideo(videoUrl);
    } else {
        btnVideo.style.display = "none";
    }

    const totalSteps = steps.length || 1;
    const perc = Math.round((current + 1) / totalSteps * 100);
    document.getElementById("progressLine").style.width = perc + "%";
    document.getElementById("stepIndicator").textContent = `Step ${current + 1}/${totalSteps}`;
}

function next(){ if(current < steps.length - 1) { current++; save(); } }
function prev(){ if(current > 0) { current--; save(); } }

document.getElementById("prevBtn").onclick = prev;

function save(){
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    data.index = current;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render();
}

function openPopupPage(url){
    const frame = document.getElementById("popupFrame");
    frame.src = url + (url.includes("?") ? "&" : "?") + "popup=1";
    document.getElementById("popup").style.display = "flex";

    frame.onload = function() {
        try {
            const doc = frame.contentDocument || frame.contentWindow.document;
            const style = doc.createElement('style');
            style.textContent = `
                .status-bar { display: none !important; }
                .cook-container { height: calc(100vh - 12px) !important; }
                #loadingOverlay, .popup-overlay, .video-modal, .modal-error-overlay { top: 0 !important; }
            `;
            doc.head.appendChild(style);
        } catch (e) { console.warn("Iframe CSS block."); }
    };
}

function closePopup(){
    document.getElementById("popup").style.display = "none";
    document.getElementById("popupFrame").src = "";
}

document.getElementById("timerBtn").onclick = () => openPopupPage("tools/timer.html");
document.getElementById("counterBtn").onclick = () => openPopupPage("tools/counter.html");

loadRecipe();