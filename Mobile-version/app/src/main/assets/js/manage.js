let currentMode = 'create';
let editingBinId = null;
let recipesCache = [];

document.addEventListener("DOMContentLoaded", () => {
    const apiKey = localStorage.getItem("jsonbin_api_key");
    const indexId = localStorage.getItem("jsonbin_index_id");
    if (!apiKey || !indexId) {
        document.getElementById("cloudModal").style.display = "flex";
        return;
    }
    resetForm();
});

function switchTab(mode) {
    currentMode = mode;
    document.getElementById("tabCreate").classList.toggle("active", mode === 'create');
    document.getElementById("tabEdit").classList.toggle("active", mode === 'edit');

    if (mode === 'create') {
        document.getElementById("createView").style.display = "block";
        document.getElementById("editGridView").style.display = "none";
        document.getElementById("manageDescription").style.display = "block";
        document.getElementById("btnUpload").style.display = "block";
        document.getElementById("editActions").style.display = "none";
        resetForm();
    } else {
        document.getElementById("createView").style.display = "none";
        document.getElementById("editGridView").style.display = "block";
        loadEditGrid();
    }
}

function resetForm() {
    document.getElementById("recipeTitle").value = "";
    document.getElementById("recipeImage").value = "";
    document.getElementById("recipeVideo").value = "";
    
    document.getElementById("ingredientsContainer").innerHTML = "";
    document.getElementById("stepsContainer").innerHTML = "";
    
    addIngredientRow();
    addStepRow();
}

function addIngredientRow(item = "", amount = "") {
    const container = document.getElementById("ingredientsContainer");
    const count = container.children.length + 1;
    
    const row = document.createElement("div");
    row.className = "dynamic-row";
    
    let deleteBtnHtml = "";
    if (count > 1) {
        deleteBtnHtml = `<button class="btn-delete-row" onclick="this.parentElement.remove()"><img src="img/delete.svg"></button>`;
    }

    row.innerHTML = `
        <div class="form-group">
            <label>Ingredient ${count}</label>
            <input type="text" class="ing-item" placeholder="Name" value="${item}">
        </div>
        <div class="form-group">
            <label>Amount</label>
            <input type="text" class="ing-amount" placeholder="e.g. 250g" value="${amount}">
        </div>
        ${deleteBtnHtml}
    `;
    container.appendChild(row);
}

function addStepRow(text = "") {
    const container = document.getElementById("stepsContainer");
    const count = container.children.length + 1;
    
    const row = document.createElement("div");
    row.className = "dynamic-row";
    
    let deleteBtnHtml = "";
    if (count > 1) {
        deleteBtnHtml = `<button class="btn-delete-row btn-delete-step" onclick="this.parentElement.remove()"><img src="img/delete.svg"></button>`;
    }

    row.innerHTML = `
        <div class="form-group">
            <label>Step ${count}</label>
            <textarea class="step-text" placeholder="Describe this step...">${text}</textarea>
        </div>
        ${deleteBtnHtml}
    `;
    container.appendChild(row);
}

function showInfo(text) {
    document.getElementById("infoText").innerText = text;
    document.getElementById("infoModal").classList.add("show");
}

function closeInfo() {
    document.getElementById("infoModal").classList.remove("show");
}

function showLoader() {
    document.getElementById("loadingOverlay").classList.add("show");
}

function hideLoader() {
    document.getElementById("loadingOverlay").classList.remove("show");
}

function getFormData() {
    const title = document.getElementById("recipeTitle").value.trim();
    const image_url = document.getElementById("recipeImage").value.trim();
    const video_url = document.getElementById("recipeVideo").value.trim();
    
    const ingredients = [];
    document.querySelectorAll("#ingredientsContainer .dynamic-row").forEach(row => {
        const item = row.querySelector(".ing-item").value.trim();
        const amount = row.querySelector(".ing-amount").value.trim();
        if (item) ingredients.push({ item, amount });
    });

    const stepsArr = [];
    document.querySelectorAll("#stepsContainer .dynamic-row").forEach(row => {
        const text = row.querySelector(".step-text").value.trim();
        if (text) stepsArr.push(text);
    });
    
    const steps = stepsArr.join("\n\n");

    if (!title || !image_url || ingredients.length === 0 || !steps) {
        alert("Please fill in all mandatory fields (Title, Image, at least 1 ingredient, at least 1 step).");
        return null;
    }

    return { title, image_url, video_url, ingredients, steps };
}

async function uploadRecipe() {
    const data = getFormData();
    if (!data) return;

    showLoader();
    try {
        await JSONBinAPI.createRecipe(data);
        hideLoader();
        document.getElementById("successTitle").innerText = "Success";
        document.getElementById("successText").innerText = "Recipe successfully created";
        document.getElementById("successModal").classList.add("show");
    } catch (e) {
        hideLoader();
        alert("Error creating recipe: " + e.message);
    }
}

async function loadEditGrid() {
    showLoader();
    try {
        const recipes = await JSONBinAPI.getRecipes();
        recipesCache = recipes;
        renderGrid(recipesCache);
    } catch (e) {
        alert("Error loading recipes.");
    }
    hideLoader();
}

function renderGrid(recipes) {
    const grid = document.getElementById("editGrid");
    grid.innerHTML = "";
    
    if (recipes.length === 0) {
        grid.innerHTML = `<div class="no-results">No recipes found.</div>`;
        return;
    }

    recipes.forEach(r => {
        const btn = document.createElement("button");
        btn.className = "card-button";
        btn.onclick = () => openEditForm(r.bin_id || r.id);
        btn.innerHTML = `
            <img src="${r.image_url || r.image}" alt="${r.title}">
            <span>${r.title}</span>
        `;
        grid.appendChild(btn);
    });
}

function filterEditGrid() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const filtered = recipesCache.filter(r => (r.title || "").toLowerCase().includes(q));
    renderGrid(filtered);
}

async function openEditForm(binId) {
    showLoader();
    try {
        const data = await JSONBinAPI.getRawRecipeByBin(binId);

        editingBinId = binId;

        document.getElementById("recipeTitle").value = data.title || "";
        document.getElementById("recipeImage").value = data.image_url || data.image || "";
        document.getElementById("recipeVideo").value = data.video_url || "";
        
        document.getElementById("ingredientsContainer").innerHTML = "";
        if (data.ingredients && data.ingredients.length > 0) {
            data.ingredients.forEach(i => addIngredientRow(i.item || i.name, i.amount || i.measure));
        } else {
            addIngredientRow();
        }

        document.getElementById("stepsContainer").innerHTML = "";
        if (data.steps) {
            const stepsArr = Array.isArray(data.steps) ? data.steps : data.steps.split("\n\n");
            stepsArr.forEach(s => addStepRow(s));
        } else {
            addStepRow();
        }

        document.getElementById("editGridView").style.display = "none";
        document.getElementById("createView").style.display = "block";
        document.getElementById("manageDescription").style.display = "none";
        document.getElementById("btnUpload").style.display = "none";
        document.getElementById("editActions").style.display = "flex";

    } catch(e) {
        alert("Error fetching recipe details.");
    }
    hideLoader();
}

function cancelEdit() {
    editingBinId = null;
    document.getElementById("createView").style.display = "none";
    document.getElementById("editGridView").style.display = "block";
}

async function saveEdit() {
    const data = getFormData();
    if (!data || !editingBinId) return;

    showLoader();
    try {
        await JSONBinAPI.updateRecipe(editingBinId, data);
        hideLoader();
        document.getElementById("successTitle").innerText = "Success";
        document.getElementById("successText").innerText = "Recipe successfully edited";
        document.getElementById("successModal").classList.add("show");
    } catch(e) {
        hideLoader();
        alert("Error saving edit: " + e.message);
    }
}

function promptDelete() {
    document.getElementById("deleteConfirmModal").classList.add("show");
}

function closeDeletePrompt() {
    document.getElementById("deleteConfirmModal").classList.remove("show");
}

async function executeDelete() {
    closeDeletePrompt();
    showLoader();
    try {
        await JSONBinAPI.deleteRecipe(editingBinId);
        hideLoader();
        cancelEdit();
        loadEditGrid();
    } catch(e) {
        hideLoader();
        alert("Error deleting recipe: " + e.message);
    }
}