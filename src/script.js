function randomHSL() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(50 + Math.random() * 40);
  const l = Math.floor(45 + Math.random() * 40);
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

document.getElementById('difficultyLabel').addEventListener('click', () => {
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
  await sleep(650);
  el.classList.remove('visible');
  await sleep(200);
}

let currentGameColor = null;
let currentRound = 1;
let gameTotalAttempts = null;
let gameResultNextAction = null;
let roundScores = [];
let roundColors = [];
let isSubmitting = false;
let isGameRunning = false;

function getScorePhrase(score) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (score === 10) return pick(["Impossible.", "Are you cheating?", "Pixel perfect.", "That's not human."]);
  if (score >= 9.8) return pick(["Essentially perfect.", "Frighteningly accurate.", "Your eyes are calibrated.", "That's unsettling.", "Save this screenshot."]);
  if (score >= 9.5) return pick(["Uncanny.", "You barely missed.", "Almost doesn't cover it.", "One step from perfect.", "Your retinas are lying."]);
  if (score >= 9.0) return pick(["Really sharp.", "You have a good eye.", "Dialed in.", "Colour-blind people hate you.", "Close enough to hurt."]);
  if (score >= 8.5) return pick(["Solid.", "You're getting it.", "Nearly there.", "A squint away from perfect.", "Strong effort."]);
  if (score >= 8.0) return pick(["Good eye.", "Above average, clearly.", "You've done this before.", "Respectable.", "That's a good guess."]);
  if (score >= 7.5) return pick(["Not bad.", "Closer than it looks.", "You felt it.", "Decent instinct.", "Your eyes are warming up."]);
  if (score >= 7.0) return pick(["Pretty close.", "In the right zone.", "Getting warmer.", "Almost on it."]);
  if (score >= 6.0) return pick(["Okay.", "Not embarrassing.", "You tried.", "Average at best.", "Right vibe, wrong color, wrong shade, wrong planet."]);
  if (score >= 5.0) return pick(["Middling.", "You were in the neighbourhood.", "Could be worse.", "Not your best work."]);
  if (score >= 4.0) return pick(["Off.", "You guessed, didn't you?", "The hue was a stretch.", "Questionable.", "Somewhere in the ballpark."]);
  if (score >= 3.0) return pick(["Wide of the mark.", "Were you even looking?", "Bold choice.", "That's a different colour.", "Room to improve is an understatement."]);
  if (score >= 2.0) return pick(["Yikes.", "That was brave.", "Interesting interpretation.", "Try again.", "The colour disagreed with you."]);
  if (score >= 1.0) return pick(["Oh.", "We don't talk about this one.", "A valiant failure.", "Colours are hard, apparently.", "The colour had other plans."]);
  return pick(["0 doesn't exist, yet here we are.", "Impressive, in a bad way.", "That was something.", "Did you close your eyes?", "Back to basics."]);
}

async function showColorRound(duration) {
  const color = randomHSL();
  currentGameColor = color;

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

  const rc = document.getElementById('roundCounter');
  rc.classList.add('shifted');

  hslPanel.style.display = 'flex';
  hslPanel.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hslPanel.style.opacity = '1';
  }));

  submitBtn.style.display = 'flex';
  submitBtn.style.opacity = '1';
  updateGameBtnColors(+hS.value, +sS.value, +lS.value);
  document.getElementById('toggleViewBtn').style.display = 'none';
}

document.getElementById('startBtn').addEventListener('click', async () => {
  if (isGameRunning) return;
  isGameRunning = true;
  cardTop.style.transition = 'opacity 0.35s ease';
  cardFooter.style.transition = 'opacity 0.35s ease';
  cardTop.style.opacity = '0';
  cardFooter.style.opacity = '0';

  gameTotalAttempts = noLimits ? null : parseInt(attemptsSlider.value);
  currentRound = 1;
  roundScores = [];
  roundColors = [];

  const roundCounter = document.getElementById('roundCounter');
  roundCounter.textContent = gameTotalAttempts ? `${currentRound}/${gameTotalAttempts}` : '';
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

function hslToXyz(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  let r = f(0), g = f(8), b = f(4);
  [r, g, b] = [r, g, b].map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
  ];
}

function xyzToLab(x, y, z) {
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x / 0.9505);
  const fy = f(y / 1.0000);
  const fz = f(z / 1.0890);
  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz),
  ];
}

function hslToLab(h, s, l) {
  return xyzToLab(...hslToXyz(h, s, l));
}

function ciede2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const avg_L = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  const avg_C = (C1 + C2) / 2;
  const C7 = avg_C ** 7;
  const G = 0.5 * (1 - Math.sqrt(C7 / (C7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
  const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);
  const h1p = (Math.atan2(b1, a1p) * 180 / Math.PI + 360) % 360;
  const h2p = (Math.atan2(b2, a2p) * 180 / Math.PI + 360) % 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp;
  if (C1p * C2p === 0) dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
  else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
  else dhp = h2p - h1p + 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
  const avg_Lp = (L1 + L2) / 2;
  const avg_Cp = (C1p + C2p) / 2;
  let avg_hp;
  if (C1p * C2p === 0) avg_hp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) avg_hp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) avg_hp = (h1p + h2p + 360) / 2;
  else avg_hp = (h1p + h2p - 360) / 2;
  const T = 1
    - 0.17 * Math.cos((avg_hp - 30) * Math.PI / 180)
    + 0.24 * Math.cos(2 * avg_hp * Math.PI / 180)
    + 0.32 * Math.cos((3 * avg_hp + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * avg_hp - 63) * Math.PI / 180);
  const SL = 1 + 0.015 * (avg_Lp - 50) ** 2 / Math.sqrt(20 + (avg_Lp - 50) ** 2);
  const SC = 1 + 0.045 * avg_Cp;
  const SH = 1 + 0.015 * avg_Cp * T;
  const avg_Cp7 = avg_Cp ** 7;
  const RC = 2 * Math.sqrt(avg_Cp7 / (avg_Cp7 + 25 ** 7));
  const d_theta = 30 * Math.exp(-Math.pow((avg_hp - 275) / 25, 2));
  const RT = -Math.sin(2 * d_theta * Math.PI / 180) * RC;
  return Math.sqrt(
    (dLp / SL) ** 2 +
    (dCp / SC) ** 2 +
    (dHp / SH) ** 2 +
    RT * (dCp / SC) * (dHp / SH)
  );
}

function calcScore(orig, guess) {
  const lab1 = hslToLab(orig.h, orig.s, orig.l);
  const lab2 = hslToLab(guess.h, guess.s, guess.l);
  const dE = ciede2000(lab1, lab2);

  const base = 10 / (1 + Math.pow(dE / 25.25, 1.55));

  const dH = Math.min(Math.abs(orig.h - guess.h), 360 - Math.abs(orig.h - guess.h));
  const avgSat = (orig.s + guess.s) / 2;

  const hueAccuracy = Math.max(0, 1 - Math.pow(dH / 25, 1.5));
  const satWeightRec = Math.min(1, avgSat / 30);
  const recovery = (10 - base) * hueAccuracy * satWeightRec * 0.25;

  const huePenFactor = Math.max(0, (dH - 30) / 150);
  const satWeightPen = Math.min(1, avgSat / 40);
  const penalty = base * huePenFactor * satWeightPen * 0.15;

  const final = Math.max(0, Math.min(10, base + recovery - penalty));
  return Math.round(final * 100) / 100;
}

let trainingColor = null;

function getAdaptiveColor(h, s, l, opacity = 1) {
  if (l > 55) {
    return `hsla(${h}, ${Math.max(s - 20, 0)}%, 15%, ${opacity})`;
  } else {
    return `hsla(${h}, ${Math.max(s - 20, 0)}%, 85%, ${opacity})`;
  }
}

function animateScore(targetScore, onComplete) {
  const el = document.getElementById('resultScore');
  const duration = 800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * targetScore;
    el.textContent = current.toFixed(2);
    if (progress < 1) requestAnimationFrame(tick);
    else {
      el.textContent = targetScore.toFixed(2);
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(tick);
}

function showResultScreen(original, guess, showPhrase) {
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

  const phraseEl = document.getElementById('resultScorePhrase');
  if (showPhrase) {
    phraseEl.textContent = getScorePhrase(score);
    phraseEl.style.opacity = '0';
    phraseEl.style.transform = 'translateY(-8px)';
    phraseEl.style.display = 'block';
  } else {
    phraseEl.style.display = 'none';
  }

  const botColor = getAdaptiveColor(original.h, original.s, original.l);
  const botColorFaded = getAdaptiveColor(original.h, original.s, original.l, 0.5);
  const botBorder = getAdaptiveColor(original.h, original.s, original.l, 0.18);

  document.getElementById('resultOriginalColor').querySelector('.result-color-sublabel').style.color = botColorFaded;
  document.getElementById('resultOriginalColor').querySelector('.result-color-values').style.color = botColor;

  const nextBtn = document.getElementById('resultNextBtn');
  nextBtn.style.borderColor = botBorder;
  nextBtn.style.background = getAdaptiveColor(original.h, original.s, original.l, 0.12);
  nextBtn.querySelector('img').style.filter = original.l > 55 ? 'invert(0)' : 'invert(1)';

  const rc = document.getElementById('roundCounter');
  rc.style.zIndex = '40';
  rc.classList.remove('shifted');

  panel.style.display = 'flex';
  panel.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.style.opacity = '1';
  }));
   setTimeout(() => animateScore(score, () => {
    phraseEl.style.opacity = '1';
    phraseEl.style.transform = 'translateY(0)';
  }), 400);
  hslPanel.style.display = 'none';
  document.getElementById('toggleViewBtn').style.display = 'none';
  document.getElementById('submitBtn').style.display = 'none';

  card.style.transition = 'background 0.4s ease';
  card.style.background = '#0c0c0e';
  isSubmitting = false;
}

const submitBtn = document.getElementById('submitBtn');

submitBtn.addEventListener('click', () => {
  if (isSubmitting) return;
  isSubmitting = true;
  const guess = vals();

  if (currentGameColor) {
    const isLastRound = gameTotalAttempts !== null && currentRound >= gameTotalAttempts;
    gameResultNextAction = isLastRound ? 'end' : 'next';
    roundScores.push(calcScore(currentGameColor, guess));
    roundColors.push({ original: currentGameColor, guess });
    showResultScreen(currentGameColor, guess, true);
    currentGameColor = null;
    return;
  }

  if (trainingColor) {
    gameResultNextAction = 'training';
    showResultScreen(trainingColor, guess, false);
  }
});

document.getElementById('resultNextBtn').addEventListener('click', async () => {
  if (isSubmitting) return;
  isSubmitting = true;

  const panel = document.getElementById('resultPanel');
  panel.style.opacity = '0';
  await sleep(400);
  panel.style.display = 'none';

  if (gameResultNextAction === 'training') {
    isSubmitting = false;
    startTraining();
  } else if (gameResultNextAction === 'next') {
    currentRound++;
    const roundCounter = document.getElementById('roundCounter');
    roundCounter.style.transition = 'none';
    roundCounter.classList.remove('shifted');
    roundCounter.textContent = gameTotalAttempts ? `${currentRound}/${gameTotalAttempts}` : '';
    roundCounter.style.zIndex = '10';
    requestAnimationFrame(() => { roundCounter.style.transition = ''; });
    isSubmitting = false;
    await showCountdownWord('ready', hslStr(randomHSL()));
    await showCountdownWord('set', hslStr(randomHSL()));
    await showCountdownWord('go', hslStr(randomHSL()));
    await showColorRound(DURATIONS[currentDifficulty]);
  } else if (gameResultNextAction === 'end') {
    isSubmitting = false;
    showSummaryScreen();
  }
});


function getFinalPhrase(pct) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (pct >= 98) return pick(["You might actually be a monitor.", "Suspiciously good.", "We're checking for cheats.", "Inhuman precision."]);
  if (pct >= 90) return pick(["Exceptional. Genuinely.", "Your eyes are a weapon.", "Top tier colour instinct.", "Almost unsettling how good that was."]);
  if (pct >= 80) return pick(["Really strong overall.", "You clearly have an eye for this.", "Solid session.", "Above average doesn't cut it — that was great."]);
  if (pct >= 70) return pick(["Good, not great.", "Respectable. Room to grow.", "You're getting there.", "Fine dining at Applebee's."]);
  if (pct >= 60) return pick(["Decent enough.", "Average with flashes of brilliance.", "Some good, some rough.", "Could be worse. Could be better."]);
  if (pct >= 50) return pick(["Right down the middle.", "Perfectly mediocre.", "Exactly half of what's possible.", "The definition of average."]);
  if (pct >= 35) return pick(["Below average, but you tried.", "The colours weren't cooperating.", "Rough session.", "There's nowhere to go but up."]);
  if (pct >= 20) return pick(["That was a struggle.", "The colours won this time.", "Maybe try training mode first.", "Bold attempt."]);
  return pick(["We don't talk about this.", "Did you play with your eyes closed?", "Impressively bad.", "Back to basics."]);
}

function showSummaryScreen() {
  const total = roundScores.reduce((a, b) => a + b, 0);
  const maxScore = gameTotalAttempts * 10;
  const pct = (total / maxScore) * 100;
  const overlay = document.getElementById('gameOverlay');
  const existing = document.getElementById('summaryPanel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'summaryPanel';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'summary-close-btn';
  closeBtn.innerHTML = '<img src="img/close.png">';
  const resetOverlay = () => {
    isGameRunning = false;
    panel.style.opacity = '0';
    setTimeout(() => {
      panel.remove();
      overlay.style.display = 'none';
      const rc = document.getElementById('roundCounter');
      rc.textContent = '';
      rc.classList.remove('shifted');
      rc.style.zIndex = '10';
      card.style.transition = 'background 0.4s ease';
      card.style.background = '#0c0c0e';
      cardTop.style.display = 'flex';
      cardFooter.style.display = 'flex';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        cardTop.style.opacity = '1';
        cardFooter.style.opacity = '1';
      }));
    }, 400);
  };
  closeBtn.addEventListener('click', resetOverlay);

  const scoreRow = document.createElement('div');
  scoreRow.className = 'summary-score-row';
  const scoreTotalEl = document.createElement('span');
  scoreTotalEl.className = 'summary-score-total';
  scoreTotalEl.textContent = '0';
  const scoreMaxEl = document.createElement('span');
  scoreMaxEl.className = 'summary-score-max';
  scoreMaxEl.textContent = '/' + maxScore;
  scoreRow.appendChild(scoreTotalEl);
  scoreRow.appendChild(scoreMaxEl);
  const phraseEl = document.createElement('p');
  phraseEl.className = 'summary-phrase';
  phraseEl.textContent = getFinalPhrase(pct);
  const colorsGrid = document.createElement('div');
  colorsGrid.className = 'summary-colors-grid';
  const cellSize = 72;

  roundColors.forEach((entry, i) => {
    const cell = document.createElement('div');
    cell.className = 'summary-color-cell';
    cell.style.setProperty('--cell-size', cellSize + 'px');

    const origHalf = document.createElement('div');
    origHalf.className = 'orig-half';
    origHalf.style.background = hslStr(entry.original);

    const guessHalf = document.createElement('div');
    guessHalf.className = 'guess-half';
    guessHalf.style.background = hslStr(entry.guess);

    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'cell-score';
    scoreLabel.style.color = entry.original.l > 55 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)';
    scoreLabel.textContent = roundScores[i].toFixed(2);

    cell.appendChild(origHalf);
    cell.appendChild(guessHalf);
    cell.appendChild(scoreLabel);
    colorsGrid.appendChild(cell);
  });

  const playAgainBtn = document.createElement('button');
  playAgainBtn.className = 'summary-play-again-btn';
  playAgainBtn.textContent = 'Play again';
  playAgainBtn.addEventListener('click', async () => {
  isGameRunning = false
  panel.style.opacity = '0';
  await sleep(400);
  panel.remove();
  overlay.style.display = 'none';

  const roundCounter = document.getElementById('roundCounter');
  roundCounter.textContent = '';
  roundCounter.classList.remove('shifted');
  roundCounter.style.zIndex = '10';
  card.style.transition = 'background 0.4s ease';
  card.style.background = '#0c0c0e';
  cardTop.style.display = 'flex';
  cardFooter.style.display = 'flex';

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  cardTop.style.opacity = '1';
  cardFooter.style.opacity = '1';
  await sleep(350);

  currentRound = 1;
  roundScores = [];
  roundColors = [];
  roundCounter.textContent = gameTotalAttempts ? `${currentRound}/${gameTotalAttempts}` : '';

  cardTop.style.opacity = '0';
  cardFooter.style.opacity = '0';
  await sleep(350);
  cardTop.style.display = 'none';
  cardFooter.style.display = 'none';

  overlay.style.display = 'flex';
  await showCountdownWord('ready', hslStr(randomHSL()));
  await showCountdownWord('set', hslStr(randomHSL()));
  await showCountdownWord('go', hslStr(randomHSL()));
  await showColorRound(DURATIONS[currentDifficulty]);
});

  panel.appendChild(closeBtn);
  panel.appendChild(scoreRow);
  panel.appendChild(phraseEl);
  panel.appendChild(colorsGrid);
  panel.appendChild(playAgainBtn);
  overlay.appendChild(panel);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.style.opacity = '1';
  }));

  const duration = 900;
  const startT = performance.now();
  function animTotal(now) {
    const progress = Math.min((now - startT) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    scoreTotalEl.textContent = (eased * total).toFixed(2);
    if (progress < 1) requestAnimationFrame(animTotal);
    else scoreTotalEl.textContent = total.toFixed(2);
  }
  setTimeout(() => requestAnimationFrame(animTotal), 300);
}

async function startTraining() {
  trainingColor = randomHSL();
  currentGameColor = null;
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

const hintBar = document.getElementById('hintBar');
const hintMap = [
  { el: document.getElementById('gameModeBtn'), text: 'Set number of attempts or go limitless.' },
  { el: document.getElementById('trainingBtn'), text: 'Memorize a color, then try to recreate it.' },
  { el: document.getElementById('difficultyTrack'), text: 'Change the game difficulty.' },
  { el: document.getElementById('difficultyLabel'), text: 'Change the game difficulty.' },
  { el: document.getElementById('startBtn'), text: 'Start the game.' },
];

let hintTimeout = null;

hintMap.forEach(({ el, text }) => {
  el.addEventListener('mouseenter', () => {
    clearTimeout(hintTimeout);
    hintBar.classList.remove('visible');
    hintTimeout = setTimeout(() => {
      hintBar.textContent = text;
      hintBar.classList.add('visible');
    }, 180);
  });
  el.addEventListener('mouseleave', () => {
    clearTimeout(hintTimeout);
    hintBar.classList.remove('visible');
  });
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('no-transition');
  document.body.classList.add('dark-bg');
  document.getElementById('themeIcon').src = 'img/light.png';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove('no-transition');
  }));
}

document.getElementById('themeBtn').addEventListener('click', () => {
  const icon = document.getElementById('themeIcon');
  const isDark = document.body.classList.toggle('dark-bg');
  icon.src = isDark ? 'img/light.png' : 'img/dark.png';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

const helpOverlay = document.getElementById('helpOverlay');
const helpPages = document.querySelectorAll('.help-page');
const helpDots = document.querySelectorAll('.help-dot');
const helpNextBtn = document.getElementById('helpNextBtn');
const helpBackBtn = document.getElementById('helpBackBtn');
let helpCurrentPage = 0;

function goToHelpPage(index, direction = 'forward') {
  helpPages[helpCurrentPage].classList.remove('active', 'back');
  helpCurrentPage = index;
  const page = helpPages[helpCurrentPage];
  if (direction === 'back') page.classList.add('back');
  else page.classList.remove('back');
  page.classList.add('active');

  helpDots.forEach((d, i) => d.classList.toggle('active', i === helpCurrentPage));
  helpBackBtn.disabled = helpCurrentPage === 0;

  const isLast = helpCurrentPage === helpPages.length - 1;
  helpNextBtn.classList.toggle('got-it', isLast);
  helpNextBtn.innerHTML = isLast ? 'Got it' : '<img src="img/arrow-right.png" alt="Next">';
}

document.getElementById('helpBtn').addEventListener('click', () => {
  helpCurrentPage = 0;
  helpPages.forEach(p => p.classList.remove('active', 'back'));
  helpPages[0].classList.add('active');
  helpDots.forEach((d, i) => d.classList.toggle('active', i === 0));
  helpBackBtn.disabled = true;
  helpNextBtn.classList.remove('got-it');
  helpNextBtn.innerHTML = '<img src="img/arrow-right.png" alt="Next">';
  helpOverlay.classList.add('visible');
});

function closeHelp() {
  helpOverlay.classList.remove('visible');
}

document.getElementById('helpCloseBtn').addEventListener('click', closeHelp);

helpOverlay.addEventListener('click', (e) => {
  if (e.target === helpOverlay) closeHelp();
});

helpNextBtn.addEventListener('click', () => {
  if (helpCurrentPage < helpPages.length - 1) {
    goToHelpPage(helpCurrentPage + 1, 'forward');
  } else {
    closeHelp();
  }
});

helpBackBtn.addEventListener('click', () => {
  if (helpCurrentPage > 0) goToHelpPage(helpCurrentPage - 1, 'back');
});