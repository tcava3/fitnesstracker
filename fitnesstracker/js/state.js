// ── OSRS XP formula ──
// ── XP formula scaled for level 1–50 ──
// Uses the OSRS formula but compressed so level 50 is the cap.
// Level 50 requires ~375k XP — achievable but takes real sustained effort.
function xpForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += Math.floor(l + 300 * Math.pow(2, l / 5));
  }
  return Math.floor(total / 4);
}
const MAX_LEVEL = 50;
const XP_TABLE = [];
for (let i = 1; i <= MAX_LEVEL; i++) XP_TABLE.push(xpForLevel(i));

function levelFromXp(xp) {
  let level = 1;
  for (let i = MAX_LEVEL - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i]) { level = i + 1; break; }
  }
  return Math.min(level, MAX_LEVEL);
}
function xpToNextLevel(xp) {
  const l = levelFromXp(xp);
  return l >= MAX_LEVEL ? 0 : XP_TABLE[l] - xp;
}
function progressPercent(xp) {
  const l = levelFromXp(xp);
  if (l >= MAX_LEVEL) return 100;
  return ((xp - XP_TABLE[l - 1]) / (XP_TABLE[l] - XP_TABLE[l - 1])) * 100;
}
