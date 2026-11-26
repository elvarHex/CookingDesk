function updateNetworkState() {
    document.getElementById("netStatus").textContent =
        navigator.onLine ? "Online" : "Offline";
}

updateNetworkState();
setInterval(updateNetworkState, 3000);

function loadAppVersion() {
    const versionEl = document.getElementById("appVersionText");
    if (window.Android && window.Android.getAppVersion) {
        try {
            const version = window.Android.getAppVersion();
            versionEl.textContent = "Desk - v" + version;
        } catch (e) {
            versionEl.textContent = "Desk - Unknown";
        }
    } else {
        versionEl.textContent = "Desk - Web";
    }
}

loadAppVersion();

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn")
            .forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".page")
            .forEach(p => p.classList.remove("active-page"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.page)
            .classList.add("active-page");
    });
});

function updateButton() {
    const key = localStorage.getItem("jsonbin_api_key");
    const btn = document.getElementById("connectBtn");
    const binText = document.getElementById("binIdDisplay");

    if (key) {
        btn.textContent = "Disconnect";
        btn.classList.replace("btn-primary", "btn-danger");

        btn.onclick = () => {
            if (window.JSONBinAPI) {
                JSONBinAPI.clearApiKey();
            } else {
                localStorage.removeItem("jsonbin_api_key");
                localStorage.removeItem("jsonbin_index_id");
                localStorage.removeItem("jsonbin_saved_id");
            }
            updateButton();
        };

        const indexId = localStorage.getItem("jsonbin_index_id");
        const savedId = localStorage.getItem("jsonbin_saved_id");

        binText.innerHTML =
            `<b>API Key</b><br>${key}<br><br>
             <b>Index Bin</b><br>${indexId || "-"}<br><br>
             <b>Saved Bin</b><br>${savedId || "-"}`;
    } else {
        btn.textContent = "Connect";

        if (btn.classList.contains("btn-danger")) {
            btn.classList.replace("btn-danger", "btn-primary");
        }

        btn.onclick = () => {
            document.getElementById("jsonbinModal").classList.add("show");
        };

        binText.innerHTML = "";
    }
}

updateButton();

document.getElementById("exportBtn").onclick = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    const json = JSON.stringify(data, null, 2);

    if (window.Android && Android.exportData) {
        Android.exportData(json);
        return;
    }

    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cookingdesk-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
};

const importFile = document.getElementById("importFile");

document.getElementById("importBtn").onclick = () => {
    if (window.Android && Android.importData) {
        Android.importData();
        return;
    }
    importFile.click();
};

importFile.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = event => {
        try {
            const data = JSON.parse(event.target.result);
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            updateButton();
            alert("Data imported successfully");
        } catch {
            alert("Invalid file");
        }
    };
    reader.readAsText(file);
});

function receiveImportedData(json) {
    if (window.Android && Android.showDialog) {
        Android.showDialog("Data successfully imported");
        return;
    }

    try {
        const data = JSON.parse(json);
        Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
        });
        updateButton();
    } catch (e) {
        if (window.Android && Android.showDialog) {
            Android.showDialog("Invalid file");
        } else {
            alert("Invalid file");
        }
    }
}

document.querySelectorAll(".open-link").forEach(btn => {
    btn.addEventListener("click", () => {
        const url = btn.dataset.url;
        if (window.Android && Android.openExternal) {
            Android.openExternal(url);
        } else {
            window.open(url, "_blank");
        }
    });
});

const popup = document.getElementById("infoPopup");
const popupText = document.getElementById("popupText");

document.querySelectorAll(".info-circle").forEach(btn => {
    btn.addEventListener("click", () => {
        popupText.textContent = btn.dataset.popup;
        popup.classList.add("show");
    });
});

document.getElementById("closePopup").onclick = () => {
    popup.classList.remove("show");
};

document.querySelectorAll(".info-btn").forEach(button => {
    button.addEventListener("click", e => {
        e.stopPropagation();
        const tooltip = button.nextElementSibling;
        const visible = tooltip.classList.contains("show");
        document.querySelectorAll(".tooltip")
            .forEach(t => t.classList.remove("show"));
        if (!visible) tooltip.classList.add("show");
    });
});

document.addEventListener("click", () => {
    document.querySelectorAll(".tooltip")
        .forEach(t => t.classList.remove("show"));
});

const modal = document.getElementById("jsonbinModal");

window.onclick = event => {
    if (event.target === modal) {
        modal.classList.remove("show");
    }
    if (event.target === popup) {
        popup.classList.remove("show");
    }
};

document.getElementById("modalConnectBtn").addEventListener("click", async () => {
    const apiKey = document.getElementById("modalApiKey").value.trim();
    if (!apiKey) {
        if (window.Android && Android.showDialog) {
            Android.showDialog("API Key is required");
        } else {
            alert("API Key is required");
        }
        return;
    }

    const btn = document.getElementById("modalConnectBtn");
    const originalText = btn.textContent;
    btn.textContent = "Connecting...";
    btn.disabled = true;

    try {
        JSONBinAPI.setApiKey(apiKey);

        if (document.getElementById("modalCreateIndex").checked) {
            await JSONBinAPI.createIndex();
        } else {
            const idxId = document.getElementById("modalIndexId").value.trim();
            if (idxId) JSONBinAPI.setIndexId(idxId);
        }

        if (document.getElementById("modalCreateSaved").checked) {
            await JSONBinAPI.createSaved();
        } else {
            const svdId = document.getElementById("modalSavedId").value.trim();
            if (svdId) JSONBinAPI.setSavedId(svdId);
        }

        modal.classList.remove("show");
        updateButton();

        document.getElementById("modalApiKey").value = "";
        document.getElementById("modalIndexId").value = "";
        document.getElementById("modalSavedId").value = "";
        document.getElementById("modalCreateIndex").checked = false;
        document.getElementById("modalCreateSaved").checked = false;

    } catch (error) {
        if (window.Android && Android.showDialog) {
            Android.showDialog("Error: " + error.message);
        } else {
            alert("Error: " + error.message);
        }
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});