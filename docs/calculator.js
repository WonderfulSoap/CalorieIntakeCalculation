// Constants for calorie calculations
const PROTEIN_CALORIES_PER_GRAM = 4;
const FAT_CALORIES_PER_GRAM = 9;
const CARB_CALORIES_PER_GRAM = 4;

// DOM Elements
const calculatorForm = document.getElementById('calculator-form');
const resultsSection = document.getElementById('results');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load previous calculations if available
    loadSavedCalculations();

    // Set up form submission
    calculatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateNutrition();
    });
});

/**
 * Calculate nutrition needs based on form inputs
 */
function calculateNutrition() {
    // Get form values
    const weight = parseFloat(document.getElementById('weight').value);
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = parseFloat(document.getElementById('activity').value);
    const proteinRatio = parseFloat(document.getElementById('protein-ratio').value);
    const fatRatio = parseFloat(document.getElementById('fat-ratio').value);

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * 170) - (5 * age) + 5; // Assuming average height of 170cm
    } else {
        bmr = (10 * weight) + (6.25 * 160) - (5 * age) - 161; // Assuming average height of 160cm
    }

    // Apply activity factor
    bmr = Math.round(bmr * activityLevel);

    // Calculate target calories (BMR - 300)
    const targetCalories = Math.round(bmr - 300);

    // Calculate protein needs (using custom ratio per kg of body weight)
    const proteinGrams = Math.round(weight * proteinRatio);
    const proteinCalories = proteinGrams * PROTEIN_CALORIES_PER_GRAM;

    // Calculate fat needs (using custom ratio per kg of body weight)
    const fatGrams = Math.round(weight * fatRatio);
    const fatCalories = fatGrams * FAT_CALORIES_PER_GRAM;

    // Calculate remaining calories for carbs
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(remainingCalories / CARB_CALORIES_PER_GRAM);
    const carbCalories = carbGrams * CARB_CALORIES_PER_GRAM;

    // Display results
    displayResults(bmr, targetCalories, proteinGrams, proteinCalories, fatGrams, fatCalories, carbGrams, carbCalories);

    // Save calculations to localStorage
    saveCalculations(weight, age, gender, activityLevel, proteinRatio, fatRatio, bmr, targetCalories, proteinGrams, fatGrams, carbGrams);

    // Show results section
    resultsSection.style.display = 'block';
}

/**
 * Display calculation results in the UI
 */
function displayResults(bmr, targetCalories, proteinGrams, proteinCalories, fatGrams, fatCalories, carbGrams, carbCalories) {
    // Update BMR and target calories
    document.getElementById('bmr-result').textContent = bmr;
    document.getElementById('target-calories').textContent = targetCalories;

    // Update protein results
    document.getElementById('protein-result').textContent = proteinGrams;
    document.getElementById('protein-calories').textContent = `${proteinCalories} 卡路里`;

    // Update fat results
    document.getElementById('fat-result').textContent = fatGrams;
    document.getElementById('fat-calories').textContent = `${fatCalories} 卡路里`;

    // Update carb results
    document.getElementById('carb-result').textContent = carbGrams;
    document.getElementById('carb-calories').textContent = `${carbCalories} 卡路里`;

    // Update summary table
    document.getElementById('summary-protein-g').textContent = proteinGrams;
    document.getElementById('summary-protein-cal').textContent = proteinCalories;
    document.getElementById('summary-protein-pct').textContent = `${Math.round((proteinCalories / targetCalories) * 100)}%`;

    document.getElementById('summary-fat-g').textContent = fatGrams;
    document.getElementById('summary-fat-cal').textContent = fatCalories;
    document.getElementById('summary-fat-pct').textContent = `${Math.round((fatCalories / targetCalories) * 100)}%`;

    document.getElementById('summary-carb-g').textContent = carbGrams;
    document.getElementById('summary-carb-cal').textContent = carbCalories;
    document.getElementById('summary-carb-pct').textContent = `${Math.round((carbCalories / targetCalories) * 100)}%`;

    document.getElementById('summary-total-g').textContent = proteinGrams + fatGrams + carbGrams;
    document.getElementById('summary-total-cal').textContent = targetCalories;
}

/**
 * Save calculations to localStorage
 */
function saveCalculations(weight, age, gender, activityLevel, proteinRatio, fatRatio, bmr, targetCalories, proteinGrams, fatGrams, carbGrams) {
    const nutritionData = {
        personalInfo: {
            weight,
            age,
            gender,
            activityLevel,
            proteinRatio,
            fatRatio
        },
        calculations: {
            bmr,
            targetCalories,
            proteinGrams,
            fatGrams,
            carbGrams
        },
        lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('nutritionData', JSON.stringify(nutritionData));
}

/**
 * Load saved calculations from localStorage
 */
function loadSavedCalculations() {
    const savedData = localStorage.getItem('nutritionData');

    if (savedData) {
        const nutritionData = JSON.parse(savedData);

        // Fill form with saved personal info
        document.getElementById('weight').value = nutritionData.personalInfo.weight;
        document.getElementById('age').value = nutritionData.personalInfo.age;
        document.getElementById('gender').value = nutritionData.personalInfo.gender;

        // 确保活动水平选项存在
        const activitySelect = document.getElementById('activity');
        const activityLevel = nutritionData.personalInfo.activityLevel;

        // 检查是否有匹配的选项
        let optionExists = false;
        for (let i = 0; i < activitySelect.options.length; i++) {
            if (activitySelect.options[i].value == activityLevel) {
                optionExists = true;
                activitySelect.selectedIndex = i;
                break;
            }
        }

        // 如果没有匹配的选项，默认选择第一个
        if (!optionExists) {
            activitySelect.selectedIndex = 0;
        }

        // 设置蛋白质和脂肪倍率
        if (nutritionData.personalInfo.proteinRatio !== undefined) {
            document.getElementById('protein-ratio').value = nutritionData.personalInfo.proteinRatio;
        }

        if (nutritionData.personalInfo.fatRatio !== undefined) {
            document.getElementById('fat-ratio').value = nutritionData.personalInfo.fatRatio;
        }

        // Display saved calculations
        const calc = nutritionData.calculations;

        // Calculate calories from grams
        const proteinCalories = calc.proteinGrams * PROTEIN_CALORIES_PER_GRAM;
        const fatCalories = calc.fatGrams * FAT_CALORIES_PER_GRAM;
        const carbCalories = calc.carbGrams * CARB_CALORIES_PER_GRAM;

        displayResults(
            calc.bmr,
            calc.targetCalories,
            calc.proteinGrams,
            proteinCalories,
            calc.fatGrams,
            fatCalories,
            calc.carbGrams,
            carbCalories
        );

        // Show results section
        resultsSection.style.display = 'block';
    }
}
