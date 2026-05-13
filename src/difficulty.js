const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const DURATIONS = { 0: 5000, 1: 3000, 2: 1000 };
let currentDifficulty = 0;

const thumb = document.getElementById('difficultyThumb');
const label = document.getElementById('difficultyLabel');
const dots = document.querySelectorAll('.difficulty-dot');
const THUMB_POSITIONS = [4, 21, 39];

function setDifficulty(index, persist = true) {
  currentDifficulty = index;
  thumb.style.left = THUMB_POSITIONS[index] + 'px';
  label.textContent = DIFFICULTIES[index];
  dots.forEach((dot, i) => {
    dot.style.opacity = i === index ? '0' : '1';
  });
  if (persist) saveSetting('difficulty', index);
}

document.getElementById('difficultyTrack').addEventListener('click', () => {
  setDifficulty((currentDifficulty + 1) % 3);
});

document.getElementById('difficultyLabel').addEventListener('click', () => {
  setDifficulty((currentDifficulty + 1) % 3);
});

const savedSettings = loadSettings();
requestAnimationFrame(() => setDifficulty(
  typeof savedSettings.difficulty === 'number' ? savedSettings.difficulty : 0,
  false
));

const gameModeBtn = document.getElementById('gameModeBtn');
const gameModePopup = document.getElementById('gameModePopup');
const attemptsSlider = document.getElementById('attemptsSlider');
const attemptsValue = document.getElementById('attemptsValue');
const noLimitsCheck = document.getElementById('noLimitsCheck');

let noLimits = false;

(function restoreGameMode() {
  const s = loadSettings();
  if (s.noLimits) {
    noLimits = true;
    noLimitsCheck.classList.add('checked');
    attemptsSlider.disabled = true;
    attemptsValue.style.opacity = '0.3';
  }
  if (typeof s.attempts === 'number') {
    attemptsSlider.value = s.attempts;
    attemptsValue.textContent = s.attempts;
  } else {
    attemptsValue.textContent = attemptsSlider.value;
  }
})();

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
  saveSetting('attempts', parseInt(attemptsSlider.value));
});

noLimitsCheck.addEventListener('click', () => {
  noLimits = !noLimits;
  noLimitsCheck.classList.toggle('checked', noLimits);
  attemptsSlider.disabled = noLimits;
  attemptsValue.style.opacity = noLimits ? '0.3' : '1';
  saveSetting('noLimits', noLimits);
});