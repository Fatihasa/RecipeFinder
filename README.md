Team Members: Fatih ASA 36470 - Fatih ALAN 36468

# 🍽️ Recipe Finder - A Progressive Web App (PWA)

**Recipe Finder** is a **Progressive Web Application (PWA)** that helps users discover, save, and manage recipes based on their preferences. The app enables users to search for recipes by ingredients, find traditional recipes from their country, and even add their own recipes with images. The best part? It **works offline**, ensuring users always have access to their saved recipes!  

## 🚀 Features  

### ✅ **Recipe Search**
- Find recipes based on ingredients you have using **Spoonacular API**  
- Discover country-based recipes using **TheMealDB API**  

### ✅ **Offline Support**  
- View saved recipes **without an internet connection**  
- **IndexedDB** stores recipes locally  
- **Service Worker & Caching** for fast, reliable performance  

### ✅ **Custom Recipe Manager**  
- Add your own recipes with images  
- Images can be uploaded or captured using the **camera**  
- Recipes are stored in **IndexedDB** for offline access  

### ✅ **Geolocation-Based Recipes**  
- Uses **OpenCage Geolocation API** to detect user location  
- Suggests recipes based on the user’s country  

### ✅ **Progressive Web App (PWA) Features**  
- **Installable** on desktop & mobile  
- Works **offline** with **Service Workers**  
- **Fast & responsive** design  

## 🛠️ Technologies Used  
- **Frontend:** HTML, CSS, JavaScript  
- **Database:** IndexedDB (for storing user recipes & ingredients)  
- **APIs:** Spoonacular API, TheMealDB API, OpenCage Geolocation API  
- **PWA Features:** Service Workers, Cache API, Manifest  

## 📸 Screenshots  

![image](https://github.com/user-attachments/assets/266dfb2b-1167-4c58-a950-038a29202b4d)
 

## 📥 Installation & Setup  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/your-username/recipe-finder.git
cd recipe-finder


2️⃣ Install Dependencies (if applicable)
bash
Copy
Edit
npm install


3️⃣ Start a Local Server
If you're using Python, run:

bash
Copy
Edit
python -m http.server 8080
If using Node.js, install http-server:

bash
Copy
Edit
npx http-server
Then open http://localhost:8080 in your browser.

4️⃣ Register the Service Worker
Ensure your app runs over HTTPS (or localhost for testing). The service worker will cache assets and enable offline functionality.

5️⃣ Deploy the App
You can deploy the app using GitHub Pages, Netlify, or Vercel.

💡 How It Works
1️⃣ Add Ingredients ➜ Get recipes based on available ingredients.


2️⃣ Find Recipes by Country ➜ Use geolocation to get traditional recipes.


3️⃣ Add Your Own Recipes ➜ Save and manage personal recipes offline.


4️⃣ Offline Access ➜ View saved recipes anytime, even without the internet.
