function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Parse a GPX file and return extracted activity data
function parseGpx(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid GPX file.');

  // Activity name and type
  const nameEl = doc.querySelector('trk > name');
  const activityName = nameEl ? nameEl.textContent.trim() : '';
  const typeEl = doc.querySelector('trk > type');
  const activityType = typeEl ? typeEl.textContent.trim().toLowerCase() : '';

  // Collect all trackpoints
  const trkpts = [...doc.querySelectorAll('trkpt')];
  if (trkpts.length < 2) throw new Error('GPX file has too few trackpoints to analyse.');

  // Compute total distance and duration
  let totalDist = 0;
  const points = trkpts.map(pt => ({
    lat: parseFloat(pt.getAttribute('lat')),
    lon: parseFloat(pt.getAttribute('lon')),
    time: pt.querySelector('time') ? new Date(pt.querySelector('time').textContent) : null,
    ele: pt.querySelector('ele') ? parseFloat(pt.querySelector('ele').textContent) : null,
  }));

  for (let i = 1; i < points.length; i++) {
    totalDist += haversine(points[i-1].lat, points[i-1].lon, points[i].lat, points[i].lon);
  }

  // Duration from first to last timestamp
  let durationMin = null;
  const firstTime = points.find(p => p.time)?.time;
  const lastTime = [...points].reverse().find(p => p.time)?.time;
  if (firstTime && lastTime) {
    durationMin = Math.round((lastTime - firstTime) / 60000);
  }

  // Activity date
  const activityDate = firstTime ? firstTime.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  // Average speed km/h to help classify
  const avgSpeedKmh = durationMin > 0 ? (totalDist / durationMin * 60) : 0;

  // Detect skill from type tag first, then fall back to speed heuristic
  let detectedSkill = null;
  const typeMap = {
    running: 'run', run: 'run', jogging: 'run',
    cycling: 'cyc', biking: 'cyc', 'mountain biking': 'cyc', 'road cycling': 'cyc',
    swimming: 'swm', swim: 'swm',
    walking: 'spt', hiking: 'spt', soccer: 'spt', football: 'spt',
    tennis: 'spt', basketball: 'spt',
  };
  for (const [key, skill] of Object.entries(typeMap)) {
    if (activityType.includes(key) || activityName.toLowerCase().includes(key)) {
      detectedSkill = skill;
      break;
    }
  }
  if (!detectedSkill) {
    if (avgSpeedKmh >= 20) detectedSkill = 'cyc';
    else if (avgSpeedKmh >= 6) detectedSkill = 'run';
    else if (avgSpeedKmh >= 2) detectedSkill = 'spt';
    else detectedSkill = 'run'; // default
  }

  // Elevation gain
  let elevGain = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].ele !== null && points[i-1].ele !== null) {
      const diff = points[i].ele - points[i-1].ele;
      if (diff > 0) elevGain += diff;
    }
  }

  return {
    activityName,
    activityType,
    detectedSkill,
    distanceKm: Math.round(totalDist * 100) / 100,
    durationMin,
    avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
    paceMinKm: (detectedSkill === 'run' || detectedSkill === 'cyc') && durationMin > 0 && totalDist > 0
      ? durationMin / totalDist : null,
    elevGainM: Math.round(elevGain),
    activityDate,
  };
}

// Stored parsed GPX data for confirm step
let gpxParsed = null;

function handleGpxUpload(event) {
  const file = event.target.files[0];
  event.target.value = ''; // reset so same file can be re-uploaded
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      gpxParsed = parseGpx(e.target.result);
      openGpxModal(gpxParsed);
    } catch(err) {
      gpxParsed = null;
      showGpxError(err.message);
    }
  };
  reader.readAsText(file);
}

function showGpxError(msg) {
  document.getElementById('gpxModal').classList.add('open');
  document.getElementById('gpxModalTitle').textContent = 'Import Failed';
  document.getElementById('gpxModalSubtitle').textContent = '';
  document.getElementById('gpxStatsGrid').innerHTML = '';
  document.getElementById('gpxFields').style.display = 'none';
  document.getElementById('gpxXpPreview').style.display = 'none';
  const err = document.getElementById('gpxError');
  err.textContent = msg;
  err.classList.add('show');
}

// Exercise options per skill for the GPX modal dropdown
const GPX_EXERCISE_OPTIONS = {
  run: ['Outdoor Run','Trail Run','Treadmill Run','Tempo Run','Long Slow Run','Sprint Intervals'],
  cyc: ['Road Cycling','Mountain Biking','Stationary Bike','Gravel Ride','Commute Ride'],
  swm: ['Freestyle','Open Water Swim','Pool Laps (Mixed)','Breaststroke','Backstroke'],
  spt: ['Netball','Soccer / Football','Tennis','Basketball','Touch Football','Other Sport'],
};

function openGpxModal(data) {
  document.getElementById('gpxError').classList.remove('show');
  document.getElementById('gpxFields').style.display = '';
  document.getElementById('gpxXpPreview').style.display = '';
  document.getElementById('gpxModalTitle').textContent = 'Activity Detected';

  const subtitle = data.activityName
    ? `"${data.activityName}"`
    : `Detected from GPX file`;
  document.getElementById('gpxModalSubtitle').textContent = subtitle;

  // Stats grid
  const statsEl = document.getElementById('gpxStatsGrid');
  const stats = [];
  if (data.distanceKm) stats.push({ val: data.distanceKm.toFixed(2) + ' km', lbl: 'Distance' });
  if (data.durationMin) {
    const h = Math.floor(data.durationMin / 60);
    const m = data.durationMin % 60;
    stats.push({ val: h > 0 ? `${h}h ${m}m` : `${m} min`, lbl: 'Duration' });
  }
  if (data.paceMinKm && data.detectedSkill === 'run') {
    stats.push({ val: formatPace(data.paceMinKm) + '/km', lbl: 'Avg Pace' });
  } else if (data.avgSpeedKmh) {
    stats.push({ val: data.avgSpeedKmh + ' km/h', lbl: 'Avg Speed' });
  }
  if (data.elevGainM > 0) stats.push({ val: data.elevGainM + ' m', lbl: 'Elev Gain' });
  statsEl.innerHTML = stats.map(s =>
    `<div class="gpx-stat"><div class="gpx-stat-val">${s.val}</div><div class="gpx-stat-lbl">${s.lbl}</div></div>`
  ).join('');

  // Set skill select
  const skillEl = document.getElementById('gpxSkill');
  skillEl.value = data.detectedSkill;
  populateGpxExerciseOptions(data.detectedSkill, data.activityName);

  // Set date
  document.getElementById('gpxDate').value = data.activityDate;
  document.getElementById('gpxDate').max = new Date().toISOString().slice(0,10);

  updateGpxPreview();
  document.getElementById('gpxModal').classList.add('open');
}

function populateGpxExerciseOptions(skill, activityName) {
  const el = document.getElementById('gpxExercise');
  const opts = GPX_EXERCISE_OPTIONS[skill] || GPX_EXERCISE_OPTIONS.run;
  el.innerHTML = opts.map(o => `<option>${o}</option>`).join('');
  // Try to auto-select a matching option from the activity name
  if (activityName) {
    const name = activityName.toLowerCase();
    const match = opts.find(o => name.includes(o.toLowerCase().split(' ')[0]));
    if (match) el.value = match;
  }
}

function updateGpxPreview() {
  if (!gpxParsed || !state) return;
  const skill = document.getElementById('gpxSkill').value;
  const intensity = parseFloat(document.getElementById('gpxIntensity').value) || 1.2;
  const d = gpxParsed.distanceKm || 0;
  const t = gpxParsed.durationMin || 0;

  // Repopulate exercise options if skill changed
  populateGpxExerciseOptions(skill, gpxParsed.activityName);

  // Show/hide intensity for strength-like skills
  const intEl = document.getElementById('gpxIntensityField');
  intEl.style.display = '';

  let xp = 0;
  if (skill === 'run') xp = calcRunXp(d, t, intensity);
  else if (skill === 'cyc') xp = calcCycXp(d, t, intensity);
  else if (skill === 'swm') xp = calcSwmXp(d, t, intensity);
  else if (skill === 'spt') xp = calcSptXp(t, intensity);

  const skillData = state.skills[skill];
  const curLevel = levelFromXp(skillData.xp);
  const newLevel = levelFromXp(skillData.xp + xp);
  const levelNote = newLevel > curLevel
    ? ` → Level up! ${curLevel} → ${newLevel}`
    : ` (${xpToNextLevel(skillData.xp + xp).toLocaleString()} XP to next level)`;

  document.getElementById('gpxXpPreview').innerHTML =
    `<span style="color:var(--text-dim)">XP to award:</span>
     <span class="gpx-xp-val">${xp.toLocaleString()} XP</span>
     <span style="color:var(--text-dim);font-size:0.82rem">${levelNote}</span>`;
}

function closeGpxModal() {
  document.getElementById('gpxModal').classList.remove('open');
  gpxParsed = null;
}

document.getElementById('gpxModal').addEventListener('click', function(e) {
  if (e.target === this) closeGpxModal();
});

function confirmGpxLog() {
  if (!gpxParsed || !state) return;

  const skill = document.getElementById('gpxSkill').value;
  const exerciseEl = document.getElementById('gpxExercise');
  const exercise = exerciseEl.options[exerciseEl.selectedIndex]?.text || 'GPX Activity';
  const intensity = parseFloat(document.getElementById('gpxIntensity').value) || 1.2;
  const date = document.getElementById('gpxDate').value || gpxParsed.activityDate;
  const d = gpxParsed.distanceKm || 0;
  const t = gpxParsed.durationMin || 0;

  const skillData = state.skills[skill];
  const oldLevel = levelFromXp(skillData.xp);

  let xp = 0, detail = '', prValue = 0, prUnit = 'km';

  if (skill === 'run') {
    const paceMinKm = d > 0 && t > 0 ? t / d : 0;
    xp = calcRunXp(d, t, intensity);
    detail = `${d}km in ${t} min (${formatPace(paceMinKm)}/km)`;
    if (gpxParsed.elevGainM > 0) detail += ` ↑${gpxParsed.elevGainM}m`;
    prValue = d; prUnit = 'km';
    // Pace PR
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
  } else if (skill === 'cyc') {
    xp = calcCycXp(d, t, intensity);
    detail = `${d}km in ${t} min`;
    if (gpxParsed.elevGainM > 0) detail += ` ↑${gpxParsed.elevGainM}m`;
    prValue = d; prUnit = 'km';
    updatePR(skill, exercise, prValue, prUnit, detail, date);
    updateChallengeProgress('cyc', { d, t });
  } else if (skill === 'swm') {
    xp = calcSwmXp(d, t, intensity);
    detail = `${d}km in ${t} min`;
    prValue = d; prUnit = 'km';
    updatePR(skill, exercise, prValue, prUnit, detail, date);
    updateChallengeProgress('swm', { d, t });
  } else if (skill === 'spt') {
    xp = calcSptXp(t, intensity);
    detail = `${t} min`;
    prValue = t; prUnit = 'min';
    updatePR(skill, exercise, prValue, prUnit, detail, date);
    updateChallengeProgress('spt', { t });
  }

  if (xp <= 0) { closeGpxModal(); return; }

  skillData.xp += xp;
  state.activities++;
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const entryId = Date.now() + Math.random();
  state.log.push({ id: entryId, skill, exercise, detail, xp, time, date, prValue, prUnit, fromGpx: true });

  // Prune old entries
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffStr = cutoff.toISOString().slice(0,10);
  state.log = state.log.filter(e => (e.date || '9999') >= cutoffStr);

  const newLevel = levelFromXp(skillData.xp);
  if (newLevel > oldLevel) showLevelUp(skillData.name, newLevel, skillData.icon);

  save();
  renderSkills();
  renderLog();
  updatePreview();
  renderChallenges();
  closeGpxModal();
}
