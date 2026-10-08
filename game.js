const WORDS = [
    'арбуз','банан','берег','билет','ветер','город','груша','доска','драка','жираф',
    'замок','земля','игрок','камень','карта','книга','кобра','кофта','лампа','лимон',
    'маска','метро','музыка','народ','облако','океан','парус','песок','пилот',
    'пламя','поезд','почва','птица','радио','робот','сахар','север','слово',
    'спорт','стена','столб','струя','театр','трава','улица','фраза','хлеба'
];

const KEY_ROWS = ['йцукенгшщзхъ', 'фывапролджэ', 'ячсмитьбю'];
const state = {
    difficulty: localStorage.getItem('wordleDifficulty') || 'normal',
    maxAttempts: Number(localStorage.getItem('wordleAttempts')) || 6,
    answer: WORDS[Math.floor(Math.random() * WORDS.length)],
    row: 0,
    col: 0,
    guesses: [],
    finished: false,
    pendingResult: null
};

const board = document.getElementById('board');
const keyboard = document.getElementById('keyboard');
const message = document.getElementById('message');
const attemptCounter = document.getElementById('attemptCounter');
const difficultyLabel = document.getElementById('difficultyLabel');

const levelNames = { easy: 'Легко', normal: 'Нормально', hard: 'Сложно' };
difficultyLabel.textContent = levelNames[state.difficulty];

function createBoard() {
    // Удаляем старые дочерние узлы перед построением нового поля.
    while (board.firstChild) board.firstChild.remove();
    for (let r = 0; r < state.maxAttempts; r++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.dataset.row = r;
        for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.setAttribute('aria-label', `Строка ${r + 1}, буква ${c + 1}`);
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function createKeyboard() {
    keyboard.textContent = '';
    KEY_ROWS.forEach(function (letters) {
        const row = document.createElement('div');
        row.className = 'key-row';
        letters.split('').forEach(function (letter) {
            const key = document.createElement('button');
            key.type = 'button';
            key.className = 'key';
            key.textContent = letter.toUpperCase();
            key.dataset.letter = letter;
            key.setAttribute('draggable', 'true');
            key.addEventListener('click', function () {
                if (touchHandled) return;
                addLetter(letter);
            });
            key.addEventListener('dragstart', handleDragStart);
            key.addEventListener('touchstart', handleTouchStart, { passive: false });
            // События mouseover/mouseout — требование задания и пример из лекции.
            key.addEventListener('mouseover', function (event) {
                if (!event.target.classList.contains('correct') && !event.target.classList.contains('absent')) {
                    event.target.style.backgroundColor = '#22c55e';
                }
            });
            key.addEventListener('mouseout', function (event) {
                if (!event.target.classList.contains('correct') && !event.target.classList.contains('absent')) {
                    event.target.style.backgroundColor = '';
                }
            });
            row.appendChild(key);
        });
        // Кнопки управления размещаются как на обычной экранной клавиатуре:
        // Backspace — в конце второго ряда, ВВОД — в конце третьего ряда.
        if (letters === KEY_ROWS[1]) {
            row.appendChild(makeControlKey('⌫', 'backspace'));
        }
        if (letters === KEY_ROWS[2]) {
            row.appendChild(makeControlKey('ВВОД', 'enter'));
        }
        keyboard.appendChild(row);
    });
}

function makeControlKey(text, action) {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'key';
    key.textContent = text;
    key.dataset.action = action;
    key.addEventListener('click', function () {
        if (action === 'backspace') removeLetter();
        else checkGuess();
    });
    return key;
}

function getCurrentCells() {
    const row = board.querySelectorAll('.row')[state.row];
    return row.querySelectorAll('.cell');
}

function addLetter(letter) {
    if (state.finished || state.col >= 5) return;
    const cells = getCurrentCells();
    cells[state.col].textContent = letter.toUpperCase();
    cells[state.col].classList.add('filled');
    state.col++;
}

function removeLetter() {
    if (state.finished || state.col <= 0) return;
    state.col--;
    const cells = getCurrentCells();
    cells[state.col].textContent = '';
    cells[state.col].classList.remove('filled');
}

function currentWord() {
    return Array.from(getCurrentCells()).map(cell => cell.textContent.toLowerCase()).join('');
}

function checkGuess() {
    if (state.finished) return;
    if (state.col < 5) {
        showMessage('Введите 5 букв.');
        return;
    }

    const guess = currentWord();
    const cells = getCurrentCells();
    const result = evaluateGuess(guess, state.answer);
    result.forEach(function (status, index) {
        cells[index].classList.remove('filled');
        cells[index].classList.add(status);
        // Клетки «переворачиваются» по очереди: задержка зависит от номера клетки.
        cells[index].style.animationDelay = (index * 0.15) + 's';
        cells[index].classList.add('reveal');
    });
    updateKeyboard(guess, result);
    state.guesses.push(guess);

    // Игра окончена: ввод блокируется, а переход к результату произойдёт
    // в обработчике animationend после переворота последней клетки.
    if (guess === state.answer) {
        state.finished = true;
        state.pendingResult = true;
        return;
    }
    if (state.row + 1 >= state.maxAttempts) {
        state.finished = true;
        state.pendingResult = false;
        return;
    }
    state.row++;
    state.col = 0;
    updateCounter();
}

function evaluateGuess(guess, answer) {
    const result = Array(5).fill('absent');
    const remaining = answer.split('');
    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
            result[i] = 'correct';
            remaining[i] = null;
        }
    }
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'correct') continue;
        const found = remaining.indexOf(guess[i]);
        if (found !== -1) {
            result[i] = 'present';
            remaining[found] = null;
        }
    }
    return result;
}

function updateKeyboard(guess, result) {
    const priority = { absent: 1, present: 2, correct: 3 };
    guess.split('').forEach(function (letter, index) {
        const key = keyboard.querySelector(`[data-letter="${letter}"]`);
        if (!key) return;
        const old = key.dataset.state;
        if (!old || priority[result[index]] > priority[old]) {
            key.dataset.state = result[index];
            key.classList.remove('absent', 'present', 'correct');
            key.classList.add(result[index]);
        }
    });
}

function showMessage(text) {
    message.textContent = text;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(function () {
        message.textContent = '';
    }, 1800);
}

function updateCounter() {
    attemptCounter.textContent = `Попытка ${state.row + 1} из ${state.maxAttempts}`;
}

// Drag & Drop: клавиша является draggable-элементом, клетка — drop target.
function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', event.currentTarget.dataset.letter);
    event.dataTransfer.effectAllowed = 'copy';
}

board.addEventListener('dragover', function (event) {
    const cell = event.target.closest('.cell');
    if (!cell) return;
    event.preventDefault();
    cell.classList.add('drag-target');
});

board.addEventListener('dragleave', function (event) {
    const cell = event.target.closest('.cell');
    if (cell) cell.classList.remove('drag-target');
});

board.addEventListener('drop', function (event) {
    event.preventDefault();
    const cell = event.target.closest('.cell');
    if (!cell) return;
    cell.classList.remove('drag-target');
    const letter = event.dataTransfer.getData('text/plain');
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (row === state.row && col === state.col && letter) addLetter(letter);
});

// Сенсорный вариант перетаскивания: touchstart/touchmove/touchend.
let touchLetter = '';
let touchHandled = false;
function handleTouchStart(event) {
    event.preventDefault();
    touchLetter = event.currentTarget.dataset.letter;
    touchHandled = false;
}
keyboard.addEventListener('touchend', function () {
    if (touchLetter) {
        addLetter(touchLetter);
        touchLetter = '';
        touchHandled = true;
        window.setTimeout(function () { touchHandled = false; }, 0);
    }
}, { passive: false });

// События анимации: их генерирует браузер, а не пользователь.
// Оба события всплывают, поэтому достаточно одного обработчика на поле.
board.addEventListener('animationstart', function (event) {
    if (event.animationName !== 'flip') return;
    if (event.target.dataset.col === '0') showMessage('Проверяем слово...');
});

board.addEventListener('animationend', function (event) {
    if (event.animationName !== 'flip') return;
    const cell = event.target;
    cell.classList.remove('reveal');
    cell.style.animationDelay = '';
    // Последняя клетка ряда закончила анимацию — можно завершать игру.
    if (cell.dataset.col === '4' && state.pendingResult !== null) {
        finishGame(state.pendingResult);
        state.pendingResult = null;
    }
});

// Физическая клавиатура — KeyboardEvent.key.
document.addEventListener('keydown', function (event) {
    if (state.finished) return;
    const key = event.key.toLowerCase();
    if (/^[а-яё]$/.test(key)) {
        event.preventDefault();
        addLetter(key);
    } else if (key === 'backspace') {
        event.preventDefault();
        removeLetter();
    } else if (key === 'enter') {
        event.preventDefault();
        checkGuess();
    }
});


document.getElementById('backButton').addEventListener('click', function () {
    window.location.href = 'index.html';
});

// Пользовательское событие: игра сообщает интерфейсу о завершении.
document.addEventListener('wordlefinished', function (event) {
    const data = event.detail;
    window.setTimeout(function () {
        localStorage.setItem('wordleResult', JSON.stringify(data));
        window.location.href = 'result.html';
    }, 250);
});

// Promise используется как одноразовая асинхронная операция перехода к результату.
function finishGame(won) {
    state.finished = true;
    const resultData = {
        won: won,
        answer: state.answer,
        attempts: state.guesses.length,
        maxAttempts: state.maxAttempts
    };
    new Promise(function (resolve) {
        window.setTimeout(function () { resolve(resultData); }, 300);
    }).then(function (data) {
        const event = new CustomEvent('wordlefinished', {
            bubbles: true,
            cancelable: true,
            detail: data
        });
        document.dispatchEvent(event);
    });
}

createBoard();
createKeyboard();
updateCounter();
