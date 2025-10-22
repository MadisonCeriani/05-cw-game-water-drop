document.getElementById("start-btn").addEventListener("click", startGame);
// Game constants
const GAME_DURATION = 30; // seconds
const SPAWN_INTERVAL = 700; // ms between spawn attempts
const MIN_FALL_TIME = 3500; // ms
const MAX_FALL_TIME = 6000; // ms

// State
let score = 0;
let timeLeft = GAME_DURATION;
let running = false;
let spawnIntervalId = null;
let countdownIntervalId = null;

// Elements
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const gameContainer = document.getElementById('game-container');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Utility: random integer in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Start the game: reset state and begin spawning + countdown
function startGame() {
  if (running) return; // prevent double-start
  running = true;
  score = 0;
  timeLeft = GAME_DURATION;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');

  // Spawn drops periodically
  spawnIntervalId = setInterval(() => spawnDrop(), SPAWN_INTERVAL);

  // Start countdown timer that updates every second
  countdownIntervalId = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

// Update the water rectangle inside the can to visually reflect canFill.
// (can feature removed)

// End the game: stop timers, clear drops, and show overlay
function endGame() {
  running = false;
  clearInterval(spawnIntervalId);
  clearInterval(countdownIntervalId);
  spawnIntervalId = null;
  countdownIntervalId = null;

  // Remove remaining drops with a short fade
  const drops = Array.from(gameContainer.querySelectorAll('.drop'));
  drops.forEach(d => d.remove());

  // Show overlay with final score
  finalScoreEl.textContent = score;
  overlayTitle.textContent = timeLeft <= 0 ? "Time's up!" : "Game over";
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

// Create a single drop. Randomly decides clean vs polluted.
function spawnDrop() {
  if (!running) return;

  const wrapper = document.createElement('div');
  wrapper.classList.add('drop');

  // Decide type: clean more likely than polluted
  const isPolluted = Math.random() < 0.28; // ~28% polluted
  const img = document.createElement('img');
  img.src = isPolluted ? 'img/polluted-drop.svg' : 'img/clean-drop.svg';
  img.alt = isPolluted ? 'Polluted drop' : 'Clean drop';

  // Slight random rotation class for personality
  const rotClass = Math.random() > 0.5 ? 'rotate-1' : 'rotate-2';
  wrapper.classList.add(rotClass);

  wrapper.appendChild(img);

  // Random horizontal position inside the container
  const containerRect = gameContainer.getBoundingClientRect();
  const size = randInt(40, 68); // choose a visual size for the SVG
  img.style.width = size + 'px';
  const x = Math.random() * (containerRect.width - size - 8) + 4;
  wrapper.style.left = x + 'px';

  // Random fall duration so drops feel natural
  const fallTime = randInt(MIN_FALL_TIME, MAX_FALL_TIME);
  wrapper.style.animation = `fall ${fallTime}ms linear forwards`;

  // Click or tap to collect. Use pointerdown for responsiveness.
  const onCollect = (ev) => {
    ev.stopPropagation();
    wrapper.classList.add('collected');
    if (isPolluted) score = Math.max(-9999, score - 1);
    else score += 1;
    scoreEl.textContent = score;
    // Floating feedback
    showFloatingScore(x + size / 2, wrapper.getBoundingClientRect().top + 10, isPolluted ? '-1' : '+1', isPolluted ? '#ff6b6b' : '#1ec6ff');

    // no can logic: just update score

    setTimeout(() => wrapper.remove(), 260);
  };

  wrapper.addEventListener('pointerdown', onCollect, { once: true });

  // Remove when reaches bottom
  wrapper.addEventListener('animationend', () => wrapper.remove());

  gameContainer.appendChild(wrapper);
}

// Small helper that shows a floating +1 or -1 where the drop was collected
function showFloatingScore(x, y, text, color) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.position = 'fixed';
  el.style.left = (x - 12) + 'px';
  el.style.top = (y - 6) + 'px';
  el.style.color = color;
  el.style.fontWeight = '800';
  el.style.pointerEvents = 'none';
  el.style.transition = 'transform 700ms ease, opacity 700ms ease';
  el.style.transform = 'translateY(0px)';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = 'translateY(-40px)';
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 800);
}

// Wiring: Start and Restart buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => startGame());

// Accessibility: pressing Space/Enter while overlay focused restarts
overlay.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') startGame();
});

// Defensive: if user navigates away or resizing causes odd sizes, clear drops on large resize
window.addEventListener('resize', () => {
  // remove offscreen drops occasionally to avoid buildup
  const drops = gameContainer.querySelectorAll('.drop');
  if (drops.length > 200) drops.forEach(d => d.remove());
});
