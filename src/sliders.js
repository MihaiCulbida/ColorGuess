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
const card = document.querySelector('.card');
const submitBtn = document.getElementById('submitBtn');

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

function updateCounterColor(h, s, l) {
  const roundCounter = document.getElementById('roundCounter');
  roundCounter.style.color = getAdaptiveColor(h, mapS(s), mapL(l), 0.5);
}

function updateGameBtnColors(h, s, l) {
  const isDarkCard = card.style.background === '#0c0c0e' || card.style.background === 'rgb(12, 12, 14)';
  const adaptive = isDarkCard ? 'rgba(255,255,255,0.15)' : getAdaptiveColor(h, mapS(s), mapL(l), 0.12);
  const adaptiveBorder = isDarkCard ? 'rgba(255,255,255,0.25)' : getAdaptiveColor(h, mapS(s), mapL(l), 0.18);
  const imgFilter = isDarkCard ? 'invert(1)' : (() => {
    const cardS = mapS(s), cardL = mapL(l);
    const sn = cardS/100, ln = cardL/100;
    const c = (1-Math.abs(2*ln-1))*sn, x = c*(1-Math.abs((h/60)%2-1)), m = ln-c/2;
    const [r,g,b] = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h/60)%6].map(v=>{const lin=v+m;return lin<=0.04045?lin/12.92:Math.pow((lin+0.055)/1.055,2.4);});
    const perceived = 0.2126*r+0.7152*g+0.0722*b;
    return perceived > 0.179 ? 'invert(0)' : 'invert(1)';
  })();

  const toggleBtn = document.getElementById('toggleViewBtn');
  toggleBtn.style.background = adaptive;
  toggleBtn.style.borderColor = adaptiveBorder;
  toggleBtn.querySelector('img').style.filter = imgFilter;
  submitBtn.style.background = adaptive;
  submitBtn.style.borderColor = adaptiveBorder;
  submitBtn.querySelector('img').style.filter = imgFilter;
  const exitBtn = document.getElementById('trainingExitBtn');
  if (exitBtn) {
    exitBtn.querySelector('img').style.filter = imgFilter;
  }
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

let labelTimeout;

function showSliderLabel(text) {
  let lbl = document.getElementById('sliderLabel');
  if (!lbl) {
    lbl = document.createElement('div');
    lbl.id = 'sliderLabel';
    document.querySelector('.hsl-panel').appendChild(lbl);
  }
  lbl.textContent = text;
  lbl.style.opacity = '1';
  clearTimeout(labelTimeout);
  labelTimeout = setTimeout(() => { lbl.style.opacity = '0'; }, 1500);
  const { h, s, l } = vals();
  lbl.style.color = getAdaptiveColor(h, mapS(s), mapL(l), 0.4);
}

buildHueBg();
updateSliders();
updateThumbs();

[hS, sS, lS].forEach(r => r.addEventListener('input', update));
hS.addEventListener('input', () => showSliderLabel('HUE'));
sS.addEventListener('input', () => showSliderLabel('SATURATION'));
lS.addEventListener('input', () => showSliderLabel('BRIGHTNESS'));

let slideThrottle = 0;
[hS, sS, lS].forEach(r => r.addEventListener('input', () => {
  const now = performance.now();
  if (now - slideThrottle < 40) return;
  slideThrottle = now;
  const min = +r.min, max = +r.max;
  sfx.slide((+r.value - min) / (max - min));
}));

document.getElementById('hslPanel').addEventListener('touchmove', e => e.preventDefault(), { passive: false });