const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const mealsContainer = document.getElementById("meals");
const resultHeading = document.getElementById("result-heading");
const errorContainer = document.getElementById("error-container");
const mealDetails = document.getElementById("meals-details");
const mealDetailsContent = document.querySelector(".meal-details-content");
const backBtn = document.getElementById("back-btn");
const recentSearchBox = document.getElementById("recent-searches");
const recentMealsBox = document.getElementById("recent-meals");

const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SEARCH_URL = `${BASE_URL}search.php?s=`;
const LOOKUP_URL = `${BASE_URL}lookup.php?i=`;

searchBtn.addEventListener("click", searchMeals);
mealsContainer.addEventListener("click", handleMealClick);
backBtn.addEventListener("click", () => mealDetails.classList.add("hidden"));

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchMeals();
});

async function searchMeals() {
    const searchTerm = searchInput.value.trim();

    // Recent Searches
    let recent = JSON.parse(localStorage.getItem("recent")) || [];

    if (!recent.includes(searchTerm)) {
        recent.unshift(searchTerm);
        if (recent.length > 5) recent.pop();
        localStorage.setItem("recent", JSON.stringify(recent));
    }

    if (!searchTerm) {
        errorContainer.textContent = "Please enter a search term";
        errorContainer.classList.remove("hidden");
        return;
    }

    try {
        resultHeading.textContent = `Search results for "${searchTerm}"`;
        mealsContainer.innerHTML = "";
        errorContainer.classList.add("hidden");

        const response = await fetch(`${SEARCH_URL}${searchTerm}`);
        const data = await response.json();

        if (data.meals === null) {
            resultHeading.textContent = "";
            mealsContainer.innerHTML = "";
            errorContainer.textContent = `No recipes found for "${searchTerm}". Try another search term!`;
            errorContainer.classList.remove("hidden");
        } else {
            displayMeals(data.meals);
            searchInput.value = "";
        }
    } catch (error) {
        errorContainer.textContent = "Something went wrong. Please try again later.";
        errorContainer.classList.remove("hidden");
    }
    showRecentSearches();
}

function displayMeals(meals){
    mealsContainer.innerHTML = "";

    const nonVegItems = ["chicken", "beef", "pork", "fish", "mutton", "egg"];

    meals.forEach(meal => {

        let isVeg = true;

        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            if (ing && nonVegItems.some(item => ing.toLowerCase().includes(item))) {
                isVeg = false;
                break;
            }
        }

        mealsContainer.innerHTML += `
        <div class="meal" data-meal-id="${meal.idMeal}">

            <div class="meal-img">
                <img src="${meal.strMealThumb}">
                <span class="badge ${isVeg ? "veg" : "nonveg"}">
                    ${isVeg ? "Veg" : "Non-Veg"}
                </span>
            </div>

            <div class="meal-info">
                <h3>${meal.strMeal}</h3>
            </div>

        </div>`;
    });
}

async function handleMealClick(e) {
    const mealEl = e.target.closest(".meal");
    if (!mealEl) return;

    const mealId = mealEl.getAttribute("data-meal-id");

    try {
        const response = await fetch(`${LOOKUP_URL}${mealId}`);
        const data = await response.json();

        if (data.meals && data.meals[0]) {
            const meal = data.meals[0];
          // veg/nonvVeg color
            const nonVegItems = ["chicken", "beef", "pork", "fish", "mutton", "egg"];

            let isVeg = true;

            for (let i = 1; i <= 20; i++) {
                const ing = meal[`strIngredient${i}`];
                if (ing && nonVegItems.some(item => ing.toLowerCase().includes(item))) {
                    isVeg = false;
                    break;
                }
            }
            document.body.classList.remove("veg-bg", "nonVeg-bg");

            if (isVeg) {
                document.body.classList.add("veg-bg");
            } else {
                document.body.classList.add("nonVeg-bg");
            }

            //Recent Recipes
            let recentMeals = JSON.parse(localStorage.getItem("recentMeals")) || [];

            recentMeals.unshift({
                name: meal.strMeal,
                img: meal.strMealThumb
            });

            localStorage.setItem("recentMeals", JSON.stringify(recentMeals.slice(0,5)));

            const ingredients = [];

            for (let i = 1; i <= 20; i++) {
                if (meal[`strIngredient${i}`]) {
                    ingredients.push({
                        ingredient: meal[`strIngredient${i}`],
                        measure: meal[`strMeasure${i}`]
                    });
                }
            }

            mealDetailsContent.innerHTML = `
                <img src="${meal.strMealThumb}" class="meal-details-img">
                <h2 class="meal-details-title">${meal.strMeal}</h2>

                <div class="meal-details-category">
                    <span>${meal.strCategory || "Uncategorized"}</span>
                </div>

                <div class="meal-details-instructions">
                    <h3>Instructions</h3>
                    <p>${meal.strInstructions}</p>
                </div>

                <div class="meal-details-ingredients">
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">
                        ${ingredients.map(item => `
                            <li>
                                <i class="fas fa-check-circle"></i>
                                ${item.measure} ${item.ingredient}
                            </li>
                        `).join("")}
                    </ul>
                </div>

                ${meal.strYoutube ? `
                    <a href="${meal.strYoutube}" target="_blank" class="youtube-link">
                        <i class="fab fa-youtube"></i> Watch Video
                    </a>` : ""}
            `;

            mealDetails.classList.remove("hidden");
            mealDetails.scrollIntoView({ behavior: "smooth" });

            showRecentMeals();
        }
    } catch (error) {
        errorContainer.textContent = "Could not load recipe details.";
        errorContainer.classList.remove("hidden");
    }
}
function showRecentSearches(){
    const data = JSON.parse(localStorage.getItem("recent")) || [];

    recentSearchBox.innerHTML = data.map(i => `
        <span style="
            background:#ff7e5f;
            color:white;
            padding:5px 10px;
            margin:5px;
            border-radius:20px;
            display:inline-block;
            cursor:pointer;
        ">${i}</span>
    `).join("");
}

function showRecentMeals(){
    const data = JSON.parse(localStorage.getItem("recentMeals")) || [];

    recentMealsBox.innerHTML = data.map(i => `
        <div style="display:inline-block; margin:5px; text-align:center;">
            <img src="${i.img}" width="80" style="border-radius:10px;"><br>
            <small>${i.name}</small>
        </div>
    `).join("");
}