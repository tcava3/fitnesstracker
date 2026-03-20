// ── Simple hash (djb2) — local toy auth only ──
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// ── Storage helpers ──
const ACCOUNTS_KEY = 'fs_accounts';
const SESSION_KEY  = 'fs_session';

function getAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; } catch { return {}; }
}
function saveAccounts(a) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }
function dataKey(u) { return 'fs_data_' + u.toLowerCase(); }
function loadUserData(u) {
  try { const r = localStorage.getItem(dataKey(u)); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveUserData(u, d) { localStorage.setItem(dataKey(u), JSON.stringify(d)); }

function freshState() {
  return {
    skills: {
      str: { name: 'Strength', icon: '💪', xp: 0 },
      run: { name: 'Running',  icon: '🏃', xp: 0 },
      swm: { name: 'Swimming', icon: '🏊', xp: 0 },
      cyc: { name: 'Cycling',  icon: '🚴', xp: 0 },
      spt: { name: 'Sports',   icon: '⚽', xp: 0 },
    },
    log: [], activities: 0,
    challenges: null,
    prs: {},
    profile: { height: '', weight: '' },
    goals: [],
  };
}

// ── Auth UI ──
function switchAuthTab(tab) {
  const login = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', login);
  document.getElementById('tabRegister').classList.toggle('active', !login);
  document.getElementById('formLogin').style.display = login ? '' : 'none';
  document.getElementById('formRegister').style.display = login ? 'none' : '';
  document.getElementById('loginError').classList.remove('show');
  document.getElementById('registerError').classList.remove('show');
}

function showAuthError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}

function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!username || !password) return showAuthError('loginError', 'Please enter your username and password.');
  const accs = getAccounts();
  const key = username.toLowerCase();
  if (!accs[key]) return showAuthError('loginError', 'No account found with that username.');
  if (accs[key].hash !== hashStr(password)) return showAuthError('loginError', 'Incorrect password.');
  startSession(accs[key].displayName);
}

function doRegister() {
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const password2 = document.getElementById('regPass2').value;
  if (!username) return showAuthError('registerError', 'Please choose a username.');
  if (username.length < 2 || username.length > 20)
    return showAuthError('registerError', 'Username must be 2–20 characters.');
  if (!/^[a-zA-Z0-9_ ]+$/.test(username))
    return showAuthError('registerError', 'Letters, numbers, spaces and underscores only.');
  if (!password || password.length < 8)
    return showAuthError('registerError', 'Password must be at least 8 characters.');
  if (password !== password2)
    return showAuthError('registerError', 'Passwords do not match.');
  const accs = getAccounts();
  const key = username.toLowerCase();
  if (accs[key]) return showAuthError('registerError', 'That username is already taken.');
  accs[key] = { displayName: username, hash: hashStr(password) };
  saveAccounts(accs);
  saveUserData(username, freshState());
  startSession(username);
}

// ── Session ──
let currentUser = null;
let state = null;

function startSession(username) {
  currentUser = username;
  sessionStorage.setItem(SESSION_KEY, username);
  state = loadUserData(username) || freshState();
  // Restore meta in case of old saves
  state.skills.str = Object.assign({ name: 'Strength', icon: '💪', xp: 0 }, state.skills.str);
  state.skills.run = Object.assign({ name: 'Running',  icon: '🏃', xp: 0 }, state.skills.run || {});
  state.skills.swm = Object.assign({ name: 'Swimming', icon: '🏊', xp: 0 }, state.skills.swm || {});
  state.skills.cyc = Object.assign({ name: 'Cycling',  icon: '🚴', xp: 0 }, state.skills.cyc || {});
  state.skills.spt = Object.assign({ name: 'Sports',   icon: '⚽', xp: 0 }, state.skills.spt || {});
  if (!state.profile) state.profile = { height: '', weight: '' };
  if (!state.goals)   state.goals   = [];

  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainApp').classList.add('visible');
  document.getElementById('headerUsername').textContent = username;

  renderSkills(); renderLog(); updatePreview();
  const savedTab = (function(){ try { return localStorage.getItem('fs_last_tab'); } catch { return null; } })();
  setTab(['str','run','swm','cyc','spt'].includes(savedTab) ? savedTab : 'str');
  // Set date picker to today
  const todayStr = new Date().toISOString().slice(0,10);
  const logDateEl = document.getElementById('log-date');
  if (logDateEl) { logDateEl.value = todayStr; logDateEl.max = todayStr; }
  setTimeout(renderChallenges, 0);
  setTimeout(renderProfile, 0);
}

function doLogout() {
  currentUser = null; state = null;
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('mainApp').classList.remove('visible');
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').classList.remove('show');
  switchAuthTab('login');
}

function save() { if (currentUser && state) saveUserData(currentUser, state); }

// ── Resume session if tab still open ──
const resumed = sessionStorage.getItem(SESSION_KEY);
if (resumed) startSession(resumed);
