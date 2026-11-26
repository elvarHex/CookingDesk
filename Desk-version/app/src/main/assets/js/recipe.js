// js/recipe.js
const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const loadingOverlay = document.getElementById("loadingOverlay");

const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

let currentRecipeId = null;
let currentRecipeSource = null;

function showError(err) {
    errorText.textContent = "ERROR: [" + err + "]";
    errorModal.classList.add("show");
}

function handleReload() {
    toggleLoader(true);
    location.reload();
}

function toggleLoader(show) {
    if (show) loadingOverlay.classList.add("show");
    else loadingOverlay.classList.remove("show");
}

window.addEventListener('error', function (event) {
    if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK' || event.target.tagName === 'IMG')) {
        const fileName = event.target.src || event.target.href;
        showError("File not found: " + fileName.split('/').pop());
        toggleLoader(false);
    } else {
        showError(event.message);
        toggleLoader(false);
    }
}, true);

window.addEventListener('unhandledrejection', function (event) {
    showError("Data error: " + (event.reason.message || event.reason));
    toggleLoader(false);
});

function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2500);
}

async function loadRecipe() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const source = params.get("source");
    const isSaved = params.has("saved");

    if (!id) return;

    currentRecipeId = id;
    currentRecipeSource = source;

    toggleLoader(true);

    try {
        const recipe = await APIBridge.getById(id, source);

        if (!recipe) {
            throw new Error("Recipe not found or connection error");
        }

        document.getElementById("recipeTitle").textContent = recipe.title;
        document.getElementById("recipeImage").src = recipe.image;
        document.getElementById("instructions").textContent = recipe.instructions;
        document.getElementById("startCookingBtn").href = "letscook.html?id=" + id + "&source=" + source;

        const ul = document.getElementById("ingredientsList");
        ul.innerHTML = "";

        recipe.ingredients.forEach(i => {
            const li = document.createElement("li");
            li.textContent = (i.measure ? i.measure + " " : "") + i.name;
            ul.appendChild(li);
        });

        if (recipe.video) {
            document.getElementById("videoBtn").style.display = "flex";
            document.getElementById("videoBtn").onclick = () => openVideo(recipe.video);
        }

        const saveBtn = document.getElementById("saveBtn");
        const removeBtn = document.getElementById("removeBtn");

        if (isSaved) {
            saveBtn.style.display = "none";
            removeBtn.style.display = "flex";
            removeBtn.onclick = () => {
                deleteModal.classList.add("show");
            };
        } else {
            saveBtn.style.display = "flex";
            if (removeBtn) removeBtn.style.display = "none";

            saveBtn.onclick = () => saveRecipe({
                title: recipe.title,
                image: recipe.image,
                id: id,
                source: source
            });
        }
    } catch (e) {
        showError(e.message || e);
    } finally {
        toggleLoader(false);
    }
}

async function saveRecipe(data) {
    if (!APIBridge.isJsonBinConnected()) {
        showToast("JSONBin.io not connected");
        return;
    }

    const savedId = localStorage.getItem("jsonbin_saved_id");
    const key = localStorage.getItem("jsonbin_api_key");

    toggleLoader(true);
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${savedId}/latest`, {
            headers: { "X-Access-Key": key, "X-Bin-Meta": "false" }
        });
        const json = await res.json();
        let list = (json.record && json.record.saved) ? json.record.saved : (json.saved || []);

        if (list.some(r => r.id === data.id)) {
            showToast("Already saved");
            return;
        }

        list.push(data);
        await fetch(`https://api.jsonbin.io/v3/b/${savedId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "X-Access-Key": key },
            body: JSON.stringify({ saved: list })
        });

        showToast("Recipe saved");
        const currentUrl = window.location.href.split("#")[0];
        if (!currentUrl.includes("saved")) {
            window.location.replace(currentUrl + "&saved");
        } else {
            window.location.reload();
        }
    } catch (e) {
        showToast("Error saving");
    } finally {
        toggleLoader(false);
    }
}

cancelDeleteBtn?.addEventListener("click", () => {
    deleteModal.classList.remove("show");
});

confirmDeleteBtn?.addEventListener("click", removeSavedRecipe);

async function removeSavedRecipe() {
    deleteModal.classList.remove("show");
    toggleLoader(true);

    try {
        const savedRecipes = await APIBridge.getSavedRecipes();
        let targetId = currentRecipeId;

        if (currentRecipeSource === "thecocktaildb") {
            targetId = "cocktail_" + currentRecipeId;
        }

        const recipeToDelete = savedRecipes.find(r => r.id.toString() === targetId.toString());

        if (recipeToDelete) {
            await APIBridge.deleteSavedRecipe(recipeToDelete.id);
        }

        window.location.replace(`recipe.html?id=${currentRecipeId}&source=${currentRecipeSource}`);
    } catch (e) {
        showToast("Error removing recipe");
    } finally {
        toggleLoader(false);
    }
}

loadRecipe();