function saveProfile() {
  if (!state) return;
  const h = document.getElementById('profileHeight').value;
  const w = document.getElementById('profileWeight').value;
  state.profile = { height: h, weight: w };
  save();
  renderBMI(h, w);
  // Flash saved indicator
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
  el.innerHTML = `BMI: <span class="bmi-val">${bmi}</span> — ${cat}<br><span style="font-size:0.78rem;color:var(--text-dim);font-style:italic">BMI is a general indicator only and may not reflect fitness level, muscle mass, or body composition.</span>`;
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
  renderGoals();
}
