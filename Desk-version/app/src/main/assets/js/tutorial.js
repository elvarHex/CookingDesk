window.onload = () => {
    if (!localStorage.getItem("first_time")) {
        localStorage.clear();
    }
};

function nextStep(current, next) {
    const cur = document.getElementById(`step-${current}`);
    const nxt = document.getElementById(`step-${next}`);

    if (cur) cur.classList.remove('active');
    if (nxt) nxt.classList.add('active');
}

function saveApiKeyAndNext() {
    const val = document.getElementById('api-key-input').value.trim();
    if (val !== "") {
        localStorage.setItem('jsonbin_api_key', val);
    }
    nextStep(3, 4);
}

function skipCloud() {
    nextStep(3, 6);
}

function toggleInput(containerId, btnId) {
    document.getElementById(containerId).classList.remove('hidden');
    document.getElementById(btnId).classList.add('active');
}

function saveBinIdAndNext(inputId, storageKey, currentStep, nextStepNum) {
    const val = document.getElementById(inputId).value.trim();
    if (val !== "") {
        localStorage.setItem(storageKey, val);
    }
    nextStep(currentStep, nextStepNum);
}

async function createBin(type) {
    const apiKey = localStorage.getItem('jsonbin_api_key');
    if (!apiKey) {
        alert("Error: API Key missing. Go back or use Link File.");
        return;
    }

    const btnId = type === 'index' ? 'btn-create-index' : 'btn-create-saved';
    const btn = document.getElementById(btnId);

    const originalText = btn.innerHTML;
    btn.innerHTML = "Loading...";
    btn.disabled = true;

    const bodyData = type === 'index' ? { recipes: [] } : { saved: [] };
    const storageKey = type === 'index' ? 'jsonbin_index_id' : 'jsonbin_saved_id';
    const currentStep = type === 'index' ? 4 : 5;
    const nextStepNum = type === 'index' ? 5 : 6;

    try {
        const res = await fetch("https://api.jsonbin.io/v3/b", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Access-Key": apiKey
            },
            body: JSON.stringify(bodyData)
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        localStorage.setItem(storageKey, data.metadata.id);

        nextStep(currentStep, nextStepNum);

    } catch (err) {
        alert("There was an error creating the file.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function finishTutorial() {
    localStorage.setItem("first_time", "0");
    window.location.href = "home.html";
}

function importTutorialData() {

    if (window.Android && Android.importTutorialData) {
        Android.importTutorialData();
        return;
    }

    document.getElementById("tutorial-import-file").click();
}

document.getElementById("tutorial-import-file").addEventListener("change", e => {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = event => {

        try {

            const data = JSON.parse(event.target.result);

            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });

            if (window.Android && Android.showDialog) {
                Android.showDialog("Data successfully imported");
            } else {
                alert("Data successfully imported");
            }

        } catch {

            if (window.Android && Android.showDialog) {
                Android.showDialog("Invalid file");
            } else {
                alert("Invalid file");
            }
        }
    };

    reader.readAsText(file);
});

function receiveTutorialImportedData(json) {

    try {

        const data = JSON.parse(json);

        Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
        });


        if (window.Android && Android.showDialog) {
            Android.showDialog("Data successfully imported");
        } else {
            alert("Data successfully imported");
        }


        nextStep(2, 6);


    } catch (e) {

        console.error(e);

        if (window.Android && Android.showDialog) {
            Android.showDialog("Invalid file");
        } else {
            alert("Invalid file");
        }

    }

}

function showErrorPopup(msg) {
    const existing = document.getElementById("tutorial-error");

    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "tutorial-error";
    div.style.position = "fixed";
    div.style.top = "50%";
    div.style.left = "50%";
    div.style.transform = "translate(-50%, -50%)";
    div.style.background = "white";
    div.style.padding = "20px";
    div.style.borderRadius = "12px";
    div.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)";
    div.style.zIndex = "99999";
    div.style.fontSize = "16px";
    div.style.fontWeight = "600";
    div.style.color = "#c62828";
    div.innerText = msg;

    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 2000);
}