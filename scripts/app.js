console.log("✅ app.js is loaded!");

// HTML Elements
const ingredientInput = document.getElementById('ingredient');
const showRecipesButton = document.getElementById('show-recipes-button');
const recipeImageInput = document.getElementById('user-recipe-image');
const recipeCameraButton = document.getElementById('camera-button');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const addIngredientButton = document.getElementById('add-ingredient');
const addMultipleIngredientsButton = document.getElementById('add-multiple-ingredients');
const ingredientList = document.getElementById('ingredient-list');
const recipeResults = document.getElementById('recipe-results');
const recipeForm = document.getElementById('recipe-form');
const userRecipeGallery = document.getElementById('user-recipe-gallery');
const recipesContainer = document.getElementById('recipes-container');
const cameraCaptureSection = document.getElementById('camera-capture');


let ingredients = [];
let loggedIn = false;
let db = null;

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
              console.log('✅ Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
              console.error('❌ Service Worker registration failed:', error);
          });
  } else {
      console.warn("Service Workers are not supported in this browser.");
  }
}



function openIndexedDB() {
  return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
          reject("IndexedDB is not supported by this browser.");
          return;
      }

      const DB_NAME = "RecipeAppDB";
      const DB_VERSION = 121;

      console.log(`Opening IndexedDB: ${DB_NAME}, Version: ${DB_VERSION}`);

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = function (event) {
          reject("Database error: " + event.target.errorCode);
      };

      request.onsuccess = function (event) {
          console.log("✅ IndexedDB connected.");
          resolve(event.target.result);
      };

      request.onupgradeneeded = function (event) {
          const db = event.target.result;
          console.log("🔄 IndexedDB upgrade needed, updating stores...");

          if (!db.objectStoreNames.contains("recipes")) {
              const recipeStore = db.createObjectStore("recipes", { keyPath: "id", autoIncrement: true });
              recipeStore.createIndex("synced", "synced", { unique: false });
              console.log('✅ Created "recipes" store with "synced" index.');
          }

          if (!db.objectStoreNames.contains("ingredients")) {
              db.createObjectStore("ingredients", { keyPath: "id", autoIncrement: true });
              console.log('✅ Created "ingredients" store.');
          }
      };
  });
}

openIndexedDB().then(db => {
  console.log("✅ IndexedDB bağlantısı başarılı!", db);
}).catch(error => {
  console.error("❌ IndexedDB açılırken hata oluştu:", error);
});

// Save Recipe to IndexedDB with Sync Status
function saveRecipeToIndexedDB(recipe, synced = false) {
  if (!db) {
      console.error('IndexedDB is not initialized.');
      return;
  }
  const transaction = db.transaction('recipes', 'readwrite');
  const store = transaction.objectStore('recipes');

  const recipeData = {
      id: recipe.id || new Date().getTime(), // Eğer id yoksa, zaman damgasını id olarak kullan
      name: recipe.name,
      description: recipe.description,
      imageSrc: recipe.imageSrc || null,
      synced: synced
  };

  store.put(recipeData);
  transaction.oncomplete = () => {
      console.log('✅ Recipe saved to IndexedDB:', recipeData);
  };
  transaction.onerror = (event) => {
      console.error('❌ Error saving recipe:', event.target.error);
  };
}


// Get Unsynced Recipes from IndexedDB
function getUnsyncedRecipesFromIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('IndexedDB is not initialized.');
      return;
    }

    const transaction = db.transaction('recipes', 'readonly');
    const store = transaction.objectStore('recipes');

    try {
      const index = store.index('synced');
      const request = index.getAll(0);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject('Failed to retrieve unsynced recipes:', event.target.error);
    } catch (error) {
      reject('IndexedDB does not have a "synced" index yet.');
    }
    
  });
}



// Sync Unsynced Recipes to Server
async function syncUnsyncedRecipes() {
  try {
    const unsyncedRecipes = await getUnsyncedRecipesFromIndexedDB();
    if (unsyncedRecipes.length === 0) return;

    const response = await fetch('https://api.example.com/sync', {
      method: 'POST',
      body: JSON.stringify(unsyncedRecipes),
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      unsyncedRecipes.forEach(recipe => saveRecipeToIndexedDB({ ...recipe, synced: true }));
      showMessage('Recipes synced successfully!', 'success');
    } else {
      throw new Error('Failed to sync recipes.');
    }
  } catch (error) {
    console.error('Error syncing recipes:', error);
    showMessage('Failed to sync recipes. Please try again later.', 'error');
  }
}




// On Page Load
window.addEventListener('load', () => {
  openIndexedDB()
      .then((database) => {
          db = database;  // 💡 IndexedDB bağlantısını kaydet
          loadIngredientsFromIndexedDB();
          loadRecipesFromIndexedDB();
          syncUnsyncedRecipes();
          registerServiceWorker();
      })
      .catch((error) => {
          console.error('Error initializing IndexedDB:', error);
      });
});



// Translations (Dil Verileri)
const translations = {
  en: {
    title: "Recipe Finder",
    heroTitle: "Recipes Right for Your Family",
    heroDescription: "Find meals tailored to your preferences. Kid-friendly, quick, and easy recipes.",
    addIngredient: "Add Ingredient",
    addMultipleIngredients: "Add Multiple Ingredients",
    countryRecipes: "Find Recipes from My Country",
    noRecipes: "No recipes found in IndexedDB.",
  },
  tr: {
    title: "Tarif Bulucu",
    heroTitle: "Aileniz İçin Doğru Tarifler",
    heroDescription: "Tercihlerinize uygun yemekler bulun. Çocuk dostu, hızlı ve kolay tarifler.",
    addIngredient: "Malzeme Ekle",
    addMultipleIngredients: "Birden Fazla Malzeme Ekle",
    countryRecipes: "Ülkemden Tarifler Bul",
    noRecipes: "IndexedDB'de tarif bulunamadı.",
  },
  es: {
    title: "Buscador de Recetas",
    heroTitle: "Recetas Ideales para tu Familia",
    heroDescription: "Encuentra comidas adaptadas a tus preferencias. Recetas fáciles, rápidas y para niños.",
    addIngredient: "Agregar Ingrediente",
    addMultipleIngredients: "Agregar Múltiples Ingredientes",
    countryRecipes: "Encontrar Recetas de Mi País",
    noRecipes: "No se encontraron recetas en IndexedDB.",
  },
};

// Language Update Function
function updateLanguage(lang) {
  const { title, heroTitle, heroDescription, addIngredient, addMultipleIngredients, countryRecipes } =
    translations[lang];

  // Güncellenecek metinler
  document.getElementById("page-title").textContent = title;
  document.querySelector(".hero-section h2").textContent = heroTitle;
  document.querySelector(".hero-section p").textContent = heroDescription;
  document.getElementById("add-ingredient").textContent = addIngredient;
  document.getElementById("add-multiple-ingredients").textContent = addMultipleIngredients;
  document.getElementById("country-recipes").textContent = countryRecipes;
}

// Dil seçildiğinde çağrılacak
document.getElementById("language").addEventListener("change", (event) => {
  const selectedLanguage = event.target.value;
  updateLanguage(selectedLanguage);
});

// Varsayılan dilin ayarlanması
document.addEventListener("DOMContentLoaded", () => {
  const defaultLanguage = "en"; // Varsayılan dil
  updateLanguage(defaultLanguage);

});

// Check Offline Status
function checkOffline() {
  if (!navigator.onLine) {
    const offlineBanner = document.createElement('div');
    offlineBanner.id = 'offline-banner';
    offlineBanner.textContent = 'You are offline. Some features may not work.';
    offlineBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background-color: #ff6f61;
      color: white;
      text-align: center;
      padding: 10px;
      z-index: 1000;
    `;
    document.body.appendChild(offlineBanner);
    return true;
  } else {
    const offlineBanner = document.getElementById('offline-banner');
    if (offlineBanner) offlineBanner.remove();
    return false;
  }
}




// Login/Logout Functionality
loginButton.addEventListener('click', () => {
  loggedIn = true;
  showMessage('Logged in successfully!');
  loginButton.style.display = 'none';
  logoutButton.style.display = 'block';
});

logoutButton.addEventListener('click', () => {
  loggedIn = false;
  showMessage('Logged out successfully!');
  loginButton.style.display = 'block';
  logoutButton.style.display = 'none';
});

// Save Ingredients to IndexedDB
function saveIngredientsToIndexedDB(ingredients) {
  if (!db) {
    console.error('IndexedDB is not initialized.');
    return;
  }
  const transaction = db.transaction('ingredients', 'readwrite');
  const store = transaction.objectStore('ingredients');
  store.clear(); // Clear existing data
  ingredients.forEach((ingredient) => {
    store.add({ name: ingredient });
  });
  transaction.oncomplete = () => {
    console.log('Ingredients saved to IndexedDB:', ingredients);
  };
  transaction.onerror = (event) => {
    console.error('Error saving ingredients:', event.target.error);
  };
}

// Load Ingredients from IndexedDB
function loadIngredientsFromIndexedDB() {
  if (!db) {
    console.error('IndexedDB is not initialized.');
    return;
  }

  const transaction = db.transaction('ingredients', 'readonly');
  const store = transaction.objectStore('ingredients');
  const request = store.getAll();

  request.onsuccess = (event) => {
    const ingredientsData = event.target.result;
    ingredients = ingredientsData.map((item) => item.name);
    updateIngredientList();
    console.log('✅ Ingredients loaded from IndexedDB:', ingredients);
  };

  request.onerror = (event) => {
    console.error('❌ Error fetching ingredients from IndexedDB:', event.target.error);
  };
}



addIngredientButton.addEventListener('click', () => {
  const ingredient = ingredientInput.value.trim();
  addIngredientToList(ingredient);
});

addMultipleIngredientsButton.addEventListener('click', () => {
  const ingredient = ingredientInput.value.trim();
  addIngredientToList(ingredient);
});


// Recipe Submission
recipeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('user-recipe-name').value;
  const description = document.getElementById('user-recipe-description').value;
  const image = recipeImageInput.files[0];
  const capturedImage = document.querySelector('#camera-capture img')?.src;

  if (!name || !description || (!image && !capturedImage)) {
    showMessage('Please fill all the fields and upload an image.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    appendUserRecipe(name, description, reader.result);
  };

  if (image) {
    reader.readAsDataURL(image);
  } else if (capturedImage) {
    appendUserRecipe(name, description, capturedImage);
  }
  recipeForm.reset();
  clearCameraPreview();
});

// Append User Recipe
function appendUserRecipe(name, description, imageSrc, saveToDB = true) {
  const existingRecipes = recipesContainer.querySelectorAll('.user-recipe');
  for (const recipe of existingRecipes) {
    if (recipe.querySelector('h3').textContent === name) {
      console.log(`Recipe "${name}" is already displayed.`);
      return; // Eğer tarif zaten gösteriliyorsa eklemeyi durdur
    }
  }

  if (saveToDB) {
    saveRecipeToIndexedDB({ name, description, imageSrc, synced: false });
  }

  const div = document.createElement('div');
  div.classList.add('user-recipe');
  div.innerHTML = `
    <h3>${name}</h3>
    <img src="${imageSrc}" alt="${name}" style="max-width: 300px; border-radius: 10px;">
    <p>${description}</p>
  `;
  recipesContainer.appendChild(div);
}

// Show/Hide Recipes Button Functionality
  document.addEventListener('DOMContentLoaded', () => {
  const showRecipesButton = document.getElementById('show-recipes-button');
  const recipesContainer = document.getElementById('recipes-container');

  if (!showRecipesButton || !recipesContainer) {
    console.error("Required elements not found in the DOM.");
    return;
  }

// Show/Hide Recipes
showRecipesButton.addEventListener('click', () => {
  if (recipesContainer.style.display === 'none') {
    recipesContainer.style.display = 'block';
    showRecipesButton.textContent = 'Hide Recipes';
    loadRecipesFromIndexedDB();
  } else {
    recipesContainer.style.display = 'none';
    showRecipesButton.textContent = 'Show Recipes';
  }
});
});

// Load Recipes from IndexedDB
window.loadRecipesFromIndexedDB = function () {
  if (!db) {
    console.error('IndexedDB is not initialized.');
    return;
  }

  const recipesContainer = document.getElementById('recipes-container');
  if (!recipesContainer) {
    console.error("Element with ID 'recipes-container' not found in the DOM.");
    return;
  }

  const transaction = db.transaction('recipes', 'readonly');
  const store = transaction.objectStore('recipes');
  const request = store.getAll();

  request.onsuccess = (event) => {
    const recipes = event.target.result;
    recipesContainer.innerHTML = '';

    if (recipes && recipes.length > 0) {
      recipes.forEach((recipe) => {
        appendUserRecipe(recipe.name, recipe.description, recipe.imageSrc);
      });
    } else {
      recipesContainer.innerHTML = '<p style="text-align: center; color: #555;">No recipes found in IndexedDB.</p>';
    }
  };

  request.onerror = (event) => {
    console.error('Error fetching recipes from IndexedDB:', event.target.error);
  };
};




// Update Ingredient List with Remove Button
function updateIngredientList() {
  ingredientList.innerHTML = ''; // Mevcut listeyi temizle

  ingredients.forEach((ingredient, index) => {
    const li = document.createElement('li');
    li.textContent = ingredient;

    // Remove Button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.marginLeft = '10px';
    removeButton.style.color = 'red';
    removeButton.style.cursor = 'pointer';

    // Remove Button Click Event
    removeButton.addEventListener('click', () => {
      ingredients.splice(index, 1); // Listeden kaldır
      saveIngredientsToIndexedDB(ingredients); // IndexedDB'yi güncelle
      updateIngredientList(); // Listeyi yeniden güncelle
    });

    li.appendChild(removeButton);
    ingredientList.appendChild(li);
  });
}


// Add Ingredient
addIngredientButton.addEventListener('click', () => {
  const ingredient = ingredientInput.value.trim();

  if (!ingredient) {
    showMessage('Please enter an ingredient.', 'error');
    return;
  }

  if (ingredients.includes(ingredient)) {
    showMessage(`${ingredient} is already added.`, 'error');
    ingredientInput.value = ''; 
    return;
  }

  ingredients.push(ingredient);
  saveIngredientsToIndexedDB(ingredients); // Save to IndexedDB
  updateIngredientList();

  console.log("🔹 Ingredient added:", ingredients);
  
  fetchRecipes(); // ✅ Ensure the API is called after adding an ingredient
  ingredientInput.value = '';
});


// Fetch Recipes from API
const apiKey = "83abb7c5dcd4458e92cb62efe246e27e";

async function fetchRecipes() {
  if (!navigator.onLine) {
    recipeResults.textContent = "You are offline. Recipes cannot be fetched.";
    return;
  }

  if (ingredients.length === 0) {
    recipeResults.textContent = "Please add at least one ingredient.";
    return;
  }

  const query = ingredients.join(",+");
  const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${query}&number=5&apiKey=${apiKey}`;

  try {
    console.log(`🔍 Fetching recipes with ingredients: ${query}`);
    console.log(`🌍 API Request URL: ${url}`);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error fetching recipes.");

    const data = await response.json();
    console.log("📦 API Response Data:", data);

    if (!data || data.length === 0) {
      recipeResults.textContent = "No recipes found.";
      return;
    }

    displayRecipes(data);
  } catch (error) {
    console.error("❌ Failed to fetch recipes:", error);
    recipeResults.textContent = "Failed to load recipes: " + error.message;
  }
}





// Display Recipes
function displayRecipes(recipes, containerElement = recipeResults) {
  containerElement.innerHTML = ''; // Clear previous results

  if (!recipes || recipes.length === 0) {
    containerElement.textContent = "No recipes found.";
    return;
  }

  recipes.forEach((recipe) => {
    console.log("📌 Displaying Recipe:", recipe); // Debugging log

    const recipeDiv = document.createElement('div');
    recipeDiv.classList.add('recipe-card');

    // ✅ Handle Spoonacular API Response
    if (recipe.id && recipe.title && recipe.image) {
      recipeDiv.innerHTML = `
        <h3>${recipe.title}</h3>
        <img src="${recipe.image}" alt="${recipe.title}" 
             style="width: 100%; max-width: 300px; border-radius: 10px;">
        <a href="https://spoonacular.com/recipes/${recipe.id}" target="_blank">View Recipe</a>
      `;
    }
    // ✅ Handle TheMealDB API Response
    else if (recipe.idMeal && recipe.strMeal && recipe.strMealThumb) {
      recipeDiv.innerHTML = `
        <h3>${recipe.strMeal}</h3>
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" 
             style="width: 100%; max-width: 300px; border-radius: 10px;">
        <a href="https://www.themealdb.com/meal/${recipe.idMeal}" target="_blank">View Recipe</a>
      `;
    } 
    // ❌ If API structure is unknown, log error
    else {
      console.warn("❌ Unknown recipe format:", recipe);
      return;
    }

    containerElement.appendChild(recipeDiv);
  });

  console.log("✅ Recipes displayed successfully.");
}





// Camera Functionality
recipeCameraButton.addEventListener('click', () => {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      cameraCaptureSection.innerHTML = '';
      cameraCaptureSection.appendChild(video);
      const captureButton = document.createElement('button');
      captureButton.textContent = 'Capture';
      cameraCaptureSection.appendChild(captureButton);
      captureButton.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = canvas.toDataURL('image/jpeg');
        clearCameraPreview();
        appendUserRecipe('Captured Recipe', 'Captured from camera.', img);
        stream.getTracks().forEach((track) => track.stop());
      });
    })
    .catch((err) => {
      console.error('Camera not accessible:', err);
      showMessage('Camera not accessible. Please check permissions.', 'error');
    });
});

// Clear Camera Preview
function clearCameraPreview() {
  cameraCaptureSection.innerHTML = '';
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);

      return navigator.serviceWorker.ready;
    })
    .then((registration) => {
      if ('sync' in registration) {
        registration.sync.register('sync-recipes')
          .then(() => console.log('Background sync registered!'))
          .catch((err) => console.error('Background sync failed:', err));
      } else {
        console.warn("Background Sync is not supported in this browser.");
      }
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

  // IndexedDB'den Tarifleri Getirme Fonksiyonu
  async function getRecipesFromIndexedDB() {
    if (!db) {
      console.error("❌ IndexedDB is not initialized.");
      return [];
    }
  
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("recipes", "readonly");
      const store = transaction.objectStore("recipes");
      const request = store.getAll();
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        console.error("❌ Error fetching recipes from IndexedDB:", event.target.error);
        reject([]);
      };
    });
  }
  

  function addIngredientToList(ingredient) {
    if (!ingredient) {
      showMessage('Please enter an ingredient.', 'error');
      return;
    }
  
    if (ingredients.includes(ingredient)) {
      showMessage(`${ingredient} is already added.`, 'error');
      ingredientInput.value = ''; 
      return;
    }
  
    // Add ingredient to list and update IndexedDB
    ingredients.push(ingredient);
    saveIngredientsToIndexedDB(ingredients);
    updateIngredientList();
  
    // 🚀 Fetch recipes immediately after adding ingredient
    console.log("🔍 Fetching recipes with ingredients:", ingredients);
    fetchRecipes(); 
  
    ingredientInput.value = '';
    showMessage(`${ingredient} was successfully added!`, 'success');
  }
  

function showMessage(message, type = 'success') {
  let messageBox = document.getElementById('message-box');

  // Eğer mesaj kutusu yoksa oluştur
  if (!messageBox) {
    messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    document.body.appendChild(messageBox);
  }

  // Mesaj içeriğini güncelle
  messageBox.textContent = message;

  // Stilleri uygula
  messageBox.style.position = 'fixed';
  messageBox.style.bottom = '20px';
  messageBox.style.left = '50%';
  messageBox.style.transform = 'translateX(-50%)';
  messageBox.style.padding = '12px 20px';
  messageBox.style.borderRadius = '5px';
  messageBox.style.fontSize = '1em';
  messageBox.style.fontWeight = 'bold';
  messageBox.style.textAlign = 'center';
  messageBox.style.zIndex = '1000';
  messageBox.style.transition = 'opacity 0.5s ease-in-out';
  messageBox.style.opacity = '1';

  // Başarı veya hata durumuna göre renk değiştir
  if (type === 'success') {
    messageBox.style.backgroundColor = '#4caf50'; // Yeşil (Başarı)
    messageBox.style.color = 'white';
  } else if (type === 'error') {
    messageBox.style.backgroundColor = '#f44336'; // Kırmızı (Hata)
    messageBox.style.color = 'white';
  } else {
    messageBox.style.backgroundColor = '#ff9800'; // Turuncu (Uyarı)
    messageBox.style.color = 'white';
  }

  // Mesajı belirli bir süre sonra kaldır
  setTimeout(() => {
    messageBox.style.opacity = '0';
    setTimeout(() => messageBox.remove(), 500);
  }, 3000); // 3 saniye sonra kaybolur
}

const countryRecipesButton = document.getElementById('country-recipes');

// OpenCage API Key (Replace with your actual key)
const OPEN_CAGE_API_KEY = '77783b5e219f492abccf0e4bbabe84b7';

// Get country name from coordinates
async function getCountryFromCoordinates(lat, lon) {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPEN_CAGE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results.length > 0) {
      return data.results[0].components.country;
    } else {
      throw new Error("Could not retrieve country information.");
    }
  } catch (error) {
    console.error("Error retrieving country information:", error);
    showMessage("Failed to get country information.", "error");
    return null;
  }
}

function getUserLocation() {
  if (!navigator.geolocation) {
    showMessage("Your browser does not support location services.", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      console.log(`📍 User location: ${latitude}, ${longitude}`);

      const country = await getCountryFromCoordinates(latitude, longitude);
      if (country) {
        console.log(`✅ Detected country: ${country}`);
        fetchCountryRecipes(country);
      }
    },
    (error) => {
      console.error("❌ Failed to get location:", error);
      showMessage("Location access denied. Please allow location services.", "error");
    }
  );
}



countryRecipesButton.addEventListener('click', getUserLocation);

const SPOONACULAR_API_KEY = 'd20ff81e82c345fca8834fd77c3c09da';

// Mapping country names to Spoonacular cuisines
const countryNameToAdjective = {
  "Poland": "Polish",
  "Canada": "Canadian",
  "United States": "American",
  "United Kingdom": "British",
  "France": "French",
  "Italy": "Italian",
  "Spain": "Spanish",
  "Germany": "German",
  "Mexico": "Mexican",
  "China": "Chinese",
  "Japan": "Japanese",
  "India": "Indian",
  "Thailand": "Thai",
  "Greece": "Greek",
  "Turkey": "Turkish",
  "Brazil": "Brazilian",
  "Argentina": "Argentinian",
  "Australia": "Australian",
  "Russia": "Russian",
  "Sweden": "Swedish",
  "Norway": "Norwegian",
  "Denmark": "Danish",
  "Netherlands": "Dutch",
  "Portugal": "Portuguese",
  "South Korea": "Korean",
  "Vietnam": "Vietnamese"
};

function getCuisineFromCountry(country) {
  if (countryNameToAdjective[country]) {
    return countryNameToAdjective[country];
  }
  
  // Eğer eşleşme yoksa, "an" veya "ish" ekleyerek dene
  if (country.endsWith("a") || country.endsWith("o") || country.endsWith("e")) {
    return country + "n"; // Örneğin "Argentina" → "Argentinian"
  }
  
  return country + "ish"; // Varsayılan fallback
}

async function fetchCountryRecipes(country) {
  const cuisine = getCuisineFromCountry(country);
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${cuisine}`;

  console.log(`🔍 Fetching recipes for country: ${country} (Cuisine: ${cuisine})`);
  console.log(`🌍 API Request: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("🌐 API error!");

    const data = await response.json();
    console.log("📥 Country API Response:", data);

    if (!data.meals || data.meals.length === 0) {
      showMessage(`❌ No recipes found for ${country} (${cuisine}).`, "error");
      return;
    }

    displayRecipes(data.meals, recipeResults); // Show recipes
    console.log("✅ Recipes displayed successfully.");
  } catch (error) {
    console.error("❌ Failed to load country recipes:", error);
    showMessage("⚠️ Could not fetch recipes.", "error");
  }
}




document.getElementById('show-recipes-button').addEventListener('click', async () => {
  const recipesContainer = document.getElementById('recipes-container');
  recipesContainer.innerHTML = '<p>Loading saved recipes...</p>';

  try {
    const recipes = await getRecipesFromIndexedDB();

    recipesContainer.innerHTML = ""; // Önceki içerikleri temizle
    if (recipes.length === 0) {
      recipesContainer.innerHTML = "<p>No saved recipes found.</p>";
      return;
    }

    recipes.forEach((recipe) => {
      const div = document.createElement('div');
      div.classList.add('recipe-card');
      div.innerHTML = `
        <h3>${recipe.name}</h3>
        <p>${recipe.description}</p>
        ${recipe.imageSrc ? `<img src="${recipe.imageSrc}" style="max-width: 300px; border-radius: 10px;">` : ''}
      `;
      recipesContainer.appendChild(div);
    });

    console.log("✅ Tarifler başarıyla yüklendi:", recipes);
  } catch (error) {
    console.error("❌ Tarifler yüklenirken hata oluştu:", error);
  }
});







