/**
 * Numpad class for creating and managing a numeric keypad
 */
class Numpad {
    constructor() {
        this.currentInput = null;
        this.currentValue = '';
        this.nextInput = null;
        this.overlay = null;
        this.display = null;
        this.inputLabel = '';

        // 计算器状态
        this.firstOperand = null;
        this.operator = null;
        this.waitForSecondOperand = false;
        this.calculationMode = false;

        // Create the numpad elements
        this.createNumpad();

        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Create the numpad HTML elements
     */
    createNumpad() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'numpad-overlay';
        this.overlay.style.display = 'none';

        // Create container
        const container = document.createElement('div');
        container.className = 'numpad-container';

        // Create header
        const header = document.createElement('div');
        header.className = 'numpad-header';

        // Create title
        this.title = document.createElement('div');
        this.title.className = 'numpad-title';
        this.title.textContent = '输入数值';

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'numpad-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.close());

        // Add title and close button to header
        header.appendChild(this.title);
        header.appendChild(closeBtn);

        // Create display
        this.display = document.createElement('input');
        this.display.className = 'numpad-display';
        this.display.type = 'text';
        this.display.readOnly = true;

        // Create keys container
        const keys = document.createElement('div');
        keys.className = 'numpad-keys';

        // Create number keys
        for (let i = 1; i <= 9; i++) {
            const key = document.createElement('button');
            key.className = 'numpad-key';
            key.textContent = i;
            key.addEventListener('click', () => this.addDigit(i));
            keys.appendChild(key);
        }

        // Create special keys
        const backspaceKey = document.createElement('button');
        backspaceKey.className = 'numpad-key backspace';
        backspaceKey.textContent = '←';
        backspaceKey.addEventListener('click', () => this.backspace());

        const zeroKey = document.createElement('button');
        zeroKey.className = 'numpad-key zero';
        zeroKey.textContent = '0';
        zeroKey.addEventListener('click', () => this.addDigit(0));

        const decimalKey = document.createElement('button');
        decimalKey.className = 'numpad-key decimal';
        decimalKey.textContent = '.';
        decimalKey.addEventListener('click', () => this.addDecimal());

        // 添加清空按钮（C键）
        const clearKey = document.createElement('button');
        clearKey.className = 'numpad-key clear';
        clearKey.textContent = 'C';
        clearKey.addEventListener('click', () => this.clearInput());

        const enterKey = document.createElement('button');
        enterKey.className = 'numpad-key enter';
        enterKey.textContent = '确认';
        enterKey.addEventListener('click', () => this.confirm());

        // 创建运算符按钮（竖排放在右侧）
        const operatorsContainer = document.createElement('div');
        operatorsContainer.className = 'numpad-operators';

        // 加法按钮
        const addKey = document.createElement('button');
        addKey.className = 'numpad-key operator add';
        addKey.textContent = '+';
        addKey.addEventListener('click', () => this.handleOperator('+'));
        operatorsContainer.appendChild(addKey);

        // 减法按钮
        const subtractKey = document.createElement('button');
        subtractKey.className = 'numpad-key operator subtract';
        subtractKey.textContent = '-';
        subtractKey.addEventListener('click', () => this.handleOperator('-'));
        operatorsContainer.appendChild(subtractKey);

        // 乘法按钮
        const multiplyKey = document.createElement('button');
        multiplyKey.className = 'numpad-key operator multiply';
        multiplyKey.textContent = '×';
        multiplyKey.addEventListener('click', () => this.handleOperator('*'));
        operatorsContainer.appendChild(multiplyKey);

        // 除法按钮
        const divideKey = document.createElement('button');
        divideKey.className = 'numpad-key operator divide';
        divideKey.textContent = '÷';
        divideKey.addEventListener('click', () => this.handleOperator('/'));
        operatorsContainer.appendChild(divideKey);

        // 等于按钮
        const equalsKey = document.createElement('button');
        equalsKey.className = 'numpad-key operator equals';
        equalsKey.textContent = '=';
        equalsKey.addEventListener('click', () => this.calculate());
        operatorsContainer.appendChild(equalsKey);

        // Add special keys
        keys.appendChild(zeroKey);
        keys.appendChild(decimalKey);
        keys.appendChild(backspaceKey);
        keys.appendChild(clearKey); // 将删除键和C键放在数字0和小数点的下面

        // 创建数字键盘和运算符的容器
        const keypadContainer = document.createElement('div');
        keypadContainer.className = 'numpad-keypad-container';
        keypadContainer.appendChild(keys);
        keypadContainer.appendChild(operatorsContainer);

        // 创建底部确认按钮容器
        const bottomContainer = document.createElement('div');
        bottomContainer.className = 'numpad-bottom-container';
        bottomContainer.appendChild(enterKey);

        // Assemble the numpad
        container.appendChild(header);
        container.appendChild(this.display);
        container.appendChild(keypadContainer); // 添加包含数字键盘和运算符的容器
        container.appendChild(bottomContainer); // 添加底部确认按钮容器
        this.overlay.appendChild(container);

        // Add to document
        document.body.appendChild(this.overlay);
    }

    /**
     * Add event listeners for keyboard input
     */
    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.overlay || this.overlay.style.display === 'none') {
                return;
            }

            // Handle number keys
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                this.addDigit(parseInt(e.key));
            }

            // Handle decimal point
            if (e.key === '.' || e.key === ',') {
                e.preventDefault();
                this.addDecimal();
            }

            // Handle backspace
            if (e.key === 'Backspace') {
                e.preventDefault();
                this.backspace();
            }

            // Handle clear (C key)
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                this.clearInput();
            }

            // Handle enter
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirm();
            }

            // Handle escape
            if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }

    /**
     * Open the numpad for a specific input
     */
    open(input, nextInput, label) {
        this.currentInput = input;
        this.nextInput = nextInput;
        this.currentValue = input.value || '';
        this.display.value = this.currentValue;
        this.inputLabel = label || '数值';
        this.title.textContent = `输入${this.inputLabel}`;
        this.overlay.style.display = 'flex';

        // Focus the display to show keyboard on mobile
        setTimeout(() => {
            this.display.focus();
        }, 100);
    }

    /**
     * Close the numpad without saving
     */
    close() {
        this.overlay.style.display = 'none';
        this.currentInput = null;
        this.nextInput = null;
        this.currentValue = '';
    }

    /**
     * Add a digit to the current value
     */
    addDigit(digit) {
        // 如果处于等待第二操作数状态，先清空显示
        if (this.waitForSecondOperand) {
            this.currentValue = '';
            this.waitForSecondOperand = false;
        }

        this.currentValue += digit;
        this.display.value = this.currentValue;
        this.calculationMode = true; // 进入计算模式
    }

    /**
     * Add a decimal point to the current value
     */
    addDecimal() {
        // 如果处于等待第二操作数状态，先重置显示
        if (this.waitForSecondOperand) {
            this.currentValue = '0';
            this.waitForSecondOperand = false;
        }

        // Only add decimal if there isn't one already
        if (!this.currentValue.includes('.')) {
            // If the current value is empty, add a leading zero
            if (this.currentValue === '') {
                this.currentValue = '0';
            }
            this.currentValue += '.';
            this.display.value = this.currentValue;
        }

        this.calculationMode = true; // 进入计算模式
    }

    /**
     * Remove the last character from the current value
     */
    backspace() {
        this.currentValue = this.currentValue.slice(0, -1);
        this.display.value = this.currentValue;
    }

    /**
     * Clear the current input value
     */
    clearInput() {
        this.currentValue = '';
        this.display.value = '';

        // 重置计算器状态
        this.firstOperand = null;
        this.operator = null;
        this.waitForSecondOperand = false;
    }

    /**
     * Confirm the current value and update the input
     */
    confirm() {
        if (this.currentInput) {
            // 如果在计算模式下且有未完成的计算，先执行计算
            if (this.calculationMode && this.operator && !this.waitForSecondOperand) {
                this.calculate();
            }

            // Parse the value as a float
            let value = parseFloat(this.currentValue);

            // If the value is NaN, set it to empty string
            if (isNaN(value)) {
                this.currentInput.value = '';
            } else {
                // Format the value to one decimal place
                this.currentInput.value = value.toFixed(1);
            }

            // Trigger change event
            this.currentInput.dispatchEvent(new Event('change', { bubbles: true }));

            // 重置计算器状态
            this.calculationMode = false;
            this.firstOperand = null;
            this.operator = null;
            this.waitForSecondOperand = false;

            // Focus the next input if provided
            if (this.nextInput) {
                this.nextInput.focus();

                // 只有当当前输入是蛋白质或脂肪时，才自动打开下一个数字键盘
                if (this.currentInput.id === 'protein' || this.currentInput.id === 'fat' ||
                    this.currentInput.id === 'food-lib-protein' || this.currentInput.id === 'food-lib-fat') {

                    let nextLabel = '';

                    // 确定下一个输入框的标签
                    if (this.nextInput.id === 'fat') {
                        nextLabel = '脂肪';
                    } else if (this.nextInput.id === 'carbs') {
                        nextLabel = '碳水化合物';
                    } else if (this.nextInput.id === 'food-lib-fat') {
                        nextLabel = '脂肪';
                    } else if (this.nextInput.id === 'food-lib-carbs') {
                        nextLabel = '碳水化合物';
                    }

                    // 找到下一个输入框之后的输入框
                    const inputs = document.querySelectorAll('.nutrient-input');
                    let nextInputIndex = -1;

                    for (let i = 0; i < inputs.length; i++) {
                        if (inputs[i] === this.nextInput) {
                            nextInputIndex = i;
                            break;
                        }
                    }

                    let nextNextInput = null;

                    if (nextInputIndex !== -1 && nextInputIndex < inputs.length - 1) {
                        nextNextInput = inputs[nextInputIndex + 1];
                    }

                    // 为下一个输入框打开数字键盘
                    this.open(this.nextInput, nextNextInput, nextLabel);
                    return;
                }
            }
        }

        // 关闭数字键盘
        this.close();
    }

    /**
     * 处理运算符
     */
    handleOperator(op) {
        // 如果当前值为空，不处理运算符
        if (this.currentValue === '') {
            return;
        }

        // 将当前值转换为数字
        const inputValue = parseFloat(this.currentValue);

        // 如果已经有一个运算符和第一个操作数，并且不是在等待第二个操作数
        // 说明用户连续点击了多个运算符，需要先计算前面的结果
        if (this.operator && this.firstOperand !== null && !this.waitForSecondOperand) {
            this.calculate();
        }

        // 保存第一个操作数和运算符
        if (this.firstOperand === null) {
            this.firstOperand = inputValue;
        }

        this.operator = op;
        this.waitForSecondOperand = true;
        this.calculationMode = true;
    }

    /**
     * 执行计算
     */
    calculate() {
        // 如果没有运算符或第一个操作数，不执行计算
        if (this.operator === null || this.firstOperand === null) {
            return;
        }

        // 获取第二个操作数
        const secondOperand = parseFloat(this.currentValue);

        // 如果第二个操作数无效，不执行计算
        if (isNaN(secondOperand)) {
            return;
        }

        // 执行计算
        let result = 0;
        switch (this.operator) {
            case '+':
                result = this.firstOperand + secondOperand;
                break;
            case '-':
                result = this.firstOperand - secondOperand;
                break;
            case '*':
                result = this.firstOperand * secondOperand;
                break;
            case '/':
                // 防止除以零
                if (secondOperand === 0) {
                    alert('不能除以零');
                    return;
                }
                result = this.firstOperand / secondOperand;
                break;
        }

        // 更新显示和当前值
        this.currentValue = result.toString();
        this.display.value = this.currentValue;

        // 重置计算状态，为下一次计算做准备
        this.firstOperand = result;
        this.waitForSecondOperand = true;
    }

    /**
     * 添加键盘事件监听，支持运算符输入
     */
    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.overlay || this.overlay.style.display === 'none') {
                return;
            }

            // Handle number keys
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                this.addDigit(parseInt(e.key));
            }

            // Handle decimal point
            if (e.key === '.' || e.key === ',') {
                e.preventDefault();
                this.addDecimal();
            }

            // Handle backspace
            if (e.key === 'Backspace') {
                e.preventDefault();
                this.backspace();
            }

            // Handle clear (C key)
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                this.clearInput();
            }

            // Handle enter
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirm();
            }

            // Handle escape
            if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }

            // 处理运算符
            if (e.key === '+') {
                e.preventDefault();
                this.handleOperator('+');
            }

            if (e.key === '-') {
                e.preventDefault();
                this.handleOperator('-');
            }

            if (e.key === '*') {
                e.preventDefault();
                this.handleOperator('*');
            }

            if (e.key === '/') {
                e.preventDefault();
                this.handleOperator('/');
            }

            // 处理等号（不重复处理Enter键，因为上面已经处理过了）
            if (e.key === '=') {
                e.preventDefault();
                this.calculate();
            }
        });
    }
}
