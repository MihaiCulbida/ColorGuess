function randomHSL() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(50 + Math.random() * 30);
  const l = Math.floor(45 + Math.random() * 20);
  return { h, s, l };
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
  const rect = gameModeBtn.getBoundingClientRect();
  gameModePopup.style.left = rect.left + 'px';
  gameModePopup.style.top = (rect.top - gameModePopup.offsetHeight - 14) + 'px';
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
  const [h, s, l] = color.match(/\d+/g).map(Number);
  updateCounterColor(h, s, l);

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
  updateCounterColor(color.h, color.s, color.l);

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
    if (secs !== lastSec) { lastSec = secs; animateSecondChange(secs); }
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
  card.style.transition = 'background 0.4s ease';
  card.style.background = '#0c0c0e';
  updateCounterColor(0, 0, 10);

  await sleep(400);

  hS.value = 180; sS.value = 60; lS.value = 50;
  buildHueBg(); updateSliders(); updateThumbs();

  document.getElementById('roundCounter').classList.add('shifted');

  hslPanel.style.display = 'flex';
  hslPanel.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hslPanel.style.opacity = '1';
  }));
}

document.getElementById('startBtn').addEventListener('click', async () => {
  cardTop.style.transition = 'opacity 0.35s ease';
  cardFooter.style.transition = 'opacity 0.35s ease';
  cardTop.style.opacity = '0';
  cardFooter.style.opacity = '0';

  const roundCounter = document.getElementById('roundCounter');
  const totalAttempts = noLimits ? null : parseInt(attemptsSlider.value);
  let currentRound = 1;
  roundCounter.textContent = totalAttempts ? `${currentRound}/${totalAttempts}` : '';
  roundCounter.classList.remove('shifted');

  await sleep(350);
  cardTop.style.display = 'none';
  cardFooter.style.display = 'none';

  document.getElementById('gameOverlay').style.display = 'flex';

  await showCountdownWord('ready', hslStr(randomHSL()));
  await showCountdownWord('set', hslStr(randomHSL()));
  await showCountdownWord('go', hslStr(randomHSL()));
  await showColorRound(DURATIONS[currentDifficulty]);
});

const hS = document.getElementById('hS');
const sS = document.getElementById('sS');
const lS = document.getElementById('lS');
const hBg = document.getElementById('hBg');
const sBg = document.getElementById('sBg');
const lBg = document.getElementById('lBg');
const hslPanel = document.getElementById('hslPanel');
const hThumb = document.getElementById('hThumb');
const sThumb = document.getElementById('sThumb');
const lThumb = document.getElementById('lThumb');

function vals() {
  return { h: +hS.value, s: +sS.value, l: +lS.value };
}

function buildHueBg() {
  const stops = [];
  for (let i = 0; i <= 360; i += 6) stops.push(`hsl(${i},85%,58%)`);
  hBg.style.background = `linear-gradient(to top,${stops.join(',')})`;
}

function updateSliders() {
  const { h, s, l } = vals();
  sBg.style.background = `linear-gradient(to top, hsl(${h},0%,50%), hsl(${h},100%,50%))`;
  lBg.style.background = `linear-gradient(to top, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},0%,100%))`;
}

function positionThumb(slider, thumbEl) {
  const min = +slider.min;
  const max = +slider.max;
  const pct = (+slider.value - min) / (max - min);
  const cardH = 430;
  const thumbR = 10;
  thumbEl.style.top = (cardH - pct * cardH - thumbR) + 'px';
}
function updateThumbs() {
  positionThumb(hS, hThumb);
  positionThumb(sS, sThumb);
  positionThumb(lS, lThumb);
}

function mapL(v) {
  if (v <= 50) return (v - 12) / (50 - 12) * 50;
  return 50 + (v - 50) / (88 - 50) * 50;
}

function mapS(v) {
  return (v - 20) / (95 - 20) * 100;
}

function update() {
  updateSliders();
  updateThumbs();
  const { h, s, l } = vals();
  card.style.transition = 'none';
  card.style.background = `hsl(${h},${s}%,${l}%)`;
  updateCounterColor(h, s, l);
  updateGameBtnColors(h, s, l);  
}

function updateCounterColor(h, s, l) {
  const roundCounter = document.getElementById('roundCounter');
  if (l > 55) {
    roundCounter.style.color = `hsla(${h},${Math.max(s-20,0)}%,25%,0.5)`;
  } else {
    roundCounter.style.color = `hsla(${h},${Math.max(s-20,0)}%,85%,0.5)`;
  }
}

buildHueBg();
updateSliders();
updateThumbs();

[hS, sS, lS].forEach(r => r.addEventListener('input', update));

let labelTimeout;

function showSliderLabel(text) {
  let label = document.getElementById('sliderLabel');
  if (!label) {
    label = document.createElement('div');
    label.id = 'sliderLabel';
    document.querySelector('.hsl-panel').appendChild(label);
  }
  label.textContent = text;
  label.style.opacity = '1';
  clearTimeout(labelTimeout);
  labelTimeout = setTimeout(() => { label.style.opacity = '0'; }, 1500);

  const { h, s, l } = vals();
  const cardL = mapL(l);
  const cardS = mapS(s);
  if (cardL > 55) {
    label.style.color = `hsla(${h},${Math.max(cardS-20,0)}%,25%,0.4)`;
  } else {
    label.style.color = `hsla(${h},${Math.max(cardS-20,0)}%,85%,0.4)`;
  }
}

[hS, sS, lS].forEach(r => r.addEventListener('input', update));
hS.addEventListener('input', () => showSliderLabel('HUE'));
sS.addEventListener('input', () => showSliderLabel('SATURATION'));
lS.addEventListener('input', () => showSliderLabel('BRIGHTNESS'))

function calcScore(orig, guess) {
  const dH = Math.min(Math.abs(orig.h - guess.h), 360 - Math.abs(orig.h - guess.h));
  const dS = Math.abs(orig.s - guess.s);
  const dL = Math.abs(orig.l - guess.l);
  const nH = dH / 180;
  const nS = dS / 100;
  const nL = dL / 100;
  const dist = (Math.pow(nH, 1.4) * 0.65 + Math.pow(nS, 1.4) * 0.20 + Math.pow(nL, 1.4) * 0.15);
  const score = Math.max(0, 1 - Math.pow(dist, 0.5)) * 10;

  return Math.round(score * 100) / 100;
}

let trainingColor = null;

function getAdaptiveColor(h, s, l, opacity = 1) {
  if (l > 55) {
    return `hsla(${h}, ${Math.max(s - 20, 0)}%, 15%, ${opacity})`;
  } else {
    return `hsla(${h}, ${Math.max(s - 20, 0)}%, 85%, ${opacity})`;
  }
}

  function animateScore(targetScore) {
  const el = document.getElementById('resultScore');
  const duration = 800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * targetScore;
    el.textContent = current.toFixed(2);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = targetScore.toFixed(2);
  }

  requestAnimationFrame(tick);
}

function showResultScreen(original, guess) {
  const score = calcScore(original, guess);
  const panel = document.getElementById('resultPanel');

  document.getElementById('resultGuessColor').style.background = hslStr(guess);
  document.getElementById('resultGuessLabel').textContent = `H${guess.h} S${guess.s} B${guess.l}`;
  document.getElementById('resultOriginalColor').style.background = hslStr(original);
  document.getElementById('resultOriginalLabel').textContent = `H${original.h} S${original.s} B${original.l}`;

  const topColor = getAdaptiveColor(guess.h, guess.s, guess.l);
  const topColorFaded = getAdaptiveColor(guess.h, guess.s, guess.l, 0.5);
  const topBorder = getAdaptiveColor(guess.h, guess.s, guess.l, 0.18);

  document.getElementById('resultScore').style.color = topColor;
  document.getElementById('resultGuessColor').querySelector('.result-color-sublabel').style.color = topColorFaded;
  document.getElementById('resultGuessColor').querySelector('.result-color-values').style.color = topColor;

  const botColor = getAdaptiveColor(original.h, original.s, original.l);
  const botColorFaded = getAdaptiveColor(original.h, original.s, original.l, 0.5);
  const botBorder = getAdaptiveColor(original.h, original.s, original.l, 0.18);

  document.getElementById('resultOriginalColor').querySelector('.result-color-sublabel').style.color = botColorFaded;
  document.getElementById('resultOriginalColor').querySelector('.result-color-values').style.color = botColor;

  const nextBtn = document.getElementById('resultNextBtn');
  nextBtn.style.borderColor = botBorder;
  nextBtn.style.background = getAdaptiveColor(original.h, original.s, original.l, 0.12);
  nextBtn.querySelector('img').style.filter = original.l > 55 ? 'invert(0)' : 'invert(1)';

  panel.style.display = 'flex';
  panel.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.style.opacity = '1';
  }));
  setTimeout(() => animateScore(score), 400);
  hslPanel.style.display = 'none';
  document.getElementById('toggleViewBtn').style.display = 'none';
  document.getElementById('submitBtn').style.display = 'none';

  card.style.transition = 'background 0.4s ease';
  card.style.background = '#0c0c0e';
}

const submitBtn = document.getElementById('submitBtn');

submitBtn.addEventListener('click', () => {
  if (!trainingColor) return;
  const guess = vals();
  showResultScreen(trainingColor, guess);
});

document.getElementById('resultNextBtn').addEventListener('click', () => {
  const panel = document.getElementById('resultPanel');
  panel.style.opacity = '0';
  setTimeout(() => {
    panel.style.display = 'none';
    startTraining();
  }, 400);
});

async function startTraining() {
  trainingColor = randomHSL();
  card.style.transition = 'background 0.5s ease';
  card.style.background = hslStr(trainingColor);
  updateCounterColor(trainingColor.h, trainingColor.s, trainingColor.l);
  await sleep(2000);

  card.style.transition = 'background 0.4s ease';
  card.style.background = '#0c0c0e';
  updateCounterColor(0, 0, 10);
  await sleep(400);

  hS.value = 180; sS.value = 60; lS.value = 50;
  buildHueBg(); updateSliders(); updateThumbs();

  const roundCounter = document.getElementById('roundCounter');
  roundCounter.textContent = '';
  roundCounter.classList.add('shifted');
  hslPanel.style.display = 'flex';
  hslPanel.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hslPanel.style.opacity = '1';
  }));

  submitBtn.style.display = 'flex';
  showToggleBtn(trainingColor);
}

const trainingBtn = document.getElementById('trainingBtn');
trainingBtn.addEventListener('click', async () => {
  cardTop.style.transition = 'opacity 0.35s ease';
  cardFooter.style.transition = 'opacity 0.35s ease';
  cardTop.style.opacity = '0';
  cardFooter.style.opacity = '0';

  await sleep(350);
  cardTop.style.display = 'none';
  cardFooter.style.display = 'none';

  document.getElementById('gameOverlay').style.display = 'flex';

  await startTraining();
});

const toggleViewBtn = document.getElementById('toggleViewBtn');
let showingAnswer = false;

function updateGameBtnColors(h, s, l) {
  const adaptive = getAdaptiveColor(h, s, l, 0.12);
  const adaptiveBorder = getAdaptiveColor(h, s, l, 0.18);
  const imgFilter = l > 55 ? 'invert(0)' : 'invert(1)';
  const toggleBtn = document.getElementById('toggleViewBtn');
  toggleBtn.style.background = adaptive;
  toggleBtn.style.borderColor = adaptiveBorder;
  toggleBtn.querySelector('img').style.filter = imgFilter;
  const subBtn = document.getElementById('submitBtn');
  subBtn.style.background = adaptive;
  subBtn.style.borderColor = adaptiveBorder;
  subBtn.querySelector('img').style.filter = imgFilter;
}



function showToggleBtn(color) {
  toggleViewBtn.style.display = 'flex';
  showingAnswer = false;
  updateGameBtnColors(+hS.value, +sS.value, +lS.value);

  toggleViewBtn.onclick = () => {
    showingAnswer = !showingAnswer;

    if (showingAnswer) {
      hslPanel.style.opacity = '0';
      submitBtn.style.opacity = '0';
      setTimeout(() => {
        hslPanel.style.display = 'none';
        submitBtn.style.display = 'none';
        card.style.transition = 'background 0.4s ease';
        card.style.background = hslStr(color);
        updateCounterColor(color.h, color.s, color.l);
        updateGameBtnColors(color.h, color.s, color.l);
      }, 400);
    } else {
      card.style.transition = 'background 0.4s ease';
      card.style.background = `hsl(${hS.value},${sS.value}%,${lS.value}%)`;
      updateCounterColor(+hS.value, +sS.value, +lS.value);
      updateGameBtnColors(+hS.value, +sS.value, +lS.value);
      hslPanel.style.display = 'flex';
      submitBtn.style.display = 'flex';
      submitBtn.style.opacity = '1';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        hslPanel.style.opacity = '1';
      }));
    }
  };
}