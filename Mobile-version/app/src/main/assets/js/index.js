let pageLoaded = false;
let timerDone = false;

function checkAndRedirect() {

    if (pageLoaded && timerDone) {

        const firstTime = localStorage.getItem("first_time");

        if (firstTime === "0") {
            window.location.href = "home.html";
        } else {
            window.location.href = "tutorial.html";
        }

    }

}


window.addEventListener('load', () => {

    pageLoaded = true;
    checkAndRedirect();

});


setTimeout(() => {

    timerDone = true;
    checkAndRedirect();

}, 1000);


window.addEventListener('resize', checkAndRedirect);