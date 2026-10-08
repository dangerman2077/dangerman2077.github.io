// Главное меню: доступ к DOM, изменение атрибутов и обработка событий.
const difficulty = document.getElementById('difficulty');
const buttons = document.querySelectorAll('.difficulty-btn');

buttons.forEach(function (button) {
    button.addEventListener('click', function (event) {
        const selected = event.target;
        const attempts = selected.getAttribute('data-attempts');
        const level = selected.dataset.difficulty;

        localStorage.setItem('wordleDifficulty', level);
        localStorage.setItem('wordleAttempts', attempts);
        window.location.href = 'game.html';
    });
});

// Пример использования parentNode из DOM API.
difficulty.addEventListener('mouseover', function (event) {
    if (event.target.classList.contains('difficulty-btn')) {
        event.target.parentNode.dataset.hovered = 'true';
    }
});
