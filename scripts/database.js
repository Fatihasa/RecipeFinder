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

// **Fonksiyonu dışa aktar (export)**
export { openIndexedDB };
