const EMOTIONS = ['angry', 'happy', 'sad', 'shy', 'surprise'];

// Build a shuffled deck of 20 cards (each emotion x4 = 10 pairs)
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

// ── Render ─────────────────────────────────────────
function renderCards() {
  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';
  buildDeck().forEach((emotion, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.emotion = emotion;
    card.dataset.idx = idx;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="emotions/${emotion}.jpg" alt="${emotion}" draggable="false">
        </div>
        <div class="card-back">?</div>
      </div>`;
    card.addEventListener('click', onCardClick);
    grid.appendChild(card);
  });
}

// ── Click handler ──────────────────────────────────
function onCardClick(e) {
  const card = e.currentTarget;
  if (locked) return;
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

// ── Reset ──────────────────────────────────────────
function resetGame() {
  playRestart();
  flipped = [];
  matchedPairs = 0;
  moves = 0;
  locked = false;
  document.getElementById('move-count').textContent = 0;
  document.getElementById('win-modal').classList.add('hidden');
  renderCards();
}

document.getElementById('restart-btn').addEventListener('click', resetGame);
document.getElementById('play-again-btn').addEventListener('click', resetGame);

renderCards();
