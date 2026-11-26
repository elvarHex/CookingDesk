// APIsystem/apibridge.js

window.APIBridge = (function() {

    // API List
    const apiConfig = {
        themealdb: { file: "APIsystem/themealdb.js", globalVar: "MealAPI" },
        thecocktaildb: { file: "APIsystem/thecocktaildb.js", globalVar: "CocktailAPI" },
        jsonbin: { file: "APIsystem/jsonbin.js", globalVar: "JSONBinAPI" }
    };

    const apisMetadata = [
        { id: "themealdb", name: "TheMealDB" },
        { id: "thecocktaildb", name: "TheCocktailDB" },
        { id: "jsonbin", name: "JSONBin.io" }
    ];

    const loadingPromises = {};

    function loadApiScript(source) {
        const config = apiConfig[source];
        if (!config) return Promise.resolve();

        if (window[config.globalVar]) return Promise.resolve();

        if (loadingPromises[source]) return loadingPromises[source];

        loadingPromises[source] = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = config.file;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Unable to load API extension for: ${source}`));
            document.head.appendChild(script);
        });

        return loadingPromises[source];
    }

    function getHandler(source) {
        const config = apiConfig[source];
        return config ? window[config.globalVar] : null;
    }

    function isJsonBinConnected() {
        const id = localStorage.getItem("jsonbin_saved_id");
        const index = localStorage.getItem("jsonbin_index_id");
        const key = localStorage.getItem("jsonbin_api_key");
        return Boolean(id && index && key && id.trim() !== "" && index.trim() !== "" && key.trim() !== "");
    }

    return {
        getAvailableApis: () => apisMetadata,
        isJsonBinConnected,

        async searchByName(name, sourcesArray) {
            let results = [];
            for (const source of sourcesArray) {
                if (source === "jsonbin" && !isJsonBinConnected()) continue;

                try {
                    await loadApiScript(source);
                    const handler = getHandler(source);
                    if (!handler) continue;

                    const r = name ? await handler.searchByName(name) : await handler.getRandom(12);
                    if (r) results = results.concat(r);
                } catch (err) {
                    console.warn(`APIBridge: Error with ${source}`, err);
                    throw new Error(`Connection to ${apisMetadata.find(a => a.id === source).name} failed.`);
                }
            }
            return results;
        },

        async getById(id, source) {
            await loadApiScript(source);
            const handler = getHandler(source);

            if (!handler) throw new Error(`Handler API per ${source} not found.`);

            if (source === "themealdb") return await handler.lookupById(id);
            if (source === "thecocktaildb") return await handler.getById(id);
            if (source === "jsonbin") return await handler.getRecipeByBin(id);

            if (handler.getById) return await handler.getById(id);
            return null;
        },

        async listAreas(sourcesArray) {
            const areaSet = new Set();
            for (const source of sourcesArray) {
                if (source === "jsonbin" && !isJsonBinConnected()) continue;

                try {
                    await loadApiScript(source);
                    const handler = getHandler(source);
                    if (!handler || !handler.listAreas) continue;

                    const arr = await handler.listAreas();
                    if (arr) {
                        arr.forEach(a => {
                            if (typeof a === 'string') areaSet.add(a);
                            else if (a.strArea) areaSet.add(a.strArea);
                        });
                    }
                } catch (e) {}
            }
            return Array.from(areaSet).sort();
        },

        async getSavedRecipes() {
            if (!isJsonBinConnected()) throw new Error("Cloud service not configured");

            await loadApiScript("jsonbin");
            const handler = getHandler("jsonbin");
            if (!handler) throw new Error("Cloud extension not loaded");

            return await handler.getSavedRecipes();
        },

        async deleteSavedRecipe(id) {
            if (!isJsonBinConnected()) throw new Error("Cloud service not configured");

            await loadApiScript("jsonbin");
            const handler = getHandler("jsonbin");
            if (!handler) throw new Error("Cloud extension not loaded");

            return await handler.deleteSavedRecipe(id);
        }
    };
})();