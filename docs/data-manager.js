// DOM Elements
const exportDataBtn = document.getElementById('export-data');
const importDataBtn = document.getElementById('import-data');
const importFileInput = document.getElementById('import-file');
const importResult = document.getElementById('import-result');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set up export button
    exportDataBtn.addEventListener('click', exportData);
    
    // Set up import button
    importDataBtn.addEventListener('click', () => {
        importFileInput.click();
    });
    
    // Set up file input change
    importFileInput.addEventListener('change', importData);
});

/**
 * Export all data from localStorage to a JSON file
 */
function exportData() {
    // Get all data from localStorage
    const data = {};
    
    // Get nutrition data
    const nutritionData = localStorage.getItem('nutritionData');
    if (nutritionData) {
        data.nutritionData = JSON.parse(nutritionData);
    }
    
    // Get food entries
    const foodEntries = localStorage.getItem('foodEntries');
    if (foodEntries) {
        data.foodEntries = JSON.parse(foodEntries);
    }
    
    // Convert to JSON string
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = `calorie-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Import data from a JSON file to localStorage
 */
function importData(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Parse the JSON data
            const data = JSON.parse(e.target.result);
            
            // Validate the data structure
            if (!data || (typeof data !== 'object')) {
                throw new Error('无效的数据格式');
            }
            
            // Import nutrition data
            if (data.nutritionData) {
                localStorage.setItem('nutritionData', JSON.stringify(data.nutritionData));
            }
            
            // Import food entries
            if (data.foodEntries) {
                localStorage.setItem('foodEntries', JSON.stringify(data.foodEntries));
            }
            
            // Show success message
            showImportResult('数据导入成功！', 'success');
            
        } catch (error) {
            // Show error message
            showImportResult(`导入失败: ${error.message}`, 'error');
        }
        
        // Reset file input
        importFileInput.value = '';
    };
    
    reader.onerror = function() {
        showImportResult('读取文件时发生错误', 'error');
        importFileInput.value = '';
    };
    
    reader.readAsText(file);
}

/**
 * Show import result message
 */
function showImportResult(message, type) {
    importResult.textContent = message;
    importResult.className = `message ${type}`;
    importResult.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        importResult.style.display = 'none';
    }, 5000);
}
