function getScorePhrase(score) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (score === 10) return pick(["Impossible.", "Are you cheating?", "Pixel perfect.", "That's not human."]);
  if (score >= 9.8) return pick(["Essentially perfect.", "Frighteningly accurate.", "Your eyes are calibrated.", "That's unsettling.", "Save this screenshot."]);
  if (score >= 9.5) return pick(["Uncanny.", "You barely missed.", "Almost doesn't cover it.", "One step from perfect.", "Your retinas are lying."]);
  if (score >= 9.0) return pick(["Really sharp.", "You have a good eye.", "Dialed in.", "Colour-blind people hate you.", "Close enough to hurt."]);
  if (score >= 8.5) return pick(["Solid.", "You're getting it.", "Nearly there.", "A squint away from perfect.", "Strong effort."]);
  if (score >= 8.0) return pick(["Good eye.", "Above average, clearly.", "You've done this before.", "Respectable.", "That's a good guess."]);
  if (score >= 7.5) return pick(["Not bad.", "Closer than it looks.", "You felt it.", "Decent instinct.", "Your eyes are warming up."]);
  if (score >= 7.0) return pick(["Pretty close.", "In the right zone.", "Getting warmer.", "Almost on it."]);
  if (score >= 6.0) return pick(["Okay.", "Not embarrassing.", "You tried.", "Average at best.", "Right vibe, wrong color, wrong shade, wrong planet."]);
  if (score >= 5.0) return pick(["Middling.", "You were in the neighbourhood.", "Could be worse.", "Not your best work."]);
  if (score >= 4.0) return pick(["Off.", "You guessed, didn't you?", "The hue was a stretch.", "Questionable.", "Somewhere in the ballpark."]);
  if (score >= 3.0) return pick(["Wide of the mark.", "Were you even looking?", "Bold choice.", "That's a different colour.", "Room to improve is an understatement."]);
  if (score >= 2.0) return pick(["Yikes.", "That was brave.", "Interesting interpretation.", "Try again.", "The colour disagreed with you."]);
  if (score >= 1.0) return pick(["Oh.", "We don't talk about this one.", "A valiant failure.", "Colours are hard, apparently.", "The colour had other plans."]);
  return pick(["0 doesn't exist, yet here we are.", "Impressive, in a bad way.", "That was something.", "Did you close your eyes?", "Back to basics."]);
}

function getFinalPhrase(pct) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (pct >= 98) return pick(["You might actually be a monitor.", "Suspiciously good.", "We're checking for cheats.", "Inhuman precision."]);
  if (pct >= 90) return pick(["Exceptional. Genuinely.", "Your eyes are a weapon.", "Top tier colour instinct.", "Almost unsettling how good that was."]);
  if (pct >= 80) return pick(["Really strong overall.", "You clearly have an eye for this.", "Solid session.", "Above average doesn't cut it — that was great."]);
  if (pct >= 70) return pick(["Good, not great.", "Respectable. Room to grow.", "You're getting there.", "Fine dining at Applebee's."]);
  if (pct >= 60) return pick(["Decent enough.", "Average with flashes of brilliance.", "Some good, some rough.", "Could be worse. Could be better."]);
  if (pct >= 50) return pick(["Right down the middle.", "Perfectly mediocre.", "Exactly half of what's possible.", "The definition of average."]);
  if (pct >= 35) return pick(["Below average, but you tried.", "The colours weren't cooperating.", "Rough session.", "There's nowhere to go but up."]);
  if (pct >= 20) return pick(["That was a struggle.", "The colours won this time.", "Maybe try training mode first.", "Bold attempt."]);
  return pick(["We don't talk about this.", "Did you play with your eyes closed?", "Impressively bad.", "Back to basics."]);
}