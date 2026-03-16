(function () {
  const ROWS = 6;
  const COLS = 10;
  const SIZE = ROWS * COLS;
  const POINTS_CORRECT = 100;
  const POINTS_WRONG = -25;

  let dots = [];
  let timeouts = [];
  let cfgMinVisibleMs = 0;
  let cfgMaxVisibleMs = 0;
  let cfgMinHiddenMs = 0;
  let cfgMaxHiddenMs = 0;
  let score = 0;
  let highScore = 0;
  let bestReactionMs = null;
  let lastSquareFormedAt = null;
  let hadSquare = false;
  let gameRunning = false;

  const startScreen = document.getElementById('start-screen');
  const gameScreen = document.getElementById('game-screen');
  const gridEl = document.getElementById('grid');
  const gridContainer = document.getElementById('grid-container');
  const scoreDisplay = document.getElementById('score-display');
  const reactionDisplay = document.getElementById('reaction-display');
  const bestReactionDisplay = document.getElementById('best-reaction-display');
  const highScoreDisplay = document.getElementById('high-score-display');
  const feedbackEl = document.getElementById('feedback');
  const startBtn = document.getElementById('start-btn');
  const backBtn = document.getElementById('back-btn');

  function index(r, c) {
    return r * COLS + c;
  }

  function buildGrid() {
    gridEl.innerHTML = '';
    for (let i = 0; i < SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      const dot = document.createElement('div');
      dot.className = 'dot';
      cell.appendChild(dot);
      gridEl.appendChild(cell);
    }
  }

  function setDot(i, on) {
    if (i < 0 || i >= SIZE) return;
    if (timeouts[i]) {
      clearTimeout(timeouts[i]);
      timeouts[i] = null;
    }
    dots[i] = on;
    const cell = gridEl.children[i];
    if (cell) cell.classList.toggle('has-dot', on);
  }

  function clearAllDots() {
    for (let i = 0; i < SIZE; i++) {
      if (timeouts[i]) {
        clearTimeout(timeouts[i]);
        timeouts[i] = null;
      }
      dots[i] = false;
      const cell = gridEl.children[i];
      if (cell) cell.classList.remove('has-dot');
    }
  }

  function getAnySquare() {
    for (let r = 0; r <= ROWS - 2; r++) {
      for (let c = 0; c <= COLS - 2; c++) {
        const i00 = index(r, c);
        const i01 = index(r, c + 1);
        const i10 = index(r + 1, c);
        const i11 = index(r + 1, c + 1);
        if (dots[i00] && dots[i01] && dots[i10] && dots[i11]) {
          return { r, c };
        }
      }
    }
    return null;
  }

  function checkAndTrackSquareFormed() {
    const square = getAnySquare();
    if (square && !hadSquare) {
      lastSquareFormedAt = Date.now();
      hadSquare = true;
    }
    if (!square) hadSquare = false;
  }

  function removeSquareAt(r, c) {
    const indices = [index(r, c), index(r, c + 1), index(r + 1, c), index(r + 1, c + 1)];
    indices.forEach((i) => {
      setDot(i, false);
      scheduleNextOn(i);
    });
  }

  function highlightScoredSquare(r, c) {
    const indices = [index(r, c), index(r, c + 1), index(r + 1, c), index(r + 1, c + 1)];
    const cells = indices.map((i) => gridEl.children[i]).filter(Boolean);
    const cornerClasses = ['scored-tl', 'scored-tr', 'scored-bl', 'scored-br'];
    indices.forEach((i) => {
      if (timeouts[i]) {
        clearTimeout(timeouts[i]);
        timeouts[i] = null;
      }
      dots[i] = false;
    });
    cells.forEach((cell, idx) => cell.classList.add(cornerClasses[idx]));
    setTimeout(() => {
      cells.forEach((cell, idx) => cell.classList.remove(cornerClasses[idx]));
      indices.forEach((i) => {
        const cell = gridEl.children[i];
        if (cell) cell.classList.remove('has-dot');
        scheduleNextOn(i);
      });
    }, 400);
  }

  function scheduleNextOn(i) {
    if (!gameRunning) return;
    const delay = cfgMinHiddenMs + Math.random() * (cfgMaxHiddenMs - cfgMinHiddenMs);
    timeouts[i] = setTimeout(() => {
      timeouts[i] = null;
      if (!gameRunning) return;
      setDot(i, true);
      checkAndTrackSquareFormed();
      const visibleDuration = cfgMinVisibleMs + Math.random() * (cfgMaxVisibleMs - cfgMinVisibleMs);
      timeouts[i] = setTimeout(() => {
        timeouts[i] = null;
        if (!gameRunning) return;
        setDot(i, false);
        checkAndTrackSquareFormed();
        scheduleNextOn(i);
      }, visibleDuration);
    }, delay);
  }

  function startCellCycle(i) {
    if (!gameRunning) return;
    const initialDelay = Math.random() * (cfgMaxHiddenMs - cfgMinHiddenMs) + cfgMinHiddenMs;
    timeouts[i] = setTimeout(() => {
      timeouts[i] = null;
      if (!gameRunning) return;
      setDot(i, true);
      checkAndTrackSquareFormed();
      const visibleDuration = cfgMinVisibleMs + Math.random() * (cfgMaxVisibleMs - cfgMinVisibleMs);
      timeouts[i] = setTimeout(() => {
        timeouts[i] = null;
        if (!gameRunning) return;
        setDot(i, false);
        checkAndTrackSquareFormed();
        scheduleNextOn(i);
      }, visibleDuration);
    }, initialDelay);
  }

  function stopGame() {
    gameRunning = false;
    clearAllDots();
  }

  function showFeedback(text, isCorrect) {
    feedbackEl.textContent = text;
    feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
    feedbackEl.style.display = 'block';
    clearTimeout(feedbackEl._hide);
    feedbackEl._hide = setTimeout(() => {
      feedbackEl.style.display = 'none';
      feedbackEl.textContent = '';
    }, 1500);
  }

  function updateHud(reactionMs) {
    scoreDisplay.textContent = 'Score: ' + score;
    highScoreDisplay.textContent = 'High score: ' + highScore;
    if (reactionMs != null) {
      reactionDisplay.textContent = 'Reaction: ' + reactionMs + ' ms';
      if (bestReactionMs == null || reactionMs < bestReactionMs) {
        bestReactionMs = reactionMs;
        bestReactionDisplay.textContent = 'Best reaction: ' + bestReactionMs + ' ms';
      }
    } else {
      bestReactionDisplay.textContent = bestReactionMs != null ? 'Best reaction: ' + bestReactionMs + ' ms' : '';
    }
  }

  function onSpace() {
    if (!gameRunning) return;
    const square = getAnySquare();
    if (square) {
      const reactionMs = lastSquareFormedAt != null ? Math.round(Date.now() - lastSquareFormedAt) : null;
      score += POINTS_CORRECT;
      if (score > highScore) highScore = score;
      highlightScoredSquare(square.r, square.c);
      checkAndTrackSquareFormed();
      if (!getAnySquare()) {
        hadSquare = false;
        lastSquareFormedAt = null;
      }
      showFeedback('Correct! +' + POINTS_CORRECT + (reactionMs != null ? '  Reaction: ' + reactionMs + ' ms' : ''), true);
      updateHud(reactionMs);
    } else {
      score += POINTS_WRONG;
      showFeedback('Wrong! ' + POINTS_WRONG, false);
      updateHud(null);
    }
  }

  function onKeydown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      onSpace();
    }
  }

  startBtn.addEventListener('click', () => {
    const minVisibleS = parseFloat(document.getElementById('min-duration').value) || 1;
    const maxVisibleS = parseFloat(document.getElementById('max-duration').value) || 3;
    const minHiddenS = parseFloat(document.getElementById('min-hidden').value) || 0.5;
    const maxHiddenS = parseFloat(document.getElementById('max-hidden').value) || 2;
    cfgMinVisibleMs = Math.max(200, minVisibleS * 1000);
    cfgMaxVisibleMs = Math.max(cfgMinVisibleMs, maxVisibleS * 1000);
    cfgMinHiddenMs = Math.max(100, minHiddenS * 1000);
    cfgMaxHiddenMs = Math.max(cfgMinHiddenMs, maxHiddenS * 1000);

    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    dots = new Array(SIZE).fill(false);
    timeouts = new Array(SIZE).fill(null);
    score = 0;
    bestReactionMs = null;
    lastSquareFormedAt = null;
    hadSquare = false;
    gameRunning = true;

    clearAllDots();
    buildGrid();
    updateHud(null);
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';

    for (let i = 0; i < SIZE; i++) startCellCycle(i);
    gridContainer.focus();
  });

  backBtn.addEventListener('click', () => {
    stopGame();
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  });

  function applyInverted(inverted) {
    document.body.classList.toggle('colors-inverted', inverted);
    document.querySelectorAll('.invert-colors-btn').forEach((btn) => {
      btn.textContent = inverted ? 'Normal colors' : 'Invert colors';
    });
    try { localStorage.setItem('dotTrainingInvertColors', inverted ? '1' : '0'); } catch (_) {}
  }

  function toggleInverted() {
    const next = !document.body.classList.contains('colors-inverted');
    applyInverted(next);
  }

  document.querySelectorAll('.invert-colors-btn').forEach((btn) => {
    btn.addEventListener('click', toggleInverted);
  });

  try {
    if (localStorage.getItem('dotTrainingInvertColors') === '1') applyInverted(true);
  } catch (_) {}

  gridContainer.addEventListener('keydown', onKeydown);
  buildGrid();
})();
