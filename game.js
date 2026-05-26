const EMOTIONS = ['angry', 'happy', 'sad', 'shy', 'surprise'];

// Deck is generated ONCE on page load and reused for all restarts/mode switches
let FIXED_DECK = null;

function buildDeck() {
  const deck = [];
  EMOTIONS.forEach(e => {
    for (let i = 0; i < 4; i++) deck.push(e);
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ── Audio ──────────────────────────────────────────
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playFlip() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

function playMatch() {
  const ctx = getCtx();
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.13;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

function playRestart() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

function playWin() {
  const ctx = getCtx();
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t);
    osc.stop(t + 0.45);
  });
}

// ── Game state ─────────────────────────────────────
let flipped = [];
let matchedPairs = 0;
let moves = 0;
let locked = false;
let colorMode = false;
let allRevealed = false;

const EMOTION_CLASS = {
  happy:    'happy',
  sad:      'sad',
  angry:    'angry',
  shy:      'shy',
  surprise: 'surprise'
};

// ── Render ─────────────────────────────────────────
function renderCards() {
  if (!FIXED_DECK) FIXED_DECK = buildDeck(); // generate only once per page load
  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';
  FIXED_DECK.forEach((emotion, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.emotion = emotion;
    card.dataset.idx = idx;
    const backClass = colorMode ? EMOTION_CLASS[emotion] : '';
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="emotions/${emotion}.jpg" alt="${emotion}" draggable="false">
        </div>
        <div class="card-back ${backClass}">?</div>
      </div>`;
    card.addEventListener('click', onCardClick);
    grid.appendChild(card);
  });
}

// ── Click handler ──────────────────────────────────
function onCardClick(e) {
  const card = e.currentTarget;
  if (locked || allRevealed) return;
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;

  playFlip();
  card.classList.add('flipped');
  flipped.push(card);

  if (flipped.length === 2) {
    locked = true;
    moves++;
    document.getElementById('move-count').textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [a, b] = flipped;

  if (a.dataset.emotion === b.dataset.emotion) {
    playMatch();
    a.classList.add('matched');
    b.classList.add('matched');
    matchedPairs++;
    flipped = [];
    locked = false;
    if (matchedPairs === 10) setTimeout(showWin, 600);
  } else {
    setTimeout(() => {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      flipped = [];
      locked = false;
    }, 1000);
  }
}

// ── Win ────────────────────────────────────────────
function showWin() {
  playWin();
  document.getElementById('final-moves').textContent = moves;
  document.getElementById('win-modal').classList.remove('hidden');
}

// ── Reset (keeps same card positions) ─────────────
function resetGame() {
  playRestart();
  flipped = [];
  matchedPairs = 0;
  moves = 0;
  locked = false;
  allRevealed = false;
  document.getElementById('move-count').textContent = 0;
  document.getElementById('win-modal').classList.add('hidden');
  document.getElementById('flip-all-btn').textContent = '👁️ 모두 보기';
  renderCards();
}

// ── Flip all (color mode only) ─────────────────────
document.getElementById('flip-all-btn').addEventListener('click', () => {
  allRevealed = !allRevealed;
  const cards = document.querySelectorAll('.card:not(.matched)');
  cards.forEach(card => {
    if (allRevealed) {
      card.classList.add('flipped');
    } else {
      card.classList.remove('flipped');
    }
  });
  flipped = [];
  locked = false;
  document.getElementById('flip-all-btn').textContent = allRevealed ? '🙈 모두 숨기기' : '👁️ 모두 보기';
});

// ── Mode toggle (updates back colors in place, preserves matched state) ────
document.getElementById('mode-btn').addEventListener('click', () => {
  colorMode = !colorMode;
  document.getElementById('mode-btn').textContent = colorMode ? '🟠 기본 모드' : '🎨 색깔 모드';
  const flipBtn = document.getElementById('flip-all-btn');
  flipBtn.textContent = '👁️ 모두 보기';
  colorMode ? flipBtn.classList.remove('hidden') : flipBtn.classList.add('hidden');

  // Update back colors in place — matched cards are untouched
  document.querySelectorAll('.card').forEach(card => {
    const back = card.querySelector('.card-back');
    back.classList.remove('happy', 'sad', 'angry', 'shy', 'surprise');
    if (colorMode) back.classList.add(EMOTION_CLASS[card.dataset.emotion]);
  });

  // Cancel any in-progress flip pair but leave matched cards alone
  flipped.forEach(card => card.classList.remove('flipped'));
  flipped = [];
  locked = false;
  allRevealed = false;
});

document.getElementById('restart-btn').addEventListener('click', resetGame);
document.getElementById('play-again-btn').addEventListener('click', resetGame);

renderCards();
