// CHALLENGE SYSTEM
// ══════════════════════════

// Pool of challenge templates per skill.
// Tiers: Beginner <10, Intermediate <25, Advanced <40, Elite 40+
const CHALLENGE_TEMPLATES = {
  str: [
    {
      id:'s1', skill:'str', icon:'🏋️', title:'Volume Week',
      desc: lvl => `Log ${lvl < 10 ? '1,000' : lvl < 25 ? '3,000' : lvl < 40 ? '6,000' : '10,000'}kg total lifting volume.`,
      metric:'volume',
      target: lvl => lvl < 10 ? 1000 : lvl < 25 ? 3000 : lvl < 40 ? 6000 : 10000,
      rewardXp: lvl => lvl < 10 ? 400 : lvl < 25 ? 900 : lvl < 40 ? 1500 : 2500,
    },
    {
      id:'s2', skill:'str', icon:'💪', title:'Session Streak',
      desc: lvl => `Complete ${lvl < 10 ? '2' : lvl < 25 ? '3' : lvl < 40 ? '4' : '5'} strength sessions this week.`,
      metric:'sessions',
      target: lvl => lvl < 10 ? 2 : lvl < 25 ? 3 : lvl < 40 ? 4 : 5,
      rewardXp: lvl => lvl < 10 ? 300 : lvl < 25 ? 700 : lvl < 40 ? 1200 : 1800,
    },
    {
      id:'s3', skill:'str', icon:'🔥', title:'Rep Grinder',
      desc: lvl => `Log ${lvl < 10 ? '50' : lvl < 25 ? '100' : lvl < 40 ? '150' : '200'} total reps this week.`,
      metric:'reps',
      target: lvl => lvl < 10 ? 50 : lvl < 25 ? 100 : lvl < 40 ? 150 : 200,
      rewardXp: lvl => lvl < 10 ? 350 : lvl < 25 ? 800 : lvl < 40 ? 1300 : 2000,
    },
    {
      id:'s4', skill:'str', icon:'⚔️', title:'Heavy Lifter',
      desc: lvl => `Log a set of 5+ reps at ${lvl < 10 ? '40' : lvl < 25 ? '60' : lvl < 40 ? '80' : '100'}kg or more.`,
      metric:'heavy',
      target: lvl => 1,
      heavyThreshold: lvl => lvl < 10 ? 40 : lvl < 25 ? 60 : lvl < 40 ? 80 : 100,
      rewardXp: lvl => lvl < 10 ? 250 : lvl < 25 ? 600 : lvl < 40 ? 1000 : 1500,
    },
  ],
  run: [
    {
      id:'r1', skill:'run', icon:'🏃', title:'Distance Week',
      desc: lvl => `Cover ${lvl < 10 ? '5' : lvl < 25 ? '10' : lvl < 40 ? '15' : '20'}km total this week.`,
      metric:'distance',
      target: lvl => lvl < 10 ? 5 : lvl < 25 ? 10 : lvl < 40 ? 15 : 20,
      rewardXp: lvl => lvl < 10 ? 400 : lvl < 25 ? 900 : lvl < 40 ? 1400 : 2000,
    },
    {
      id:'r2', skill:'run', icon:'⚡', title:'Speed Sessions',
      desc: lvl => `Log ${lvl < 10 ? '1' : lvl < 25 ? '2' : '3'} sprint or HIIT sessions this week.`,
      metric:'sessions',
      target: lvl => lvl < 10 ? 1 : lvl < 25 ? 2 : 3,
      rewardXp: lvl => lvl < 10 ? 300 : lvl < 25 ? 700 : lvl < 40 ? 1200 : 1600,
    },
    {
      id:'r3', skill:'run', icon:'🎯', title:'Time on Feet',
      desc: lvl => `Accumulate ${lvl < 10 ? '60' : lvl < 25 ? '90' : lvl < 40 ? '120' : '180'} minutes of agility training.`,
      metric:'duration',
      target: lvl => lvl < 10 ? 60 : lvl < 25 ? 90 : lvl < 40 ? 120 : 180,
      rewardXp: lvl => lvl < 10 ? 350 : lvl < 25 ? 800 : lvl < 40 ? 1300 : 1800,
    },
    {
      id:'r4', skill:'run', icon:'🏅', title:'Active Days',
      desc: lvl => `Log agility activity on ${lvl < 10 ? '2' : lvl < 25 ? '3' : '4'} different days this week.`,
      metric:'days',
      target: lvl => lvl < 10 ? 2 : lvl < 25 ? 3 : 4,
      rewardXp: lvl => lvl < 10 ? 450 : lvl < 25 ? 1000 : lvl < 40 ? 1600 : 2200,
    },
  ],
  swm: [
    {
      id:'w1', skill:'swm', icon:'🏊', title:'Distance Grind',
      desc: lvl => `Swim ${lvl < 10 ? '1' : lvl < 25 ? '3' : lvl < 40 ? '6' : '10'}km this week.`,
      metric:'distance',
      target: lvl => lvl < 10 ? 1 : lvl < 25 ? 3 : lvl < 40 ? 6 : 10,
      rewardXp: lvl => lvl < 10 ? 450 : lvl < 25 ? 1000 : lvl < 40 ? 1800 : 2800,
    },
    {
      id:'w2', skill:'swm', icon:'🌊', title:'Pool Sessions',
      desc: lvl => `Complete ${lvl < 10 ? '2' : lvl < 25 ? '3' : lvl < 40 ? '4' : '5'} swimming sessions this week.`,
      metric:'sessions',
      target: lvl => lvl < 10 ? 2 : lvl < 25 ? 3 : lvl < 40 ? 4 : 5,
      rewardXp: lvl => lvl < 10 ? 400 : lvl < 25 ? 900 : lvl < 40 ? 1600 : 2500,
    },
    {
      id:'w3', skill:'swm', icon:'⏱️', title:'Time in Water',
      desc: lvl => `Accumulate ${lvl < 10 ? '60' : lvl < 25 ? '120' : lvl < 40 ? '180' : '240'} minutes of swimming.`,
      metric:'duration',
      target: lvl => lvl < 10 ? 60 : lvl < 25 ? 120 : lvl < 40 ? 180 : 240,
      rewardXp: lvl => lvl < 10 ? 350 : lvl < 25 ? 800 : lvl < 40 ? 1400 : 2000,
    },
    {
      id:'w4', skill:'swm', icon:'📅', title:'Consistent Swimmer',
      desc: lvl => `Log swimming on ${lvl < 10 ? '2' : lvl < 25 ? '2' : '3'} different days.`,
      metric:'days',
      target: lvl => lvl < 10 ? 2 : lvl < 25 ? 2 : 3,
      rewardXp: lvl => lvl < 10 ? 300 : lvl < 25 ? 700 : lvl < 40 ? 1200 : 1800,
    },
  ],
  cyc: [
    {
      id:'c1', skill:'cyc', icon:'🚴', title:'Cycling Distance',
      desc: lvl => `Cycle ${lvl < 10 ? '20' : lvl < 25 ? '50' : lvl < 40 ? '80' : '120'}km this week.`,
      metric:'distance',
      target: lvl => lvl < 10 ? 20 : lvl < 25 ? 50 : lvl < 40 ? 80 : 120,
      rewardXp: lvl => lvl < 10 ? 400 : lvl < 25 ? 900 : lvl < 40 ? 1500 : 2500,
    },
    {
      id:'c2', skill:'cyc', icon:'⏱️', title:'Saddle Time',
      desc: lvl => `Accumulate ${lvl < 10 ? '60' : lvl < 25 ? '120' : lvl < 40 ? '180' : '240'} minutes of cycling.`,
      metric:'duration',
      target: lvl => lvl < 10 ? 60 : lvl < 25 ? 120 : lvl < 40 ? 180 : 240,
      rewardXp: lvl => lvl < 10 ? 350 : lvl < 25 ? 800 : lvl < 40 ? 1300 : 2000,
    },
    {
      id:'c3', skill:'cyc', icon:'📅', title:'Riding Days',
      desc: lvl => `Ride on ${lvl < 10 ? '2' : lvl < 25 ? '3' : '4'} different days this week.`,
      metric:'days',
      target: lvl => lvl < 10 ? 2 : lvl < 25 ? 3 : 4,
      rewardXp: lvl => lvl < 10 ? 450 : lvl < 25 ? 1000 : lvl < 40 ? 1600 : 2200,
    },
    {
      id:'c4', skill:'cyc', icon:'🏔️', title:'Century Ride',
      desc: lvl => `Complete a single ride of ${lvl < 10 ? '15' : lvl < 25 ? '40' : lvl < 40 ? '60' : '100'}km.`,
      metric:'distance',
      target: lvl => lvl < 10 ? 15 : lvl < 25 ? 40 : lvl < 40 ? 60 : 100,
      rewardXp: lvl => lvl < 10 ? 500 : lvl < 25 ? 1100 : lvl < 40 ? 1800 : 3000,
    },
  ],
  spt: [
    {
      id:'p1', skill:'spt', icon:'⚽', title:'Game Day',
      desc: lvl => `Play ${lvl < 10 ? '1' : lvl < 25 ? '2' : lvl < 40 ? '3' : '4'} sport session${lvl < 10 ? '' : 's'} this week.`,
      metric:'sessions',
      target: lvl => lvl < 10 ? 1 : lvl < 25 ? 2 : lvl < 40 ? 3 : 4,
      rewardXp: lvl => lvl < 10 ? 350 : lvl < 25 ? 800 : lvl < 40 ? 1300 : 2000,
    },
    {
      id:'p2', skill:'spt', icon:'⏱️', title:'Time on Court',
      desc: lvl => `Accumulate ${lvl < 10 ? '60' : lvl < 25 ? '120' : lvl < 40 ? '180' : '240'} minutes of sport this week.`,
      metric:'duration',
      target: lvl => lvl < 10 ? 60 : lvl < 25 ? 120 : lvl < 40 ? 180 : 240,
      rewardXp: lvl => lvl < 10 ? 400 : lvl < 25 ? 900 : lvl < 40 ? 1500 : 2200,
    },
    {
      id:'p3', skill:'spt', icon:'📅', title:'Active Week',
      desc: lvl => `Play sport on ${lvl < 10 ? '2' : lvl < 25 ? '3' : '4'} different days this week.`,
      metric:'days',
      target: lvl => lvl < 10 ? 2 : lvl < 25 ? 3 : 4,
      rewardXp: lvl => lvl < 10 ? 500 : lvl < 25 ? 1100 : lvl < 40 ? 1800 : 2600,
    },
    {
      id:'p4', skill:'spt', icon:'🏆', title:'Marathon Match',
      desc: lvl => `Complete a single session of ${lvl < 10 ? '60' : lvl < 25 ? '90' : lvl < 40 ? '120' : '150'} minutes or more.`,
      metric:'single_duration',
      target: lvl => lvl < 10 ? 60 : lvl < 25 ? 90 : lvl < 40 ? 120 : 150,
      rewardXp: lvl => lvl < 10 ? 450 : lvl < 25 ? 1000 : lvl < 40 ? 1600 : 2400,
    },
  ],
};

// Build a resolved challenge object for a given template + current level
function resolveChallenge(tmpl, level) {
  return {
    id: tmpl.id,
    skill: tmpl.skill,
    icon: tmpl.icon,
    title: tmpl.title,
    desc: tmpl.desc(level),
    metric: tmpl.metric,
    target: tmpl.target(level),
    heavyThreshold: tmpl.heavyThreshold ? tmpl.heavyThreshold(level) : null,
    rewardXp: tmpl.rewardXp(level),
  };
}

// Build the pool for display/selection at current skill level
function getChallengePool(skill) {
  const level = levelFromXp(state.skills[skill].xp);
  return CHALLENGE_TEMPLATES[skill].map(t => resolveChallenge(t, level));
}

// Get ISO week string for current week e.g. "2026-W12"
function currentWeekKey() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

function daysUntilMonday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  return day === 1 ? 7 : (8 - day) % 7;
}

// Returns or initialises challenges state for the current week
function getChallengesState() {
  const wk = currentWeekKey();
  if (!state.challenges || state.challenges.week !== wk) {
    // Archive the outgoing week's completion status before resetting
    if (state.challenges && state.challenges.week) {
      if (!state.challengeHistory) state.challengeHistory = [];
      const anyComplete = Object.values(state.challenges.completed || {}).some(Boolean);
      state.challengeHistory.push({ week: state.challenges.week, anyComplete });
      // Keep only last 52 weeks
      if (state.challengeHistory.length > 52) state.challengeHistory.shift();
    }
    state.challenges = {
      week: wk,
      chosen: { str: null, run: null, swm: null, cyc: null, spt: null },
      progress: {},
      completed: { str: false, run: false, swm: false, cyc: false, spt: false },
      weekLog: [],
    };
  }
  return state.challenges;
}

// Count consecutive weeks (ending last week) where at least one challenge was completed
function calcChallengeStreak() {
  const history = state.challengeHistory || [];
  if (!history.length) return 0;
  // Sort descending by week key
  const sorted = [...history].sort((a, b) => b.week.localeCompare(a.week));
  let streak = 0;
  for (const entry of sorted) {
    if (entry.anyComplete) streak++;
    else break;
  }
  return streak;
}

function getChallengeById(id) {
  for (const templates of Object.values(CHALLENGE_TEMPLATES)) {
    const tmpl = templates.find(t => t.id === id);
    if (tmpl) {
      // Resolve at current level of that skill
      const skill = tmpl.skill;
      const level = levelFromXp(state.skills[skill].xp);
      return resolveChallenge(tmpl, level);
    }
  }
  return null;
}

// ── Update challenge progress after a logged activity ──
function updateChallengeProgress(skill, exerciseData) {
  const cs = getChallengesState();
  const chosenId = cs.chosen[skill];
  if (!chosenId || cs.completed[skill]) return;

  const challenge = getChallengeById(chosenId);
  if (!challenge) return;

  if (!cs.progress[chosenId]) cs.progress[chosenId] = 0;

  const today = new Date().toDateString();
  if (!cs.weekLog) cs.weekLog = [];

  let gained = 0;

  if (challenge.metric === 'volume') {
    // exerciseData: { w, s, r }
    gained = (exerciseData.w || 0) * (exerciseData.s || 0) * (exerciseData.r || 0);
  } else if (challenge.metric === 'sessions') {
    gained = 1;
  } else if (challenge.metric === 'reps') {
    gained = (exerciseData.s || 0) * (exerciseData.r || 0);
  } else if (challenge.metric === 'heavy') {
    // counts if weight >= level-scaled threshold and reps >= 5
    const threshold = challenge.heavyThreshold || 100;
    if ((exerciseData.w || 0) >= threshold && (exerciseData.r || 0) >= 5) gained = 1;
  } else if (challenge.metric === 'distance') {
    gained = exerciseData.d || 0;
  } else if (challenge.metric === 'duration') {
    gained = exerciseData.t || 0;
  } else if (challenge.metric === 'single_duration') {
    // Complete if a single session meets the target
    if ((exerciseData.t || 0) >= challenge.target) gained = challenge.target - (cs.progress[chosenId] || 0);
  } else if (challenge.metric === 'days') {
    // Only count if this is a new day for this skill this week
    const dayKey = `${skill}-${today}`;
    if (!cs.weekLog.includes(dayKey)) {
      cs.weekLog.push(dayKey);
      gained = 1;
    }
  }

  cs.progress[chosenId] = (cs.progress[chosenId] || 0) + gained;

  // Check completion
  if (cs.progress[chosenId] >= challenge.target) {
    cs.progress[chosenId] = challenge.target; // cap
    cs.completed[skill] = true;
    // Award bonus XP
    state.skills[skill].xp += challenge.rewardXp;
    showChallengeComplete(challenge);
  }
}

function showChallengeComplete(challenge) {
  const toast = document.createElement('div');
  toast.className = 'challenge-toast';
  toast.innerHTML = `
    <div class="ct-icon">${challenge.icon}</div>
    <div class="ct-title">Challenge Complete!</div>
    <div class="ct-sub">${challenge.title} — +${challenge.rewardXp.toLocaleString()} XP</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Render the challenges panel ──
function renderChallenges() {
  const cs = getChallengesState();
  const body = document.getElementById('challengesBody');
  const resetLabel = document.getElementById('challengeResetLabel');
  const streakLabel = document.getElementById('challengeStreakLabel');
  if (!body) return;

  const days = daysUntilMonday();
  resetLabel.textContent = `Resets in ${days} day${days !== 1 ? 's' : ''}`;

  // Streak: count consecutive past weeks where at least one challenge was completed
  const streak = calcChallengeStreak();
  if (streakLabel) {
    streakLabel.textContent = streak > 0 ? `🔥 ${streak} week streak` : '';
    streakLabel.style.display = streak > 0 ? '' : 'none';
  }

  const skills = ['str','run','swm','cyc','spt'];
  const skillLabels = { str:'Strength', run:'Running', swm:'Swimming', cyc:'Cycling', spt:'Sports' };
  const skillIcons  = { str:'💪', run:'🏃', swm:'🏊', cyc:'🚴', spt:'⚽' };

  body.innerHTML = '';

  skills.forEach(skill => {
    const chosenId = cs.chosen[skill];
    const challenge = chosenId ? getChallengeById(chosenId) : null;
    const completed = cs.completed[skill];
    const progress = chosenId ? (cs.progress[chosenId] || 0) : 0;

    const card = document.createElement('div');

    if (!challenge) {
      // Not yet chosen — show selectable card
      card.className = `challenge-card ${skill} selectable`;
      card.onclick = () => openChallengeModal(skill);
      card.innerHTML = `
        <div class="challenge-card-top">
          <div class="challenge-skill-badge">${skillIcons[skill]} ${skillLabels[skill]}</div>
          <div class="challenge-title" style="color:var(--text-dim);font-style:italic">No challenge selected</div>
        </div>
        <div class="challenge-card-body">
          <div class="challenge-desc">Tap to choose your ${skillLabels[skill]} challenge for this week.</div>
        </div>`;
    } else {
      const pct = Math.min(100, (progress / challenge.target) * 100);
      const targetDisplay = challenge.metric === 'duration'
        ? `${challenge.target} min`
        : challenge.metric === 'distance'
        ? `${challenge.target} km`
        : challenge.metric === 'volume'
        ? `${challenge.target.toLocaleString()} kg`
        : `${challenge.target}`;
      const progressDisplay = challenge.metric === 'duration'
        ? `${Math.round(progress)} min`
        : challenge.metric === 'distance'
        ? `${progress.toFixed(1)} km`
        : challenge.metric === 'volume'
        ? `${Math.round(progress).toLocaleString()} kg`
        : `${Math.round(progress)}`;

      card.className = `challenge-card ${skill}${completed ? ' completed' : ''}`;
      card.innerHTML = `
        <div class="challenge-card-top">
          <div class="challenge-skill-badge">${skillIcons[skill]} ${skillLabels[skill]}</div>
          <div class="challenge-title">${challenge.icon} ${challenge.title}</div>
        </div>
        <div class="challenge-card-body">
          <div class="challenge-desc">${challenge.desc}</div>
          <div class="challenge-progress-wrap">
            <div class="challenge-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="challenge-progress-text">
            <span class="prog-val">${progressDisplay}</span>
            <span>${targetDisplay}</span>
          </div>
          <div class="challenge-reward">🏆 Reward: +${challenge.rewardXp.toLocaleString()} XP</div>
          <div class="challenge-complete-badge">✦ Completed</div>
        </div>`;
    }

    body.appendChild(card);
  });
}

// ── Challenge selection modal ──
let challengeModalSkill = null;

function openChallengeModal(skill) {
  challengeModalSkill = skill;
  const skillLabels = { str:'Strength', run:'Running', swm:'Swimming', cyc:'Cycling', spt:'Sports' };
  const level = levelFromXp(state.skills[skill].xp);
  const tier = level < 10 ? 'Beginner' : level < 25 ? 'Intermediate' : level < 40 ? 'Advanced' : 'Elite';
  document.getElementById('challengeModalTitle').textContent = `${skillLabels[skill]} Challenges · ${tier} (Lv. ${level})`;

  const optionsEl = document.getElementById('challengeModalOptions');
  optionsEl.innerHTML = '';

  getChallengePool(skill).forEach(ch => {
    const opt = document.createElement('div');
    opt.className = 'challenge-option';
    opt.id = `ch-opt-${ch.id}`;
    opt.innerHTML = `
      <div class="challenge-option-icon">${ch.icon}</div>
      <div class="challenge-option-info">
        <div class="challenge-option-title">${ch.title}</div>
        <div class="challenge-option-desc">${ch.desc}</div>
        <div class="challenge-option-confirm">
          <button class="btn-confirm-challenge" onclick="selectChallenge('${skill}','${ch.id}')">✦ Confirm</button>
          <button class="btn-cancel-challenge" onclick="cancelChallengePending()">Cancel</button>
        </div>
      </div>
      <div class="challenge-option-xp">+${ch.rewardXp.toLocaleString()} XP</div>`;
    opt.onclick = (e) => {
      // Don't trigger if clicking the confirm/cancel buttons
      if (e.target.closest('.challenge-option-confirm')) return;
      pendingChallengeOption(ch.id);
    };
    optionsEl.appendChild(opt);
  });

  document.getElementById('challengeModal').classList.add('open');
}

function closeChallengeModal() {
  document.getElementById('challengeModal').classList.remove('open');
  challengeModalSkill = null;
}

function pendingChallengeOption(id) {
  document.querySelectorAll('.challenge-option').forEach(el => el.classList.remove('pending'));
  const opt = document.getElementById(`ch-opt-${id}`);
  if (opt) opt.classList.add('pending');
}

function cancelChallengePending() {
  document.querySelectorAll('.challenge-option').forEach(el => el.classList.remove('pending'));
}

function selectChallenge(skill, id) {
  const cs = getChallengesState();
  cs.chosen[skill] = id;
  cs.progress[id] = cs.progress[id] || 0;
  save();
  closeChallengeModal();
  renderChallenges();
}

document.getElementById('challengeModal').addEventListener('click', function(e) {
  if (e.target === this) closeChallengeModal();
});

// ══════════════════════════
// PROFILE & GOALS
// ══════════════════════════

// ══════════════════════════
// GPX IMPORT
// ══════════════════════════

// Haversine distance between two lat/lng points in km
