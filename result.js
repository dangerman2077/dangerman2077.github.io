const result = JSON.parse(localStorage.getItem('wordleResult') || '{}');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const resultStats = document.getElementById('resultStats');

if (result.won) {
    resultTitle.textContent = 'Победа!';
    resultText.textContent = `Слово «${result.answer}» угадано.`;
} else {
    resultTitle.textContent = 'Поражение';
    resultText.textContent = `Загаданное слово: «${result.answer}».`;
}
resultStats.textContent = `Использовано попыток: ${result.attempts} из ${result.maxAttempts}`;

// on*-обработчик для кнопки повторной игры.
document.getElementById('againButton').onclick = function () {
    localStorage.removeItem('wordleResult');
    window.location.href = 'game.html';
};

document.getElementById('menuButton').addEventListener('click', function (event) {
    event.preventDefault();
    window.location.href = 'index.html';
});
