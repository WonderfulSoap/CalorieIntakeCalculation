// Constants for calorie calculations
const PROTEIN_CALORIES_PER_GRAM = 4;
const FAT_CALORIES_PER_GRAM = 9;
const CARB_CALORIES_PER_GRAM = 4;

// Default food library path
const DEFAULT_FOOD_LIBRARY_PATH = 'default-food-library.json';

// DOM Elements
const foodLibraryForm = document.getElementById('food-library-form');
const foodLibraryContainer = document.getElementById('food-library-container');
const foodSearch = document.getElementById('food-search');
const clearFoodFormBtn = document.getElementById('clear-food-form');

// 创建数字键盘实例
let numpad;

// 存储预定义食物库
let defaultFoodLibrary = [];

/**
 * 清空所有输入字段的函数
 */
function clearAllInputs() {
    console.log('清空所有输入字段');
    // 使用表单重置
    foodLibraryForm.reset();

    // 显式清空每个字段
    document.getElementById('food-lib-name').value = '';
    document.getElementById('food-lib-protein').value = '';
    document.getElementById('food-lib-fat').value = '';
    document.getElementById('food-lib-carbs').value = '';
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

    // 设置数字键盘输入
    setupNumpadInputs();

    // 加载预定义食物库
    await loadDefaultFoodLibrary();

    // 加载食物库
    loadFoodLibrary();

    // 设置表单提交
    foodLibraryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addFoodToLibrary();
    });

    // 设置清空按钮
    clearFoodFormBtn.addEventListener('click', clearAllInputs);

    // 设置搜索功能
    foodSearch.addEventListener('input', searchFoodLibrary);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * 设置数字键盘输入
 */
function setupNumpadInputs() {
    // 如果 numpad 实例不存在，则不设置
    if (!numpad) {
        console.warn('数字键盘实例不存在，无法设置输入');
        return;
    }

    const inputs = document.querySelectorAll('.nutrient-input');

    inputs.forEach((input) => {
        // 禁用移动设备的屏幕键盘
        input.setAttribute('readonly', 'readonly');

        // 添加点击事件打开数字键盘
        input.addEventListener('click', () => {
            let nextInput = null;
            let label = '';

            // 确定点击的是哪个输入框，并设置下一个输入框
            if (input.id === 'food-lib-protein') {
                nextInput = document.getElementById('food-lib-fat');
                label = '蛋白质';
            } else if (input.id === 'food-lib-fat') {
                nextInput = document.getElementById('food-lib-carbs');
                label = '脂肪';
            } else if (input.id === 'food-lib-carbs') {
                nextInput = null; // 不设置下一个输入框，因为food-lib-name不是数字输入框
                label = '碳水化合物';
            }

            // 为此输入框打开数字键盘
            if (numpad && typeof numpad.open === 'function') {
                numpad.open(input, nextInput, label);
            } else {
                console.error('数字键盘实例不可用或 open 方法不存在');
            }
        });
    });
}

/**
 * 添加食物到食物库
 */
function addFoodToLibrary() {
    // 获取表单值
    const foodName = document.getElementById('food-lib-name').value.trim();
    const foodUnit = document.getElementById('food-unit').value;
    const nutritionBase = parseInt(document.getElementById('nutrition-base').value);

    // 获取营养成分值并确保它们是有效的数字
    let proteinValue = document.getElementById('food-lib-protein').value;
    let fatValue = document.getElementById('food-lib-fat').value;
    let carbsValue = document.getElementById('food-lib-carbs').value;

    // 解析为数字，如果无效则默认为0
    const protein = proteinValue ? parseFloat(proteinValue) || 0 : 0;
    const fat = fatValue ? parseFloat(fatValue) || 0 : 0;
    const carbs = carbsValue ? parseFloat(carbsValue) || 0 : 0;

    // 检查是否所有值都为0，如果是则不添加食物
    if (protein === 0 && fat === 0 && carbs === 0) {
        alert('请至少输入一项营养成分');
        return;
    }

    // 检查食物名称是否为空
    if (!foodName) {
        alert('请输入食物名称');
        return;
    }

    // 计算卡路里
    const calories = (protein * PROTEIN_CALORIES_PER_GRAM) +
                     (fat * FAT_CALORIES_PER_GRAM) +
                     (carbs * CARB_CALORIES_PER_GRAM);

    // 创建食物对象
    const foodItem = {
        id: Date.now(), // 使用时间戳作为唯一ID
        name: foodName,
        unit: foodUnit,
        nutritionBase: nutritionBase,
        protein: protein,
        fat: fat,
        carbs: carbs,
        calories: Math.round(calories)
    };

    // 保存到localStorage
    saveFoodToLibrary(foodItem);

    // 清空表单
    clearAllInputs();

    // 重新加载食物库
    loadFoodLibrary();
}

/**
 * 保存食物到localStorage
 */
function saveFoodToLibrary(foodItem) {
    // 获取现有食物库
    let foodLibrary = JSON.parse(localStorage.getItem('foodLibrary')) || [];

    // 添加新食物
    foodLibrary.push(foodItem);

    // 保存回localStorage
    localStorage.setItem('foodLibrary', JSON.stringify(foodLibrary));
}

/**
 * 从食物库中删除食物
 */
function deleteFoodFromLibrary(id) {
    // 检查是否为预定义食物
    const isDefaultFood = defaultFoodLibrary.some(item => item.id === id);

    if (isDefaultFood) {
        alert('预定义食物无法删除');
        return;
    }

    // 获取现有食物库
    let foodLibrary = JSON.parse(localStorage.getItem('foodLibrary')) || [];

    // 过滤掉要删除的食物
    foodLibrary = foodLibrary.filter(item => item.id !== id);

    // 保存回localStorage
    localStorage.setItem('foodLibrary', JSON.stringify(foodLibrary));

    // 重新加载食物库
    loadFoodLibrary();
}

/**
 * 加载食物库
 */
function loadFoodLibrary() {
    // 清空容器
    foodLibraryContainer.innerHTML = '';

    // 获取用户自定义食物库
    const userFoodLibrary = JSON.parse(localStorage.getItem('foodLibrary')) || [];

    // 合并预定义食物库和用户自定义食物库
    const combinedFoodLibrary = [...defaultFoodLibrary, ...userFoodLibrary];

    if (combinedFoodLibrary.length === 0) {
        // 如果食物库为空，显示提示信息
        foodLibraryContainer.innerHTML = '<p class="empty-library">您的食物库还是空的，请添加常用食物。</p>';
        return;
    }

    // 创建表格
    const table = document.createElement('table');
    table.className = 'food-library-table';

    // 添加表头
    table.innerHTML = `
        <thead>
            <tr>
                <th>食物名称</th>
                <th>单位</th>
                <th>基准</th>
                <th>蛋白质 (克)</th>
                <th>脂肪 (克)</th>
                <th>碳水 (克)</th>
                <th>卡路里</th>
                <th>操作</th>
                <th>类型</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    // 添加食物到表格
    const tbody = table.querySelector('tbody');
    combinedFoodLibrary.forEach(food => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', food.id);

        // 如果是预定义食物，添加特殊样式
        if (food.isDefault) {
            row.classList.add('default-food');
        }

        // 显示基准单位
        const baseDisplay = food.nutritionBase === 1 ? '每1' : '每100';

        // 确定食物类型和删除按钮
        const foodType = food.isDefault ? '预定义' : '自定义';
        const deleteButton = food.isDefault
            ? '<button class="btn btn-secondary btn-sm" disabled>无法删除</button>'
            : '<button class="btn btn-danger btn-sm delete-food-btn">删除</button>';

        row.innerHTML = `
            <td>${food.name}</td>
            <td>${food.unit}</td>
            <td>${baseDisplay}${food.unit}</td>
            <td>${food.protein.toFixed(1)}</td>
            <td>${food.fat.toFixed(1)}</td>
            <td>${food.carbs.toFixed(1)}</td>
            <td>${food.calories}</td>
            <td>
                ${deleteButton}
            </td>
            <td>${foodType}</td>
        `;

        // 如果不是预定义食物，添加删除事件监听器
        if (!food.isDefault) {
            const deleteBtn = row.querySelector('.delete-food-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`确定要删除 "${food.name}" 吗？`)) {
                        deleteFoodFromLibrary(food.id);
                    }
                });
            }
        }

        tbody.appendChild(row);
    });

    // 将表格添加到容器
    foodLibraryContainer.appendChild(table);
}

/**
 * 搜索食物库
 */
function searchFoodLibrary() {
    const searchTerm = foodSearch.value.toLowerCase().trim();

    // 如果搜索词为空，显示所有食物
    if (!searchTerm) {
        loadFoodLibrary();
        return;
    }

    // 获取用户自定义食物库
    const userFoodLibrary = JSON.parse(localStorage.getItem('foodLibrary')) || [];

    // 合并预定义食物库和用户自定义食物库
    const combinedFoodLibrary = [...defaultFoodLibrary, ...userFoodLibrary];

    // 过滤符合搜索条件的食物
    const filteredFoods = combinedFoodLibrary.filter(food =>
        food.name.toLowerCase().includes(searchTerm)
    );

    // 清空容器
    foodLibraryContainer.innerHTML = '';

    if (filteredFoods.length === 0) {
        // 如果没有找到匹配的食物，显示提示信息
        foodLibraryContainer.innerHTML = '<p class="empty-library">没有找到匹配的食物。</p>';
        return;
    }

    // 创建表格
    const table = document.createElement('table');
    table.className = 'food-library-table';

    // 添加表头
    table.innerHTML = `
        <thead>
            <tr>
                <th>食物名称</th>
                <th>单位</th>
                <th>基准</th>
                <th>蛋白质 (克)</th>
                <th>脂肪 (克)</th>
                <th>碳水 (克)</th>
                <th>卡路里</th>
                <th>操作</th>
                <th>类型</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    // 添加食物到表格
    const tbody = table.querySelector('tbody');
    filteredFoods.forEach(food => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', food.id);

        // 如果是预定义食物，添加特殊样式
        if (food.isDefault) {
            row.classList.add('default-food');
        }

        // 显示基准单位
        const baseDisplay = food.nutritionBase === 1 ? '每1' : '每100';

        // 确定食物类型和删除按钮
        const foodType = food.isDefault ? '预定义' : '自定义';
        const deleteButton = food.isDefault
            ? '<button class="btn btn-secondary btn-sm" disabled>无法删除</button>'
            : '<button class="btn btn-danger btn-sm delete-food-btn">删除</button>';

        row.innerHTML = `
            <td>${food.name}</td>
            <td>${food.unit}</td>
            <td>${baseDisplay}${food.unit}</td>
            <td>${food.protein.toFixed(1)}</td>
            <td>${food.fat.toFixed(1)}</td>
            <td>${food.carbs.toFixed(1)}</td>
            <td>${food.calories}</td>
            <td>
                ${deleteButton}
            </td>
            <td>${foodType}</td>
        `;

        // 如果不是预定义食物，添加删除事件监听器
        if (!food.isDefault) {
            const deleteBtn = row.querySelector('.delete-food-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`确定要删除 "${food.name}" 吗？`)) {
                        deleteFoodFromLibrary(food.id);
                    }
                });
            }
        }

        tbody.appendChild(row);
    });

    // 将表格添加到容器
    foodLibraryContainer.appendChild(table);
}
