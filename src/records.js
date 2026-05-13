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
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: hsl(${entry.original.h}, ${entry.original.s}%, ${entry.original.l}%);
        clip-path: polygon(0 0, 100% 0, 0 100%);
      `;

      const guessHalf = document.createElement('div');
      guessHalf.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: hsl(${entry.guess.h}, ${entry.guess.s}%, ${entry.guess.l}%);
        clip-path: polygon(100% 0, 100% 100%, 0 100%);
      `;

      const scoreLabel = document.createElement('span');
      scoreLabel.style.cssText = `
        position: absolute; top: 6px; left: 8px;
        font-family: 'Figtree', sans-serif; font-size: 11px;
        font-weight: 800; letter-spacing: -0.3px; z-index: 2;
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

  requestAnimationFrame(() => requestAnimationFrame(() => { detail.style.opacity = '1'; }));

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