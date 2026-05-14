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

const privacyBtn = document.getElementById('privacyBtn');
const privacyOverlay = document.getElementById('privacyOverlay');
const privacyCloseBtn = document.getElementById('privacyCloseBtn');

privacyBtn.addEventListener('click', e => {
  e.preventDefault();
  privacyOverlay.classList.add('visible');
});

privacyCloseBtn.addEventListener('click', () => {
  privacyOverlay.classList.remove('visible');
});

const aboutBtn = document.getElementById('aboutBtn');
const aboutOverlay = document.getElementById('aboutOverlay');
const aboutCloseBtn = document.getElementById('aboutCloseBtn');

aboutBtn.addEventListener('click', e => {
  e.preventDefault();
  aboutOverlay.classList.add('visible');
});

aboutCloseBtn.addEventListener('click', () => {
  aboutOverlay.classList.remove('visible');
});

const scoringBtn = document.getElementById('scoringBtn');
const scoringOverlay = document.getElementById('scoringOverlay');
const scoringCloseBtn = document.getElementById('scoringCloseBtn');

scoringBtn.addEventListener('click', e => {
  e.preventDefault();
  scoringOverlay.classList.add('visible');
});

scoringCloseBtn.addEventListener('click', () => {
  scoringOverlay.classList.remove('visible');
});

(function() {
  let target = { h: 142, s: 55, l: 40 };

  function hslToXyz(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
    let r = f(0), g = f(8), b = f(4);
    [r, g, b] = [r, g, b].map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return [r * 0.4124564 + g * 0.3575761 + b * 0.1804375, r * 0.2126729 + g * 0.7151522 + b * 0.0721750, r * 0.0193339 + g * 0.1191920 + b * 0.9503041];
  }

  function xyzToLab(x, y, z) {
    const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const fx = f(x / 0.9505), fy = f(y / 1.0), fz = f(z / 1.089);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  function hslToLab(h, s, l) { return xyzToLab(...hslToXyz(h, s, l)); }

  function ciede2000(lab1, lab2) {
    const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2;
    const avg_L = (L1 + L2) / 2, C1 = Math.sqrt(a1**2 + b1**2), C2 = Math.sqrt(a2**2 + b2**2), avg_C = (C1 + C2) / 2, C7 = avg_C**7;
    const G = 0.5 * (1 - Math.sqrt(C7 / (C7 + 25**7)));
    const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
    const C1p = Math.sqrt(a1p**2 + b1**2), C2p = Math.sqrt(a2p**2 + b2**2);
    const h1p = (Math.atan2(b1, a1p) * 180 / Math.PI + 360) % 360, h2p = (Math.atan2(b2, a2p) * 180 / Math.PI + 360) % 360;
    const dLp = L2 - L1, dCp = C2p - C1p;
    let dhp;
    if (C1p * C2p === 0) dhp = 0;
    else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
    else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
    else dhp = h2p - h1p + 360;
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
    const avg_Cp = (C1p + C2p) / 2;
    let avg_hp;
    if (C1p * C2p === 0) avg_hp = h1p + h2p;
    else if (Math.abs(h1p - h2p) <= 180) avg_hp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) avg_hp = (h1p + h2p + 360) / 2;
    else avg_hp = (h1p + h2p - 360) / 2;
    const T = 1 - 0.17 * Math.cos((avg_hp - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * avg_hp * Math.PI / 180) + 0.32 * Math.cos((3 * avg_hp + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * avg_hp - 63) * Math.PI / 180);
    const SL = 1 + 0.015 * (avg_L - 50)**2 / Math.sqrt(20 + (avg_L - 50)**2), SC = 1 + 0.045 * avg_Cp, SH = 1 + 0.015 * avg_Cp * T;
    const avg_Cp7 = avg_Cp**7, RC = 2 * Math.sqrt(avg_Cp7 / (avg_Cp7 + 25**7));
    const d_theta = 30 * Math.exp(-Math.pow((avg_hp - 275) / 25, 2)), RT = -Math.sin(2 * d_theta * Math.PI / 180) * RC;
    return Math.sqrt((dLp / SL)**2 + (dCp / SC)**2 + (dHp / SH)**2 + RT * (dCp / SC) * (dHp / SH));
  }

  function calcScore(orig, guess) {
    const lab1 = hslToLab(orig.h, orig.s, orig.l), lab2 = hslToLab(guess.h, guess.s, guess.l);
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
    return { score: Math.round(final * 100) / 100, dE: Math.round(dE * 10) / 10, recovery: Math.round(recovery * 100) / 100, penalty: Math.round(penalty * 100) / 100 };
  }

  function update() {
    const guess = { h: +document.getElementById('wH').value, s: +document.getElementById('wS').value, l: +document.getElementById('wL').value };
    document.getElementById('wHv').textContent = guess.h + '°';
    document.getElementById('wSv').textContent = guess.s + '%';
    document.getElementById('wLv').textContent = guess.l + '%';
    document.getElementById('wTarget').style.background = `hsl(${target.h}, ${target.s}%, ${target.l}%)`;
    document.getElementById('wGuess').style.background = `hsl(${guess.h}, ${guess.s}%, ${guess.l}%)`;
    const r = calcScore(target, guess);
    const scoreEl = document.getElementById('wScore');
    scoreEl.textContent = r.score.toFixed(2);
    if (r.score >= 9) scoreEl.style.color = '#7defa1';
    else if (r.score >= 7) scoreEl.style.color = '#f0c96e';
    else if (r.score >= 5) scoreEl.style.color = '#f5945c';
    else scoreEl.style.color = '#ec6767';
    document.getElementById('wDelta').textContent = r.dE.toFixed(1);
    document.getElementById('wRec').textContent = '+' + r.recovery.toFixed(2);
    document.getElementById('wPen').textContent = '-' + r.penalty.toFixed(2);
  }

  document.getElementById('wH').addEventListener('input', update);
  document.getElementById('wS').addEventListener('input', update);
  document.getElementById('wL').addEventListener('input', update);

  document.getElementById('wNewTarget').addEventListener('click', () => {
    target = { h: Math.floor(Math.random() * 360), s: Math.floor(20 + Math.random() * 61), l: Math.floor(20 + Math.random() * 61) };
    update();
  });

  document.getElementById('wReset').addEventListener('click', () => {
    document.getElementById('wH').value = 180;
    document.getElementById('wS').value = 60;
    document.getElementById('wL').value = 50;
    update();
  });

  update();
})();