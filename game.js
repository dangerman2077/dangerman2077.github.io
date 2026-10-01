const WORDS = ('арбуз белка берег бетон билет блюдо ветер вилка вишня волна ворон время гараж герой голос гроза груша дочка дождь жизнь ' +
 'завод зебра земля зерно игрок камин канал карта класс книга кошка крыша лодка малыш масло мечта мышка народ олень ответ отряд паром ' +
 'певец песня пилот плита почта право птица радио речка рубль рыбак сахар семья север слово спина стена театр улица успех холод цветы ' +
 'чашка шапка школа ягода ясень поезд лимон банан сосна ножка пятно').split(' ');
const LAYOUT = ['йцукенгшщзхъ', 'фывапролджэ', 'ячсмитьбю'];   // ЙЦУКЕН
const RANK = { absent: 1, present: 2, correct: 3 };

const app = document.getElementById('app');
const toast = document.getElementById('toast');
let screen = document.getElementById('loading'), firstShow = true, toastTimer;

const wait = ms => new Promise(r => setTimeout(r, ms));
const animEnd = el => new Promise(r => el.addEventListener('animationend', r, { once: true })); // Promise + событие анимации

function say(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
}

// Генерация интерфейса по образцу из <template>
function show(id) {
  const tpl = document.getElementById('tpl-' + id);
  const node = document.importNode(tpl.content, true).firstElementChild;
  if (firstShow) { screen.replaceWith(node); firstShow = false; }
  else app.replaceChild(node, screen);
  retribute('data-note');
      b.append(note);
      b.onclick = () => resolve({ name: b.name, title: b.dataset.title, tries: +b.dataset.tries });
    }
  });
}

/* ---------- Интерфейс 2: игра ---------- */
function score(g, s) {
  const res = Array(5).fill('absent'), left = [...s];
  for (let i = 0; i < 5; i++) if (g[i] === s[i]) { res[i] = 'correct'; left[i] = null; }
  for (let i = 0; i < 5; i++) if (res[i] !== 'correct') {
    const k = left.indexOf(g[i]);
    if (k > -1) { res[i] = 'present'; left[k] = null; }
  }
  return res;
}

function playGame(level) {
  return new Promise(resolve => {
    const tries = level.tries, secret = WORDS[Math.floor(Math.random() * WORDS.length)];
    const game = show('game');
    const board = game.querySelector('#board'), kb = game.lastElementChild;
    const info = document.createElement('p');
    info.className = 'info';
    board.before(info);

    let row = 0, cur = Array(5).fill(''), over = false, busy = false;
    const t0 = performance.now();

    // поле
    for (let r = 0; r < tries; r++) {
      const d = document.createElement('div');
      d.className = 'row';
      for (let c = 0; c < 5; c++) {
        const t = document.createElement('div');
        t.className = 'tile';
        t.dataset.col = c;
        d.appendChild(t);
      }
      board.appendChild(d);
    }
    // клавиатура
    const fnKey = (label, act) => {
      const k = document.createElement('div');
      k.className = 'key wide'; k.tabIndex = 0; k.textContent = label; k.dataset.act = act;
      return k;
    };
    LAYOUT.forEach((letters, n) => {
      const r = document.createElement('div');
      r.className = 'krow';
      for (const ch of letters) {
        const k = document.createElement('div');
        k.className = 'key'; k.tabIndex = 0; k.textContent = ch;
        k.dataset.letter = ch; k.draggable = true; k.title = 'Перетащите на клетку';
        r.appendChild(k);
      }
      if (n === 2) { r.insertBefore(fnKey('Ввод', 'enter'), r.firstChild); r.appendChild(fnKey('⌫', 'back')); }
      kb.appendChild(r);
    });

    const updateInfo = () => { info.textContent = `Попытка ${Math.min(row + 1, tries)} из ${tries}`; };
    const tiles = () => board.children[row].children;
    const tileIndex = t => (t && t.parentNode === board.children[row] ? +t.dataset.col : -1);
    const render = () => {
      const t = tiles();
      for (let i = 0; i < 5; i++) {
        t[i].textContent = cur[i];
        t[i].classList.toggle('filled', cur[i] !== '');
      }
    };
    function put(ch, i = -1) {
      if (over || busy) return;
      if (i < 0) i = cur.indexOf('');
      if (i < 0) return;
      cur[i] = ch; render();
    }
    function back() {
      if (over || busy) return;
      for (let i = 4; i >= 0; i--) if (cur[i]) { cur[i] = ''; break; }
      render();
    }
    function paintKeys(word, res) {
      [...word].forEach((ch, i) => {
        const k = kb.querySelector(`[data-letter="${ch}"]`);
        const old = k.hasAttribute('data-state') ? RANK[k.getAttribute('data-state')] : 0;
        if (RANK[res[i]] > old) k.setAttribute('data-state', res[i]);
      });
    }
    async function submit() {
      if (over || busy) return;
      if (cur.includes('')) return say('Нужно ввести 5 букв');
      busy = true;
      const word = cur.join(''), res = score(word, secret), t = tiles();
      for (let i = 0; i < 5; i++) {
        t[i].classList.add('flip');
        setTimeout(() => (t[i].dataset.state = res[i]), 180);
        await Promise.race([animEnd(t[i]), wait(600)]);
        t[i].classList.remove('flip');
      }
      paintKeys(word, res);
      busy = false;
      board.dispatchEvent(new CustomEvent('wordchecked', { bubbles: true, detail: { word, result: res } }));
    }

    /* --- пользовательские события --- */
    game.addEventListener('wordchecked', e => {
      const win = e.detail.result.every(s => s === 'correct');
      row++;
      if (win || row >= tries) game.dispatchEvent(new CustomEvent('gameover', { detail: { win } }));
      else { cur = Array(5).fill(''); updateInfo(); }
    });
    game.addEventListener('gameover', async e => {
      over = true;
      document.removeEventListener('keydown', onKey);
      kb.querySelectorAll('[draggable]').forEach(k => k.removeAttribute('draggable'));
      const time = ((e.timeStamp - t0) / 1000).toFixed(1);   // время по метке события
      await wait(800);
      resolve({ win: e.detail.win, secret, attempts: row, tries, time, level });
    });

    /* --- мышь: подсветка зелёным при наведении (всплытие, делегирование) --- */
    kb.addEventListener('mouseover', e => {
      const k = e.target.closest('.key');
      if (k) k.style.backgroundColor = '#8ce99a';
    });
    kb.addEventListener('mouseout', e => {
      const k = e.target.closest('.key');
      if (k) k.style.backgroundColor = '';
    });
    kb.addEventListener('click', e => {
      const k = e.target.closest('.key');
      if (!k) return;
      e.stopPropagation();
      if (k.dataset.act === 'enter') submit();
      else if (k.dataset.act === 'back') back();
    });
    kb.ondblclick = e => {                                   // запасной способ ввода
      const k = e.target.closest('.key[data-letter]');
      if (k) put(k.dataset.letter);
    };
    // фокус: focus/blur не всплывают, поэтому слушаем на фазе перехвата
    kb.addEventListener('focus', e => e.target.classList.add('focused'), true);
    kb.addEventListener('blur', e => e.target.classList.remove('focused'), true);

    /* --- перетаскивание (DragEvent) --- */
    kb.ondragstart = e => {
      const k = e.target.closest('.key[data-letter]');
      if (!k || over) return e.preventDefault();
      e.dataTransfer.setData('text/plain', k.dataset.letter);
      e.dataTransfer.effectAllowed = 'copy';
    };
    board.addEventListener('dragover', e => {
      e.preventDefault();                                    // разрешаем drop
      board.querySelectorAll('.over').forEach(x => x.classList.remove('over'));
      const t = e.target.closest('.tile');
      if (tileIndex(t) >= 0) t.classList.add('over');
    });
    board.addEventListener('drop', e => {
      e.preventDefault();
      board.querySelectorAll('.over').forEach(x => x.classList.remove('over'));
      put(e.dataTransfer.getData('text/plain'), tileIndex(e.target.closest('.tile')));
    });

    /* --- сенсорные события: то же перетаскивание на телефоне --- */
    let ghost = null, dragged = '';
    const moveGhost = p => { ghost.style.left = p.clientX + 'px'; ghost.style.top = p.clientY + 'px'; };
    kb.addEventListener('touchstart', e => {
      const k = e.target.closest('.key[data-letter]');
      if (!k || over) return;
      dragged = k.dataset.letter;
      ghost = document.createElement('div');
      ghost.className = 'key ghost'; ghost.textContent = dragged;
      document.body.appendChild(ghost);
      moveGhost(e.touches[0]);
    }, { passive: true });
    kb.addEventListener('touchmove', e => {
      if (!ghost) return;
      e.preventDefault();
      moveGhost(e.touches[0]);
    }, { passive: false });
    kb.addEventListener('touchend', e => {
      if (!ghost) return;
      const p = e.changedTouches[0];
      document.body.removeChild(ghost); ghost = null;
      const el = document.elementFromPoint(p.clientX, p.clientY);
      if (el && board.contains(el)) put(dragged, tileIndex(el.closest('.tile')));
    });

    /* --- физическая клавиатура --- */
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Backspace') { e.preventDefault(); back(); }
      else if (e.key.length === 1) {
        const ch = e.key.toLowerCase().replace('ё', 'е');
        if (/^[а-я]$/.test(ch)) put(ch);
        else if (/^[a-z]$/.test(ch)) say('Переключите раскладку на русскую');
      }
    }
    document.addEventListener('keydown', onKey);
    updateInfo();
  });
}

/* ---------- Интерфейс 3: результат ---------- */
function showEnd(r) {
  return new Promise(resolve => {
    const end = show('end');
    end.dataset.result = r.win ? 'win' : 'lose';
    end.querySelector('#endTitle').textContent = r.win ? 'Победа!' : 'Поражение';
    const text = end.querySelector('#endText');
    text.innerText = r.win
      ? `Слово «${r.secret.toUpperCase()}» отгадано за ${r.attempts} из ${r.tries} попыток.`
      : `Попытки закончились. Загаданное слово: «${r.secret.toUpperCase()}».`;
    const stat = document.createElement('p');
    stat.textContent = `Сложность: ${r.level.title}. Время: ${r.time} с.`;
    text.after(stat);
    end.querySelector('[name=again]').onclick = () => resolve('again');
    end.querySelector('[name=menu]').onclick = () => resolve('menu');
  });
}

// Фокус окна: non-user событие, вешаем через on*-свойства
window.onblur = () => { document.title = 'Пауза…'; };
window.onfocus = () => { document.title = 'Слово'; };

(async function main() {
  for (;;) {
    const level = await showMenu();
    let again;
    do {
      const result = await playGame(level);
      again = (await showEnd(result)) === 'again';
    } while (again);
  }
})();
