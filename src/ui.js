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

if (privacyBtn) {
  privacyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    privacyOverlay.classList.add('visible');
  });
}

if (privacyCloseBtn) {
  privacyCloseBtn.addEventListener('click', () => {
    privacyOverlay.classList.remove('visible');
  });
}

if (privacyOverlay) {
  privacyOverlay.addEventListener('click', (e) => {
    if (e.target === privacyOverlay) privacyOverlay.classList.remove('visible');
  });
}