function goto(href) {
  window.location.href = href;
}

function trackPage() {
    const page = window.location.pathname.split('/').pop();

    if (page === 'saved.html' || page === 'search.html') {
        sessionStorage.setItem('lastValidPage', page);
    }
}

function GoBackRecipe() {
    const last = sessionStorage.getItem('lastValidPage');

    if (last === 'saved.html' || last === 'search.html') {
        window.location.href = last;
    } else {
        window.location.href = 'search.html';
    }
}

function startClock(el) {
  if (!el) return;
  function tick() {
    const d = new Date();
    el.textContent = d.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  tick();
  setInterval(tick, 1000);
}

function startWifiMonitor(imgEl) {
  if (!imgEl) return;

  function update() {
    const paginaCorrente = window.location.pathname;
    let percorsoImmagine = "";

    if (paginaCorrente.includes("/tools/")) {
      percorsoImmagine = navigator.onLine ? "../img/wifion.svg" : "../img/wifioff.svg";
    } else {
      percorsoImmagine = navigator.onLine ? "img/wifion.svg" : "img/wifioff.svg";
    }

    imgEl.src = percorsoImmagine;
  }

  update();
  setInterval(update, 3000);
}

function startBattery(el) {
  if (!el) return;

  if ("getBattery" in navigator) {
    navigator.getBattery().then(b => {
      function update() {
        el.textContent = Math.round(b.level * 100) + "%";
      }
      update();
      b.addEventListener("levelchange", update);
    });
  } else {
    el.textContent = "--";
  }
}

// STATUS BAR
function updateTime() {
    const d = new Date();
    document.getElementById("time").textContent =
        d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
setInterval(updateTime, 1000);
updateTime();

function updateWifi() {
    const wifiImg = document.getElementById("wifi");
    if (!wifiImg) return;

    const paginaCorrente = window.location.pathname;

    let percorsoImmagine = "";

    if (paginaCorrente.includes("/tools/")) {
        percorsoImmagine = navigator.onLine ? "../img/wifion.svg" : "../img/wifioff.svg";
    } else {
        percorsoImmagine = navigator.onLine ? "img/wifion.svg" : "img/wifioff.svg";
    }

    wifiImg.src = percorsoImmagine;
}

updateWifi();
setInterval(updateWifi, 3000);

// BATTERY STATUS
if (navigator.getBattery) {
    navigator.getBattery().then(b => {
        function upd() {
            document.getElementById("battery").textContent =
                Math.round(b.level * 100) + "%";
        }
        upd();
        b.addEventListener("levelchange", upd);
    });
} else {
    document.getElementById("battery").textContent = "n/a";
}

// CLOUD MODAL
function closeCloudModal() {
    document.getElementById("cloudModal").style.display = "none";
}

// NAVIGATION
function GoHome(event) {
    event.preventDefault();
    const referrer = document.referrer;

    if (referrer.endsWith('home.html') || referrer.endsWith('/')) {
        history.back();
    } else {
        window.location.href = 'home.html';
    }
}

function GoTools(event) {
    event.preventDefault();
    const referrer = document.referrer;

    if (referrer.endsWith('tools.html')) {
        history.back();
    } else {
        window.location.href = '../tools.html';
    }
}

function GoCook(event) {
    event.preventDefault();
    const referrer = document.referrer;

    if (referrer.endsWith('cook.html') || referrer.endsWith('/')) {
        history.back();
    } else {
        window.location.href = 'cook.html';
    }
}

// EXIT RECIPE
function confirmExit(){ document.getElementById("confirmPopup").style.display="flex"; }
function closeConfirm(){ document.getElementById("confirmPopup").style.display="none"; }

function exitRecipe(){
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = `recipe.html?id=${recipeId}&source=${source}`;
}

function exitRecipeNoConfirm(){ exitRecipe(); }

// YOUTUBE
function getEmbed(url){
    if(!url) return null;
    let id=null;
    if(url.includes("watch?v=")) id=url.split("watch?v=")[1].split("&")[0];
    else if(url.includes("youtu.be/")) id=url.split("youtu.be/")[1].split("?")[0];
    return id ? "https://www.youtube.com/embed/" + id + "?rel=0&modestbranding=1&autoplay=1" : null;
}

function openVideo(url){
    const embed = getEmbed(url);
    if(!embed) return;
    const iframe = document.getElementById("videoFrame");
    iframe.src = embed;
    document.getElementById("videoModal").style.display = "flex";
}

function closeVideo(){
    document.getElementById("videoFrame").src = "";
    document.getElementById("videoModal").style.display = "none";
}

trackPage();