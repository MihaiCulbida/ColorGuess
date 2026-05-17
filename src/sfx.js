let muted = false;

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
    slide: (v) => tone(180 + v * 220, 'sine', 0.003, 0.01, 0.12, 0.025),
  };
})();

(function restoreMute() {
  const s = loadSettings();
  if (s.muted) {
    muted = true;
    document.getElementById('muteIcon').src = 'img/volume-slash.png';
  }
})();

document.getElementById('muteBtn').addEventListener('click', () => {
  muted = !muted;
  document.getElementById('muteIcon').src = muted ? 'img/volume-slash.png' : 'img/volume.png';
  saveSetting('muted', muted);
});