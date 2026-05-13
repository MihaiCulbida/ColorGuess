function randomHSL() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(20 + Math.random() * 61);
  const l = Math.floor(20 + Math.random() * 61);
  return { h, s, l };
}

function hslStr({ h, s, l }) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function mapL(v) {
  if (v <= 50) return (v - 12) / (50 - 12) * 50;
  return 50 + (v - 50) / (88 - 50) * 50;
}

function mapS(v) {
  return (v - 20) / (95 - 20) * 100;
}

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
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
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
  const SL = 1 + 0.015 * (avg_L - 50) ** 2 / Math.sqrt(20 + (avg_L - 50) ** 2);
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