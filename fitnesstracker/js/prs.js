// ── Page switching ──
function showPage(page) {
  const pages = ['dashboard','pr','profile'];
  pages.forEach(p => {
    const el = document.getElementById('page' + p.charAt(0).toUpperCase() + p.slice(1));
    if (el) el.classList.toggle('visible', p === page);
    const btn = document.getElementById('nav' + p.charAt(0).toUpperCase() + p.slice(1));
    if (btn) btn.classList.toggle('active', p === page);
  });
  document.getElementById('pageDashboard').classList.toggle('hidden', page !== 'dashboard');
  if (page === 'pr') renderPR();
  if (page === 'profile') renderProfile();
}

// ── Personal Records system ──
// Records stored as: state.prs = { 'Back Squat': { skill:'str', value:100, unit:'kg', detail:'3×5 @ 100kg', date:'2026-03-01' }, ... }
// Strength PB = heaviest single-set weight for that exercise
// Agility/Endurance PB = longest distance for that exercise

function getPRs() {
  return state.prs || (state.prs = {});
}

function updatePR(skill, exercise, value, unit, detail, date) {
  const prs = getPRs();
  const existing = prs[exercise];
  if (!existing || value > existing.value) {
    const isNew = !!existing; // true if updating, not first entry
    prs[exercise] = { skill, value, unit, detail, date };
    if (isNew) showPBToast(exercise, value, unit);
    return true;
  }
  return false;
}

function showPBToast(exercise, value, unit) {
  const t = document.createElement('div');
  t.className = 'pb-toast';
  t.innerHTML = `
    <div class="pb-icon">🏅</div>
    <div class="pb-title">Personal Best!</div>
    <div class="pb-sub">${exercise} — ${value}${unit}</div>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function renderPR() {
  const prs = getPRs();
  const sections = { str: 'prStr', run: 'prRun', swm: 'prSwm', cyc: 'prCyc', spt: 'prSpt' };
  const headers = {
    str: ['Exercise', 'Best Weight', 'Detail', 'Date'],
    run: ['Distance', 'Best Pace', 'Detail', 'Date'],
    swm: ['Stroke',    'Best Distance', 'Detail', 'Date'],
    cyc: ['Activity',  'Best Distance', 'Detail', 'Date'],
    spt: ['Sport',     'Best Session',  'Detail', 'Date'],
  };
  const emptyMsg = {
    str: 'No strength activities logged yet.',
    run: 'No running pace records yet. Log a 1km, 3km, 5km, 10km, half or marathon to set one.',
    swm: 'No swimming activities logged yet.',
    cyc: 'No cycling activities logged yet.',
    spt: 'No sports activities logged yet.',
  };

  ['str','run','swm','cyc','spt'].forEach(skill => {
    const el = document.getElementById(sections[skill]);
    if (!el) return;

    if (skill === 'run') {
      // Running PRs are pace-based, keyed as "Run PR: 5 km" etc.
      const bracketOrder = ['1 km','3 km','5 km','10 km','Half Marathon','Marathon'];
      const records = bracketOrder
        .map(b => ({ bracket: b, pr: prs[runPRKey(b)] }))
        .filter(r => r.pr);
      if (!records.length) {
        el.innerHTML = `<div class="pr-empty">${emptyMsg[skill]}</div>`;
        return;
      }
      const [h0,h1,h2,h3] = headers[skill];
      el.innerHTML = `
        <table class="pr-table">
          <thead><tr><th>${h0}</th><th>${h1}</th><th>${h2}</th><th>${h3}</th></tr></thead>
          <tbody>
            ${records.map(({ bracket, pr }) => `
              <tr>
                <td><strong>${bracket}</strong></td>
                <td><span class="pr-value">${formatPace(pr.value)}<span style="font-size:0.75rem;font-family:'Crimson Text',serif;color:var(--text-dim)">/km</span></span></td>
                <td style="color:var(--text-dim);font-style:italic">${pr.detail}</td>
                <td><div class="pr-date">${pr.date ? new Date(pr.date+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}) : '—'}</div></td>
              </tr>`).join('')}
          </tbody>
        </table>`;
      return;
    }

    const records = Object.entries(prs).filter(([,v]) => v.skill === skill);
    if (!records.length) {
      el.innerHTML = `<div class="pr-empty">${emptyMsg[skill]}</div>`;
      return;
    }
    records.sort((a,b) => b[1].value - a[1].value);
    const [h0,h1,h2,h3] = headers[skill];
    el.innerHTML = `
      <table class="pr-table">
        <thead><tr><th>${h0}</th><th>${h1}</th><th>${h2}</th><th>${h3}</th></tr></thead>
        <tbody>
          ${records.map(([name, r]) => `
            <tr>
              <td>${name}</td>
              <td><span class="pr-value">${r.value}${r.unit}</span></td>
              <td style="color:var(--text-dim);font-style:italic">${r.detail}</td>
              <td><div class="pr-date">${r.date ? new Date(r.date+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}) : '—'}</div></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  });
}

// ── Resume session if tab still open ──
