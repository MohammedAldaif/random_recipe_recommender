const spoonacularApiKey = '73e3c0c1fa5044888a2abac3a84865fa'; // Replace with your Spoonacular API key
const translatorApiKey = '448e426d89234d3aa5de651b529d32be'; // Replace with your Translator Text API key
const translatorEndpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0'; // Microsoft Translator Text API endpoint
function setLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    const lang = userLang.startsWith('ar') ? 'ar' : 'en';

    document.querySelectorAll('[data-lang-en]').forEach(element => {
        element.textContent = element.getAttribute(`data-lang-${lang}`);
    });
}

async function getRandomRecipe() {
    const url = `https://api.spoonacular.com/recipes/random?apiKey=${spoonacularApiKey}&number=1`;

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
            recipe.instructions = await translateText(recipe.instructions, 'ar');
        }

        localStorage.setItem('recipe', JSON.stringify(recipe));
        window.location.href = 'recipe.html';
    } catch (error) {
        displayError(error.message);
    }
}

async function translateText(text, targetLang) {
    const url = `${translatorEndpoint}&to=${targetLang}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': translatorApiKey,
                'Ocp-Apim-Subscription-Region': qatarcentral,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify([{ 'text': text }])
        });

        if (!response.ok) {
            throw new Error(`Translation API error! status: ${response.status}`);
        }

        const data = await response.json();
        return data[0].translations[0].text;
    } catch (error) {
        displayError(error.message);
        throw error; // Re-throw the error to be handled in the calling function
    }
}

function displayRecipe(recipe) {
    const recipeDiv = document.getElementById('recipe');

    const recipeTitle = document.createElement('h2');
    recipeTitle.textContent = recipe.title;

    const recipeImage = document.createElement('img');
    recipeImage.src = recipe.image;
    recipeImage.alt = recipe.title;

    const recipeInstructions = document.createElement('p');
    recipeInstructions.textContent = recipe.instructions || 'No instructions available.';

    recipeDiv.appendChild(recipeTitle);
    recipeDiv.appendChild(recipeImage);
    recipeDiv.appendChild(recipeInstructions);
}

function goBack() {
    window.location.href = 'index.html';
}

function displayError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.textContent = `Error: ${message}`;
    document.body.appendChild(errorDiv);
}

document.addEventListener('DOMContentLoaded', () => {
    setLanguage();
    if (document.getElementById('recipe')) {
        const recipe = JSON.parse(localStorage.getItem('recipe'));
        if (recipe) {
            displayRecipe(recipe);
        } else {
            displayError('No recipe data available.');
        }
    }
});
