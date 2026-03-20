function saveProfile() {
  if (!state) return;
  const h = document.getElementById('profileHeight').value;
  const w = document.getElementById('profileWeight').value;

  // Track weight history — one entry per day (overwrite same day)
  if (w) {
    const today = new Date().toISOString().slice(0, 10);
    if (!state.weightHistory) state.weightHistory = [];
    const existing = state.weightHistory.findIndex(e => e.date === today);
    if (existing >= 0) {
      state.weightHistory[existing].weight = parseFloat(w);
    } else {
      state.weightHistory.push({ date: today, weight: parseFloat(w) });
    }
    // Keep last 365 entries
    state.weightHistory.sort((a, b) => a.date.localeCompare(b.date));
    if (state.weightHistory.length > 365) state.weightHistory = state.weightHistory.slice(-365);
  }

  state.profile = { height: h, weight: w };
  save();
  renderBMI(h, w);
  renderWeightChart();

  const ind = document.getElementById('profileSaveIndicator');
  if (ind) {
    ind.classList.add('show');
    clearTimeout(ind._timer);
    ind._timer = setTimeout(() => ind.classList.remove('show'), 1800);
  }
}

function renderBMI(h, w) {
  const el = document.getElementById('profileBmi');
  if (!el) return;
  const hNum = parseFloat(h), wNum = parseFloat(w);
  if (!hNum || !wNum) { el.innerHTML = ''; return; }
  const bmi = (wNum / ((hNum / 100) ** 2)).toFixed(1);
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy weight' : bmi < 30 ? 'Overweight' : 'Obese';
  el.innerHTML = `BMI: <span class="bmi-val">${bmi}</span> — ${cat}<br><span style="font-size:0.78rem;color:var(--text-dim)">BMI is a general indicator only and may not reflect fitness level or muscle mass.</span>`;
}

function renderWeightChart() {
  const history = (state.weightHistory || []).filter(e => e.weight > 0);
  const section = document.getElementById('weightHistorySection');
  const canvas = document.getElementById('weightChart');
  if (!section || !canvas) return;

  if (history.length < 2) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.offsetWidth || 300;
  const H = 120;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { top: 14, right: 16, bottom: 24, left: 44 };
  const gW = W - pad.left - pad.right;
  const gH = H - pad.top - pad.bottom;

  const weights = history.map(e => e.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const n = history.length;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = pad.top + (i / 3) * gH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + gW, y); ctx.stroke();
    const val = maxW - (i / 3) * range;
    ctx.fillStyle = 'rgba(139,148,158,0.8)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), pad.left - 4, y + 3);
  }

  // Gradient fill
  const color = 'var(--accent)';
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + gH);
  grad.addColorStop(0, 'rgba(232,132,90,0.25)');
  grad.addColorStop(1, 'rgba(232,132,90,0.02)');

  const pts = history.map((e, i) => ({
    x: pad.left + (i / (n - 1)) * gW,
    y: pad.top + gH - ((e.weight - minW) / range) * gH
  }));

  ctx.beginPath();
  pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
  ctx.lineTo(pts[n - 1].x, pad.top + gH);
  ctx.lineTo(pts[0].x, pad.top + gH);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); ctx.strokeStyle = '#E8845A'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
  ctx.stroke();

  // Dots
  pts.forEach(pt => {
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#E8845A'; ctx.fill();
    ctx.strokeStyle = '#0D1117'; ctx.lineWidth = 1.5; ctx.stroke();
  });

  // X labels — first, last, and a few in between
  ctx.fillStyle = 'rgba(139,148,158,0.8)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  const maxLabels = 5;
  const step = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);
  history.forEach((e, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    ctx.fillText(e.date.slice(5), pts[i].x, H - 4);
  });
}

function addGoal() {
  const input = document.getElementById('goalInput');
  const text = input.value.trim();
  if (!text) return;
  if (!state.goals) state.goals = [];
  state.goals.push({ id: Date.now(), text, done: false });
  input.value = '';
  save();
  renderGoals();
}

function toggleGoal(id) {
  const goal = state.goals.find(g => g.id === id);
  if (goal) { goal.done = !goal.done; save(); renderGoals(); }
}

function removeGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  save();
  renderGoals();
}

function renderGoals() {
  const el = document.getElementById('goalsList');
  if (!el) return;
  if (!state.goals || !state.goals.length) {
    el.innerHTML = '<div class="goals-empty">No goals yet. Add one above.</div>';
    return;
  }
  el.innerHTML = state.goals.map(g => `
    <div class="goal-item">
      <div class="goal-check ${g.done ? 'done' : ''}" onclick="toggleGoal(${g.id})"></div>
      <div class="goal-text ${g.done ? 'done' : ''}">${g.text}</div>
      <button class="btn-remove-goal" onclick="removeGoal(${g.id})" title="Remove">✕</button>
    </div>`).join('');
}

function renderProfile() {
  if (!state) return;
  const p = state.profile || {};
  const hEl = document.getElementById('profileHeight');
  const wEl = document.getElementById('profileWeight');
  if (hEl) hEl.value = p.height || '';
  if (wEl) wEl.value = p.weight || '';
  renderBMI(p.height, p.weight);
  renderWeightChart();
  renderGoals();
}
