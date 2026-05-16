const toggleViewBtn = document.getElementById('toggleViewBtn');
let showingAnswer = false;

function showToggleBtn(color) {
  toggleViewBtn.style.display = 'flex';
  toggleViewBtn.style.opacity = '0';
  showingAnswer = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    toggleViewBtn.style.opacity = '1';
  }));
  updateGameBtnColors(+hS.value, +sS.value, +lS.value);

  toggleViewBtn.onclick = () => {
    showingAnswer = !showingAnswer;

    if (showingAnswer) {
      hslPanel.style.opacity = '0';
      setTimeout(() => {
        hslPanel.style.display = 'none';
        card.style.transition = 'background 0.4s ease';
        card.style.background = hslStr(color);
        const exitBtn = document.getElementById('trainingExitBtn');
        if (exitBtn) exitBtn.style.display = 'none';
        updateCounterColor(color.h, color.s, color.l);
        updateGameBtnColors(color.h, color.s, color.l);
      }, 400);
    } else {
      card.style.transition = 'background 0.4s ease';
      card.style.background = `hsl(${hS.value},${sS.value}%,${lS.value}%)`;
      const exitBtn = document.getElementById('trainingExitBtn');
      if (exitBtn) exitBtn.style.display = 'flex';
      updateCounterColor(+hS.value, +sS.value, +lS.value);
      updateGameBtnColors(+hS.value, +sS.value, +lS.value);
      hslPanel.style.display = 'flex';
      submitBtn.style.display = 'flex';
      submitBtn.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        hslPanel.style.opacity = '1';
        submitBtn.style.opacity = '1';
      }));
    }
  };
}

async function startTraining() {
  trainingColor = randomHSL();
  currentGameColor = null;
  card.style.transition = 'background 0.5s ease';
  card.style.background = hslStr(trainingColor);
  updateCounterColor(trainingColor.h, trainingColor.s, trainingColor.l);
  const exitBtnEl = document.getElementById('trainingExitBtn');
  if (exitBtnEl) exitBtnEl.style.display = 'none';
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

  let exitBtn = document.getElementById('trainingExitBtn');
  if (!exitBtn) {
    exitBtn = document.createElement('button');
    exitBtn.id = 'trainingExitBtn';
    exitBtn.className = 'training-exit-btn';
    exitBtn.innerHTML = '<img src="img/close.png" alt="Exit">';
    document.getElementById('gameOverlay').appendChild(exitBtn);
  }
  exitBtn.style.display = 'flex';
  exitBtn.onclick = resetToMenu;
  hslPanel.style.display = 'flex';
  hslPanel.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hslPanel.style.opacity = '1';
  }));

  submitBtn.style.display = 'flex';
  showToggleBtn(trainingColor);
}

function resetToMenu() {
  isGameRunning = false;
  isSubmitting = false;
  gameResultNextAction = null;
  trainingColor = null;
  currentGameColor = null;
  isTrainingRunning = false;
  const overlay = document.getElementById('gameOverlay');
  const exitBtn = document.getElementById('trainingExitBtn');
  if (exitBtn) exitBtn.style.display = 'none';
  hslPanel.style.display = 'none';
  submitBtn.style.display = 'none';
  toggleViewBtn.style.display = 'none';
  const rc = document.getElementById('roundCounter');
  rc.textContent = '';
  rc.classList.remove('shifted');
  card.style.transition = 'background 0.4s ease';
  card.style.background = '#0c0c0e';
  overlay.style.display = 'none';
  const resultPanel = document.getElementById('resultPanel');
  if (resultPanel) { resultPanel.style.display = 'none'; resultPanel.style.opacity = '0'; }
  hslPanel.style.display = 'none';
  hslPanel.style.opacity = '0';
  cardTop.style.display = 'flex';
  cardFooter.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cardTop.style.opacity = '1';
    cardFooter.style.opacity = '1';
  }));
}

  let isTrainingRunning = false;
document.getElementById('trainingBtn').addEventListener('click', async () => {
  if (isTrainingRunning) return;
  isTrainingRunning = true;
  cardTop.style.transition = 'opacity 0.35s ease';
  cardFooter.style.transition = 'opacity 0.35s ease';
  cardTop.style.opacity = '0';
  cardFooter.style.opacity = '0';

  await sleep(350);
  cardTop.style.display = 'none';
  cardFooter.style.display = 'none';

  document.getElementById('gameOverlay').style.display = 'flex';
  const resultPanel = document.getElementById('resultPanel');
  if (resultPanel) { resultPanel.style.display = 'none'; resultPanel.style.opacity = '0'; }
  hslPanel.style.display = 'none';
  hslPanel.style.opacity = '0';
  submitBtn.style.display = 'none';
  toggleViewBtn.style.display = 'none';
  await startTraining();
});