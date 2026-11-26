document.addEventListener("DOMContentLoaded", function() {
    const savedLink = document.getElementById("savedLink");

    // Intercepts clicks on saved recipes to verify cloud credentials
    savedLink.addEventListener("click", function(e) {
        const id = localStorage.getItem("jsonbin_saved_id");
        const index = localStorage.getItem("jsonbin_index_id");
        const key = localStorage.getItem("jsonbin_api_key");

        if (!id || !index || !key || id.trim() === "" || index.trim() === "" || key.trim() === "") {
            e.preventDefault();
            document.getElementById("cloudModal").style.display = "flex";
        }
    });
});

