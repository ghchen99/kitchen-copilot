# Kitchen Copilot Frontend

A sleek Next.js web application that uses AI to analyze your refrigerator contents from photos and generate smart, personalized recipes based on what you have — factoring in your dietary needs, allergens, missing ingredients, and cooking preferences.

## 🧠 What It Does

### 1. Image Upload  
Snap or upload a photo of your fridge. Our AI scans the photo to detect individual ingredients with impressive accuracy.

<p align="center">
  <img src="./assets/ImageUpload.png" alt="Image Upload" width="600"/>
</p>

### 2. Ingredient Detection  
Instantly see a list of recognized ingredients. You can also manually edit or add missing ones.

<p align="center">
  <img src="./assets/Ingredients.png" alt="Detected Ingredients" width="600"/>
</p>

### 3. Set Allergens & Dietary Preferences  
Filter out ingredients that conflict with dietary restrictions like gluten-free, vegan, or specific allergens such as nuts or dairy.

<p align="center">
  <img src="./assets/Allergy.png" alt="Allergen Selection" width="600"/>
</p>

### 4. Smart Recipe Suggestions  
Based on what’s in your fridge (and what’s not), the app flags incompatible items and generates curated recipe ideas, factoring in:

- Cooking time  
- Difficulty level  
- Ingredients you’re missing

<p align="center">
  <img src="./assets/Recipes.png" alt="Recipe Suggestions" width="600"/>
</p>

## ✨ Key Features

- 📸 **Photo-based ingredient recognition**  
- 🍽️ **Tailored recipe recommendations**  
- ⚠️ **Allergen detection and dietary filters**  
- 🕒 **Smart sorting by prep time, difficulty, and availability**  
- 🌓 **Responsive UI with dark/light mode**

## 🛠 Tech Stack

**Backend**  
- Python 3.8+  
- Azure Functions  
- Azure OpenAI GPT-4 Vision model

**Frontend**  
- **Framework:** Next.js 15, React 19  
- **Language:** TypeScript  
- **Styling:** Tailwind CSS  
- **UI Components:** [shadcn/ui](https://ui.shadcn.com)  
- **Animations:** Framer Motion  

![Solution Architecture Diagram](assets/Architecture.png)

## 📄 License

This project is licensed under the MIT License.
