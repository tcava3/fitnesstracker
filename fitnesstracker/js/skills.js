// ── XP formulas ──
function calcStrXp(w, s, r) { return Math.round(s * r * w * 0.08); }
function calcRunXp(d, t, intensity) {
  const pace = t / Math.max(d, 0.01);
  const pb = pace < 6 ? 1.2 : pace < 8 ? 1.0 : 0.85;
  return Math.round(d * 30 * parseFloat(intensity) * pb);
}
function calcSwmXp(d, t, intensity) {
  return Math.round((d * 60 + t * 0.8) * parseFloat(intensity));
}
function calcCycXp(d, t, intensity) {
  return Math.round((d * 10 + t * 0.3) * parseFloat(intensity));
}

function calcSptXp(t, intensity) {
  return Math.round(t * 1.2 * parseFloat(intensity));
}

const XP_FORMULAS = {
  str: '<strong>Strength XP</strong> = Sets × Reps × Weight (kg) × 0.08<br>Heavier lifts and more volume earn more XP.',
  run: '<strong>Running XP</strong> = Distance (km) × 30 × Intensity × Pace bonus<br>Sub-6:00/km pace earns a 20% bonus. Sub-8:00/km is neutral. Slower gets a small penalty. Your pace and speed are shown live as you type.',
  swm: '<strong>Swimming XP</strong> = (Distance × 60 + Duration × 0.8) × Intensity<br>Both distance and time in the water contribute.',
  cyc: '<strong>Cycling XP</strong> = (Distance × 10 + Duration × 0.3) × Intensity<br>Longer rides and higher effort earn more XP.',
  spt: '<strong>Sports XP</strong> = Duration (min) × 1.2 × Intensity<br>Competitive games earn more XP than casual training. Tournaments earn the most.',
};

function toggleXpInfo() {
  const note = document.getElementById('xpFormulaNote');
  if (!note) return;
  const isShowing = note.classList.contains('show');
  if (isShowing) { note.classList.remove('show'); return; }
  note.innerHTML = XP_FORMULAS[activeTab] || '';
  note.classList.add('show');
}
let activeTab = 'str';

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

// ── Skill detail modal ──
const SKILL_COLORS = {
  str: '#e05050', run: '#50c878', swm: '#5090e0', cyc: '#e0a030', spt: '#c060e0'
};

// Active run filter bracket
let _runFilter = 'all';
let _currentRunEntries = [];

function openSkillModal(skillKey) {
  const skill = state.skills[skillKey];
  document.getElementById('skillModalIcon').textContent = skill.icon;
  document.getElementById('skillModalTitle').textContent = skill.name;
  _runFilter = 'all';

  const entries = (state.log || [])
    .filter(e => e.skill === skillKey)
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  const labels = {
    str: 'Weekly Volume (kg)', run: 'Pace per Run (min/km)',
    swm: 'Weekly Distance & Duration', cyc: 'Weekly Distance (km)', spt: 'Sessions & Duration per Week'
  };
  document.getElementById('skillChartLabel').textContent = labels[skillKey];

  const filtersEl = document.getElementById('skillChartFilters');
  if (skillKey === 'run') {
    _currentRunEntries = entries;
    const brackets = ['all', '1 km', '3 km', '5 km', '10 km', 'Half Marathon', 'Marathon'];
    filtersEl.innerHTML = brackets.map(b =>
      `<button class="skill-filter-btn${b === _runFilter ? ' active' : ''}" onclick="setRunFilter('${b}')">${b === 'all' ? 'All' : b}</button>`
    ).join('');
  } else {
    filtersEl.innerHTML = '';
  }

  renderSkillChart(entries, skillKey);
  renderSkillRecent(entries, skillKey);
  document.getElementById('skillModal').classList.add('open');
}

function setRunFilter(bracket) {
  _runFilter = bracket;
  document.querySelectorAll('.skill-filter-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === (bracket === 'all' ? 'All' : bracket));
  });
  renderSkillChart(_currentRunEntries, 'run');
}

function closeSkillModal() {
  document.getElementById('skillModal').classList.remove('open');
}

function isoWeek(dateStr) {
  const d = new Date(dateStr);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const week = Math.floor((d - startOfWeek1) / 604800000) + 1;
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

function renderSkillChart(entries, skillKey) {
  const canvas = document.getElementById('skillProgressChart');
  const canvas2 = document.getElementById('skillProgressChart2');
  const emptyEl = document.getElementById('skillChartEmpty');

  canvas2.style.display = 'none';

  if (entries.length === 0) {
    canvas.style.display = 'none'; emptyEl.style.display = 'block'; return;
  }
  canvas.style.display = 'block'; emptyEl.style.display = 'none';

  const color = SKILL_COLORS[skillKey];

  function setupCanvas(c) {
    const dpr = window.devicePixelRatio || 1;
    const W = c.offsetWidth || c.parentElement.offsetWidth || 300;
    const H = 140;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
    return { ctx, W, H };
  }

  if (skillKey === 'run') {
    canvas2.style.display = 'block';
    const c1 = setupCanvas(canvas);
    const c2 = setupCanvas(canvas2);
    drawRunPaceChart(c1.ctx, entries, c1.W, c1.H, color);
    drawRunDistanceChart(c2.ctx, entries, c2.W, c2.H, color);
  } else if (skillKey === 'swm') {
    canvas2.style.display = 'block';
    const c1 = setupCanvas(canvas);
    const c2 = setupCanvas(canvas2);
    drawSwmDistanceChart(c1.ctx, entries, c1.W, c1.H, color);
    drawSwmDurationChart(c2.ctx, entries, c2.W, c2.H, color);
  } else if (skillKey === 'cyc') {
    canvas2.style.display = 'block';
    const c1 = setupCanvas(canvas);
    const c2 = setupCanvas(canvas2);
    drawCycDistanceChart(c1.ctx, entries, c1.W, c1.H, color);
    drawCycSpeedChart(c2.ctx, entries, c2.W, c2.H, color);
  } else {
    const { ctx, W, H } = setupCanvas(canvas);
    if (skillKey === 'str') drawStrChart(ctx, entries, W, H, color);
    else if (skillKey === 'spt') drawSptChart(ctx, entries, W, H, color);
  }
}

function chartPad(W, H) {
  const p = { top: 18, right: 36, bottom: 32, left: 52 };
  p.gW = W - p.left - p.right; p.gH = H - p.top - p.bottom;
  return p;
}

// Returns the center x for slot i out of n, evenly distributed
function slotX(p, i, n) {
  const slotW = p.gW / n;
  return p.left + slotW * i + slotW / 2;
}

function drawGrid(ctx, p, H, maxVal, labelFn) {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = p.top + (i / 4) * p.gH;
    ctx.beginPath(); ctx.moveTo(p.left, y); ctx.lineTo(p.left + p.gW, y); ctx.stroke();
    ctx.fillStyle = 'rgba(122,112,85,0.8)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(labelFn(maxVal * (1 - i / 4)), p.left - 4, y + 3);
  }
}

function drawXLabels(ctx, p, H, labels) {
  const n = labels.length;
  ctx.fillStyle = 'rgba(122,112,85,0.8)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  // Show at most 7 labels, always include first and last
  const maxLabels = 7;
  const step = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);
  labels.forEach((lbl, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    ctx.fillText(lbl, slotX(p, i, n), H - 4);
  });
}

function drawBars(ctx, p, values, maxVal, color) {
  const n = values.length;
  const slotW = p.gW / n;
  const bw = Math.max(2, Math.min(slotW * 0.7, 40));
  values.forEach((v, i) => {
    const bh = Math.max(0, ((v || 0) / maxVal) * p.gH);
    const x = slotX(p, i, n) - bw / 2;
    ctx.fillStyle = color + 'aa'; ctx.fillRect(x, p.top + p.gH - bh, bw, bh);
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(x, p.top + p.gH - bh, bw, bh);
  });
}

function drawLine(ctx, p, values, maxVal, color) {
  const n = values.length;
  const pts = values.map((v, i) => v == null ? null : {
    x: slotX(p, i, n),
    y: p.top + p.gH - (v / maxVal) * p.gH
  });
  const valid = pts.filter(Boolean);
  if (valid.length < 2) return;
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  let started = false;
  pts.forEach(pt => { if (!pt) return; started ? ctx.lineTo(pt.x, pt.y) : (ctx.moveTo(pt.x, pt.y), started = true); });
  ctx.stroke();
  valid.forEach(pt => {
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

function legend(ctx, p, items) {
  ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  let x = p.left;
  items.forEach(([color, label, isLine]) => {
    if (isLine) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + 4, 6, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = color + 'cc'; ctx.fillRect(x, 2, 10, 8);
    }
    ctx.fillStyle = 'rgba(122,112,85,0.9)'; ctx.fillText(label, x + (isLine ? 10 : 13), 10);
    x += ctx.measureText(label).width + (isLine ? 18 : 22);
  });
}

function drawStrChart(ctx, entries, W, H, color) {
  const byWeek = {};
  entries.forEach(e => {
    const w = isoWeek(e.date);
    if (!byWeek[w]) byWeek[w] = { volume: 0, heaviest: 0 };
    const m = e.detail.match(/(\d+)\s*sets\s*[×x]\s*(\d+)\s*reps\s*@\s*([\d.]+)kg/i);
    if (m) {
      byWeek[w].volume += parseInt(m[1]) * parseInt(m[2]) * parseFloat(m[3]);
      byWeek[w].heaviest = Math.max(byWeek[w].heaviest, parseFloat(m[3]));
    }
  });
  const weeks = Object.keys(byWeek).sort();
  if (!weeks.length) return;
  const vols = weeks.map(w => byWeek[w].volume);
  const heavy = weeks.map(w => byWeek[w].heaviest);
  const maxVol = Math.max(...vols) || 1;
  const maxHeavy = Math.max(...heavy) || 1;
  const p = chartPad(W, H); const n = weeks.length;
  drawGrid(ctx, p, H, maxVol, v => v >= 1000 ? (v/1000).toFixed(1)+'k' : Math.round(v));
  drawBars(ctx, p, vols, maxVol, color);
  drawLine(ctx, p, heavy.map(v => (v / maxHeavy) * maxVol), maxVol, '#c8a84b');
  drawXLabels(ctx, p, H, weeks.map(w => w.slice(5)));
  legend(ctx, p, [[color, 'Volume (kg)', false], ['#c8a84b', 'Heaviest lift', true]]);
}

// ── Running chart 1: Pace per run (filtered by distance bracket) ──
function drawRunPaceChart(ctx, entries, W, H, color) {
  let filtered = _runFilter === 'all' ? entries : entries.filter(e => runDistanceBracket(e.prValue) === _runFilter);
  const p = chartPad(W, H);

  // Label
  ctx.fillStyle = 'rgba(122,112,85,0.7)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(_runFilter === 'all' ? 'Pace per run — all distances (↓ = faster)' : `Pace per run — ${_runFilter} (↓ = faster)`, p.left, 10);

  if (!filtered.length) {
    ctx.fillStyle = 'rgba(122,112,85,0.6)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No runs for this distance yet.', W / 2, H / 2); return;
  }

  const pacePoints = filtered.map(e => {
    const m = e.detail.match(/\(([0-9]+):([0-9]+)\/km\)/);
    return m ? { date: e.date, pace: parseInt(m[1]) + parseInt(m[2]) / 60 } : null;
  }).filter(Boolean);

  if (!pacePoints.length) {
    ctx.fillStyle = 'rgba(122,112,85,0.6)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No pace data available.', W / 2, H / 2); return;
  }

  const n = pacePoints.length;
  const maxPace = Math.max(...pacePoints.map(p => p.pace));
  const minPace = Math.min(...pacePoints.map(p => p.pace));
  const paceRange = maxPace - minPace || 0.5;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = p.top + (i / 4) * p.gH;
    ctx.beginPath(); ctx.moveTo(p.left, y); ctx.lineTo(p.left + p.gW, y); ctx.stroke();
    const pace = minPace + (1 - i / 4) * paceRange;
    const mins = Math.floor(pace); const secs = Math.round((pace - mins) * 60);
    ctx.fillStyle = 'rgba(122,112,85,0.8)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(`${mins}:${String(secs).padStart(2,'0')}`, p.left - 4, y + 3);
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, p.top, 0, p.top + p.gH);
  grad.addColorStop(0, color + '00'); grad.addColorStop(1, color + '33');
  ctx.beginPath();
  pacePoints.forEach((pt, i) => {
    const x = slotX(p, i, n);
    const y = p.top + ((pt.pace - minPace) / paceRange) * p.gH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(slotX(p, n - 1, n), p.top + p.gH);
  ctx.lineTo(slotX(p, 0, n), p.top + p.gH);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  // Line + dots
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  pacePoints.forEach((pt, i) => {
    const x = slotX(p, i, n);
    const y = p.top + ((pt.pace - minPace) / paceRange) * p.gH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  pacePoints.forEach((pt, i) => {
    const x = slotX(p, i, n);
    const y = p.top + ((pt.pace - minPace) / paceRange) * p.gH;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1.5; ctx.stroke();
  });

  // X labels (dates)
  drawXLabels(ctx, p, H, pacePoints.map(pt => pt.date.slice(5)));
}

// ── Running chart 2: Weekly distance bars ──
function drawRunDistanceChart(ctx, entries, W, H, color) {
  const byWeek = {};
  entries.forEach(e => { const w = isoWeek(e.date); byWeek[w] = (byWeek[w] || 0) + (e.prValue || 0); });
  const weeks = Object.keys(byWeek).sort();
  if (!weeks.length) return;
  const dists = weeks.map(w => byWeek[w]);
  const maxDist = Math.max(...dists) || 1;
  const p = chartPad(W, H);

  ctx.fillStyle = 'rgba(122,112,85,0.7)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Weekly distance (all runs)', p.left, 10);

  drawGrid(ctx, p, H, maxDist, v => v.toFixed(0) + 'km');
  drawBars(ctx, p, dists, maxDist, color);
  drawXLabels(ctx, p, H, weeks.map(w => w.slice(5)));
}

// ── Swimming chart 1: Weekly distance bars ──
function drawSwmDistanceChart(ctx, entries, W, H, color) {
  const byWeek = {};
  entries.forEach(e => { const w = isoWeek(e.date); byWeek[w] = (byWeek[w] || 0) + (e.prValue || 0); });
  const weeks = Object.keys(byWeek).sort();
  if (!weeks.length) return;
  const dists = weeks.map(w => byWeek[w]);
  const maxDist = Math.max(...dists) || 1;
  const p = chartPad(W, H);
  ctx.fillStyle = 'rgba(122,112,85,0.7)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Weekly distance (km)', p.left, 10);
  drawGrid(ctx, p, H, maxDist, v => v.toFixed(1) + 'km');
  drawBars(ctx, p, dists, maxDist, color);
  drawXLabels(ctx, p, H, weeks.map(w => w.slice(5)));
}

// ── Swimming chart 2: Avg session duration line ──
function drawSwmDurationChart(ctx, entries, W, H, color) {
  const byWeek = {};
  entries.forEach(e => {
    const w = isoWeek(e.date);
    if (!byWeek[w]) byWeek[w] = { total: 0, count: 0 };
    const m = e.detail.match(/in\s+(\d+)\s*min/);
    if (m) { byWeek[w].total += parseInt(m[1]); byWeek[w].count++; }
  });
  const weeks = Object.keys(byWeek).sort();
  if (!weeks.length) return;
  const avgDurs = weeks.map(w => byWeek[w].count ? byWeek[w].total / byWeek[w].count : null);
  const maxDur = Math.max(...avgDurs.filter(Boolean)) || 1;
  const p = chartPad(W, H);
  ctx.fillStyle = 'rgba(122,112,85,0.7)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Avg session duration (min)', p.left, 10);
  drawGrid(ctx, p, H, maxDur, v => Math.round(v) + 'm');
  drawLine(ctx, p, avgDurs.map(v => v == null ? null : (v / maxDur) * maxDur), maxDur, color);
  drawXLabels(ctx, p, H, weeks.map(w => w.slice(5)));
}

// ── Cycling chart 1: Weekly distance bars ──
function drawCycDistanceChart(ctx, entries, W, H, color) {
  const byWeek = {};
  entries.forEach(e => { const w = isoWeek(e.date); byWeek[w] = (byWeek[w] || 0) + (e.prValue || 0); });
  const weeks = Object.keys(byWeek).sort();
  if (!weeks.length) return;
  const dists = weeks.map(w => byWeek[w]);
  const maxDist = Math.max(...dists) || 1;
  const p = chartPad(W, H);
  ctx.fillStyle = 'rgba(122,112,85,0.7)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Weekly distance (km)', p.left, 10);
  drawGrid(ctx, p, H, maxDist, v => Math.round(v) + 'km');
  drawBars(ctx, p, dists, maxDist, color);
  drawXLabels(ctx, p, H, weeks.map(w => w.slice(5)));
}

// ── Cycling chart 2: Avg speed per session line ──
function drawCycSpeedChart(ctx, entries, W, H, color) {
  // avg speed = distance / duration * 60 (km/h), parsed from "20km in 60 min"
  const byWeek = {};
  entries.forEach(e => {
    const w = isoWeek(e.date);
    const m = e.detail.match(/([\d.]+)km\s+in\s+(\d+)\s*min/);
    if (!m) return;
    const speed = parseFloat(m[1]) / parseInt(m[2]) * 60;
    if (!byWeek[w]) byWeek[w] = { total: 0, count: 0 };
    byWeek[w].total += speed; byWeek[w].count++;
  });
  const weeks = Object.keys(byWeek).sort();
  if (!weeks.length) return;
  const speeds = weeks.map(w => byWeek[w].count ? byWeek[w].total / byWeek[w].count : null);
  const maxSpeed = Math.max(...speeds.filter(Boolean)) || 1;
  const p = chartPad(W, H);
  ctx.fillStyle = 'rgba(122,112,85,0.7)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Avg speed per session (km/h)', p.left, 10);
  drawGrid(ctx, p, H, maxSpeed, v => v.toFixed(0) + 'km/h');
  drawLine(ctx, p, speeds.map(v => v == null ? null : v), maxSpeed, color);
  drawXLabels(ctx, p, H, weeks.map(w => w.slice(5)));
}

function drawSptChart(ctx, entries, W, H, color) {
  const byWeek = {};
  entries.forEach(e => {
    const w = isoWeek(e.date);
    if (!byWeek[w]) byWeek[w] = { sessions: 0, duration: 0 };
    byWeek[w].sessions++; byWeek[w].duration += e.prValue || 0;
  });
  const weeks = Object.keys(byWeek).sort();
  if (!weeks.length) return;
  const sessions = weeks.map(w => byWeek[w].sessions);
  const durations = weeks.map(w => byWeek[w].duration);
  const maxSess = Math.max(...sessions) || 1;
  const maxDur = Math.max(...durations) || 1;
  const p = chartPad(W, H);
  drawGrid(ctx, p, H, maxSess, v => Math.round(v));
  drawBars(ctx, p, sessions, maxSess, color);
  drawLine(ctx, p, durations.map(v => (v / maxDur) * maxSess), maxSess, '#c8a84b');
  drawXLabels(ctx, p, H, weeks.map(w => w.slice(5)));
  legend(ctx, p, [[color, 'Sessions', false], ['#c8a84b', 'Total mins', true]]);
}

function renderSkillRecent(entries, skillKey) {
  const list = document.getElementById('skillRecentList');
  const last5 = entries.slice(-5).reverse();
  if (last5.length === 0) {
    list.innerHTML = '<div class="skill-recent-empty">No activities logged yet.</div>';
    return;
  }
  list.innerHTML = last5.map(e => `
    <div class="skill-recent-entry">
      <div class="skill-recent-dot ${skillKey}"></div>
      <div class="skill-recent-info">
        <div class="skill-recent-name">${e.exercise}</div>
        <div class="skill-recent-detail">${e.detail}</div>
      </div>
      <div class="skill-recent-right">
        <div class="skill-recent-xp">+${e.xp.toLocaleString()} XP</div>
        <div class="skill-recent-date">${e.date}</div>
      </div>
    </div>`).join('');
}

document.addEventListener('click', e => {
  const modal = document.getElementById('skillModal');
  if (modal && e.target === modal) closeSkillModal();
});
