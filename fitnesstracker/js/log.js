function setTab(tab) {
  activeTab = tab;
  try { localStorage.setItem('fs_last_tab', tab); } catch {}
  ['str', 'run', 'swm', 'cyc', 'spt'].forEach(t => {
    document.getElementById('form-' + t).style.display = t === tab ? '' : 'none';
    document.querySelectorAll('.skill-tab').forEach(el =>
      el.classList.toggle('active', el.classList.contains(t) && t === tab));
  });
  const note = document.getElementById('xpFormulaNote');
  if (note) note.classList.remove('show');
  updatePreview();
}

function setRunPreset(km) {
  const el = document.getElementById('run-distance');
  if (el) { el.value = km; updatePreview(); }
}

function getPreviewXp() {
  if (activeTab === 'str') return calcStrXp(
    parseFloat(document.getElementById('str-weight').value) || 0,
    parseInt(document.getElementById('str-sets').value) || 0,
    parseInt(document.getElementById('str-reps').value) || 0);
  if (activeTab === 'run') return calcRunXp(
    parseFloat(document.getElementById('run-distance').value) || 0,
    parseInt(document.getElementById('run-duration').value) || 0,
    document.getElementById('run-intensity').value);
  if (activeTab === 'swm') return calcSwmXp(
    parseFloat(document.getElementById('swm-distance').value) || 0,
    parseInt(document.getElementById('swm-duration').value) || 0,
    document.getElementById('swm-intensity').value);
  if (activeTab === 'spt') return calcSptXp(
    parseInt(document.getElementById('spt-duration').value) || 0,
    document.getElementById('spt-intensity').value);
  return calcCycXp(
    parseFloat(document.getElementById('cyc-distance').value) || 0,
    parseInt(document.getElementById('cyc-duration').value) || 0,
    document.getElementById('cyc-intensity').value);
}

// ── Running pace helpers ──
function formatPace(minPerKm) {
  if (!isFinite(minPerKm) || minPerKm <= 0) return '—';
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Returns the standard distance bracket label for a given distance, or null
function runDistanceBracket(d) {
  if (d >= 42.0 && d <= 42.4) return 'Marathon';
  if (d >= 21.0 && d <= 21.2) return 'Half Marathon';
  if (d >= 9.9  && d <= 10.1) return '10 km';
  if (d >= 4.9  && d <= 5.1)  return '5 km';
  if (d >= 2.9  && d <= 3.1)  return '3 km';
  if (d >= 0.99 && d <= 1.01) return '1 km';
  return null;
}

// PR key for a running pace PB: "Run PR: 5 km"
function runPRKey(bracket) { return `Run PR: ${bracket}`; }

function updatePreview() {
  if (!state) return;
  const xp = getPreviewXp();
  document.getElementById('xpPreview').textContent = xp.toLocaleString() + ' XP';
  const skill = state.skills[activeTab];
  const cur = levelFromXp(skill.xp), next = levelFromXp(skill.xp + xp);
  document.getElementById('xpPreviewNote').textContent = next > cur
    ? `→ Level up! ${cur} → ${next}`
    : `(${xpToNextLevel(skill.xp + xp).toLocaleString()} XP to next level)`;

  // Update running pace display
  const paceEl = document.getElementById('runPaceDisplay');
  if (paceEl && activeTab === 'run') {
    const d = parseFloat(document.getElementById('run-distance').value) || 0;
    const t = parseInt(document.getElementById('run-duration').value) || 0;
    if (d > 0 && t > 0) {
      const paceMinKm = t / d;
      const paceFormatted = formatPace(paceMinKm);
      const speedKmh = (d / t * 60).toFixed(1);
      const bracket = runDistanceBracket(d);
      const prs = getPRs();
      let prNote = '';
      if (bracket) {
        const key = runPRKey(bracket);
        const existing = prs[key];
        if (existing) {
          const existingPace = existing.value; // stored as min/km float
          if (paceMinKm < existingPace) {
            prNote = `<span class="pace-bracket-badge">🏅 New ${bracket} PB!</span>`;
          } else {
            const diff = paceMinKm - existingPace;
            prNote = `<span class="pace-bracket-badge">${bracket} PB: ${formatPace(existingPace)} (${formatPace(diff)} off)</span>`;
          }
        } else {
          prNote = `<span class="pace-bracket-badge">${bracket} — first attempt</span>`;
        }
      }
      paceEl.innerHTML = `
        <div class="pace-stat">
          <span class="pace-stat-val">${paceFormatted}</span>
          <span class="pace-stat-lbl">min / km</span>
        </div>
        <div class="pace-stat">
          <span class="pace-stat-val">${speedKmh}</span>
          <span class="pace-stat-lbl">km / h</span>
        </div>
        ${prNote}`;
    } else {
      paceEl.innerHTML = '';
    }
  } else if (paceEl) {
    paceEl.innerHTML = '';
  }
}

function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  grid.innerHTML = '';
  let totalXp = 0, totalLevel = 0;
  Object.entries(state.skills).forEach(([key, skill]) => {
    const level = levelFromXp(skill.xp);
    const pct = progressPercent(skill.xp);
    totalXp += skill.xp; totalLevel += level;
    const card = document.createElement('div');
    card.className = `skill-card ${key}`;
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="skill-header">
        <div class="skill-icon">${skill.icon}</div>
        <div><div class="skill-name">${skill.name}</div></div>
      </div>
      <div class="skill-level-row">
        <div class="skill-level">${level}</div>
        <div class="skill-level-max">/ 50</div>
      </div>
      <div class="xp-bar-wrap"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
      <div class="xp-text">
        <span class="xp-current">${skill.xp.toLocaleString()} XP</span>
        <span>${level < MAX_LEVEL ? xpToNextLevel(skill.xp).toLocaleString() + ' to go' : 'MAX LEVEL'}</span>
      </div>`;
    card.onclick = () => openSkillModal(key);
    grid.appendChild(card);
  });
  document.getElementById('totalXp').textContent = totalXp.toLocaleString();
  document.getElementById('totalLevel').textContent = totalLevel;
  document.getElementById('activitiesLogged').textContent = state.activities;
}

// ── Calendar state ──
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed

function renderLog() { renderCalendar(); } // keep compatibility

function renderCalendar() {
  const label = document.getElementById('calMonthLabel');
  const grid  = document.getElementById('calGrid');
  if (!label || !grid) return;

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  label.textContent = `${MONTHS[calMonth]} ${calYear}`;

  // Build a map of date string → entries
  const byDate = {};
  (state.log || []).forEach(e => {
    if (!e.date) return;
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  // First day of month — adjust so week starts Monday (0=Mon … 6=Sun)
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const offset   = (firstDay + 6) % 7; // Mon=0
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  grid.innerHTML = '';

  // Empty cells before first day
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const entries = byDate[dateStr] || [];
    const isToday = dateStr === todayStr;
    const hasAct  = entries.length > 0;

    const cell = document.createElement('div');
    cell.className = `cal-day ${hasAct ? 'has-activity' : 'inactive'}${isToday ? ' today' : ''}`;
    cell.innerHTML = `<span>${d}</span>`;

    if (hasAct) {
      // Show up to 3 colour dots for the skills logged that day
      const skills = [...new Set(entries.map(e => e.skill))].slice(0, 3);
      const dots = document.createElement('div');
      dots.className = 'cal-dots';
      skills.forEach(sk => {
        const dot = document.createElement('div');
        dot.className = `cal-dot ${sk}`;
        dots.appendChild(dot);
      });
      cell.appendChild(dots);
      cell.onclick = () => openDayModal(dateStr, entries);
    }

    grid.appendChild(cell);
  }
}

function calPrevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function calNextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

function openDayModal(dateStr, entries) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  document.getElementById('dayModalTitle').textContent = label;
  renderDayModalEntries(dateStr);
  document.getElementById('dayModal').classList.add('open');
}

function renderDayModalEntries(dateStr) {
  const body = document.getElementById('dayModalBody');
  const entries = (state.log || []).filter(e => e.date === dateStr);
  if (!entries.length) { closeDayModal(); return; }
  body.innerHTML = entries.map(e => `
    <div class="day-entry" data-id="${e.id}">
      <div class="day-entry-dot ${e.skill}"></div>
      <div class="day-entry-info">
        <div class="day-entry-name">${e.exercise}</div>
        <div class="day-entry-detail">${e.detail}</div>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <div>
          <div class="day-entry-xp">+${e.xp.toLocaleString()} XP</div>
          <div class="day-entry-time">${e.time || ''}</div>
        </div>
        <button class="btn-delete-entry" title="Delete entry" onclick="deleteEntry(${e.id}, '${dateStr}')">✕</button>
      </div>
    </div>`).join('');
}

function deleteEntry(id, dateStr) {
  const idx = state.log.findIndex(e => e.id === id);
  if (idx === -1) return;
  const entry = state.log[idx];

  // Reverse XP
  state.skills[entry.skill].xp = Math.max(0, state.skills[entry.skill].xp - entry.xp);
  state.activities = Math.max(0, (state.activities || 1) - 1);

  // Remove from log
  state.log.splice(idx, 1);

  // Rebuild PRs
  if (entry.skill === 'run') {
    // Rebuild all pace brackets that may have been affected
    const bracket = entry.prValue > 0 ? runDistanceBracket(entry.prValue) : null;
    if (bracket) rebuildPRsForExercise(runPRKey(bracket), 'run');
  } else {
    rebuildPRsForExercise(entry.exercise, entry.skill);
  }

  save();
  renderSkills();
  renderCalendar();
  renderDayModalEntries(dateStr);
}

function rebuildPRsForExercise(exercise, skill) {
  // Pace PR keys ("Run PR: 5 km") are rebuilt separately
  if (exercise.startsWith('Run PR: ')) {
    const bracket = exercise.replace('Run PR: ', '');
    const key = runPRKey(bracket);
    const records = state.log.filter(e =>
      e.skill === 'run' && e.prValue > 0 && runDistanceBracket(e.prValue) === bracket
    );
    if (!records.length) { delete state.prs[key]; return; }
    // Best pace = minimum min/km, stored as prValue for run? No — pace was stored separately.
    // Re-derive pace from detail or recompute. We stored detail as "Xkm in Y min (P/km)"
    // Re-parse pace from log entries that match this bracket
    let best = null;
    records.forEach(e => {
      // prValue for run is distance — re-derive pace from detail string
      const match = e.detail && e.detail.match(/\(([0-9]+):([0-9]+)\/km\)/);
      if (match) {
        const paceVal = parseInt(match[1]) + parseInt(match[2]) / 60;
        if (!best || paceVal < best.paceVal) best = { ...e, paceVal };
      }
    });
    if (best) {
      state.prs[key] = { skill: 'run', value: best.paceVal, unit: '/km', detail: best.detail, date: best.date, ispacePR: true, bracket };
    } else {
      delete state.prs[key];
    }
    return;
  }
  // Non-pace PRs: find highest prValue in log for this exercise
  const records = state.log.filter(e => e.exercise === exercise && e.skill === skill);
  if (!records.length) {
    delete state.prs[exercise];
    return;
  }
  const best = records.reduce((a, b) => (b.prValue > a.prValue ? b : a));
  state.prs[exercise] = { skill, value: best.prValue, unit: best.prUnit, detail: best.detail, date: best.date };
}

function closeDayModal() {
  document.getElementById('dayModal').classList.remove('open');
}

document.getElementById('dayModal').addEventListener('click', function(e) {
  if (e.target === this) closeDayModal();
});

function showLevelUp(skillName, newLevel, icon) {
  const t = document.createElement('div');
  t.className = 'levelup-toast';
  t.innerHTML = `<div class="lt-skill">${icon}</div><div class="lt-title">Level Up!</div><div class="lt-sub">${skillName} is now level ${newLevel}</div>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function logExercise() {
  const skill = state.skills[activeTab];
  const oldLevel = levelFromXp(skill.xp);
  let xp = 0, detail = '', exercise = '';
  let prValue = 0, prUnit = 'kg';

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const logDateEl = document.getElementById('log-date');
  const todayStr = now.toISOString().slice(0,10);
  const date = (logDateEl && logDateEl.value) ? logDateEl.value : todayStr;

  if (activeTab === 'str') {
    const w = parseFloat(document.getElementById('str-weight').value) || 0;
    const s = parseInt(document.getElementById('str-sets').value) || 0;
    const r = parseInt(document.getElementById('str-reps').value) || 0;
    const el = document.getElementById('str-exercise');
    exercise = el.options[el.selectedIndex].text;
    xp = calcStrXp(w, s, r); detail = `${s} sets × ${r} reps @ ${w}kg`;
    prValue = w; prUnit = 'kg';
    updateChallengeProgress('str', { w, s, r });
  } else if (activeTab === 'run') {
    const d = parseFloat(document.getElementById('run-distance').value) || 0;
    const t = parseInt(document.getElementById('run-duration').value) || 0;
    const i = document.getElementById('run-intensity').value;
    const el = document.getElementById('run-exercise');
    exercise = el.options[el.selectedIndex].text;
    const paceMinKm = d > 0 ? t / d : 0;
    xp = calcRunXp(d, t, i);
    detail = `${d}km in ${t} min (${formatPace(paceMinKm)}/km)`;
    prValue = d; prUnit = 'km';
    // Store pace PR for standard distance brackets
    const bracket = runDistanceBracket(d);
    if (bracket && paceMinKm > 0) {
      const key = runPRKey(bracket);
      const prs = getPRs();
      const existing = prs[key];
      if (!existing || paceMinKm < existing.value) {
        if (existing) showPBToast(bracket, formatPace(paceMinKm), '/km');
        prs[key] = { skill: 'run', value: paceMinKm, unit: '/km', detail, date, ispacePR: true, bracket };
      }
    }
    updateChallengeProgress('run', { d, t });
  } else if (activeTab === 'swm') {
    const d = parseFloat(document.getElementById('swm-distance').value) || 0;
    const t = parseInt(document.getElementById('swm-duration').value) || 0;
    const i = document.getElementById('swm-intensity').value;
    const el = document.getElementById('swm-exercise');
    exercise = el.options[el.selectedIndex].text;
    xp = calcSwmXp(d, t, i); detail = `${d}km in ${t} min`;
    prValue = d; prUnit = 'km';
    updateChallengeProgress('swm', { d, t });
  } else if (activeTab === 'spt') {
    const t = parseInt(document.getElementById('spt-duration').value) || 0;
    const i = document.getElementById('spt-intensity').value;
    const el = document.getElementById('spt-exercise');
    exercise = el.options[el.selectedIndex].text;
    xp = calcSptXp(t, i); detail = `${t} min`;
    prValue = t; prUnit = 'min';
    updateChallengeProgress('spt', { t });
  } else {
    const d = parseFloat(document.getElementById('cyc-distance').value) || 0;
    const t = parseInt(document.getElementById('cyc-duration').value) || 0;
    const i = document.getElementById('cyc-intensity').value;
    const el = document.getElementById('cyc-exercise');
    exercise = el.options[el.selectedIndex].text;
    xp = calcCycXp(d, t, i); detail = `${d}km in ${t} min`;
    prValue = d; prUnit = 'km';
    updateChallengeProgress('cyc', { d, t });
  }

  if (xp <= 0) return;
  skill.xp += xp; state.activities++;
  const entryId = Date.now() + Math.random();
  state.log.push({ id: entryId, skill: activeTab, exercise, detail, xp, time, date, prValue, prUnit });

  // Track personal records
  updatePR(activeTab, exercise, prValue, prUnit, detail, date);

  // Prune entries older than 3 years
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  state.log = state.log.filter(e => (e.date || '9999') >= cutoffStr);

  const newLevel = levelFromXp(skill.xp);
  if (newLevel > oldLevel) showLevelUp(skill.name, newLevel, skill.icon);

  save(); renderSkills(); renderLog(); updatePreview(); renderChallenges();
}
