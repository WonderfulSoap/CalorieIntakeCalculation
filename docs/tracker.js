// Constants for calorie calculations
const PROTEIN_CALORIES_PER_GRAM = 4;
const FAT_CALORIES_PER_GRAM = 9;
const CARB_CALORIES_PER_GRAM = 4;

// Default food library path
const DEFAULT_FOOD_LIBRARY_PATH = 'default-food-library.json';

// 存储预定义食物库
let defaultFoodLibrary = [];

// DOM Elements
const foodForm = document.getElementById('food-form');
const libraryFoodForm = document.getElementById('library-food-form');
const foodGroupsContainer = document.getElementById('food-groups-container');
const dateSelect = document.getElementById('date-select');
const clearDayBtn = document.getElementById('clear-day');
const noTargetWarning = document.getElementById('no-target-warning');
const manualTab = document.getElementById('manual-tab');
const libraryTab = document.getElementById('library-tab');
const manualInput = document.getElementById('manual-input');
const libraryInput = document.getElementById('library-input');
const foodSelect = document.getElementById('food-select');
const foodAmount = document.getElementById('food-amount');
const foodUnit = document.getElementById('food-unit');
const previewProtein = document.getElementById('preview-protein');
const previewFat = document.getElementById('preview-fat');
const previewCarbs = document.getElementById('preview-carbs');
const previewCalories = document.getElementById('preview-calories');

// Current date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// 创建数字键盘实例
// 将在 initializeApp 函数中初始化
let numpad;

/**
 * 清空手动输入表单的所有输入字段
 */
function clearAllInputs() {
    console.log('清空所有输入字段');
    // 使用表单重置
    foodForm.reset();

    // 显式清空每个字段
    document.getElementById('protein').value = '';
    document.getElementById('fat').value = '';
    document.getElementById('carbs').value = '';
    document.getElementById('food-name').value = '';

    // 记录清空后的值，用于调试
    console.log('清空后的值：', {
        protein: document.getElementById('protein').value,
        fat: document.getElementById('fat').value,
        carbs: document.getElementById('carbs').value,
        foodName: document.getElementById('food-name').value
    });
}

/**
 * 清空食物库选择表单的所有输入字段
 */
function clearLibraryInputs() {
    console.log('清空食物库选择表单');
    // 使用表单重置
    libraryFoodForm.reset();

    // 显式清空摄入量字段
    document.getElementById('food-amount').value = '';

    // 重置预览
    updateNutritionPreview();
}

/**
 * 加载预定义食物库
 */
async function loadDefaultFoodLibrary() {
    try {
        // 使用fetch API加载预定义食物库JSON文件
        const response = await fetch(DEFAULT_FOOD_LIBRARY_PATH);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 解析JSON数据
        const data = await response.json();

        // 存储预定义食物库
        defaultFoodLibrary = data;

        console.log('预定义食物库加载成功，共加载', defaultFoodLibrary.length, '个食物');

        return true;
    } catch (error) {
        console.error('加载预定义食物库失败:', error);
        defaultFoodLibrary = [];
        return false;
    }
}

// 主要的初始化函数
async function initializeApp() {
    try {
        // 尝试创建 Numpad 实例
        numpad = new Numpad();
        console.log('数字键盘初始化成功');
    } catch (error) {
        console.error('数字键盘初始化失败:', error);
    }

    // Set date input to today
    dateSelect.value = today;

    // Check if nutrition targets exist
    checkNutritionTargets();

    // Load food entries for today
    loadFoodEntries(today);

    // 加载预定义食物库
    await loadDefaultFoodLibrary();

    // Load food library for dropdown
    loadFoodLibraryOptions();

    // Set up numpad for nutrient inputs
    setupNumpadInputs();

    // Set up form submission with Enter key navigation
    setupFormNavigation();

    // Set up form submission for manual input
    foodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addFoodEntry();

        // 确保表单重置并清空所有输入字段
        clearAllInputs();
    });

    // Set up form submission for library input
    libraryFoodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addFoodFromLibrary();
    });

    // Set up date change
    dateSelect.addEventListener('change', () => {
        loadFoodEntries(dateSelect.value);
    });

    // Set up clear day button
    const clearDayBtn = document.getElementById('clear-day');
    if (clearDayBtn) {
        clearDayBtn.addEventListener('click', () => {
            if (confirm('确定要清除当天的所有食物记录吗？')) {
                clearDayEntries(dateSelect.value);
            }
        });
    } else {
        console.warn('清除当天记录按钮不存在');
    }

    // 设置清空输入按钮
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearAllInputs();
        });
    }

    // 设置清空食物库选择表单按钮
    const clearLibraryBtn = document.getElementById('clear-library-btn');
    if (clearLibraryBtn) {
        clearLibraryBtn.addEventListener('click', () => {
            clearLibraryInputs();
        });
    }

    // 设置标签切换
    manualTab.addEventListener('click', () => {
        manualTab.classList.add('active');
        libraryTab.classList.remove('active');
        manualInput.style.display = 'block';
        libraryInput.style.display = 'none';
    });

    libraryTab.addEventListener('click', () => {
        libraryTab.classList.add('active');
        manualTab.classList.remove('active');
        libraryInput.style.display = 'block';
        manualInput.style.display = 'none';
    });

    // 设置食物选择变化事件
    foodSelect.addEventListener('change', updateNutritionPreview);

    // 设置摄入量变化事件
    foodAmount.addEventListener('change', updateNutritionPreview);
    foodAmount.addEventListener('input', updateNutritionPreview);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Set up numpad for nutrient inputs
 */
function setupNumpadInputs() {
    // 如果 numpad 实例不存在，则不设置
    if (!numpad) {
        console.warn('数字键盘实例不存在，无法设置输入');
        return;
    }

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
            } else if (input.id === 'food-amount') {
                nextInput = null; // 明确设置为null，表示没有下一个输入框
                label = '摄入量';
            }

            // Open numpad for this input
            if (numpad && typeof numpad.open === 'function') {
                numpad.open(input, nextInput, label);
            } else {
                console.error('数字键盘实例不可用或 open 方法不存在');
            }
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
 * 加载食物库选项到下拉菜单
 */
function loadFoodLibraryOptions() {
    // 获取用户自定义食物库
    const userFoodLibrary = JSON.parse(localStorage.getItem('foodLibrary')) || [];

    // 合并预定义食物库和用户自定义食物库
    const combinedFoodLibrary = [...defaultFoodLibrary, ...userFoodLibrary];

    // 清空下拉菜单（保留第一个默认选项）
    while (foodSelect.options.length > 1) {
        foodSelect.remove(1);
    }

    // 如果合并后的食物库为空，显示提示信息
    if (combinedFoodLibrary.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '-- 食物库为空，请先添加食物 --';
        option.disabled = true;
        foodSelect.appendChild(option);
        return;
    }

    // 添加食物到下拉菜单
    combinedFoodLibrary.forEach(food => {
        const option = document.createElement('option');
        option.value = food.id;
        option.textContent = food.name + (food.isDefault ? ' (预定义)' : '');
        option.setAttribute('data-unit', food.unit);
        option.setAttribute('data-base', food.nutritionBase);
        option.setAttribute('data-protein', food.protein);
        option.setAttribute('data-fat', food.fat);
        option.setAttribute('data-carbs', food.carbs);
        option.setAttribute('data-calories', food.calories);
        option.setAttribute('data-is-default', food.isDefault ? 'true' : 'false');
        foodSelect.appendChild(option);
    });
}

/**
 * 更新营养成分预览
 */
function updateNutritionPreview() {
    // 获取选中的食物
    const selectedOption = foodSelect.options[foodSelect.selectedIndex];

    // 如果没有选中食物，清空预览
    if (!selectedOption || !selectedOption.value) {
        previewProtein.textContent = '0';
        previewFat.textContent = '0';
        previewCarbs.textContent = '0';
        previewCalories.textContent = '0';
        foodUnit.textContent = '克';
        return;
    }

    // 获取食物单位
    const unit = selectedOption.getAttribute('data-unit') || '克';
    foodUnit.textContent = unit;

    // 获取营养基准（1或100）
    const nutritionBase = parseInt(selectedOption.getAttribute('data-base')) || 100;

    // 获取营养成分
    const baseProtein = parseFloat(selectedOption.getAttribute('data-protein')) || 0;
    const baseFat = parseFloat(selectedOption.getAttribute('data-fat')) || 0;
    const baseCarbs = parseFloat(selectedOption.getAttribute('data-carbs')) || 0;
    const baseCalories = parseFloat(selectedOption.getAttribute('data-calories')) || 0;

    // 获取摄入量
    const amount = parseFloat(foodAmount.value) || 0;

    // 计算实际营养成分
    let protein, fat, carbs, calories;

    if (nutritionBase === 1) {
        // 如果基准是1单位，直接乘以摄入量
        protein = baseProtein * amount;
        fat = baseFat * amount;
        carbs = baseCarbs * amount;
        calories = baseCalories * amount;
    } else {
        // 如果基准是100单位，需要除以100再乘以摄入量
        protein = (baseProtein / 100) * amount;
        fat = (baseFat / 100) * amount;
        carbs = (baseCarbs / 100) * amount;
        calories = (baseCalories / 100) * amount;
    }

    // 更新预览
    previewProtein.textContent = protein.toFixed(1);
    previewFat.textContent = fat.toFixed(1);
    previewCarbs.textContent = carbs.toFixed(1);
    previewCalories.textContent = Math.round(calories);
}

/**
 * 从食物库添加食物
 */
function addFoodFromLibrary() {
    // 获取选中的食物
    const selectedOption = foodSelect.options[foodSelect.selectedIndex];

    // 如果没有选中食物，显示错误
    if (!selectedOption || !selectedOption.value) {
        alert('请选择一个食物');
        return;
    }

    // 获取食物名称
    const foodName = selectedOption.textContent;

    // 获取食物单位
    const unit = selectedOption.getAttribute('data-unit') || '克';

    // 获取营养基准（1或100）
    const nutritionBase = parseInt(selectedOption.getAttribute('data-base')) || 100;

    // 获取基础营养成分
    const baseProtein = parseFloat(selectedOption.getAttribute('data-protein')) || 0;
    const baseFat = parseFloat(selectedOption.getAttribute('data-fat')) || 0;
    const baseCarbs = parseFloat(selectedOption.getAttribute('data-carbs')) || 0;
    const baseCalories = parseFloat(selectedOption.getAttribute('data-calories')) || 0;

    // 获取摄入量
    const amount = parseFloat(foodAmount.value) || 0;

    // 检查摄入量是否有效
    if (amount <= 0) {
        alert('请输入有效的摄入量');
        return;
    }

    // 计算实际营养成分
    let protein, fat, carbs, calories;

    if (nutritionBase === 1) {
        // 如果基准是1单位，直接乘以摄入量
        protein = baseProtein * amount;
        fat = baseFat * amount;
        carbs = baseCarbs * amount;
        calories = baseCalories * amount;
    } else {
        // 如果基准是100单位，需要除以100再乘以摄入量
        protein = (baseProtein / 100) * amount;
        fat = (baseFat / 100) * amount;
        carbs = (baseCarbs / 100) * amount;
        calories = (baseCalories / 100) * amount;
    }

    const date = dateSelect.value;

    // 创建食物条目名称，包含摄入量和单位
    const entryName = `${foodName} (${amount}${unit})`;

    // Get current time
    const now = new Date();
    const timestamp = now.getTime();
    const timeString = now.toLocaleTimeString();

    // Create food entry object
    const foodEntry = {
        id: timestamp, // Use timestamp as unique ID
        name: entryName,
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

    // 清空输入字段
    clearLibraryInputs();
}

/**
 * Add a new food entry
 */
function addFoodEntry() {
    let foodName = document.getElementById('food-name').value;

    // 获取输入值并确保它们是有效的数字
    let proteinValue = document.getElementById('protein').value;
    let fatValue = document.getElementById('fat').value;
    let carbsValue = document.getElementById('carbs').value;

    // 解析为数字，如果无效则默认为0
    const protein = proteinValue ? parseFloat(proteinValue) || 0 : 0;
    const fat = fatValue ? parseFloat(fatValue) || 0 : 0;
    const carbs = carbsValue ? parseFloat(carbsValue) || 0 : 0;

    // 检查是否所有值都为0，如果是则不添加食物
    if (protein === 0 && fat === 0 && carbs === 0) {
        console.warn('所有营养值都为0或无效，不添加食物');
        return;
    }

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

    // 清空所有输入字段
    clearAllInputs();

    // Focus protein input
    const proteinInput = document.getElementById('protein');
    proteinInput.focus();
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
 * 保留此注释作为历史参考，但移除未使用的函数
 *
 * 现在我们使用 loadFoodEntriesGrouped 函数来显示分组的食物条目
 */

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
    try {
        // 确保 entries 是数组
        if (!Array.isArray(entries)) {
            console.error('无效的食物条目数组:', entries);
            return;
        }

        // 过滤掉无效的条目
        const validEntries = entries.filter(entry => entry && typeof entry === 'object');

        if (validEntries.length === 0) {
            console.warn('没有有效的食物条目');
            return;
        }

        // Sort entries by timestamp
        validEntries.sort((a, b) => {
            const timestampA = typeof a.timestamp === 'number' ? a.timestamp : 0;
            const timestampB = typeof b.timestamp === 'number' ? b.timestamp : 0;
            return timestampA - timestampB;
        });

        // Group entries by hour
        const groupedEntries = {};
        const hourLabels = {};

        validEntries.forEach(entry => {
            try {
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
            } catch (error) {
                console.error('处理食物条目时出错:', error, entry);
            }
        });

        // Get all group totals first
        const allGroupTotals = {};
        Object.keys(groupedEntries).forEach(key => {
            allGroupTotals[key] = calculateGroupTotals(groupedEntries[key]);
        });

        // Create groups in UI - 按照时间降序排列
        Object.keys(groupedEntries).sort((a, b) => parseInt(b) - parseInt(a)).forEach(hourKey => {
            try {
                const groupEntries = groupedEntries[hourKey];
                const timeLabel = hourLabels[hourKey];

                // Get the group totals we already calculated
                const groupTotals = allGroupTotals[hourKey];

                // Get nutrition targets from localStorage
                const nutritionDataStr = localStorage.getItem('nutritionData');
                const nutritionData = nutritionDataStr ? JSON.parse(nutritionDataStr) : null;
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
            } catch (error) {
                console.error('创建食物组时出错:', error);
            }
        });
    } catch (error) {
        console.error('加载食物条目时出错:', error);
    }
}

/**
 * Calculate totals for a group of food entries
 */
function calculateGroupTotals(entries) {
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let calories = 0;

    if (!Array.isArray(entries)) {
        console.error('无效的食物条目数组:', entries);
        return { protein, fat, carbs, calories };
    }

    entries.forEach(entry => {
        if (!entry || typeof entry !== 'object') {
            console.warn('跳过无效的食物条目:', entry);
            return;
        }

        // 确保所有属性都是有效的数字
        protein += typeof entry.protein === 'number' ? entry.protein : 0;
        fat += typeof entry.fat === 'number' ? entry.fat : 0;
        carbs += typeof entry.carbs === 'number' ? entry.carbs : 0;
        calories += typeof entry.calories === 'number' ? entry.calories : 0;
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

    if (!Array.isArray(entries)) {
        console.error('无效的食物条目数组:', entries);
        return { protein, fat, carbs, calories };
    }

    entries.forEach(entry => {
        if (!entry || typeof entry !== 'object') {
            console.warn('跳过无效的食物条目:', entry);
            return;
        }

        // 确保所有属性都是有效的数字
        protein += typeof entry.protein === 'number' ? entry.protein : 0;
        fat += typeof entry.fat === 'number' ? entry.fat : 0;
        carbs += typeof entry.carbs === 'number' ? entry.carbs : 0;
        calories += typeof entry.calories === 'number' ? entry.calories : 0;
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
        // 确保条目有效
        if (!entry || typeof entry !== 'object') {
            console.error('无效的食物条目:', entry);
            return;
        }

        const row = document.createElement('tr');
        row.setAttribute('data-id', entry.id || '');

        // 确保所有属性都有有效值
        const name = entry.name || '未命名食物';
        const protein = typeof entry.protein === 'number' ? entry.protein : 0;
        const fat = typeof entry.fat === 'number' ? entry.fat : 0;
        const carbs = typeof entry.carbs === 'number' ? entry.carbs : 0;
        const calories = typeof entry.calories === 'number' ? entry.calories : 0;

        // Ensure time is available or use a placeholder
        const displayTime = entry.time || '未记录时间';

        row.innerHTML = `
            <td>${name}</td>
            <td>${protein.toFixed(1)}</td>
            <td>${fat.toFixed(1)}</td>
            <td>${carbs.toFixed(1)}</td>
            <td>${calories}</td>
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

    // 初始化变量（在try块外部定义，以便在整个函数范围内可用）
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalCalories = 0;

    try {
        // 安全地解析 localStorage 数据
        const foodEntriesStr = localStorage.getItem('foodEntries');
        const foodEntries = foodEntriesStr ? JSON.parse(foodEntriesStr) : {};

        if (!foodEntries || typeof foodEntries !== 'object') {
            console.error('无效的食物条目数据:', foodEntries);
            return;
        }

        // Calculate totals
        if (foodEntries[date] && Array.isArray(foodEntries[date])) {
            foodEntries[date].forEach(entry => {
                if (!entry || typeof entry !== 'object') {
                    console.warn('跳过无效的食物条目:', entry);
                    return;
                }

                // 确保所有属性都是有效的数字
                totalProtein += typeof entry.protein === 'number' ? entry.protein : 0;
                totalFat += typeof entry.fat === 'number' ? entry.fat : 0;
                totalCarbs += typeof entry.carbs === 'number' ? entry.carbs : 0;
                totalCalories += typeof entry.calories === 'number' ? entry.calories : 0;
            });
        }

        // 这些元素在HTML中不存在，所以我们不再尝试更新它们
        // 相关信息已经在updateDailySummary函数中更新
        console.log('当前总计:', {
            protein: totalProtein ? totalProtein.toFixed(1) : '0.0',
            fat: totalFat ? totalFat.toFixed(1) : '0.0',
            carbs: totalCarbs ? totalCarbs.toFixed(1) : '0.0',
            calories: totalCalories || 0
        });
    } catch (error) {
        console.error('计算总计时出错:', error);
    }
}

/**
 * Update daily summary with progress bars
 */
function updateDailySummary() {
    try {
        // Check if targets exist
        if (!checkNutritionTargets()) {
            return;
        }

        // 安全地获取营养目标
        const nutritionDataStr = localStorage.getItem('nutritionData');
        if (!nutritionDataStr) {
            console.warn('未找到营养目标数据');
            return;
        }

        const nutritionData = JSON.parse(nutritionDataStr);
        if (!nutritionData || !nutritionData.calculations) {
            console.warn('营养目标数据无效:', nutritionData);
            return;
        }

        const targets = nutritionData.calculations;

        // 安全地获取食物条目
        const date = dateSelect.value;
        const foodEntriesStr = localStorage.getItem('foodEntries');
        const foodEntries = foodEntriesStr ? JSON.parse(foodEntriesStr) : {};

        if (!foodEntries || typeof foodEntries !== 'object') {
            console.error('无效的食物条目数据:', foodEntries);
            return;
        }

        let currentProtein = 0;
        let currentFat = 0;
        let currentCarbs = 0;
        let currentCalories = 0;

        if (foodEntries[date] && Array.isArray(foodEntries[date])) {
            foodEntries[date].forEach(entry => {
                if (!entry || typeof entry !== 'object') {
                    console.warn('跳过无效的食物条目:', entry);
                    return;
                }

                // 确保所有属性都是有效的数字
                currentProtein += typeof entry.protein === 'number' ? entry.protein : 0;
                currentFat += typeof entry.fat === 'number' ? entry.fat : 0;
                currentCarbs += typeof entry.carbs === 'number' ? entry.carbs : 0;
                currentCalories += typeof entry.calories === 'number' ? entry.calories : 0;
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
    } catch (error) {
        console.error('更新每日摘要时出错:', error);
    }
}
