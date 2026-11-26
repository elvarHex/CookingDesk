// js/search.js
const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const loadingOverlay = document.getElementById("loadingOverlay");

function showError(err) {
    errorText.textContent = "ERROR: [" + err + "]";
    errorModal.classList.add("show");
}

function handleReload() {
    toggleLoader(true);
    location.reload();
}

function toggleLoader(show) {
    if(show) loadingOverlay.classList.add("show");
    else loadingOverlay.classList.remove("show");
}

function closeCloudModal() {
    document.getElementById("cloudModal").style.display = "none";
}

window.addEventListener('error', function(event) {
    if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK' || event.target.tagName === 'IMG')) {
        const fileName = event.target.src || event.target.href;
        showError("File not found or failed to load: " + fileName.split('/').pop());
        toggleLoader(false);
    } else {
        showError(event.message);
        toggleLoader(false);
    }
}, true);

window.addEventListener('unhandledrejection', function(event) {
    showError("Data transfer error: " + (event.reason.message || event.reason));
    toggleLoader(false);
});

(function(){
    const grid = document.getElementById("resultsGrid");
    const toast = document.getElementById("toast");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const openFilterBtn = document.getElementById("openFilterBtn");
    const filterIndicator = document.getElementById("filterIndicator");
    const modal = document.getElementById("filterModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalApplyBtn = document.getElementById("modalApplyBtn");
    const modalClearBtn = document.getElementById("modalClearBtn");
    const modalAreaSelect = document.getElementById("modalAreaSelect");
    const apiContainer = document.getElementById("apiContainer");

    const STORAGE_KEY = "cookingdesk_area_filter";
    const STORAGE_API_KEY = "cookingdesk_api_filter";

    const AVAILABLE_APIS = APIBridge.getAvailableApis();

    const urlParams = new URLSearchParams(window.location.search);
    const recipeParam = urlParams.get("recipename");
    if (recipeParam !== null) {
        searchInput.value = recipeParam;
    }

    function showToast(msg){
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(()=>toast.classList.remove("show"), 2500);
    }

    function escapeHtml(s){
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function getSavedFilter(){
        try { return localStorage.getItem(STORAGE_KEY) || "";
        } catch(e){ return ""; }
    }

    function saveFilter(area){
        try {
            if(!area) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, area);
        } catch(e){}
    }

    function getSavedApis(){
        try{
            const raw = localStorage.getItem(STORAGE_API_KEY);
            if(!raw) return AVAILABLE_APIS.map(a=>a.id);
            let list = JSON.parse(raw);
            if(!APIBridge.isJsonBinConnected()) {
                list = list.filter(id => id !== 'jsonbin');
            }
            return list;
        }catch(e){ return AVAILABLE_APIS.map(a=>a.id);
        }
    }

    function saveApis(arr){
        try{ localStorage.setItem(STORAGE_API_KEY, JSON.stringify(arr));
        }catch(e){}
    }

    function setFilterIndicator(){
        const area = getSavedFilter();
        const selected = getSavedApis();
        const allIds = AVAILABLE_APIS.map(a=>a.id);
        const apisDiffer = selected.length !== allIds.length || !selected.every(id => allIds.includes(id));
        filterIndicator.style.display = (area || apisDiffer) ? "block" : "none";
    }

    function renderApiOptions(){
        apiContainer.innerHTML = "";
        const selected = getSavedApis();
        const connected = APIBridge.isJsonBinConnected();

        AVAILABLE_APIS.forEach(api=>{
            const isJsonBin = api.id === "jsonbin";
            const row = document.createElement("label");
            row.style.display = "flex"; row.style.alignItems = "center"; row.style.gap = "8px";
            row.style.cursor = (isJsonBin && !connected) ? "default" : "pointer";
            if(isJsonBin && !connected) row.style.opacity = "0.5";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox"; checkbox.id = "api_" + api.id;

            if(isJsonBin && !connected) {
                checkbox.checked = false;
                checkbox.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById("cloudModal").style.display = "flex";
                };
            } else {
                checkbox.checked = selected.includes(api.id);
            }

            const txt = document.createElement("span");
            txt.textContent = api.name;
            row.appendChild(checkbox); row.appendChild(txt);
            apiContainer.appendChild(row);
        });
    }

    function appendCards(data){
        data.forEach(m=>{
            const a = document.createElement("a");
            a.className = "card-button";
            a.href = `recipe.html?id=${encodeURIComponent(m.id)}&source=${m._sourceApi}`;
            const imgUrl = m.image || 'img/transparentlogo.svg';
            let sourceIconHtml = '';

            if(m._sourceApi === 'jsonbin') {
                sourceIconHtml = `<img src="img/cloud-link.svg" class="source-icon" alt="JSONBin">`;
            }
            a.innerHTML = `
                ${sourceIconHtml}
                <img src="${escapeHtml(imgUrl)}" class="main-img" alt="${escapeHtml(m.title)}">
                <span>${escapeHtml(m.title)}</span>
            `;
            grid.appendChild(a);
        });
    }

    async function search(){
        toggleLoader(true);
        grid.innerHTML = "";
        const name = searchInput.value.trim();
        const savedArea = getSavedFilter();
        const selectedApis = getSavedApis();
        try {
            let results = await APIBridge.searchByName(name, selectedApis);
            if(savedArea){
                results = results.filter(m => String(m.area || "").toLowerCase() === savedArea.toLowerCase());
            }
            if(results.length === 0){
                grid.innerHTML = '<div class="no-results">No recipes found</div>';
            } else {
                appendCards(results);
            }
        } catch(e) {
            showError(e.message || e);
        } finally {
            toggleLoader(false);
        }
    }

    function triggerSearch() {
        const val = searchInput.value.trim();
        const currentParam = new URLSearchParams(window.location.search).get("recipename");
        if (currentParam === val) {
            search();
        } else {
            window.location.href = "search.html?recipename=" + encodeURIComponent(val);
        }
    }

    openFilterBtn.addEventListener("click", ()=>{
        modal.classList.add("show");
        renderApiOptions();
        modalAreaSelect.value = getSavedFilter();
    });
    closeModalBtn.addEventListener("click", () => modal.classList.remove("show"));

    modalApplyBtn.addEventListener("click", ()=>{
        saveFilter(modalAreaSelect.value);
        const chosen = [];
        AVAILABLE_APIS.forEach(api=>{
            const el = document.getElementById("api_" + api.id);
            if(el && el.checked) chosen.push(api.id);
        });
        saveApis(chosen);
        modal.classList.remove("show");
        setFilterIndicator();
        triggerSearch();
    });

    modalClearBtn.addEventListener("click", ()=>{
        saveFilter("");
        const defaults = AVAILABLE_APIS.map(a => a.id);
        saveApis(defaults);
        modal.classList.remove("show");
        setFilterIndicator();
        triggerSearch();
    });

    searchBtn.addEventListener("click", triggerSearch);
    searchInput.addEventListener("keydown", e => { if(e.key === "Enter") triggerSearch(); });

    // Initial asynchronous loading
    (async function loadAreas(){
        try {
            const allApiIds = AVAILABLE_APIS.map(a => a.id);
            const areas = await APIBridge.listAreas(allApiIds);

            areas.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s; opt.textContent = s;
                modalAreaSelect.appendChild(opt);
            });
        } catch(e){}
    })();
    setFilterIndicator();
    search();
})();