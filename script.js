const spoonacularApiKey = '73e3c0c1fa5044888a2abac3a84865fa'; // Replace with your Spoonacular API key
const translatorApiKey = '2a5592c5c19c4d71bb8f1621a8873982'; // Replace with your Translator Text API key
const translatorEndpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0'; // Microsoft Translator Text API endpoint

// Set the language of the page based on user's browser settings
function setLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    const lang = userLang.startsWith('ar') ? 'ar' : 'en';

    document.querySelectorAll('[data-lang-en]').forEach(element => {
        element.textContent = element.getAttribute(`data-lang-${lang}`);
    });
}

// Fetch a random recipe from Spoonacular API
async function getRandomRecipe() {
    const url = `https://api.spoonacular.com/recipes/random?apiKey=${spoonacularApiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const recipe = data.recipes[0];

        const userLang = navigator.language || navigator.userLanguage;
        if (userLang.startsWith('ar')) {
            recipe.title = await translateText(recipe.title, 'ar');
            recipe.instructions = await translateHtml(recipe.instructions, 'ar');
            recipe.extendedIngredients = await Promise.all(
                recipe.extendedIngredients.map(async (ingredient) => {
                    ingredient.original = await translateText(ingredient.original, 'ar');
                    return ingredient;
                })
            );
        }

        localStorage.setItem('recipe', JSON.stringify(recipe));
        window.location.href = 'recipe.html';
    } catch (error) {
        displayError(`Error fetching recipe: ${error.message}`);
    }
}

// Translate text using Microsoft Translator API
async function translateText(text, targetLang) {
    const url = `${translatorEndpoint}&to=${targetLang}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': translatorApiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify([{ 'text': text }])
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(`Translation API error! status: ${response.status}`);
        }

        return responseData[0].translations[0].text;
    } catch (error) {
        displayError(`Error translating text: ${error.message}`);
        throw error;
    }
}

// Translate HTML content using Microsoft Translator API
async function translateHtml(html, targetLang) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textNodes = getTextNodes(tempDiv);

    const translations = await Promise.all(
        textNodes.map(node => translateText(node.nodeValue, targetLang))
    );

    textNodes.forEach((node, index) => {
        node.nodeValue = translations[index];
    });

    return tempDiv.innerHTML;
}

// Get all text nodes within an HTML element
function getTextNodes(node) {
    const textNodes = [];
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
        textNodes.push(node);
    } else {
        node.childNodes.forEach(child => {
            textNodes.push(...getTextNodes(child));
        });
    }
    return textNodes;
}

// Display the recipe on the recipe details page
function displayRecipe(recipe) {
    const recipeDiv = document.getElementById('recipe-details');

    const recipeTitle = document.createElement('h2');
    recipeTitle.textContent = recipe.title;

    const recipeImage = document.createElement('img');
    recipeImage.src = recipe.image;
    recipeImage.alt = recipe.title;

    const recipeTimeServings = document.createElement('div');
    recipeTimeServings.className = 'time-servings';

    const prepTime = document.createElement('p');
    prepTime.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M12 0a12 12 0 100 24A12 12 0 0012 0zm0 21.5a9.5 9.5 0 110-19 9.5 9.5 0 010 19zm-.75-16V12h5.25v1.5h-6.75V5.5h1.5zm0 0"/>
        </svg>
        <span>Preparation time: ${recipe.preparationMinutes > 0 ? recipe.preparationMinutes : 'N/A'} minutes</span>
    `;

    const cookTime = document.createElement('p');
    cookTime.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M12 0a12 12 0 100 24A12 12 0 0012 0zm0 21.5a9.5 9.5 0 110-19 9.5 9.5 0 010 19zm-.75-16V12h5.25v1.5h-6.75V5.5h1.5zm0 0"/>
        </svg>
        <span>Cooking time: ${recipe.cookingMinutes > 0 ? recipe.cookingMinutes : 'N/A'} minutes</span>
    `;

    const readyTime = document.createElement('p');
    readyTime.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M12 0a12 12 0 100 24A12 12 0 0012 0zm0 21.5a9.5 9.5 0 110-19 9.5 9.5 0 010 19zm-.75-16V12h5.25v1.5h-6.75V5.5h1.5zm0 0"/>
        </svg>
        <span>Ready in: ${recipe.readyInMinutes} minutes</span>
    `;

    const servings = document.createElement('p');
    servings.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M12 0a12 12 0 100 24A12 12 0 0012 0zm0 21.5a9.5 9.5 0 110-19 9.5 9.5 0 010 19zm-.75-16V12h5.25v1.5h-6.75V5.5h1.5zm0 0"/>
        </svg>
        <span>Servings: ${recipe.servings}</span>
    `;

    recipeTimeServings.appendChild(prepTime);
    recipeTimeServings.appendChild(cookTime);
    recipeTimeServings.appendChild(readyTime);
    recipeTimeServings.appendChild(servings);

    const recipeIngredients = document.createElement('ul');
    recipe.extendedIngredients.forEach(ingredient => {
        const listItem = document.createElement('li');
        listItem.textContent = ingredient.original;
        recipeIngredients.appendChild(listItem);
    });

    const recipeInstructions = document.createElement('div');
    recipeInstructions.innerHTML = recipe.instructions || 'No instructions available.';

    recipeDiv.appendChild(recipeTitle);
    recipeDiv.appendChild(recipeImage);
    recipeDiv.appendChild(recipeTimeServings);
    recipeDiv.appendChild(recipeIngredients);
    recipeDiv.appendChild(recipeInstructions);
}

// Navigate back to the home page
function goBack() {
    window.location.href = 'index.html';
}

// Display error messages
function displayError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.style.color = 'red';
    errorDiv.textContent = `Error: ${message}`;
}

// Event listener for DOMContentLoaded to set language and display recipe details
document.addEventListener('DOMContentLoaded', () => {
    setLanguage();
    if (document.getElementById('recipe-details')) {
        const recipe = JSON.parse(localStorage.getItem('recipe'));
        if (recipe) {
            displayRecipe(recipe);
        } else {
            displayError('No recipe data available.');
        }
    }
});
