const cardTop = document.querySelector('.card-top');
const cardFooter = document.querySelector('.card-footer');

let currentGameColor = null;
let currentRound = 1;
let gameTotalAttempts = null;
let gameResultNextAction = null;
let roundScores = [];
let roundColors = [];
let isSubmitting = false;
let isGameRunning = false;
let trainingColor = null;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function showCountdownWord(text, color) {
  const exitBtn = document.getElementById('trainingExitBtn');
  if (exitBtn) exitBtn.style.display = 'none';
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
  const exitBtn = document.getElementById('trainingExitBtn');
  if (exitBtn) exitBtn.style.display = 'none';
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

  if (exitBtn && gameTotalAttempts === null) exitBtn.style.display = 'flex';

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
  submitBtn.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    submitBtn.style.opacity = '1';
  }));
  updateGameBtnColors(+hS.value, +sS.value, +lS.value);
  document.getElementById('toggleViewBtn').style.display = 'none';
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

  document.getElementById('resultScore').style.color = topColor;
  document.getElementById('resultGuessColor').querySelector('.result-color-sublabel').style.color = topColorFaded;
  document.getElementById('resultGuessColor').querySelector('.result-color-values').style.color = topColor;

  const phraseEl = document.getElementById('resultScorePhrase');
  if (showPhrase) {
    phraseEl.textContent = getScorePhrase(score);
    phraseEl.style.color = topColorFaded;
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
  toggleViewBtn.style.opacity = '0';
  setTimeout(() => { toggleViewBtn.style.display = 'none'; }, 300);
  submitBtn.style.display = 'none';

  card.style.transition = 'background 0.4s ease';
  card.style.background = '#0c0c0e';
  isSubmitting = false;
}

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
 
  if (gameTotalAttempts === null) {
    let exitBtn = document.getElementById('trainingExitBtn');
    if (!exitBtn) {
      exitBtn = document.createElement('button');
      exitBtn.id = 'trainingExitBtn';
      exitBtn.className = 'training-exit-btn';
      exitBtn.innerHTML = '<img src="img/close.png" alt="Exit">';
      document.getElementById('gameOverlay').appendChild(exitBtn);
    }
    exitBtn.style.display = 'flex';
    exitBtn.onclick = () => resetToMenu();
  }

  await showCountdownWord('ready', hslStr(randomHSL()));
  await showCountdownWord('set', hslStr(randomHSL()));
  await showCountdownWord('go', hslStr(randomHSL()));
  await showColorRound(DURATIONS[currentDifficulty]);
});