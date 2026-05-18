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
  const isSingleRow = roundColors.length <= 5;
  colorsGrid.style.marginTop = isSingleRow ? 'auto' : '20px';
  colorsGrid.style.marginBottom = isSingleRow ? 'auto' : '0';

  const cellEls = [];
  const isMobile = window.innerWidth <= 480;
  const count = roundColors.length;

  if (isMobile) {
    const gap = 3;
    const gridW = panel.getBoundingClientRect().width - 56;
    const cols = count <= 5 ? count : Math.ceil(count / 2);
    const cellSize = Math.min(60, Math.floor((gridW - gap * (cols - 1)) / cols));
    const totalGridW = cols * cellSize + (cols - 1) * gap;
    colorsGrid.style.display = 'grid';
    colorsGrid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    colorsGrid.style.width = totalGridW + 'px';
    colorsGrid.style.gap = gap + 'px';
    colorsGrid.style.margin = '12px auto';
    roundColors.forEach((entry, i) => {
      const cell = document.createElement('div');
      cell.className = 'summary-color-cell';
      cell.style.width = cellSize + 'px';
      cell.style.height = cellSize + 'px';
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
      cellEls.push(cell);
    });
  } else {
    roundColors.forEach((entry, i) => {
      const cell = document.createElement('div');
      cell.className = 'summary-color-cell';
      cell.style.setProperty('--cell-size', '72px');
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
      cellEls.push(cell);
    });
  }

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

  panel.appendChild(scoreRow);
  panel.appendChild(phraseEl);
  panel.appendChild(colorsGrid);
  panel.appendChild(playAgainBtn);
  panel.appendChild(saveRow);
  panel.appendChild(closeBtn);
  overlay.appendChild(panel);


  const staggerEls = [scoreRow, phraseEl, ...cellEls, playAgainBtn, saveRow, closeBtn];
  staggerEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
  });

  panel.style.opacity = '0';
  panel.style.transition = 'opacity 0.3s ease';
  requestAnimationFrame(() => requestAnimationFrame(() => { panel.style.opacity = '1'; }));

  let skipped = false;
  let scoreAnimRaf = null;
  let scoreAnimStart = null;
  const SCORE_DURATION = 900;

  function revealAll() {
    skipped = true;
    if (scoreAnimRaf) cancelAnimationFrame(scoreAnimRaf);
    scoreTotalEl.textContent = total.toFixed(2);

    staggerEls.forEach(el => {
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    panel.removeEventListener('click', onPanelClick);
  }

  function onPanelClick() {
    if (!skipped) revealAll();
  }
  panel.addEventListener('click', onPanelClick);


  const cellDelay = 80;
  const cellsStart = 1100;
  const playAgainDelay = cellsStart + cellEls.length * cellDelay + 100;
  const saveRowDelay = playAgainDelay + 200;
  const closeDelay = saveRowDelay + 200;

  function revealEl(el) {
    if (skipped) return;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }

  setTimeout(() => revealEl(scoreRow), 0);

  function animTotal(now) {
    if (!scoreAnimStart) scoreAnimStart = now;
    const progress = Math.min((now - scoreAnimStart) / SCORE_DURATION, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    scoreTotalEl.textContent = (eased * total).toFixed(2);
    if (progress < 1) {
      scoreAnimRaf = requestAnimationFrame(animTotal);
    } else {
      scoreTotalEl.textContent = total.toFixed(2);
      scoreAnimRaf = null;
    }
  }
  setTimeout(() => { if (!skipped) scoreAnimRaf = requestAnimationFrame(animTotal); }, 300);

  setTimeout(() => revealEl(phraseEl), 700);

  cellEls.forEach((cell, i) => {
    setTimeout(() => revealEl(cell), cellsStart + i * cellDelay);
  });

  setTimeout(() => revealEl(playAgainBtn), playAgainDelay);

  setTimeout(() => revealEl(saveRow), saveRowDelay);

  setTimeout(() => revealEl(closeBtn), closeDelay);
}
