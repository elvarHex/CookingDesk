// JSONBin Integration for CookingDesk

window.JSONBinAPI = (function(){
  const BASE = "https://api.jsonbin.io/v3";
  let API_KEY = localStorage.getItem("jsonbin_api_key") || "";
  let INDEX_ID = localStorage.getItem("jsonbin_index_id") || "";
  let SAVED_ID = localStorage.getItem("jsonbin_saved_id") || "";

  /* =======================
     🔑 CONFIG
  ======================= */
  function setApiKey(key){ API_KEY = key; localStorage.setItem("jsonbin_api_key", key); }
  function clearApiKey(){
    API_KEY = ""; INDEX_ID = ""; SAVED_ID = "";
    localStorage.removeItem("jsonbin_api_key"); localStorage.removeItem("jsonbin_index_id"); localStorage.removeItem("jsonbin_saved_id");
  }
  function setIndexId(id){ INDEX_ID = id; localStorage.setItem("jsonbin_index_id", id); }
  function setSavedId(id){ SAVED_ID = id; localStorage.setItem("jsonbin_saved_id", id); }
  function getIndexId(){ return INDEX_ID; }
  function getSavedId(){ return SAVED_ID; }

  /* =======================
     🌐 FETCH & NORMALIZE
  ======================= */
  async function fetchJson(url, options = {}){
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", "X-Access-Key": API_KEY, "X-Bin-Meta": "false", ...(options.headers || {}) }
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function normalize(data) {
    if(!data) return null;

    let instructions = data.steps || "";
    if (Array.isArray(data.steps)) {
       instructions = data.steps.map((s, i) => `Step ${i + 1}:\n${s}`).join("\n\n");
    }

    const ingredients = (data.ingredients || []).map(i => ({
      name: i.item || i.name || "",
      measure: i.amount || i.measure || ""
    }));

    return {
      id: data.id || data.bin_id || "",
      title: data.title || "",
      image: data.image || data.image_url || "",
      area: "Custom",
      instructions: instructions,
      ingredients: ingredients,
      video: data.video_url || null,
      _sourceApi: data.source || "jsonbin"
    };
  }

  function normalizeArray(arr) {
    return Array.isArray(arr) ? arr.map(normalize) : [];
  }

  /* =======================
     📁 BINS CREATION
  ======================= */
  async function createIndex(){
    const data = await fetchJson(`${BASE}/b`, { method: "POST", body: JSON.stringify({ recipes: [] }) });
    setIndexId(data.metadata.id);
    return data.metadata.id;
  }
  async function createSaved(){
    const data = await fetchJson(`${BASE}/b`, { method: "POST", body: JSON.stringify({ saved: [] }) });
    setSavedId(data.metadata.id);
    return data.metadata.id;
  }

  /* =======================
     🔍 API METHODS
  ======================= */
  async function getRecipes(){
    if(!INDEX_ID) throw new Error("Index not configured");
    const data = await fetchJson(`${BASE}/b/${INDEX_ID}/latest`);
    return data.record ? data.record.recipes || [] : data.recipes || [];
  }

  async function searchByName(name){
    const recipes = await getRecipes();
    const filtered = recipes.filter(r => (r.title||"").toLowerCase().includes(name.toLowerCase()));
    return normalizeArray(filtered);
  }

  async function getRandom(count = 12){
    const recipes = await getRecipes();
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return normalizeArray(shuffled.slice(0, count));
  }

  async function listAreas(){
    return [{ strArea: "Custom" }];
  }

  async function getRecipeByBin(binId){
    const data = await fetchJson(`${BASE}/b/${binId}/latest`);
    const raw = data.record ? data.record : data;
    return normalize(raw);
  }

  async function getSavedRecipes(){
    if(!SAVED_ID) throw new Error("Saved bin not configured");
    const data = await fetchJson(`${BASE}/b/${SAVED_ID}/latest`);
    const rawList = data.record ? data.record.saved || [] : data.saved || [];
    return normalizeArray(rawList);
  }

  async function deleteSavedRecipe(id){
    if(!SAVED_ID) throw new Error("Saved bin not configured");
    const data = await fetchJson(`${BASE}/b/${SAVED_ID}/latest`);
    const saved = data.record ? data.record.saved || [] : data.saved || [];
    const updated = saved.filter(r => r.id !== id && r.bin_id !== id);
    await fetchJson(`${BASE}/b/${SAVED_ID}`, { method: "PUT", body: JSON.stringify({ saved: updated }) });
    return true;
  }

  return {
    setApiKey, clearApiKey, setIndexId, setSavedId, getIndexId, getSavedId,
    createIndex, createSaved, getRecipes, getSavedRecipes, deleteSavedRecipe,
    searchByName, getRandom, listAreas, getRecipeByBin
  };
})();