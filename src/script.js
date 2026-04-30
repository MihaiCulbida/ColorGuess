function randomHSL() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(50 + Math.random() * 30);
  const l = Math.floor(45 + Math.random() * 20);
  return { h, s, l };
}

async function getColorName(h, s, l) {
  const res = await fetch(`https://www.thecolorapi.com/id?hsl=hsl(${h},${s}%,${l}%)`);
  const data = await res.json();
  return data.name.value;
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const DURATIONS = { 0: 5000, 1: 3000, 2: 1000 };
let currentDifficulty = 0;

const thumb = document.getElementById('difficultyThumb');
const label = document.getElementById('difficultyLabel');
const dots = document.querySelectorAll('.difficulty-dot');
const THUMB_POSITIONS = [4, 21, 39];

function setDifficulty(index) {
  currentDifficulty = index;
  thumb.style.left = THUMB_POSITIONS[index] + 'px';
  label.textContent = DIFFICULTIES[index];
  dots.forEach((dot, i) => {
    dot.style.opacity = i === index ? '0' : '1';
  });
}

document.getElementById('difficultyTrack').addEventListener('click', () => {
  setDifficulty((currentDifficulty + 1) % 3);
});

requestAnimationFrame(() => setDifficulty(0));

const gameModeBtn = document.getElementById('gameModeBtn');
const gameModePopup = document.getElementById('gameModePopup');
const attemptsSlider = document.getElementById('attemptsSlider');
const attemptsValue = document.getElementById('attemptsValue');
const noLimitsCheck = document.getElementById('noLimitsCheck');

let noLimits = false;

gameModeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  gameModePopup.classList.toggle('visible');
});

document.addEventListener('click', (e) => {
  if (!gameModePopup.contains(e.target) && e.target !== gameModeBtn) {
    gameModePopup.classList.remove('visible');
  }
});

attemptsSlider.addEventListener('input', () => {
  attemptsValue.textContent = attemptsSlider.value;
});

noLimitsCheck.addEventListener('click', () => {
  noLimits = !noLimits;
  noLimitsCheck.classList.toggle('checked', noLimits);
  attemptsSlider.disabled = noLimits;
  attemptsValue.style.opacity = noLimits ? '0.3' : '1';
});

const card = document.querySelector('.card');
const cardTop = document.querySelector('.card-top');
const cardFooter = document.querySelector('.card-footer');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function hslStr({ h, s, l }) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

async function showCountdownWord(text, color) {
  card.style.transition = 'background 0.5s ease';
  card.style.background = color;

  const el = document.getElementById('countdownWord');
  el.textContent = text;
  el.classList.add('visible');

  await sleep(900);

  el.classList.remove('visible');
  await sleep(300);
}

async function showColorRound(duration) {
  const color = randomHSL();
  card.style.transition = 'background 0.5s ease';
  card.style.background = hslStr(color);

  const cornerTimer = document.getElementById('cornerTimer');
  const timerSeconds = document.getElementById('timerSeconds');
  const timerMillis = document.getElementById('timerMillis');

  cornerTimer.style.display = 'flex';

  let lastSec = Math.floor(duration / 1000);
  timerSeconds.textContent = lastSec;

  const start = performance.now();
  let rafId;

  function animateSecondChange(newVal) {
    timerSeconds.style.transition = 'none';
    timerSeconds.style.opacity = '1';
    timerSeconds.style.transform = 'translateY(0)';

    // slide out down
    timerSeconds.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    timerSeconds.style.opacity = '0';
    timerSeconds.style.transform = 'translateY(16px)';

    setTimeout(() => {
      timerSeconds.textContent = newVal;
      timerSeconds.style.transition = 'none';
      timerSeconds.style.opacity = '0';
      timerSeconds.style.transform = 'translateY(-16px)';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          timerSeconds.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          timerSeconds.style.opacity = '1';
          timerSeconds.style.transform = 'translateY(0)';
        });
      });
    }, 210);
  }

  function tick() {
    const elapsed = performance.now() - start;
    const remaining = Math.max(0, duration - elapsed);
    const secs = Math.floor(remaining / 1000);
    const ms = Math.floor((remaining % 1000) / 10);

    if (secs !== lastSec) {
      lastSec = secs;
      animateSecondChange(secs);
    }

    timerMillis.textContent = ms.toString().padStart(2, '0');

    if (remaining > 0) rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  await sleep(duration);

  cancelAnimationFrame(rafId);
  cornerTimer.style.display = 'none';
  timerSeconds.style.transition = 'none';
  timerSeconds.style.opacity = '1';
  timerSeconds.style.transform = 'translateY(0)';
  card.style.transition = 'background 0.8s ease';
  card.style.background = '#0c0c0e';
  await sleep(800);
}

document.getElementById('startBtn').addEventListener('click', async () => {
  cardTop.style.transition = 'opacity 0.35s ease';
  cardFooter.style.transition = 'opacity 0.35s ease';
  cardTop.style.opacity = '0';
  cardFooter.style.opacity = '0';

  const roundCounter = document.getElementById('roundCounter');
const totalAttempts = noLimits ? null : parseInt(attemptsSlider.value);
let currentRound = 1;

if (totalAttempts) {
  roundCounter.textContent = `${currentRound}/${totalAttempts}`;
} else {
  roundCounter.textContent = '';
}

  await sleep(350);

  cardTop.style.display = 'none';
  cardFooter.style.display = 'none';

  const overlay = document.getElementById('gameOverlay');
  overlay.style.display = 'flex';

  await showCountdownWord('ready', hslStr(randomHSL()));
  await showCountdownWord('set', hslStr(randomHSL()));
  await showCountdownWord('go', hslStr(randomHSL()));
  await showColorRound(DURATIONS[currentDifficulty]);
});