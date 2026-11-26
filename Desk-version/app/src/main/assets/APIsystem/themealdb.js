// TheMealDB Integration for CookingDesk

window.MealAPI = (function () {
  const BASE = "https://www.themealdb.com/api/json/v1/1";

  /* =======================
     🌐 FETCH & NORMALIZE
  ======================= */
  async function fetchJson(url) {
    try {
      const resp = await fetch(url, { method: "GET", mode: "cors", cache: "no-store" });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (err) {
      console.error("MealAPI error:", err);
      return null;
    }
  }

  function normalize(data) {
    if (!data) return null;
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const name = data["strIngredient" + i];
      const measure = data["strMeasure" + i];
      if (name && name.trim()) {
        ingredients.push({ name: name.trim(), measure: measure ? measure.trim() : "" });
      }
    }
    return {
      id: data.idMeal || "",
      title: data.strMeal || "",
      image: data.strMealThumb || "",
      area: data.strArea || "Custom",
      instructions: data.strInstructions || "",
      ingredients: ingredients,
      video: data.strYoutube || null,
      _sourceApi: "themealdb"
    };
  }

  function normalizeArray(arr) {
    return Array.isArray(arr) ? arr.map(normalize) : [];
  }

  /* =======================
     🔍 API METHODS
  ======================= */
  return {
    async searchByName(name) {
      if (!name) return [];
      const data = await fetchJson(`${BASE}/search.php?s=${encodeURIComponent(name)}`);
      return data ? normalizeArray(data.meals) : [];
    },
    async filterByIngredient(ingredients) {
      const data = await fetchJson(`${BASE}/filter.php?i=${encodeURIComponent(ingredients)}`);
      return data ? normalizeArray(data.meals) : [];
    },
    async filterByCategory(category) {
      const data = await fetchJson(`${BASE}/filter.php?c=${encodeURIComponent(category)}`);
      return data ? normalizeArray(data.meals) : [];
    },
    async filterByArea(area) {
      const data = await fetchJson(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
      return data ? normalizeArray(data.meals) : [];
    },
    async getRandom(count = 1) {

      const savedArea = localStorage.getItem("cookingdesk_area_filter");

      if (savedArea) {
        const data = await fetchJson(
          `${BASE}/filter.php?a=${encodeURIComponent(savedArea)}`
        );

        if (!data || !data.meals) return [];

        return data.meals.slice(0, count).map(meal => ({
          id: meal.idMeal,
          title: meal.strMeal,
          image: meal.strMealThumb,
          area: savedArea,
          instructions: "",
          ingredients: [],
          video: null,
          _sourceApi: "themealdb"
        }));
      }

      const meals = [];

      for (let i = 0; i < count; i++) {
        const data = await fetchJson(`${BASE}/random.php`);
        if (data && data.meals) {
          meals.push(normalize(data.meals[0]));
        }
      }

      return meals;
    },
    async lookupById(id) {
      const data = await fetchJson(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
      return (data && data.meals) ? normalize(data.meals[0]) : null;
    },
    async listCategories() {
      const data = await fetchJson(`${BASE}/list.php?c=list`);
      return data ? data.meals : [];
    },
    async listAreas() {
      const data = await fetchJson(`${BASE}/list.php?a=list`);

      if (!data || !data.meals) return [];

      return data.meals
        .map(d => d.strArea)
        .filter(Boolean);
    },
    async listIngredients() {
      const data = await fetchJson(`${BASE}/list.php?i=list`);
      return data ? data.meals : [];
    }
  };
})();