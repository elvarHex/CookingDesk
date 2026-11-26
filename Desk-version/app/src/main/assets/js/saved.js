// js/saved.js
const grid = document.getElementById("grid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const loadingOverlay = document.getElementById("loadingOverlay");

let recipesData = [];

function toggleLoader(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? "flex" : "none";
    }
}

function showError(err) {
    errorText.textContent = "ERROR: [" + err + "]";
    errorModal.classList.add("show");
}

function handleReload() {
    toggleLoader(true);
    location.reload();
}

window.onerror = function(message) {
    showError(message);
    toggleLoader(false);
};

function renderRecipes(data){
    grid.innerHTML = "";
    if(!data.length){
        grid.innerHTML = '<div class="no-results">No recipes saved</div>';
        return;
    }

    data.forEach(r => {
        const a = document.createElement("a");
        a.href = "#";
        a.className = "card-button";
        a.innerHTML = `<img src="${r.image}"><span>${r.title}</span>`;

        let source = r.sourceApi || r._sourceApi;

        if(!source){
            if(r.id.toString().startsWith("cocktail_")) source = "thecocktaildb";
            else if(r.id.toString().length < 10) source = "themealdb";
            else source = "jsonbin";
        }

        const cleanId = r.id.toString().replace("cocktail_", "").replace("themealdb_", "");
        const recipeUrl = `recipe.html?id=${cleanId}&source=${source}&saved`;

        a.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = recipeUrl;
        });

        grid.appendChild(a);
    });
}

async function loadRecipes(){
    toggleLoader(true);
    try{
        recipesData = await APIBridge.getSavedRecipes();
        renderRecipes(recipesData);
    }catch(e){
        showError(e.message || "Error loading recipes");
        grid.innerHTML = '<div class="no-results">Loading error</div>';
    }finally{
        toggleLoader(false);
    }
}

searchBtn.addEventListener("click", () => {
    const q = searchInput.value.toLowerCase();
    renderRecipes(recipesData.filter(r => r.title.toLowerCase().includes(q)));
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

loadRecipes();