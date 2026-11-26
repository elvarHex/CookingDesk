// TheCocktailDB Integration for CookingDesk

window.CocktailAPI = (function(){
  const BASE = "https://www.thecocktaildb.com/api/json/v1/1/";

  /* =======================
     🌐 FETCH & NORMALIZE
  ======================= */
  async function fetchJson(url) {
    try {
      const resp = await fetch(url, { method: "GET", mode: "cors", cache: "no-store" });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (err) {
      console.error("CocktailAPI error:", err);
      return null;
    }
  }

  function normalize(data){
    if (!data) return null;
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const name = data["strIngredient" + i];
      const measure = data["strMeasure" + i];
      if (name && name.trim()) {
        ingredients.push({ name: name.trim(), measure: measure ? measure.trim() : "" });
      }
    }
    return {
      id: "cocktail_" + data.idDrink,
      title: data.strDrink || "",
      image: data.strDrinkThumb || "",
      area: data.strAlcoholic || "Alcoholic",
      instructions: data.strInstructions || "",
      ingredients: ingredients,
      video: data.strVideo || null,
      _sourceApi: "thecocktaildb"
    };
  }

  function normalizeArray(arr) {
    return Array.isArray(arr) ? arr.map(normalize) : [];
  }

  /* =======================
     🔍 API METHODS
  ======================= */
  return {
    async searchByName(name){
      if(!name) return [];
      const data = await fetchJson(BASE + "search.php?s=" + encodeURIComponent(name));
      return data ? normalizeArray(data.drinks) : [];
    },
    async getRandom(count = 1){
      const out = [];
      for(let i=0; i < count; i++){
        const data = await fetchJson(BASE + "random.php");
        if(data && data.drinks) out.push(normalize(data.drinks[0]));
      }
      return out;
    },
    async listAreas(){
      const data = await fetchJson(BASE + "list.php?a=list");
      return data && data.drinks ? data.drinks.map(d => ({ strArea: d.strAlcoholic })) : [];
    },
    async getById(id){
      if(!id) return null;
      const cleanId = String(id).replace(/^cocktail_/, "");
      const data = await fetchJson(BASE + "lookup.php?i=" + encodeURIComponent(cleanId));
      return (data && data.drinks) ? normalize(data.drinks[0]) : null;
    }
  };
})();