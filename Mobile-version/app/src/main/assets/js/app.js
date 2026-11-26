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

const homeSearchBtn = document.getElementById('homeSearchBtn');
    const homeSearchInput = document.getElementById('homeSearchInput');

    function executeHomeSearch() {
        const query = homeSearchInput.value.trim();
        window.location.href = 'search.html?recipename=' + encodeURIComponent(query);
    }

    if (homeSearchBtn) {
        homeSearchBtn.addEventListener('click', executeHomeSearch);
    }
    if (homeSearchInput) {
        homeSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') executeHomeSearch();
        });
    }

trackPage();