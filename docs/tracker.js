// Constants for calorie calculations
const PROTEIN_CALORIES_PER_GRAM = 4;
const FAT_CALORIES_PER_GRAM = 9;
const CARB_CALORIES_PER_GRAM = 4;

// DOM Elements
const foodForm = document.getElementById('food-form');
const foodGroupsContainer = document.getElementById('food-groups-container');
const dateSelect = document.getElementById('date-select');
const clearDayBtn = document.getElementById('clear-day');
const noTargetWarning = document.getElementById('no-target-warning');

// Current date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Create numpad instance
const numpad = new Numpad();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set date input to today
    dateSelect.value = today;

    // Check if nutrition targets exist
    checkNutritionTargets();

    // Load food entries for today
    loadFoodEntries(today);

    // Set up numpad for nutrient inputs
    setupNumpadInputs();

    // Set up form submission with Enter key navigation
    setupFormNavigation();

    // Set up form submission
    foodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addFoodEntry();
    });

    // Set up date change
    dateSelect.addEventListener('change', () => {
        loadFoodEntries(dateSelect.value);
    });

    // Set up clear day button
    clearDayBtn.addEventListener('click', () => {
        if (confirm('确定要清除当天的所有食物记录吗？')) {
            clearDayEntries(dateSelect.value);
        }
    });
});

/**
 * Set up numpad for nutrient inputs
 */
function setupNumpadInputs() {
    const inputs = document.querySelectorAll('.nutrient-input');

    inputs.forEach((input) => {
        // Disable on-screen keyboard for mobile devices
        input.setAttribute('readonly', 'readonly');

        // Add click event to open numpad
        input.addEventListener('click', () => {
            let nextInput = null;
            let label = '';

            // Determine which input was clicked and set the next input
            if (input.id === 'protein') {
                nextInput = document.getElementById('fat');
                label = '蛋白质';
            } else if (input.id === 'fat') {
                nextInput = document.getElementById('carbs');
                label = '脂肪';
            } else if (input.id === 'carbs') {
                nextInput = document.getElementById('food-name');
                label = '碳水化合物';
            }

            // Open numpad for this input
            numpad.open(input, nextInput, label);
        });
    });
}

/**
 * Set up form navigation with Enter key
 */
function setupFormNavigation() {
    const inputs = document.querySelectorAll('.nutrient-input');
    const foodNameInput = document.getElementById('food-name');

    inputs.forEach((input, index) => {
        input.addEventListener('keypress', (e) => {
            // If Enter key is pressed
            if (e.key === 'Enter') {
                e.preventDefault();

                // If it's the last input, focus the food name input
                if (index === inputs.length - 1) {
                    foodNameInput.focus();
                } else {
                    // Otherwise, focus the next input
                    inputs[index + 1].focus();
                }
            }
        });
    });

    // Add event listener for food name input
    foodNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            foodForm.dispatchEvent(new Event('submit'));
        }
    });
}

/**
 * Check if nutrition targets exist in localStorage
 */
function checkNutritionTargets() {
    const nutritionData = localStorage.getItem('nutritionData');

    if (!nutritionData) {
        noTargetWarning.style.display = 'block';
        return false;
    } else {
        noTargetWarning.style.display = 'none';
        return true;
    }
}

/**
 * Add a new food entry
 */
function addFoodEntry() {
    let foodName = document.getElementById('food-name').value;
    const protein = parseFloat(document.getElementById('protein').value);
    const fat = parseFloat(document.getElementById('fat').value);
    const carbs = parseFloat(document.getElementById('carbs').value);
    const date = dateSelect.value;

    // 如果食物名称为空，使用默认名称
    if (!foodName || foodName.trim() === '') {
        foodName = `营养记录 ${new Date().toLocaleTimeString()}`;
    }

    // Calculate calories
    const calories = (protein * PROTEIN_CALORIES_PER_GRAM) +
                     (fat * FAT_CALORIES_PER_GRAM) +
                     (carbs * CARB_CALORIES_PER_GRAM);

    // Get current time
    const now = new Date();
    const timestamp = now.getTime();
    const timeString = now.toLocaleTimeString();

    // Create food entry object
    const foodEntry = {
        id: timestamp, // Use timestamp as unique ID
        name: foodName,
        protein: protein,
        fat: fat,
        carbs: carbs,
        calories: Math.round(calories),
        date: date,
        time: timeString,
        timestamp: timestamp
    };

    // Save to localStorage
    saveFoodEntry(foodEntry);

    // Update UI by reloading all entries
    loadFoodEntries(date);

    // Update totals and summary
    updateTotals();
    updateDailySummary();

    // Reset form
    foodForm.reset();

    // Focus protein input and open numpad
    const proteinInput = document.getElementById('protein');
    proteinInput.focus();

    // Open numpad for protein input
    setTimeout(() => {
        numpad.open(proteinInput, document.getElementById('fat'), '蛋白质');
    }, 100);
}

/**
 * Save food entry to localStorage
 */
function saveFoodEntry(foodEntry) {
    // Get existing entries
    let foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || {};

    // Initialize date entry if it doesn't exist
    if (!foodEntries[foodEntry.date]) {
        foodEntries[foodEntry.date] = [];
    }

    // Add new entry
    foodEntries[foodEntry.date].push(foodEntry);

    // Save back to localStorage
    localStorage.setItem('foodEntries', JSON.stringify(foodEntries));
}

/**
 * Add food entry to UI
 * This function is no longer used directly - entries are now grouped
 */
function addFoodEntryToUI(foodEntry) {
    // This function is kept for reference but no longer used directly
    // Instead, we use loadFoodEntriesGrouped

    // Update totals
    updateTotals();

    // Update daily summary
    updateDailySummary();
}

/**
 * Load food entries for a specific date
 */
function loadFoodEntries(date) {
    // Clear current list
    foodGroupsContainer.innerHTML = '';

    // Get entries from localStorage
    const foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || {};

    // Check if entries exist for this date
    if (foodEntries[date] && foodEntries[date].length > 0) {
        // Load entries grouped by hour
        loadFoodEntriesGrouped(foodEntries[date], date);
    }

    // Update summary
    updateDailySummary();
}

/**
 * Group food entries by hour and display them
 */
function loadFoodEntriesGrouped(entries, date) {
    // Sort entries by timestamp
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Group entries by hour
    const groupedEntries = {};
    const hourLabels = {};

    entries.forEach(entry => {
        // Handle entries that might not have timestamp (backward compatibility)
        let entryDate;
        let hour;

        if (entry.timestamp) {
            // Use existing timestamp
            entryDate = new Date(entry.timestamp);
        } else {
            // Create a timestamp from the ID if possible, or use current time
            const timestamp = typeof entry.id === 'number' ? entry.id : Date.now();
            entryDate = new Date(timestamp);

            // Add timestamp to entry for future use
            entry.timestamp = timestamp;

            // Add formatted time string if missing
            if (!entry.time) {
                entry.time = entryDate.toLocaleTimeString();
            }
        }

        // Extract hour
        hour = entryDate.getHours();

        // Create hour key (0-23)
        const hourKey = hour;

        // Create hour label (e.g., "早上 8-9点")
        let timeLabel;
        if (hour >= 5 && hour < 9) {
            timeLabel = `早上 ${hour}-${hour+1}点`;
        } else if (hour >= 9 && hour < 11) {
            timeLabel = `上午 ${hour}-${hour+1}点`;
        } else if (hour >= 11 && hour < 13) {
            timeLabel = `中午 ${hour}-${hour+1}点`;
        } else if (hour >= 13 && hour < 17) {
            timeLabel = `下午 ${hour}-${hour+1}点`;
        } else if (hour >= 17 && hour < 19) {
            timeLabel = `傍晚 ${hour}-${hour+1}点`;
        } else if (hour >= 19 && hour < 23) {
            timeLabel = `晚上 ${hour}-${hour+1}点`;
        } else {
            timeLabel = `深夜 ${hour}-${hour+1}点`;
        }

        // Initialize group if it doesn't exist
        if (!groupedEntries[hourKey]) {
            groupedEntries[hourKey] = [];
            hourLabels[hourKey] = timeLabel;
        }

        // Add entry to group
        groupedEntries[hourKey].push(entry);
    });

    // Get all group totals first
    const allGroupTotals = {};
    Object.keys(groupedEntries).forEach(key => {
        allGroupTotals[key] = calculateGroupTotals(groupedEntries[key]);
    });

    // Create groups in UI
    Object.keys(groupedEntries).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hourKey => {
        const groupEntries = groupedEntries[hourKey];
        const timeLabel = hourLabels[hourKey];

        // Get the group totals we already calculated
        const groupTotals = allGroupTotals[hourKey];

        // Get nutrition targets from localStorage
        const nutritionData = JSON.parse(localStorage.getItem('nutritionData'));
        let targetProtein = 0;
        let targetFat = 0;
        let targetCarbs = 0;
        let targetCalories = 0;

        // If nutrition targets exist, use them for percentage calculations
        if (nutritionData && nutritionData.calculations) {
            targetProtein = nutritionData.calculations.proteinGrams || 0;
            targetFat = nutritionData.calculations.fatGrams || 0;
            targetCarbs = nutritionData.calculations.carbGrams || 0;
            targetCalories = nutritionData.calculations.targetCalories || 0;
        }

        // Calculate percentages relative to daily targets (safely handle division by zero)
        const percentages = {
            protein: targetProtein > 0 ? Math.round((groupTotals.protein / targetProtein) * 100) : 0,
            fat: targetFat > 0 ? Math.round((groupTotals.fat / targetFat) * 100) : 0,
            carbs: targetCarbs > 0 ? Math.round((groupTotals.carbs / targetCarbs) * 100) : 0,
            calories: targetCalories > 0 ? Math.round((groupTotals.calories / targetCalories) * 100) : 0
        };

        // Create group element
        createFoodGroup(timeLabel, groupEntries, groupTotals, percentages, date);
    });
}

/**
 * Calculate totals for a group of food entries
 */
function calculateGroupTotals(entries) {
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let calories = 0;

    entries.forEach(entry => {
        protein += entry.protein;
        fat += entry.fat;
        carbs += entry.carbs;
        calories += entry.calories;
    });

    return { protein, fat, carbs, calories };
}

/**
 * Calculate daily totals from all entries
 */
function calculateDailyTotals(entries) {
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let calories = 0;

    entries.forEach(entry => {
        protein += entry.protein;
        fat += entry.fat;
        carbs += entry.carbs;
        calories += entry.calories;
    });

    return { protein, fat, carbs, calories };
}

/**
 * Create a food group element and add it to the container
 */
function createFoodGroup(timeLabel, entries, totals, percentages, date) {
    // Create group container
    const groupElement = document.createElement('div');
    groupElement.className = 'food-group';

    // Create header
    const header = document.createElement('div');
    header.className = 'food-group-header';
    header.innerHTML = `
        <h3 class="food-group-title">${timeLabel}</h3>
        <div class="food-group-summary">${entries.length} 项食物记录</div>
    `;

    // Create table
    const table = document.createElement('table');
    table.className = 'food-group-table';

    // Add table header
    table.innerHTML = `
        <thead>
            <tr>
                <th>食物名称</th>
                <th>蛋白质 (克)</th>
                <th>脂肪 (克)</th>
                <th>碳水 (克)</th>
                <th>卡路里</th>
                <th>时间</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    // Add entries to table
    const tbody = table.querySelector('tbody');
    entries.forEach(entry => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', entry.id);

        // Ensure time is available or use a placeholder
        const displayTime = entry.time || '未记录时间';

        row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.protein.toFixed(1)}</td>
            <td>${entry.fat.toFixed(1)}</td>
            <td>${entry.carbs.toFixed(1)}</td>
            <td>${entry.calories}</td>
            <td>${displayTime}</td>
            <td>
                <button class="btn btn-danger btn-sm delete-btn">删除</button>
            </td>
        `;

        // Add delete event listener
        row.querySelector('.delete-btn').addEventListener('click', () => {
            deleteFoodEntry(entry.id, date);
        });

        tbody.appendChild(row);
    });

    // Create footer with totals and percentages
    const footer = document.createElement('div');
    footer.className = 'food-group-footer';
    footer.innerHTML = `
        <div class="food-group-total">
            总计: ${totals.calories} 卡路里
        </div>
        <div class="food-group-percentage">
            <div class="percentage-item">
                <span class="percentage-label">蛋白质:</span>
                <span class="percentage-value protein">${percentages.protein}%目标 (${totals.protein.toFixed(1)}克)</span>
            </div>
            <div class="percentage-item">
                <span class="percentage-label">脂肪:</span>
                <span class="percentage-value fat">${percentages.fat}%目标 (${totals.fat.toFixed(1)}克)</span>
            </div>
            <div class="percentage-item">
                <span class="percentage-label">碳水:</span>
                <span class="percentage-value carb">${percentages.carbs}%目标 (${totals.carbs.toFixed(1)}克)</span>
            </div>
            <div class="percentage-item">
                <span class="percentage-label">卡路里:</span>
                <span class="percentage-value calories">${percentages.calories}%目标 (${totals.calories}卡)</span>
            </div>
        </div>
    `;

    // Assemble group
    groupElement.appendChild(header);
    groupElement.appendChild(table);
    groupElement.appendChild(footer);

    // Add to container
    foodGroupsContainer.appendChild(groupElement);
}

/**
 * Delete a food entry
 */
function deleteFoodEntry(id, date) {
    // Get entries from localStorage
    let foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || {};

    // Find and remove the entry
    if (foodEntries[date]) {
        foodEntries[date] = foodEntries[date].filter(entry => entry.id !== id);

        // Save back to localStorage
        localStorage.setItem('foodEntries', JSON.stringify(foodEntries));

        // Reload all entries to update groups
        loadFoodEntries(date);

        // Update totals and summary
        updateTotals();
        updateDailySummary();
    }
}

/**
 * Clear all entries for a specific date
 */
function clearDayEntries(date) {
    // Get entries from localStorage
    let foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || {};

    // Remove entries for this date
    if (foodEntries[date]) {
        delete foodEntries[date];

        // Save back to localStorage
        localStorage.setItem('foodEntries', JSON.stringify(foodEntries));

        // Clear UI
        foodGroupsContainer.innerHTML = '';

        // Update totals and summary
        updateTotals();
        updateDailySummary();
    }
}

/**
 * Update total nutrition values
 */
function updateTotals() {
    const date = dateSelect.value;
    const foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || {};

    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalCalories = 0;

    // Calculate totals
    if (foodEntries[date]) {
        foodEntries[date].forEach(entry => {
            totalProtein += entry.protein;
            totalFat += entry.fat;
            totalCarbs += entry.carbs;
            totalCalories += entry.calories;
        });
    }

    // Update UI
    document.getElementById('total-protein').textContent = totalProtein.toFixed(1);
    document.getElementById('total-fat').textContent = totalFat.toFixed(1);
    document.getElementById('total-carbs').textContent = totalCarbs.toFixed(1);
    document.getElementById('total-calories').textContent = totalCalories;
}

/**
 * Update daily summary with progress bars
 */
function updateDailySummary() {
    // Check if targets exist
    if (!checkNutritionTargets()) {
        return;
    }

    // Get nutrition targets
    const nutritionData = JSON.parse(localStorage.getItem('nutritionData'));
    const targets = nutritionData.calculations;

    // Get current totals
    const date = dateSelect.value;
    const foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || {};

    let currentProtein = 0;
    let currentFat = 0;
    let currentCarbs = 0;
    let currentCalories = 0;

    if (foodEntries[date]) {
        foodEntries[date].forEach(entry => {
            currentProtein += entry.protein;
            currentFat += entry.fat;
            currentCarbs += entry.carbs;
            currentCalories += entry.calories;
        });
    }

    // Update progress bars
    const caloriesProgress = (currentCalories / targets.targetCalories) * 100;
    document.getElementById('calories-progress').style.width = `${Math.min(caloriesProgress, 100)}%`;
    document.getElementById('current-calories').textContent = currentCalories;
    document.getElementById('target-calories-display').textContent = targets.targetCalories;

    const proteinProgress = (currentProtein / targets.proteinGrams) * 100;
    document.getElementById('protein-progress').style.width = `${Math.min(proteinProgress, 100)}%`;
    document.getElementById('current-protein').textContent = currentProtein.toFixed(1);
    document.getElementById('target-protein').textContent = targets.proteinGrams;

    const fatProgress = (currentFat / targets.fatGrams) * 100;
    document.getElementById('fat-progress').style.width = `${Math.min(fatProgress, 100)}%`;
    document.getElementById('current-fat').textContent = currentFat.toFixed(1);
    document.getElementById('target-fat').textContent = targets.fatGrams;

    const carbProgress = (currentCarbs / targets.carbGrams) * 100;
    document.getElementById('carb-progress').style.width = `${Math.min(carbProgress, 100)}%`;
    document.getElementById('current-carbs').textContent = currentCarbs.toFixed(1);
    document.getElementById('target-carbs').textContent = targets.carbGrams;
}
