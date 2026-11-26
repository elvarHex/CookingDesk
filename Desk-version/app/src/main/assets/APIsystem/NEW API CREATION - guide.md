# Adding a New API to CookingDesk

This guide explains how to integrate a new API into the CookingDesk system. Thanks to the centralized architecture and lazy loading mechanism, you only need to create a new adapter file and register it in the bridge.

---

# Architecture Overview

CookingDesk uses a **Bridge Pattern** managed by `apibridge.js`.

The user interface interacts exclusively with the bridge, which dynamically loads and invokes the correct API adapter only when requested.

To add a new API, you only need to perform two steps:

1. Create a new adapter script.
2. Register the adapter in the central bridge.

---

# Step 1: Create the API Adapter File

Create a new JavaScript file inside the API directory.

**Path**

```text
app/src/main/assets/APIsystem/your-api-name.js
```

Every API adapter must:

- expose a globally accessible object through `window`;
- implement the standard interface;
- normalize all returned data into the CookingDesk standard format.

Data normalization is **mandatory** to ensure compatibility with the application's UI components.

---

## Boilerplate Template

Copy the following structure into your new file (for example `customapi.js`).

```javascript
// app/src/main/assets/APIsystem/customapi.js

window.CustomAPI = (function() {
    const BASE_URL = "https://api.example.com/v1/";

    /**
     * Normalizes raw API data into the standard CookingDesk format.
     * @param {Object} item - Raw data from the external API.
     * @returns {Object|null} Standardized recipe object.
     */
    function normalize(item) {
        if (!item) return null;

        return {
            // CRITICAL: Always prefix the ID to prevent collisions across APIs
            id: "customapi_" + item.id_original,

            title: item.recipe_name || "",
            image: item.image_url || "",
            area: item.region || "Custom",
            instructions: item.cooking_steps || "",

            ingredients: Array.isArray(item.ingredients_list)
                ? item.ingredients_list.map(ing => ({
                    name: ing.name,
                    measure: ing.amount
                }))
                : [],

            video: item.youtube_link || null,

            // Must match the ID used in apibridge.js
            _sourceApi: "customapi"
        };
    }

    function normalizeArray(arr) {
        return Array.isArray(arr)
            ? arr.map(normalize).filter(Boolean)
            : [];
    }

    // Public Interface required by APIBridge
    return {

        async searchByName(name) {
            try {
                const response = await fetch(
                    `${BASE_URL}search?q=${encodeURIComponent(name)}`
                );

                const data = await response.json();
                return normalizeArray(data.results);

            } catch (error) {
                console.error("CustomAPI search error:", error);
                return [];
            }
        },

        async getRandom(count = 12) {
            try {
                const response = await fetch(
                    `${BASE_URL}random?limit=${count}`
                );

                const data = await response.json();
                return normalizeArray(data.results);

            } catch (error) {
                console.error("CustomAPI random error:", error);
                return [];
            }
        },

        async getById(id) {
            try {

                // Strip prefix if your external API requires the raw ID
                const rawId = id.replace("customapi_", "");

                const response = await fetch(
                    `${BASE_URL}lookup?id=${rawId}`
                );

                const data = await response.json();

                return normalize(data.recipe);

            } catch (error) {
                console.error("CustomAPI lookup error:", error);
                return null;
            }
        },

        async listAreas() {
            try {

                const response = await fetch(
                    `${BASE_URL}regions`
                );

                const data = await response.json();

                // Must return an array of strings or objects
                // containing { strArea: "Name" }
                return data.regions || [];

            } catch (error) {
                console.error("CustomAPI regions error:", error);
                return [];
            }
        }
    };

})();
```

---

# Step 2: Register the API in the Bridge

Open the central bridge file.

**Path**

```text
app/src/main/assets/APIsystem/apibridge.js
```

Update the two configuration objects located at the top of the file.

These inform CookingDesk that your API exists and how it should be loaded.

---

## A. Update `apiConfig`

Add:

- your API ID
- the adapter file path
- the name of the global object exposed in Step 1

```javascript
const apiConfig = {
    themealdb: {
        file: "APIsystem/themealdb.js",
        globalVar: "MealAPI"
    },

    thecocktaildb: {
        file: "APIsystem/thecocktaildb.js",
        globalVar: "CocktailAPI"
    },

    jsonbin: {
        file: "APIsystem/jsonbin.js",
        globalVar: "JSONBinAPI"
    },

    customapi: {
        file: "APIsystem/customapi.js",
        globalVar: "CustomAPI"
    } // <-- ADD YOUR API HERE
};
```

---

## B. Update `apisMetadata`

Add the metadata object.

This controls the display name shown in UI search filters and menus.

```javascript
const apisMetadata = [

    {
        id: "themealdb",
        name: "TheMealDB"
    },

    {
        id: "thecocktaildb",
        name: "TheCocktailDB"
    },

    {
        id: "jsonbin",
        name: "JSONBin.io"
    },

    {
        id: "customapi",
        name: "My Custom Service"
    } // <-- ADD YOUR API HERE

];
```

---

# Core Requirements Checklist

Before submitting a Pull Request, verify that your implementation satisfies all of the following requirements.

- [ ] **No HTML Changes**  
  Do **not** add `<script>` tags to any HTML file. `apibridge.js` loads adapters dynamically.

- [ ] **ID Prefixing**  
  Every normalized object **must** prefix its `id`.

  Example:

  ```javascript
  id: "yourapi_" + originalId
  ```

  This prevents collisions between multiple APIs.

- [ ] **Source Tracking**  
  Every normalized object **must** include:

  ```javascript
  _sourceApi: "your-api-id"
  ```

  The value **must exactly match** the key used inside `apiConfig`.

- [ ] **Graceful Failure**  
  Every public method must catch network and parsing errors locally.

  Return safe defaults:

    - `[]` for arrays
    - `null` for single objects

  This prevents failures from interrupting the global multi-source query loop.

---

# Summary

Adding a new API requires only two steps:

1. Create a new adapter implementing the standard APIBridge interface.
2. Register it in `apibridge.js`.

By following the normalization rules and the checklist above, your adapter will automatically integrate with CookingDesk's search, filtering, and recipe loading workflow.