# ColorMatch

A browser-based color memory game. A color fills the screen for a few seconds. You memorize it. When it disappears, you use three sliders to recreate it from memory as accurately as possible. The closer your guess is to the original, the higher your score.

---

## What it is

ColorMatch challenges your visual memory and color perception. Each round, a randomly generated color is displayed for a limited time. Once it disappears, you adjust three vertical sliders controlling Hue, Saturation, and Brightness to recreate the color you saw. Your guess is then scored using CIEDE2000 - a perceptual color difference formula - so the score reflects how different the colors actually look to the human eye, not just how far apart the slider values are.

---

## Features

- Three difficulty levels - Easy (5 s), Medium (3 s), Hard (1 s) - controlling how long the color is visible
- Configurable session length: 1 to 10 rounds, or limitless mode with no round cap
- Training mode - the color stays visible while you drag the sliders in real time, with a toggle to peek at the original at any time
- Perceptual scoring using CIEDE2000 with hue recovery and hue penalty adjustments
- Animated score display and per-round result screen showing both colors side by side
- End-of-session summary screen with diagonal split swatches for every round
- Local records system - save scores with a 3-letter name, browse by difficulty, search by initials, view per-round color breakdowns
- Fully responsive - works on mobile with touch input
- Installable as a PWA with offline support via a service worker

---

## Color generation

Every round, the hue is fully random (0-360 degrees). Saturation and lightness are constrained to a 20-80 percent range, avoiding extremes that would produce near-black, near-white, or fully desaturated colors that would be unfair or unreadable.

---

## Records

Records are saved locally in the browser using `localStorage`. They are never sent to a server. Each record stores the 3-letter name, total score, difficulty, number of attempts, and the full color data for every round so the per-round breakdown can be viewed later. Records can be deleted at any time from within the records panel.

---

Live at [color-match-colorgame.vercel.app](https://color-match-colorgame.vercel.app)
