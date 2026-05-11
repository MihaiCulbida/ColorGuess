const sfx = (() => {
  let ctx = null;
  const get = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());

  function tone(freq, type, attack, sustain, release, gain = 0.18) {
    if (muted) return;
    const ac = get();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    env.gain.setValueAtTime(0, ac.currentTime);
    env.gain.linearRampToValueAtTime(gain, ac.currentTime + attack);
    env.gain.setValueAtTime(gain, ac.currentTime + attack + sustain);
    env.gain.linearRampToValueAtTime(0, ac.currentTime + attack + sustain + release);
    osc.connect(env);
    env.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + attack + sustain + release + 0.01);
  }

  function noise(duration, gain = 0.06) {
    if (muted) return;
    const ac = get();
    const buf = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const env = ac.createGain();
    env.gain.setValueAtTime(gain, ac.currentTime);
    env.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
    src.connect(env);
    env.connect(ac.destination);
    src.start();
    src.stop(ac.currentTime + duration);
  }

  return {
    hover: () => tone(200, 'sine', 0.005, 0.04, 0.08, 0.07),
    click: () => tone(240, 'sine', 0.003, 0.02, 0.06, 0.10),
    ready: () => tone(330, 'triangle', 0.01, 0.08, 0.15, 0.15),
    set: () => tone(440, 'triangle', 0.01, 0.08, 0.15, 0.15),
    go: () => tone(660, 'triangle', 0.01, 0.10, 0.20, 0.20),
    tick: () => tone(220, 'sine', 0.005, 0.01, 0.05, 0.08),
    score: (p) => tone(200 + p * 600, 'sine', 0.005, 0.01, 0.04, 0.10),
    submit: () => { tone(420, 'sine', 0.005, 0.05, 0.10, 0.12); noise(0.08, 0.04); },
  };
})();

function randomHSL() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(20 + Math.random() * 61);
  const l = Math.floor(20 + Math.random() * 61);
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

  if (text === 'ready') sfx.ready();
  else if (text === 'set') sfx.set();
  else if (text === 'go') sfx.go();

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
    if (secs !== lastSec) { lastSec = secs; animateSecondChange(secs); sfx.tick(); }
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
  roundCounter.style.color = getAdaptiveColor(h, mapS(s), mapL(l), 0.5);
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
  label.style.color = getAdaptiveColor(h, cardS, cardL, 0.4);
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
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = ln - c / 2;
  const hi = Math.floor(h / 60) % 6;
  const rgb = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][hi];
  const [r, g, b] = rgb.map(v => {
    const lin = v + m;
    return lin <= 0.04045 ? lin / 12.92 : Math.pow((lin + 0.055) / 1.055, 2.4);
  });
  const perceived = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const dark = perceived > 0.179;
  return `hsla(${h}, ${Math.max(s - 20, 0)}%, ${dark ? 15 : 85}%, ${opacity})`;
}

function animateScore(targetScore, onComplete) {
  const el = document.getElementById('resultScore');
  const duration = 800;
  const start = performance.now();

  let lastSoundAt = -1;
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * targetScore;
    el.textContent = current.toFixed(2);
    const soundStep = Math.floor(progress * 8);
    if (soundStep !== lastSoundAt) { lastSoundAt = soundStep; sfx.score(eased); }
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
  sfx.submit();
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
  sfx.click();
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

  const summaryToast = document.createElement('div');
  summaryToast.className = 'records-toast';
  summaryToast.id = 'summaryToast';
  panel.appendChild(summaryToast);

  let summaryToastTimer = null;
  function showSummaryToast(msg, type) {
    const t = document.getElementById('summaryToast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'records-toast visible ' + type;
    clearTimeout(summaryToastTimer);
    summaryToastTimer = setTimeout(() => { t.className = 'records-toast'; }, 3000);
  }

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
  const isSingleRow = roundColors.length <= 5;
  colorsGrid.style.marginTop = isSingleRow ? 'auto' : '20px';
  colorsGrid.style.marginBottom = isSingleRow ? 'auto' : '0';

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
    isGameRunning = false;
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

  const saveRow = document.createElement('div');
  saveRow.className = 'summary-save-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.maxLength = 3;
  nameInput.placeholder = 'AAA';
  nameInput.className = 'summary-name-pill';
  nameInput.addEventListener('input', () => {
    nameInput.value = nameInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'summary-save-btn';
  saveBtn.textContent = 'Save the record';
  saveBtn.addEventListener('click', () => {
    const raw = nameInput.value.trim();
    if (raw.length < 3) { showSummaryToast('Enter exactly 3 letters', 'error'); return; }
    if (!/^[A-Z]{3}$/.test(raw)) { showSummaryToast('Letters only — no numbers or symbols', 'error'); return; }
    const records = loadRecords();
    if (records.find(r => r.name === raw && r.difficulty === currentDifficulty)) { showSummaryToast('Name already used', 'error'); return; }
    const entry = {
      id: Date.now() + Math.random(),
      name: raw,
      score: total,
      attempts: gameTotalAttempts === null ? 0 : gameTotalAttempts,
      rounds: roundScores.length,
      difficulty: currentDifficulty,
      date: new Date().toISOString(),
      roundScores: [...roundScores],
      roundColors: JSON.parse(JSON.stringify(roundColors.map(e => ({ original: e.original, guess: e.guess }))))
    };
    records.push(entry);
    saveRecordsLS(records);
    nameInput.disabled = true;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saved';
    showSummaryToast('Saved', 'success');
  });

  saveRow.appendChild(nameInput);
  saveRow.appendChild(saveBtn);

  panel.appendChild(closeBtn);
  panel.appendChild(scoreRow);
  panel.appendChild(phraseEl);
  panel.appendChild(colorsGrid);
  panel.appendChild(playAgainBtn);
  panel.appendChild(saveRow);
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
  const adaptive = getAdaptiveColor(h, mapS(s), mapL(l), 0.12);
  const adaptiveBorder = getAdaptiveColor(h, mapS(s), mapL(l), 0.18);
  const perceived = (() => {
    const cardS = mapS(s), cardL = mapL(l);
    const sn = cardS/100, ln = cardL/100;
    const c = (1-Math.abs(2*ln-1))*sn, x = c*(1-Math.abs((h/60)%2-1)), m = ln-c/2;
    const [r,g,b] = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h/60)%6].map(v=>{const lin=v+m;return lin<=0.04045?lin/12.92:Math.pow((lin+0.055)/1.055,2.4);});
    return 0.2126*r+0.7152*g+0.0722*b;
  })();
  const imgFilter = perceived > 0.179 ? 'invert(0)' : 'invert(1)';
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
  { el: document.getElementById('recordsBtn'), text: 'View your records.' }
];

let hintTimeout = null;

hintMap.forEach(({ el, text }) => {
  el.addEventListener('mouseenter', () => {
    sfx.hover();
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
  el.addEventListener('click', () => sfx.click());
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
  sfx.click();
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
  sfx.click();
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

document.getElementById('helpCloseBtn').addEventListener('click', () => { sfx.click(); closeHelp(); });

helpOverlay.addEventListener('click', (e) => {
  if (e.target === helpOverlay) closeHelp();
});

helpNextBtn.addEventListener('click', () => {
  sfx.click();
  if (helpCurrentPage < helpPages.length - 1) {
    goToHelpPage(helpCurrentPage + 1, 'forward');
  } else {
    closeHelp();
  }
});

helpBackBtn.addEventListener('click', () => {
  sfx.click();
  if (helpCurrentPage > 0) goToHelpPage(helpCurrentPage - 1, 'back');
});

let muted = false;
document.getElementById('muteBtn').addEventListener('click', () => {
  muted = !muted;
  document.getElementById('muteIcon').src = muted ? 'img/volume-slash.png' : 'img/volume.png';
});

const RECORDS_KEY = 'colormatch_records';
function loadRecords() { try { return JSON.parse(localStorage.getItem(RECORDS_KEY)) || []; } catch { return []; } }
function saveRecordsLS(arr) { localStorage.setItem(RECORDS_KEY, JSON.stringify(arr)); }

const DIFF_LABELS = { 0: 'Easy', 1: 'Medium', 2: 'Hard' };
const DIFF_KEYS = [0, 1, 2];

let recordsPendingDeleteId = null;
let recordsActiveTab = 0;
let recordsToastTimer = null;
let recordsSearchQuery = '';

function showRecordsToast(msg, type) {
  const t = document.getElementById('recordsToast');
  t.textContent = msg;
  t.className = 'records-toast visible ' + type;
  clearTimeout(recordsToastTimer);
  recordsToastTimer = setTimeout(() => { t.className = 'records-toast'; }, 3000);
}

function showRecordDetail(rec) {
  sfx.click();
  const panel = document.getElementById('recordsPanel');

  const existing = document.getElementById('recordDetailPanel');
  if (existing) existing.remove();

  const detail = document.createElement('div');
  detail.id = 'recordDetailPanel';
  detail.className = 'record-detail-panel';

  const backBtn = document.createElement('button');
  backBtn.className = 'record-detail-back-btn';
  backBtn.innerHTML = '<img src="img/arrow-left.png" alt="Back">';
  backBtn.addEventListener('click', () => {
    sfx.click();
    detail.style.opacity = '0';
    setTimeout(() => detail.remove(), 300);
  });

  const nameEl = document.createElement('div');
  nameEl.className = 'record-detail-name';
  nameEl.textContent = rec.name;

  const header = document.createElement('div');
  header.className = 'record-detail-header';
  header.appendChild(backBtn);
  header.appendChild(nameEl);

  const att = rec.attempts === 0 ? 'Limitless' : rec.attempts === 1 ? '1 attempt' : rec.attempts + ' attempts';
  const maxScore = (rec.attempts === 0 ? rec.rounds : rec.attempts) * 10;

  const scoreRow = document.createElement('div');
  scoreRow.className = 'record-detail-score-row';
  const scoreTotalEl = document.createElement('span');
  scoreTotalEl.className = 'record-detail-score-total';
  scoreTotalEl.textContent = '0.00';
  const scoreMaxEl = document.createElement('span');
  scoreMaxEl.className = 'record-detail-score-max';
  scoreMaxEl.textContent = '/' + maxScore;
  scoreRow.appendChild(scoreTotalEl);
  scoreRow.appendChild(scoreMaxEl);

  const metaEl = document.createElement('div');
  metaEl.className = 'record-detail-meta';
  metaEl.textContent = att + ' · ' + DIFF_LABELS[rec.difficulty];

  const colorsGrid = document.createElement('div');
  colorsGrid.className = 'record-detail-grid';
  const cols = Math.min(rec.roundColors.length, 5);
  colorsGrid.style.maxWidth = (5 * 80 + 4 * 6) + 'px';
  colorsGrid.style.margin = '20px auto 0';

  const hasColors = rec.roundColors && rec.roundColors.length > 0;
  const hasScores = rec.roundScores && rec.roundScores.length > 0;

  if (hasColors) {
    rec.roundColors.forEach((entry, i) => {
      const cell = document.createElement('div');
      cell.className = 'record-detail-cell';

      const origHalf = document.createElement('div');
      origHalf.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: hsl(${entry.original.h}, ${entry.original.s}%, ${entry.original.l}%);
        clip-path: polygon(0 0, 100% 0, 0 100%);
      `;

      const guessHalf = document.createElement('div');
      guessHalf.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: hsl(${entry.guess.h}, ${entry.guess.s}%, ${entry.guess.l}%);
        clip-path: polygon(100% 0, 100% 100%, 0 100%);
      `;

      const scoreLabel = document.createElement('span');
      scoreLabel.style.cssText = `
        position: absolute;
        top: 6px;
        left: 8px;
        font-family: 'Figtree', sans-serif;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: -0.3px;
        z-index: 2;
        color: ${entry.original.l > 55 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)'};
      `;
      scoreLabel.textContent = hasScores && rec.roundScores[i] != null
        ? rec.roundScores[i].toFixed(2)
        : calcScore(entry.original, entry.guess).toFixed(2);

      cell.appendChild(origHalf);
      cell.appendChild(guessHalf);
      cell.appendChild(scoreLabel);
      colorsGrid.appendChild(cell);
    });
  } else {
    const noData = document.createElement('p');
    noData.className = 'record-detail-no-data';
    noData.textContent = 'Color data not available for this record.';
    colorsGrid.appendChild(noData);
  }

  detail.appendChild(header);
  detail.appendChild(scoreRow);
  detail.appendChild(metaEl);
  detail.appendChild(colorsGrid);
  panel.appendChild(detail);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    detail.style.opacity = '1';
  }));

  const duration = 700;
  const startT = performance.now();
  function animTotal(now) {
    const progress = Math.min((now - startT) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    scoreTotalEl.textContent = (eased * rec.score).toFixed(2);
    if (progress < 1) requestAnimationFrame(animTotal);
    else scoreTotalEl.textContent = rec.score.toFixed(2);
  }
  setTimeout(() => requestAnimationFrame(animTotal), 150);
}

function openRecordsPanel() {
  sfx.click();
  document.getElementById('gameOverlay').style.display = 'flex';
  hslPanel.style.display = 'none';
  submitBtn.style.display = 'none';
  document.getElementById('toggleViewBtn').style.display = 'none';
  document.getElementById('resultPanel').style.display = 'none';

  const records = loadRecords();
  const usedDiffs = DIFF_KEYS.filter(d => records.some(r => r.difficulty === d));
  recordsActiveTab = usedDiffs.length ? usedDiffs[0] : 0;
  recordsSearchQuery = '';

  renderRecordsPanel();
  const panel = document.getElementById('recordsPanel');
  panel.style.display = 'flex';
  panel.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => { panel.style.opacity = '1'; }));
}

function closeRecordsPanel() {
  const panel = document.getElementById('recordsPanel');
  panel.style.opacity = '0';
  setTimeout(() => { panel.style.display = 'none'; }, 350);
  if (!isGameRunning) document.getElementById('gameOverlay').style.display = 'none';
}

function renderRecordsPanel() {
  const records = loadRecords();
  const tabsRow = document.getElementById('recordsTabsRow');
  const list = document.getElementById('recordsList');

  const usedDiffs = DIFF_KEYS.filter(d => records.some(r => r.difficulty === d));

  function renderFilteredList() {
    const filtered = records
      .filter(r => r.difficulty === recordsActiveTab)
      .filter(r => !recordsSearchQuery || r.name.startsWith(recordsSearchQuery));

    list.innerHTML = '';

    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'records-empty';
      empty.textContent = recordsSearchQuery ? 'No records found.' : 'No records yet.';
      list.appendChild(empty);
      return;
    }

    const attemptGroups = [...new Set(filtered.map(r => r.attempts))]
      .sort((a, b) => {
        if (a === 0) return 1;
        if (b === 0) return -1;
        return b - a;
      });

    attemptGroups.forEach(att => {
      const group = filtered.filter(r => r.attempts === att).sort((a, b) => b.score - a.score);

      const groupEl = document.createElement('div');
      groupEl.className = 'records-attempts-group';

      const lbl = document.createElement('span');
      lbl.className = 'records-attempts-label';
      lbl.textContent = att === 0 ? 'Limitless' : att === 1 ? '1 attempt' : att + ' attempts';
      groupEl.appendChild(lbl);

      group.forEach((rec, idx) => {
        const row = document.createElement('div');
        row.className = 'records-row';
        row.style.cursor = 'pointer';

        const rank = document.createElement('span');
        rank.className = 'records-row-rank';
        rank.textContent = idx + 1;

        const name = document.createElement('span');
        name.className = 'records-row-name';
        name.textContent = rec.name;

        const score = document.createElement('span');
        score.className = 'records-row-score';
        const max = att === 0 ? rec.rounds : att;
        score.textContent = rec.score.toFixed(2) + ' / ' + (max * 10);

        const del = document.createElement('button');
        del.className = 'records-row-del';
        del.innerHTML = '<img src="img/close.png" alt="Delete">';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          recordsPendingDeleteId = rec.id;
          document.getElementById('recordsDeleteConfirm').style.display = 'flex';
        });

        row.addEventListener('click', () => showRecordDetail(rec));
        row.appendChild(rank);
        row.appendChild(name);
        row.appendChild(score);
        row.appendChild(del);
        groupEl.appendChild(row);
      });

      list.appendChild(groupEl);
    });
  }

  tabsRow.innerHTML = '';

  const searchBtn = document.createElement('button');
  searchBtn.className = 'records-search-btn' + (recordsSearchQuery ? ' active' : '');
  searchBtn.innerHTML = '<img src="img/search.png" alt="Search">';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'records-search-input' + (recordsSearchQuery ? ' visible' : '');
  searchInput.placeholder = 'AAA';
  searchInput.maxLength = 3;
  searchInput.value = recordsSearchQuery;
  searchInput.addEventListener('input', () => {
    searchInput.value = searchInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    recordsSearchQuery = searchInput.value;
    renderFilteredList();
  });
  
  searchBtn.addEventListener('click', () => {
    const isVisible = searchInput.classList.toggle('visible');
    searchBtn.classList.toggle('active', isVisible);
    if (isVisible) {
      setTimeout(() => searchInput.focus(), 50);
    } else {
      recordsSearchQuery = '';
      searchInput.value = '';
      renderFilteredList();
    }
  });
  
  const tabsLeft = document.createElement('div');
  tabsLeft.className = 'records-tabs-left';

  usedDiffs.forEach(d => {
    const tab = document.createElement('button');
    tab.className = 'records-tab' + (recordsActiveTab === d ? ' active' : '');
    tab.textContent = DIFF_LABELS[d];
    tab.addEventListener('click', () => {
      recordsActiveTab = d;
      recordsSearchQuery = '';
      renderRecordsPanel();
    });
    tabsLeft.appendChild(tab);
  });

  tabsRow.appendChild(tabsLeft);
  tabsRow.appendChild(searchBtn);
  tabsRow.appendChild(searchInput);

  renderFilteredList();
}

document.getElementById('recordsDeleteYes').addEventListener('click', () => {
  if (recordsPendingDeleteId == null) return;
  const all = loadRecords().filter(r => r.id !== recordsPendingDeleteId);
  saveRecordsLS(all);
  recordsPendingDeleteId = null;
  document.getElementById('recordsDeleteConfirm').style.display = 'none';

  const remaining = all.filter(r => r.difficulty === recordsActiveTab);
  if (!remaining.length) {
    const usedDiffs = DIFF_KEYS.filter(d => all.some(r => r.difficulty === d));
    recordsActiveTab = usedDiffs.length ? usedDiffs[0] : 0;
  }

  renderRecordsPanel();
});

document.getElementById('recordsDeleteNo').addEventListener('click', () => {
  recordsPendingDeleteId = null;
  document.getElementById('recordsDeleteConfirm').style.display = 'none';
});

document.getElementById('recordsBtn').addEventListener('click', openRecordsPanel);
document.getElementById('recordsBackBtn').addEventListener('click', () => {
  sfx.click();
  closeRecordsPanel();
});