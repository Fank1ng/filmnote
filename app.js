// ===== DOM CACHE =====
const $ = {
  get addSeasonBtn() { return document.getElementById('addSeasonBtn'); },
  get authEmail() { return document.getElementById('authEmail'); },
  get authError() { return document.getElementById('authError'); },
  get authOverlay() { return document.getElementById('authOverlay'); },
  get authPassword() { return document.getElementById('authPassword'); },
  get authLoginView() { return document.getElementById('authLoginView'); },
  get authRegisterView() { return document.getElementById('authRegisterView'); },
  get authRegError() { return document.getElementById('authRegError'); },
  get regEmail() { return document.getElementById('regEmail'); },
  get regPassword() { return document.getElementById('regPassword'); },
  get regName() { return document.getElementById('regName'); },
  get regInviteCode() { return document.getElementById('regInviteCode'); },
  get showRegisterLink() { return document.getElementById('showRegisterLink'); },
  get showLoginLink() { return document.getElementById('showLoginLink'); },
  get inviteMenuBtn() { return document.getElementById('inviteMenuBtn'); },
  get inviteCodeOverlay() { return document.getElementById('inviteCodeOverlay'); },
  get inviteGenerateBtn() { return document.getElementById('inviteGenerateBtn'); },
  get inviteCodeList() { return document.getElementById('inviteCodeList'); },
  get inviteCloseBtn() { return document.getElementById('inviteCloseBtn'); },
  get cancelEditBtn() { return document.getElementById('cancelEditBtn'); },
  get comment() { return document.getElementById('comment'); },
  get detailModal() { return document.getElementById('detailModal'); },
  get director() { return document.getElementById('director'); },
  get dismissMigrate() { return document.getElementById('dismissMigrate'); },
  get editId() { return document.getElementById('editId'); },
  get emptyState() { return document.getElementById('emptyState'); },
  get exportBtn() { return document.getElementById('exportBtn'); },
  get formTitle() { return document.getElementById('formTitle'); },
  get headerCount() { return document.getElementById('headerCount'); },
  get headerUser() { return document.getElementById('headerUser'); },
  get importBtn() { return document.getElementById('importBtn'); },
  get importFile() { return document.getElementById('importFile'); },
  get loadingState() { return document.getElementById('loadingState'); },
  get listEntriesView() { return document.getElementById('listEntriesView'); },
  get listModeTabs() { return document.getElementById('listModeTabs'); },
  get listWatchlistView() { return document.getElementById('listWatchlistView'); },
  get loginBtn() { return document.getElementById('loginBtn'); },
  get logoutBtn() { return document.getElementById('logoutBtn'); },
  get changePwBtn() { return document.getElementById('changePwBtn'); },
  get changePwCancel() { return document.getElementById('changePwCancel'); },
  get changePwInput() { return document.getElementById('changePwInput'); },
  get changePwOverlay() { return document.getElementById('changePwOverlay'); },
  get changePwSave() { return document.getElementById('changePwSave'); },
  get forgotPwLink() { return document.getElementById('forgotPwLink'); },
  get resetEmail() { return document.getElementById('resetEmail'); },
  get resetPwForm() { return document.getElementById('resetPwForm'); },
  get newPwForm() { return document.getElementById('newPwForm'); },
  get newPassword() { return document.getElementById('newPassword'); },
  get sendResetBtn() { return document.getElementById('sendResetBtn'); },
  get updatePwBtn() { return document.getElementById('updatePwBtn'); },
  get backToLoginLink() { return document.getElementById('backToLoginLink'); },
  get mainApp() { return document.getElementById('mainApp'); },
  get mainDims() { return document.getElementById('mainDims'); },
  get migrateBanner() { return document.getElementById('migrateBanner'); },
  get migrateLink() { return document.getElementById('migrateLink'); },
  get modalContent() { return document.getElementById('modalContent'); },
  get movieForm() { return document.getElementById('movieForm'); },
  get movieList() { return document.getElementById('movieList'); },
  get nameInput() { return document.getElementById('nameInput'); },
  get nameOverlay() { return document.getElementById('nameOverlay'); },
  get nameSaveBtn() { return document.getElementById('nameSaveBtn'); },
  get ownerFilter() { return document.getElementById('ownerFilter'); },
  get posterPath() { return document.getElementById('posterPath'); },
  get scoreFilter() { return document.getElementById('scoreFilter'); },
  get searchInput() { return document.getElementById('searchInput'); },
  get searchActions() { return document.getElementById('searchActions'); },
  get searchAddReviewBtn() { return document.getElementById('searchAddReviewBtn'); },
  get searchWatchBtn() { return document.getElementById('searchWatchBtn'); },
  get searchNextBtn() { return document.getElementById('searchNextBtn'); },
  get searchResults() { return document.getElementById('searchResults'); },
  get seasonList() { return document.getElementById('seasonList'); },
  get seasonSection() { return document.getElementById('seasonSection'); },
  get regSignupBtn() { return document.getElementById('regSignupBtn'); },
  get sortBy() { return document.getElementById('sortBy'); },
  get statsContent() { return document.getElementById('statsContent'); },
  get statsUserPicker() { return document.getElementById('statsUserPicker'); },
  get submitBtn() { return document.getElementById('submitBtn'); },
  get title() { return document.getElementById('title'); },
  get tmdbId() { return document.getElementById('tmdbId'); },
  get tmdbSearch() { return document.getElementById('tmdbSearch'); },
  get toast() { return document.getElementById('toast'); },
  get totalScorePreview() { return document.getElementById('totalScorePreview'); },
  get userMenu() { return document.getElementById('userMenu'); },
  get userDropdown() { return document.getElementById('userDropdown'); },
  get coupleContent() { return document.getElementById('coupleContent'); },
  get watchlistMovieGrid() { return document.getElementById('watchlistMovieGrid'); },
  get watchlistCount() { return document.getElementById('watchlistCount'); },
  get watchlistPagination() { return document.getElementById('watchlistPagination'); },
  get year() { return document.getElementById('year'); },
  // Discover
  get discoverContent() { return document.getElementById('discoverContent'); },
  get qrTitle() { return document.getElementById('qrTitle'); },
  get qrDims() { return document.getElementById('qrDims'); },
  get qrComment() { return document.getElementById('qrComment'); },
  get qrTotalScore() { return document.getElementById('qrTotalScore'); },
  get qrCancel() { return document.getElementById('qrCancel'); },
  get qrSubmit() { return document.getElementById('qrSubmit'); },
  get qrSeasonSection() { return document.getElementById('qrSeasonSection'); },
  get qrSeasonList() { return document.getElementById('qrSeasonList'); },
  get qrAddSeasonBtn() { return document.getElementById('qrAddSeasonBtn'); },
  get quickRateModal() { return document.getElementById('quickRateModal'); },
  get blockedMgmtBtn() { return document.getElementById('blockedMgmtBtn'); },
  get blockedModal() { return document.getElementById('blockedModal'); },
  get blockedMovieGrid() { return document.getElementById('blockedMovieGrid'); },
  get blockedCount() { return document.getElementById('blockedCount'); },
  get blockedPagination() { return document.getElementById('blockedPagination'); },
  get blockedModalClose() { return document.getElementById('blockedModalClose'); },
};

// ===== AUTH UI =====
function showLoginView() {
  $['authError'].textContent = '';
  $['authLoginView'].classList.remove('hidden');
  $['authRegisterView'].classList.add('hidden');
  $['resetPwForm'].classList.add('hidden');
  $['newPwForm'].classList.add('hidden');
  $['authPassword'].classList.remove('hidden');
  $['loginBtn'].classList.remove('hidden');
  $['forgotPwLink'].classList.remove('hidden');
}
function showRegisterView() {
  $['authRegError'].textContent = '';
  $['authLoginView'].classList.add('hidden');
  $['authRegisterView'].classList.remove('hidden');
  $['resetPwForm'].classList.add('hidden');
  $['newPwForm'].classList.add('hidden');
}
function showAuthError(msg, isReg) {
  const el = isReg ? $['authRegError'] : $['authError'];
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 4000);
}

// Forgot password toggle
$['forgotPwLink'].addEventListener('click', ()=>{
  $['authPassword'].classList.add('hidden');
  $['loginBtn'].classList.add('hidden');
  $['forgotPwLink'].classList.add('hidden');
  $['resetPwForm'].classList.remove('hidden');
  $['authLoginView'].querySelector('.subtitle').textContent = '找回密码';
  $['resetEmail'].value = $['authEmail'].value;
});

// Back to login from reset/new-pw
$['backToLoginLink'].addEventListener('click', ()=>{
  $['resetPwForm'].classList.add('hidden');
  $['newPwForm'].classList.add('hidden');
  showLoginView();
});

// Send reset email
$['sendResetBtn'].addEventListener('click', async ()=>{
  const email = $['resetEmail'].value.trim();
  if (!email) { showAuthError('请输入邮箱'); return; }
  const btn = $['sendResetBtn'];
  btn.textContent = '发送中...'; btn.disabled = true;
  const {error} = await db.auth.resetPasswordForEmail(email, {redirectTo: window.location.origin + window.location.pathname});
  if (error) { showAuthError('发送失败: '+error.message); btn.textContent='发送重置邮件'; btn.disabled=false; return; }
  toast('重置邮件已发送，请查收并点击链接');
  $['resetPwForm'].classList.add('hidden');
  showLoginView();
  btn.textContent = '发送重置邮件'; btn.disabled = false;
});

// Update password from recovery link
$['updatePwBtn'].addEventListener('click', async ()=>{
  const pw = $['newPassword'].value;
  if (!pw || pw.length < 6) { showAuthError('密码至少6位'); return; }
  const btn = $['updatePwBtn'];
  btn.textContent = '更新中...'; btn.disabled = true;
  const {error} = await db.auth.updateUser({password: pw});
  if (error) { showAuthError('更新失败: '+error.message); btn.textContent='更新密码并登录'; btn.disabled=false; return; }
  toast('密码已更新');
  const {data:{session}} = await db.auth.getSession();
  if (session) {
    $['newPwForm'].classList.add('hidden');
    showLoginView();
    await initApp(session.user);
  }
  btn.textContent = '更新密码并登录'; btn.disabled = false;
});

// Change password (logged in)
$['changePwBtn'].addEventListener('click', ()=>{
  $['userMenu'].classList.remove('open');
  $['changePwInput'].value = '';
  $['changePwOverlay'].classList.add('open');
});
$['changePwCancel'].addEventListener('click', ()=>{
  $['changePwOverlay'].classList.remove('open');
});
$['changePwSave'].addEventListener('click', async ()=>{
  const pw = $['changePwInput'].value;
  if (!pw || pw.length < 6) { toast('密码至少6位'); return; }
  const btn = $['changePwSave']; btn.textContent = '保存中...'; btn.disabled = true;
  const {error} = await db.auth.updateUser({password: pw});
  if (error) { toast('修改失败: '+error.message); btn.textContent='确认修改'; btn.disabled=false; return; }
  toast('密码已修改');
  $['changePwOverlay'].classList.remove('open');
  btn.textContent = '确认修改'; btn.disabled = false;
});

// ===== STATE =====
let currentUser = null;
let currentProfile = null;
let entryType = 'movie';
let editingEntryId = null;
let highlightEntryId = null;
let allEntries = [];
let allSeasonRatings = [];
let allProfiles = {};
let realtimeChannel = null;
let realtimeDebounce = null;
let sessionCheckTimer = null;

// Couple state
let couplesAvailable = true;
let activeCouple = null;
let pendingCouples = [];
let couplePartner = null;
let coupleQueue = [];
let coupleQueueAvailable = true;
let coupleRecommendations = null;
let coupleRecommendationLoading = false;
let coupleRecommendationState = 'idle';
let couplePreferenceWarmKey = '';
let coupleTab = 'archive';
let coupleArchiveChart = 'score';
let coupleWheelPick = null;

const authOverlay = $['authOverlay'];
const mainApp = $['mainApp'];
const nameOverlay = $['nameOverlay'];

// ===== HELPERS =====
function calcTotal(ratings) { let s=0; for(const [k,w] of Object.entries(WEIGHTS)) s+=(ratings[k]||5)*w; return Math.round(s*10)/10; }
function getEntryScore(entry) {
  if (entry.type !== 'series') return entry.total_score;
  const seasons = allSeasonRatings.filter(s => s.entry_id === entry.id && s.user_id === entry.user_id);
  if (seasons.length === 0) return entry.total_score;
  return seasons.reduce((sum, se) => sum + se.total_score, 0) / seasons.length;
}
function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function fmtDate(d){ if(!d) return ''; const dt=new Date(d); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); }
function posterUrl(path) { return path ? TMDB_IMG+path : ''; }

function toast(msg) {
  const t=$['toast']; t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}

// ── Shared helpers ──
function getGroupKey(e) { return e.tmdb_id ? 'tmdb_'+e.tmdb_id : 'title_'+e.title.toLowerCase().trim()+'_'+(e.year||0); }
function getUserName(uid) { return (allProfiles[uid]?.display_name||currentProfile?.user_id===uid&&currentProfile?.display_name||'').toLowerCase(); }
const isPrivileged = () => ['fank1ng','ceci'].includes((currentProfile?.display_name||'').toLowerCase());
function buildRecommendationEntries() {
  return allEntries.map(e => ({
    user_id: e.user_id,
    type: e.type,
    tmdb_id: e.tmdb_id || null,
    total_score: e.total_score || null,
    created_at: e.created_at || ''
  }));
}

// ===== AUTH BUTTONS =====
// Register with invite code
$['regSignupBtn'].addEventListener('click', async ()=>{
  const btn = $['regSignupBtn'];
  const origText = btn.textContent;
  btn.textContent = '注册中...';
  btn.disabled = true;
  try {
    const email = $['regEmail'].value.trim();
    const password = $['regPassword'].value;
    const name = $['regName'].value.trim();
    const inviteCode = $['regInviteCode'].value.trim();
    if (!email || !password) { showAuthError('请填写邮箱和密码', true); btn.textContent=origText; btn.disabled=false; return; }
    if (!name) { showAuthError('请填写显示名称', true); btn.textContent=origText; btn.disabled=false; return; }
    if (!/^[a-zA-Z0-9]{1,6}$/.test(name)) { showAuthError('用户名仅支持英文和数字，最多6位', true); btn.textContent=origText; btn.disabled=false; return; }
    if (!inviteCode) { showAuthError('请填写邀请码', true); btn.textContent=origText; btn.disabled=false; return; }
    if (!db) { showAuthError('初始化失败，请刷新页面', true); btn.textContent=origText; btn.disabled=false; return; }

    // Validate invite code
    const {data: valid, error: rpcErr} = await db.rpc('claim_invite_code', { p_code: inviteCode });
    if (rpcErr || !valid) { showAuthError('邀请码无效或已用完', true); btn.textContent=origText; btn.disabled=false; return; }

    const {data: dupName} = await db.from('user_preferences').select('user_id').eq('display_name', name).maybeSingle();
    if (dupName) { showAuthError('该用户名已被使用，请换一个', true); btn.textContent=origText; btn.disabled=false; return; }

    const {data, error} = await db.auth.signUp({
      email, password,
      options: { data: { display_name: name } }
    });
    if (error) {
      showAuthError(error.message.includes('already registered') ? '该邮箱已注册，请直接登录' : error.message, true);
      btn.textContent=origText; btn.disabled=false;
      return;
    }
    if (data.user?.identities?.length===0) { showAuthError('该邮箱已注册，请直接登录', true); btn.textContent=origText; btn.disabled=false; return; }
    const {data: loginData, error: signInErr} = await db.auth.signInWithPassword({email, password});
    if (signInErr) { showAuthError('注册成功但登录失败，请尝试手动登录', true); btn.textContent=origText; btn.disabled=false; return; }
    await initApp(loginData.user);
    toast('注册成功！');
  } catch(e) {
    showAuthError('错误: ' + (e.message||e), true);
    console.error(e);
    btn.textContent = origText;
    btn.disabled = false;
  }
});

$['showRegisterLink'].addEventListener('click', showRegisterView);
$['showLoginLink'].addEventListener('click', showLoginView);

$['loginBtn'].addEventListener('click', async ()=>{
  const btn = $['loginBtn'];
  const origText = btn.textContent;
  btn.textContent = '登录中...';
  btn.disabled = true;
  try {
    const email = $['authEmail'].value.trim();
    const password = $['authPassword'].value;
    if (!email || !password) { showAuthError('请填写邮箱和密码'); return; }
    if (!db) { showAuthError('初始化失败，请刷新页面'); return; }

    const {data: loginData, error} = await db.auth.signInWithPassword({email, password});
    if (error) { showAuthError('登录失败，请检查邮箱和密码'); return; }
    await initApp(loginData.user);
  } catch(e) {
    showAuthError('错误: ' + (e.message||e));
    console.error(e);
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
});

$['logoutBtn'].addEventListener('click', async ()=>{
  $['userMenu'].classList.remove('open');
  await db.auth.signOut();
  doLogout();
});

// User menu dropdown toggle
$['userMenu'].addEventListener('click', (e)=>{
  e.stopPropagation();
  $['userMenu'].classList.toggle('open');
});
document.addEventListener('click', ()=>{
  $['userMenu'].classList.remove('open');
});


// ===== INVITE CODE MANAGEMENT =====
async function loadInviteCodes() {
  const {data: codes, error} = await db.from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { $['inviteCodeList'].innerHTML = '<p style="color:var(--text2);font-size:0.8rem">加载失败</p>'; return; }
  const active = (codes||[]).filter(c => new Date(c.expires_at) > new Date() && c.use_count < c.max_uses);

  if (!active.length) {
    $['inviteCodeList'].innerHTML = '<p style="color:var(--text2);font-size:0.8rem">暂无有效邀请码，点击上方按钮生成</p>';
    return;
  }
  $['inviteCodeList'].innerHTML = active.map(c => {
    const remaining = Math.max(0, new Date(c.expires_at) - Date.now());
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div>
        <code style="font-size:1rem;color:var(--gold);font-weight:700;letter-spacing:1px">${esc(c.code)}</code>
        <span style="font-size:0.7rem;color:var(--text2);margin-left:8px">剩余 ${h}小时${m}分</span>
      </div>
      <button class="btn btn-xs btn-secondary" onclick="copyInviteCode('${esc(c.code)}')" aria-label="复制邀请码">复制</button>
    </div>`;
  }).join('');
}

function copyInviteCode(code) {
  navigator.clipboard.writeText(code).then(() => toast('已复制邀请码'));
}

$['inviteGenerateBtn'].addEventListener('click', async () => {
  const btn = $['inviteGenerateBtn'];
  btn.textContent = '生成中...'; btn.disabled = true;
  const {data: code, error} = await db.rpc('generate_invite_code');
  if (error) { toast('生成失败: ' + error.message); btn.textContent='生成邀请码'; btn.disabled=false; return; }
  toast('已生成: ' + code);
  await loadInviteCodes();
  btn.textContent = '生成邀请码'; btn.disabled = false;
});

$['inviteMenuBtn'].addEventListener('click', () => {
  $['userMenu'].classList.remove('open');
  $['inviteCodeOverlay'].classList.add('open');
  loadInviteCodes();
});

$['inviteCloseBtn'].addEventListener('click', () => {
  $['inviteCodeOverlay'].classList.remove('open');
});
$['inviteCodeOverlay'].addEventListener('click', (e) => {
  if (e.target === e.currentTarget) $['inviteCodeOverlay'].classList.remove('open');
});

// Name setup
$['nameSaveBtn'].addEventListener('click', async ()=>{
  const name = $['nameInput'].value.trim();
  if (!name) return;
  if (!/^[a-zA-Z0-9]{1,6}$/.test(name)) { toast('用户名仅支持英文和数字，最多6位'); return; }
  const {data: dup} = await db.from('user_preferences').select('user_id').eq('display_name', name).maybeSingle();
  if (dup && dup.user_id !== currentUser.id) { toast('该用户名已被使用'); return; }
  let sessionToken = sessionStorage.getItem(SESSION_KEY);
  if (!sessionToken) { sessionToken = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, sessionToken); }
  await db.from('user_preferences').upsert({ user_id: currentUser.id, display_name: name, session_token: sessionToken });
  currentProfile = { user_id: currentUser.id, display_name: name };
  nameOverlay.classList.remove('open');
  $['headerUser'].textContent = name;
  $['headerUser'].style.color = getUserColor(currentUser.id).main;
  await loadAllData();
  subscribeToRealtime();
  $['inviteMenuBtn'].classList.toggle('hidden', name.toLowerCase() !== 'fank1ng' && name.toLowerCase() !== 'ceci');
});

// ===== APP INIT =====
async function initApp(user) {
  currentUser = user;
  authOverlay.classList.add('hidden');
  mainApp.classList.remove('hidden');

  const {data:pref, error: prefError} = await db.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
  if (prefError) {
    console.error('Load profile failed:', prefError);
    toast('账号信息加载失败：' + prefError.message);
    doLogout();
    return;
  }
  if (pref) {
    // Generate session token — invalidates any other active session for this account
    const sessionToken = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionToken);
    const { error: tokenError } = await db.from('user_preferences').update({ session_token: sessionToken }).eq('user_id', user.id);
    if (tokenError) {
      console.error('Update session token failed:', tokenError);
      toast('会话刷新失败：' + tokenError.message);
      doLogout();
      return;
    }
    currentProfile = pref;
    $['headerUser'].textContent = pref.display_name;
    $['headerUser'].style.color = getUserColor(user.id).main;
    nameOverlay.classList.remove('open');
    updateRecTabLabel();
    checkMigration();
    await loadAllData();
    subscribeToRealtime();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkSessionToken(); });
    clearInterval(sessionCheckTimer);
    sessionCheckTimer = setInterval(() => checkSessionToken(), 10000);
    // Show invite management for fank1ng/ceci
    const uname = getUserName(user.id);
    $['inviteMenuBtn'].classList.toggle('hidden', uname !== 'fank1ng' && uname !== 'ceci');
  } else {
    $['nameInput'].value = user.user_metadata?.display_name || user.email?.split('@')[0] || '';
    nameOverlay.classList.add('open');
    $['headerUser'].textContent = '...';
    $['headerUser'].style.color = getUserColor(user.id).main;
  }
}

function doLogout() {
  unsubscribeRealtime();
  clearInterval(sessionCheckTimer);
  sessionStorage.removeItem(SESSION_KEY);
  for (const k of Object.keys(creditsEnCache)) delete creditsEnCache[k];
  currentUser = null;
  currentProfile = null;
  allEntries = [];
  allSeasonRatings = [];
  authOverlay.classList.remove('hidden');
  mainApp.classList.add('hidden');
  nameOverlay.classList.remove('open');
  $['migrateBanner'].classList.add('hidden');
}

let lastSessionCheck = 0;
async function checkSessionToken() {
  if (!currentUser) return;
  const now = Date.now();
  if (now - lastSessionCheck < 5000) return;
  lastSessionCheck = now;
  try {
    const {data:pref} = await db.from('user_preferences').select('session_token').eq('user_id', currentUser.id).maybeSingle();
    const myToken = sessionStorage.getItem(SESSION_KEY);
    if (pref && myToken && pref.session_token !== myToken) {
      toast('账号已在其他位置登录');
      doLogout();
    }
  } catch(e) {}
}

// ===== MIGRATION =====
function checkMigration() {
  const old = localStorage.getItem('filmnote_movies');
  if (old && JSON.parse(old).length > 0) {
    $['migrateBanner'].classList.remove('hidden');
  }
}
$['migrateLink'].addEventListener('click', async ()=>{
  const old = JSON.parse(localStorage.getItem('filmnote_movies')||'[]');
  if (!old.length) return;
  if (!confirm(`将迁移 ${old.length} 条旧记录到云端账号"${currentProfile?.display_name}"，确认？`)) return;

  let movieCount = 0, seriesCount = 0;
  for (const m of old) {
    const entry = {
      user_id: currentUser.id,
      type: m.type || (m.seasons?.length ? 'series' : 'movie'),
      title: m.title,
      year: m.year || null,
      director: m.director || '',
      ratings: m.ratings || {},
      total_score: m.totalScore || calcTotal(m.ratings||{}),
      comment: m.comment || '',
      created_at: m.createdAt || new Date().toISOString(),
      updated_at: m.updatedAt || new Date().toISOString()
    };
    const {data:inserted, error} = await db.from('entries').insert(entry).select('id').single();
    if (!error && inserted) {
      if (entry.type==='series') seriesCount++; else movieCount++;
      if (entry.type==='series' && m.seasons && m.seasons.length) {
        for (const s of m.seasons) {
          await db.from('season_ratings').insert({
            entry_id: inserted.id, user_id: currentUser.id,
            season_number: s.season_number||1, season_title: s.season_title||'',
            ratings: s.ratings||{}, total_score: s.totalScore||calcTotal(s.ratings||{}),
            comment: s.comment||'', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          });
        }
      }
    }
  }
  const total = movieCount + seriesCount;
  if (total) {
    localStorage.removeItem('filmnote_movies');
    const parts = []; if (movieCount) parts.push(`${movieCount} 部电影`); if (seriesCount) parts.push(`${seriesCount} 部剧集`);
    toast(`已迁移 ${parts.join('、')}，共 ${total} 条记录`);
  }
  $['migrateBanner'].classList.add('hidden');
  loadAllData();
});
$['dismissMigrate'].addEventListener('click', ()=>{
  $['migrateBanner'].classList.add('hidden');
});

// ===== DATA LOADING (with localStorage cache) =====
const CACHE_KEY = 'filmnote_cache_';
const CACHE_VERSION = '2026-05-13-v2';
function getCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_KEY + key);
    if (!raw) return null;
    const {data, ts, version} = JSON.parse(raw);
    if (version !== CACHE_VERSION) { localStorage.removeItem(CACHE_KEY + key); return null; }
    if (Date.now() - ts > 3600000) { localStorage.removeItem(CACHE_KEY + key); return null; }
    return data;
  } catch { return null; }
}
function setCache(key, data) {
  try { localStorage.setItem(CACHE_KEY + key, JSON.stringify({data, ts: Date.now(), version: CACHE_VERSION})); } catch {}
}

// Movie cache: permanent localStorage for normalized TMDB detail
const movieCache = (() => {
  const KEY = 'filmnote_movie_cache';
  const OLD_KEY = 'filmnote_overviews';

  function loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
      // One-time migration from old overview-only format
      const oldRaw = localStorage.getItem(OLD_KEY);
      if (oldRaw) {
        const old = JSON.parse(oldRaw);
        const migrated = {};
        for (const [id, overview] of Object.entries(old)) {
          migrated[id] = normalizeMovieDetail({ overview });
        }
        saveAll(migrated);
        localStorage.removeItem(OLD_KEY);
        return migrated;
      }
      return {};
    } catch { return {}; }
  }

  function saveAll(all) {
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
  }

  return {
    get(tmdbId) {
      if (!tmdbId) return null;
      const cached = loadAll()[tmdbId] || null;
      return cached ? normalizeMovieDetail(cached) : null;
    },
    hasFull(tmdbId) {
      return !needsMovieDetailFetch(this.get(tmdbId));
    },

    set(tmdbId, data) {
      if (!tmdbId || !data) return;
      const all = loadAll();
      if (typeof data === 'string') {
        all[tmdbId] = mergeMovieDetail(all[tmdbId], { overview: data });
      } else {
        all[tmdbId] = mergeMovieDetail(all[tmdbId], data);
      }
      saveAll(all);
    },
    setBatch(map) {
      if (!map || !Object.keys(map).length) return;
      const all = loadAll();
      for (const [id, val] of Object.entries(map)) {
        if (typeof val === 'string') {
          all[id] = mergeMovieDetail(all[id], { overview: val });
        } else {
          all[id] = mergeMovieDetail(all[id], val);
        }
      }
      saveAll(all);
    },
    applyDetailsTo(entries) {
      const all = loadAll();
      for (const e of entries) {
        if (!e.tmdb_id || !all[e.tmdb_id]) continue;
        applyMovieDetailToEntry(e, normalizeMovieDetail(all[e.tmdb_id]));
      }
    },
    applyOverviewTo(entries) { this.applyDetailsTo(entries); }
  };
})();

async function loadAllData() {
  if (!currentUser) return;
  const uid = currentUser.id;

  // 1. Try cache first for instant render
  const cachedEntries = getCache('entries_' + uid);
  const cachedSeasons = getCache('seasons_' + uid);
  const cachedPrefs = getCache('prefs_' + uid);
  if (cachedEntries) {
    allEntries = cachedEntries;
    movieCache.applyOverviewTo(allEntries);
    allSeasonRatings = cachedSeasons || [];
    allProfiles = cachedPrefs || {};
    buildSearchIndex();
    updateHeaderCount();
    renderActiveTab();
  }

  // 2. Fetch fresh data from Supabase
  try {
    const [{data:entries},{data:seasons},{data:prefs}] = await Promise.all([
      db.from('entries').select('*').order('created_at',{ascending:false}),
      db.from('season_ratings').select('*').order('season_number',{ascending:true}),
      db.from('user_preferences').select('*')
    ]);
    allEntries = entries || [];
    invalidateCoupleRecommendations();
    // Backfill movieCache from Supabase (migration: overviews stored in DB before refactor)
    const batch = {};
    for (const e of allEntries) {
      if (e.tmdb_id && e.overview) batch[e.tmdb_id] = e.overview;
    }
    if (Object.keys(batch).length) movieCache.setBatch(batch);
    movieCache.applyOverviewTo(allEntries);
    allSeasonRatings = seasons || [];
    allProfiles = {};
    (prefs||[]).forEach(p=>{ allProfiles[p.user_id]=p; });

    const myToken = sessionStorage.getItem(SESSION_KEY);
    const dbToken = allProfiles[currentUser.id]?.session_token;
    if (myToken && dbToken && myToken !== dbToken) {
      toast('账号已在其他位置登录');
      doLogout();
      return;
    }

    // Update cache
    setCache('entries_' + uid, allEntries);
    setCache('seasons_' + uid, allSeasonRatings);
    setCache('prefs_' + uid, allProfiles);
    buildSearchIndex();

    updateHeaderCount();
    prefetchOverviews();
    renderActiveTab();
    discoverRatedCount = allEntries.filter(e=>e.user_id===currentUser?.id && e.type==='movie').length;
    updateRecTabLabel();
    warmOriginalTitleCache();
    warmCreditsEnCache();
    // Load secondary user lists
    loadBlockedMovies();
    await loadWatchlist();
    await loadCoupleState();
    await loadCoupleBlockedMovies();
    await loadCoupleQueue();
    if (getActiveTab() === 'couple') renderCouple();
    // One-time KV backfill for recommendation engine (runs once per deployment)
    if (!localStorage.getItem('kv_backfilled_v1')) {
      localStorage.setItem('kv_backfilled_v1', '1');
      setTimeout(() => backfillKvCache(), 3000);
    }
  } catch(e) {
    console.error('loadAllData error:', e);
    if (!cachedEntries) toast('加载数据失败: ' + (e.message||e));
  }
}

// Shared helpers for overview rendering
function buildOverviewHTML(ovId, text) {
  return `<h4>📖 简介</h4><div class="tmdb-overview" id="${ovId}">${esc(text)}</div><span class="tmdb-expand" id="${ovId}-btn" style="display:none" onclick="document.getElementById('${ovId}').classList.toggle('expanded');this.textContent=this.textContent==='展开全部'?'收起':'展开全部'">展开全部</span>`;
}

function checkOverviewOverflow(ovId) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const oe = document.getElementById(ovId);
      const btn = document.getElementById(ovId + '-btn');
      if (oe && btn && oe.scrollHeight > oe.clientHeight) btn.style.display = '';
    });
  });
}

const MOVIE_DETAIL_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeMovieDetail(input, credits) {
  if (!input) return null;
  if (input.movie) return normalizeMovieDetail(input.movie);
  if (input.details) return extractMovieDetail(input.details, input.credits || credits);

  const cast = Array.isArray(input.cast)
    ? input.cast.map(c => typeof c === 'string' ? c : c?.name).filter(Boolean).slice(0, 8)
    : [];
  const genres = Array.isArray(input.genres)
    ? input.genres.map(g => typeof g === 'string' ? g : g?.name).filter(Boolean)
    : [];
  const keywordIds = Array.isArray(input.keyword_ids)
    ? input.keyword_ids.map(Number).filter(Boolean)
    : Array.isArray(input.keywords)
      ? input.keywords.map(k => Number(typeof k === 'number' ? k : k?.id)).filter(Boolean)
      : [];
  const keywordNames = Array.isArray(input.keyword_names)
    ? input.keyword_names.map(String).filter(Boolean)
    : Array.isArray(input.keywords)
      ? input.keywords.map(k => typeof k === 'string' ? k : k?.name).filter(Boolean)
      : [];

  return {
    id: input.id || input.tmdb_id || null,
    title: input.title || input.name || '',
    original_title: input.original_title || input.original_name || '',
    overview: input.overview || '',
    overview_missing: input.overview_missing === true,
    release_date: input.release_date || input.first_air_date || '',
    year: input.year || parseInt(String(input.release_date || input.first_air_date || '').slice(0, 4)) || null,
    poster_path: input.poster_path || '',
    genres,
    genre_ids: input.genre_ids || [],
    vote_average: Number(input.vote_average || 0),
    vote_count: Number(input.vote_count || 0),
    popularity: Number(input.popularity || 0),
    runtime: Number(input.runtime || 0),
    director: input.director || '',
    cast,
    keyword_ids: keywordIds,
    keyword_names: keywordNames,
    original_language: input.original_language || '',
    fetched_at: input.fetched_at || 0
  };
}

function mergeMovieDetail(existing, incoming) {
  const prev = normalizeMovieDetail(existing) || {};
  const next = normalizeMovieDetail(incoming) || {};
  return {
    ...prev,
    ...next,
    title: next.title || prev.title || '',
    original_title: next.original_title || prev.original_title || '',
    overview: next.overview || prev.overview || '',
    overview_missing: next.overview ? false : (next.overview_missing ?? prev.overview_missing ?? false),
    release_date: next.release_date || prev.release_date || '',
    year: next.year || prev.year || null,
    poster_path: next.poster_path || prev.poster_path || '',
    genres: next.genres?.length ? next.genres : (prev.genres || []),
    genre_ids: next.genre_ids?.length ? next.genre_ids : (prev.genre_ids || []),
    vote_average: next.vote_average || prev.vote_average || 0,
    vote_count: next.vote_count || prev.vote_count || 0,
    popularity: next.popularity || prev.popularity || 0,
    runtime: next.runtime || prev.runtime || 0,
    director: next.director || prev.director || '',
    cast: next.cast?.length ? next.cast : (prev.cast || []),
    keyword_ids: next.keyword_ids?.length ? next.keyword_ids : (prev.keyword_ids || []),
    keyword_names: next.keyword_names?.length ? next.keyword_names : (prev.keyword_names || []),
    original_language: next.original_language || prev.original_language || '',
    fetched_at: next.fetched_at || prev.fetched_at || 0
  };
}

function needsMovieDetailFetch(detail) {
  if (!detail) return true;
  const stale = !detail.fetched_at || Date.now() - detail.fetched_at > MOVIE_DETAIL_REFRESH_MS;
  const missingOverview = !detail.overview && !detail.overview_missing;
  const missingCore = missingOverview || (!detail.director && !(detail.cast && detail.cast.length) && !detail.vote_average);
  const legacyPartial = !detail.fetched_at && (missingOverview || !detail.director || !(detail.cast && detail.cast.length));
  return stale || missingCore || legacyPartial;
}

function applyMovieDetailToEntry(entry, detail) {
  if (!entry || !detail) return {};
  const updates = {};
  if (detail.overview && !entry.overview) {
    entry.overview = detail.overview;
    updates.overview = detail.overview;
  }
  if (detail.director && !entry.director) {
    entry.director = detail.director;
    updates.director = detail.director;
  }
  if (detail.poster_path && !entry.poster_path) {
    entry.poster_path = detail.poster_path;
    updates.poster_path = detail.poster_path;
  }
  if (detail.year && !entry.year) {
    entry.year = detail.year;
    updates.year = detail.year;
  }
  return updates;
}

async function backfillMovieDetailToDB(entry, detail) {
  if (!entry || !detail || !entry.id || entry.user_id !== currentUser?.id) return;
  const updates = applyMovieDetailToEntry(entry, detail);
  if (!Object.keys(updates).length) return;
  db.from('entries').update(updates).eq('id', entry.id).then(()=>{}).catch(()=>{});
}

async function fetchMovieDetail(tmdbId, opts = {}) {
  if (!tmdbId) return null;
  const cached = movieCache.get(tmdbId);
  if (!opts.force && cached && !needsMovieDetailFetch(cached)) return cached;
  if (!opts.force && tmdbDetailCache[tmdbId]) return tmdbDetailCache[tmdbId];
  const detail = await fetchMovieDetailFromWorker(tmdbId)
    || await fetchMovieDetailFromPrefetch(tmdbId)
    || await fetchMovieDetailDirect(tmdbId);
  if (!detail) return cached || null;
  tmdbDetailCache[tmdbId] = detail;
  movieCache.set(tmdbId, detail);
  if (detail.original_title) originalTitleCache[tmdbId] = detail.original_title;
  return detail;
}

async function fetchMovieDetailFromWorker(tmdbId) {
  try {
    const res = await fetch(TMDB_PROXY + '/detail/' + tmdbId);
    if (!res.ok) return null;
    const result = await res.json();
    return normalizeMovieDetail(result.movie || result);
  } catch(e) { return null; }
}

async function fetchMovieDetailFromPrefetch(tmdbId) {
  try {
    const res = await fetch(TMDB_PROXY + '/prefetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_ids: [Number(tmdbId)], return_overviews: true })
    });
    if (!res.ok) return null;
    const result = await res.json();
    return normalizeMovieDetail(result.details?.[tmdbId] || result.details?.[String(tmdbId)]);
  } catch(e) { return null; }
}

async function fetchMovieDetailDirect(tmdbId) {
  try {
    const res = await tmdbFetch(`/movie/${tmdbId}?language=zh-CN`);
    if (!res.ok) return null;
    const detail = await res.json();
    return normalizeMovieDetail(detail);
  } catch(e) { return null; }
}

async function fetchOverview(tmdbId) {
  const detail = await fetchMovieDetail(tmdbId);
  return detail?.overview || '';
}

function editActionForEntry(entry) {
  return `openQuickEdit('${entry.id}')`;
}

function buildDimTagsHTML(ratings, userColor) {
  return Object.keys(WEIGHTS).map(dim =>
    `<span class="mc-dim-item" style="border-color:${userColor.main}"><span class="dim-lab">${DIM_LABELS[dim].slice(0,2)}</span><span class="dim-val" style="color:${userColor.main}">${ratings[dim]||5}</span></span>`
  ).join('');
}

async function backfillOverviewToDB(entry, overview) {
  if (!overview) return;
  await backfillMovieDetailToDB(entry, { overview });
}


// Extract clean cacheable object from raw TMDB detail+credits response
function extractMovieDetail(details, credits) {
  const director = (credits?.crew || []).find(c => c.job === 'Director');
  const cast = (credits?.cast || []).slice(0, 6);
  const keywords = details?.keywords?.keywords || details?.keywords?.results || details?.keywords || [];
  if (!details || details.success === false) return null;
  return normalizeMovieDetail({
    id: details?.id || null,
    title: details?.title || details?.name || '',
    original_title: details?.original_title || details?.original_name || '',
    overview: details?.overview || '',
    overview_missing: !details?.overview,
    release_date: details?.release_date || details?.first_air_date || '',
    poster_path: details?.poster_path || '',
    genres: (details?.genres || []).map(g => g.name),
    genre_ids: (details?.genres || []).map(g => g.id),
    vote_average: details?.vote_average || 0,
    vote_count: details?.vote_count || 0,
    popularity: details?.popularity || 0,
    runtime: details?.runtime || 0,
    director: director ? director.name : '',
    cast: cast.map(c => c.name),
    keyword_ids: keywords.map(k => k.id).filter(Boolean),
    keyword_names: keywords.map(k => k.name).filter(Boolean),
    original_language: details?.original_language || '',
    fetched_at: Date.now()
  });
}

// Build complete TMDB detail section HTML from cached data
function buildTmdbDetailHTML(cached, ovId) {
  const parts = [];
  // Meta row: vote_average + genres + runtime
  const chips = [];
  if (cached.vote_average) {
    chips.push(`<span style="color:var(--gold);font-weight:700;font-size:0.85rem">⭐ ${cached.vote_average.toFixed(1)}</span>`);
  }
  if (cached.genres && cached.genres.length) {
    cached.genres.forEach(g => chips.push(`<span class="cast-chip">${esc(g)}</span>`));
  }
  if (cached.runtime) {
    chips.push(`<span class="cast-chip">${cached.runtime} 分钟</span>`);
  }
  if (chips.length) {
    parts.push(`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${chips.join('')}</div>`);
  }
  if (cached.overview) {
    parts.push(buildOverviewHTML(ovId, cached.overview));
  } else if (cached.overview_missing) {
    parts.push('<p style="font-size:0.8rem;color:var(--text2)">TMDB 暂无简介</p>');
  }
  if (cached.director) {
    parts.push(`<h4 style="margin-top:8px">🎬 导演</h4><div class="tmdb-cast"><span class="cast-chip">${esc(cached.director)}</span></div>`);
  }
  if (cached.cast && cached.cast.length) {
    parts.push(`<h4 style="margin-top:8px">👥 演员</h4><div class="tmdb-cast">${cached.cast.map(c => `<span class="cast-chip">${esc(c)}</span>`).join('')}</div>`);
  }
  return parts.join('');
}

// Batch-prefetch missing/stale movie details after data load (hits Worker cache, non-blocking)
async function prefetchOverviews() {
  const missing = allEntries.filter(e => e.tmdb_id && needsMovieDetailFetch(movieCache.get(e.tmdb_id)));
  if (!missing.length) return;
  const ids = [...new Set(missing.map(e => e.tmdb_id))];
  const byTmdbId = {};
  for (const entry of missing) {
    if (!byTmdbId[entry.tmdb_id]) byTmdbId[entry.tmdb_id] = [];
    byTmdbId[entry.tmdb_id].push(entry);
  }
  for (let offset = 0; offset < ids.length; offset += 50) {
    const idBatch = ids.slice(offset, offset + 50);
    try {
      const res = await fetch(TMDB_PROXY + '/prefetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_ids: idBatch, return_overviews: true })
      });
      if (res.ok) {
        const data = await res.json();
        const detailMap = data.details || (data.overviews ? Object.fromEntries(
          Object.entries(data.overviews).map(([id, overview]) => [id, { id: Number(id), overview }])
        ) : {});
        if (Object.keys(detailMap).length) {
          movieCache.setBatch(detailMap);
          for (const [tmdbId, rawDetail] of Object.entries(detailMap)) {
            const detail = normalizeMovieDetail(rawDetail);
            const entries = byTmdbId[parseInt(tmdbId)];
            if (!detail || !entries) continue;
            for (const entry of entries) {
              backfillMovieDetailToDB(entry, detail);
            }
          }
          buildSearchIndex();
          if (getActiveTab()==='list') renderList();
        }
      }
    } catch(e) { console.warn('prefetchOverviews failed:', e); }
  }
}

async function warmOriginalTitleCache() {
  const uncached = allEntries.filter(e => e.tmdb_id && !originalTitleCache[e.tmdb_id]);
  if (!uncached.length) return;
  const ids = [...new Set(uncached.map(e => e.tmdb_id))];
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    const res = await fetch(TMDB_PROXY + '/titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_ids: ids }),
      signal: ac.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      Object.assign(originalTitleCache, data.results);
      buildSearchIndex();
      if (getActiveTab()==='list') renderList();
    }
  } catch(e) { console.warn('warmOriginalTitleCache failed:', e); }
}

async function warmCreditsEnCache() {
  const uncached = allEntries.filter(e => e.tmdb_id && !creditsEnCache[e.tmdb_id]);
  if (!uncached.length) return;
  const ids = [...new Set(uncached.map(e => e.tmdb_id))];
  // Send in batches of 50 (Worker limit)
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 15000);
      const res = await fetch(TMDB_PROXY + '/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_ids: batch }),
        signal: ac.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        Object.assign(creditsEnCache, data.results);
      }
    } catch(e) { console.warn('warmCreditsEnCache batch failed:', e); }
  }
  buildSearchIndex();
  if (getActiveTab()==='list') renderList();
}

// One-time KV cache backfill — collects all unique movie tmdb_ids and pre-warms via Worker
async function backfillKvCache() {
  if (!TMDB_PROXY) return;
  const movieIds = [...new Set(
    allEntries.filter(e => e.tmdb_id && e.type === 'movie').map(e => e.tmdb_id)
  )];
  if (!movieIds.length) return;
  for (let i = 0; i < movieIds.length; i += 50) {
    const batch = movieIds.slice(i, i + 50);
    try {
      const res = await fetch(TMDB_PROXY + '/prefetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_ids: batch })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('KV backfill done:', data);
      }
    } catch (e) { console.warn('backfillKvCache failed:', e); }
  }
}

function getActiveTab() {
  const btn = document.querySelector('nav button.active');
  return btn ? btn.dataset.tab : 'rate';
}
let skipListRender = false;

function renderActiveTab() {
  const tab = getActiveTab();
  if (tab==='list' && !skipListRender) renderList();
  if (tab==='couple') renderCouple();
  if (tab==='stats') renderStats();
}

function updateHeaderCount() {
  const mCount = allEntries.filter(e=>e.type==='movie' && e.user_id===currentUser.id).length;
  const sCount = allEntries.filter(e=>e.type==='series' && e.user_id===currentUser.id).length;
  const hparts = []; if (mCount) hparts.push(`${mCount}部电影`); if (sCount) hparts.push(`${sCount}部剧集`);
  $['headerCount'].textContent = hparts.length ? `共 ${hparts.join(' ')}` : '暂无记录';
}

// ===== REALTIME SYNC =====
function subscribeToRealtime() {
  if (realtimeChannel) return;
  try {
    let channel = db.channel('filmnote-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        (payload) => handleRealtimeChange(payload, 'entries')
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'season_ratings' },
        (payload) => handleRealtimeChange(payload, 'seasons')
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_preferences' },
        (payload) => handleRealtimeChange(payload, 'prefs')
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_movies' },
        () => { loadBlockedMovies(); loadCoupleBlockedMovies(); }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'couples' },
        () => { loadCoupleState().then(loadCoupleBlockedMovies).then(loadCoupleQueue).then(renderActiveTab).catch(()=>{}); }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'couple_watch_queue' },
        () => { loadCoupleQueue().then(renderActiveTab).catch(()=>{}); }
      );
    if (watchlistAvailable) {
      channel = channel.on('postgres_changes',
        { event: '*', schema: 'public', table: 'watchlist_movies' },
        () => { loadWatchlist(); }
      );
    }
    realtimeChannel = channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('Realtime: connected');
        if (status === 'CHANNEL_ERROR') { console.warn('Realtime error, retrying...'); realtimeChannel = null; setTimeout(subscribeToRealtime, 3000); }
        if (status === 'CLOSED') { realtimeChannel = null; setTimeout(subscribeToRealtime, 3000); }
      });
  } catch(e) {
    console.warn('Realtime subscription failed:', e.message);
    realtimeChannel = null;
  }
}

function handleRealtimeChange(payload, source) {
  const uid = payload.new?.user_id || payload.old?.user_id;
  if (uid === currentUser?.id && source !== 'prefs') return;
  // Only react to user_preferences when session_token actually changed
  if (source === 'prefs' && payload.new?.session_token === payload.old?.session_token) return;

  // Debounce rapid changes
  clearTimeout(realtimeDebounce);
  realtimeDebounce = setTimeout(() => {
    loadAllData();
  }, 800);
}

function unsubscribeRealtime() {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
  clearTimeout(realtimeDebounce);
}

// ===== DIMENSION SLIDERS =====
function buildDimSliders(prefix, ratings) {
  return Object.entries(DIM_LABELS).map(([dim,label])=>`
    <div class="dim-row">
      <div class="dim-info"><div class="dim-name">${label}</div><div class="dim-weight">权重 ${WEIGHTS[dim]*100}%</div></div>
      <div class="dim-slider">
        <input type="range" min="1" max="10" value="${ratings[dim]||5}" data-prefix="${prefix}" data-dim="${dim}" aria-label="${label}" aria-valuenow="${ratings[dim]||5}" aria-valuemin="1" aria-valuemax="10">
        <span class="dim-score" data-prefix="${prefix}" data-dim="${dim}">${ratings[dim]||5}</span>
      </div>
    </div>
  `).join('');
}


$['mainDims'].innerHTML = buildDimSliders('main', {});
bindDimSliders('main');
updateTotalPreview();

function bindDimSliders(prefix) {
  const selector = prefix ? `.dim-slider input[type="range"][data-prefix="${prefix}"]` : '.dim-slider input[type="range"]';
  document.querySelectorAll(selector).forEach(s=>{
    s.addEventListener('input', ()=>{
      const scoreEl = document.querySelector(`.dim-score[data-prefix="${s.dataset.prefix}"][data-dim="${s.dataset.dim}"]`);
      if (scoreEl) scoreEl.textContent = s.value;
      if (s.dataset.prefix==='main') updateTotalPreview();
      else updateSeasonPreview(s.dataset.prefix);
    });
  });
}

function getMainRatings() {
  const r = {};
  document.querySelectorAll('#mainDims input[type="range"]').forEach(s=>{ r[s.dataset.dim]=parseInt(s.value); });
  return r;
}

function updateTotalPreview() {
  $['totalScorePreview'].textContent = calcTotal(getMainRatings()).toFixed(1);
}

function updateSeasonPreview(prefix) {
  const r = {};
  document.querySelectorAll(`.dim-slider input[data-prefix="${prefix}"]`).forEach(s=>{ r[s.dataset.dim]=parseInt(s.value); });
  const badge = document.getElementById(`seasonTotal-${prefix}`);
  if (badge) badge.textContent = calcTotal(r).toFixed(1);
}

// ===== SEASON RATINGS UI =====
function addSeasonRow(seasonData, scope = 'main') {
  const listEl = scope === 'qr' ? $['qrSeasonList'] : $['seasonList'];
  if (!listEl) return;
  const sidx = seasonData?._idx || Date.now();
  const snum = seasonData?.season_number || '';
  const stitle = seasonData?.season_title || '';
  const ratings = seasonData?.ratings || {};
  const comment = seasonData?.comment || '';
  const prefix = `${scope === 'qr' ? 'qs' : 's'}${sidx}`;

  const card = document.createElement('div');
  card.className = 'season-card';
  card.dataset.seasonIdx = sidx;
  card.dataset.seasonScope = scope;
  card.innerHTML = `
    <div class="season-header" data-prefix="${prefix}">
      <span class="season-title">📺 第 <input type="number" value="${snum}" min="1" max="50" placeholder="?" style="width:50px;background:transparent;border:1px solid var(--border);color:var(--text);border-radius:4px;padding:2px 6px;font-size:0.85rem" onclick="event.stopPropagation()" title="季号不可重复"> 季 · <input type="text" value="${esc(stitle)}" placeholder="季标题（可选）" style="width:140px;background:transparent;border:1px solid var(--border);color:var(--text);border-radius:4px;padding:2px 6px;font-size:0.85rem" onclick="event.stopPropagation()"></span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="season-score" id="seasonTotal-${prefix}">${calcTotal(ratings).toFixed(1)}</span>
        <button type="button" class="btn btn-xs btn-danger" onclick="removeSeason('${sidx}', '${scope}')" title="删除此季">✕</button>
      </div>
    </div>
    <div class="season-body">
      <div class="dim-list">${buildDimSliders(prefix, ratings)}</div>
      <div class="form-group">
        <label>短评（可选）</label>
        <textarea placeholder="对这季的评价..." style="width:100%;padding:8px 12px;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:var(--radius);font-size:0.85rem;font-family:inherit" rows="1">${esc(comment)}</textarea>
      </div>
    </div>
  `;
  listEl.appendChild(card);

  // Toggle expand
  card.querySelector('.season-header').addEventListener('click', function(e) {
    if (e.target.tagName==='INPUT') return;
    card.querySelector('.season-body').classList.toggle('open');
  });
  // Expand by default for new seasons
  if (!seasonData?._id) card.querySelector('.season-body').classList.add('open');

  bindDimSliders(prefix);
}

function removeSeason(idx, scope = 'main') {
  const card = document.querySelector(`.season-card[data-season-idx="${idx}"][data-season-scope="${scope}"]`);
  if (card) card.remove();
}

function collectSeasonData(listEl = $['seasonList']) {
  const seasons = [];
  if (!listEl) return seasons;
  listEl.querySelectorAll('.season-card').forEach(card=>{
    const idx = card.dataset.seasonIdx;
    const prefix = `${card.dataset.seasonScope === 'qr' ? 'qs' : 's'}${idx}`;
    const numInput = card.querySelector('.season-header input[type="number"]');
    const titleInput = card.querySelector('.season-header input[type="text"]');
    const ratings = {};
    card.querySelectorAll(`input[type="range"][data-prefix="${prefix}"]`).forEach(s=>{
      ratings[s.dataset.dim] = parseInt(s.value);
    });
    const commentEl = card.querySelector('textarea');
    seasons.push({
      _idx: idx,
      season_number: parseInt(numInput?.value) || 0,
      season_title: titleInput?.value?.trim() || '',
      ratings,
      total_score: calcTotal(ratings),
      comment: commentEl?.value?.trim() || ''
    });
  });
  seasons.sort((a,b)=>a.season_number-b.season_number);
  return seasons;
}

$['addSeasonBtn'].addEventListener('click', ()=>{
  const existing = collectSeasonData($['seasonList']).map(s=>s.season_number);
  const next = existing.length>0 ? Math.max(...existing)+1 : 1;
  addSeasonRow({ season_number: next }, 'main');
});

$['qrAddSeasonBtn'].addEventListener('click', ()=>{
  const existing = collectSeasonData($['qrSeasonList']).map(s=>s.season_number);
  const next = existing.length>0 ? Math.max(...existing)+1 : 1;
  addSeasonRow({ season_number: next }, 'qr');
});

// ===== TYPE TOGGLE =====
function normalizeMediaType(type) {
  return type === 'series' || type === 'tv' ? 'series' : 'movie';
}

function entryTypeToMediaType(type = entryType) {
  return normalizeMediaType(type);
}

function mediaTypeToEntryType(type) {
  return normalizeMediaType(type);
}

function mediaTypeLabel(type) {
  return normalizeMediaType(type) === 'series' ? '剧集' : '电影';
}

function listKey(mediaTypeOrMovie, tmdbId = null) {
  if (typeof mediaTypeOrMovie === 'object' && mediaTypeOrMovie) {
    return `${normalizeMediaType(mediaTypeOrMovie.media_type || mediaTypeOrMovie.type)}:${Number(mediaTypeOrMovie.tmdb_id || mediaTypeOrMovie.id)}`;
  }
  return `${normalizeMediaType(mediaTypeOrMovie)}:${Number(tmdbId)}`;
}

function setEntryType(nextType) {
  entryType = mediaTypeToEntryType(nextType);
  const isSeries = entryType === 'series';
  document.querySelectorAll('#typeToggle button').forEach(b => b.classList.toggle('active', b.dataset.type === entryType));
  $['seasonSection'].classList.toggle('hidden', !isSeries);
  $['formTitle'].textContent = '搜索电影 / 剧集';
  $['tmdbSearch'].placeholder = isSeries ? '🔍 搜索剧集，选择后添加评价或加入清单...' : '🔍 搜索电影，选择后添加评价或加入清单...';
  clearSelectedSearchMovie();
  $['searchResults'].classList.remove('open');
}

document.querySelectorAll('#typeToggle button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    setEntryType(btn.dataset.type);
  });
});

// ===== TMDB SEARCH =====
let tmdbTimer = null;
let tmdbAbort = null;
let selectedSearchMovie = null;

function updateSearchActions() {
  const disabled = !selectedSearchMovie;
  [$['searchAddReviewBtn'], $['searchWatchBtn'], $['searchNextBtn']].forEach(btn => {
    if (btn) btn.disabled = disabled;
  });
}

function clearSelectedSearchMovie() {
  selectedSearchMovie = null;
  document.querySelectorAll('.sr-item.selected').forEach(item => item.classList.remove('selected'));
  updateSearchActions();
}

function selectSearchResult(item) {
  const movie = movieFromSearchElement(item);
  if (!movie) return;
  selectedSearchMovie = movie;
  document.querySelectorAll('.sr-item.selected').forEach(row => row.classList.remove('selected'));
  item.classList.add('selected');
  updateSearchActions();
}

$['tmdbSearch'].addEventListener('input', function(){
  clearTimeout(tmdbTimer);
  const q = this.value.trim();
  clearSelectedSearchMovie();
  if (!q) { $['searchResults'].classList.remove('open'); return; }
  tmdbTimer = setTimeout(()=>searchTmdb(q), 350);
});

function movieFromSearchElement(item) {
  return normalizeListMovie({
    id: item.dataset.tmdbId,
    media_type: item.dataset.mediaType,
    title: item.dataset.title,
    year: item.dataset.year,
    release_date: item.dataset.releaseDate || '',
    poster_path: item.dataset.poster || ''
  });
}

async function fillFromTmdbSearchItem(item) {
  const tmdbId = item.dataset.tmdbId;
  const mediaType = normalizeMediaType(item.dataset.mediaType);
  setEntryType(mediaType);
  $['title'].value = item.dataset.title;
  $['year'].value = item.dataset.year || '';
  $['tmdbId'].value = tmdbId;
  $['posterPath'].value = item.dataset.poster;
  $['tmdbSearch'].value = '';
  $['searchResults'].classList.remove('open');

  // Fetch normalized detail once; the same cache feeds save, detail modal, and search
  try {
    const type = mediaType === 'series' ? 'tv' : 'movie';
    let director = '';
    if (mediaType === 'series') {
      const detailRes = await tmdbFetch(`/${type}/${tmdbId}?language=zh-CN`);
      const detailData = await detailRes.json().catch(() => ({}));
      if (detailData?.first_air_date && !$['year'].value) $['year'].value = detailData.first_air_date.slice(0, 4);
      if (detailData?.poster_path && !$['posterPath'].value) $['posterPath'].value = detailData.poster_path;
      const credRes = await tmdbFetch(`/${type}/${tmdbId}/credits?language=zh-CN`);
      const credData = await credRes.json();
      const creator = (detailData.created_by || [])[0] || (credData.crew||[]).find(c=>c.job==='Director'||c.job==='Executive Producer');
      director = creator?.name || '';
    } else {
      const detail = await fetchMovieDetail(tmdbId);
      director = detail?.director || '';
      if (detail?.overview || detail?.poster_path || detail?.year) {
        if (detail.year && !$['year'].value) $['year'].value = detail.year;
        if (detail.poster_path && !$['posterPath'].value) $['posterPath'].value = detail.poster_path;
      }
    }
    if (director) $['director'].value = director;
  } catch(e){}
  toast('已自动填入信息');
}

$['searchAddReviewBtn'].addEventListener('click', ()=>{
  if (!selectedSearchMovie) return;
  $['searchResults'].classList.remove('open');
  openQuickRate(selectedSearchMovie);
});

$['searchWatchBtn'].addEventListener('click', async ()=>{
  if (!selectedSearchMovie) return;
  await addToWatchlist(selectedSearchMovie);
});

$['searchNextBtn'].addEventListener('click', async ()=>{
  if (!selectedSearchMovie) return;
  await addToCoupleQueue(selectedSearchMovie);
});
updateSearchActions();

async function searchTmdb(query) {
  const container = $['searchResults'];
  clearSelectedSearchMovie();
  // Abort previous in-flight request
  if (tmdbAbort) tmdbAbort.abort();
  tmdbAbort = new AbortController();
  try {
    const type = entryType === 'series' ? 'tv' : 'movie';
    const res = await fetch(TMDB_PROXY + `/search?q=${encodeURIComponent(query)}&type=${type}`, { signal: tmdbAbort.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false || data.error || data.status_code) {
      throw new Error(data.error || data.status_message || `TMDB 搜索接口异常 (${res.status})`);
    }
    if (!data.results?.length) {
      clearSelectedSearchMovie();
      container.innerHTML = '<div style="padding:12px;color:var(--text2);font-size:0.85rem">无结果</div>';
      container.classList.add('open');
      return;
    }
    container.innerHTML = data.results.slice(0,8).map(r=>{
      const title = r.title || r.name;
      const year = (r.release_date||r.first_air_date||'').slice(0,4);
      const releaseDate = r.release_date || r.first_air_date || '';
      const poster = r.poster_path ? posterUrl(r.poster_path) : '';
      const mediaType = type === 'tv' ? 'series' : 'movie';
      return `
        <div class="sr-item" data-tmdb-id="${r.id}" data-media-type="${mediaType}" data-title="${esc(title)}" data-year="${year}" data-release-date="${releaseDate}" data-poster="${r.poster_path||''}">
          ${poster ? `<img class="sr-poster" src="${poster}" alt="">` : '<div class="sr-poster"></div>'}
          <div class="sr-info sr-fill-action">
            <div class="sr-title">${esc(title)}</div>
            <div class="sr-meta">${year||'未知'} ${r.overview ? '· '+esc(r.overview.slice(0,60))+'...' : ''}</div>
          </div>
        </div>
      `;
    }).join('');
    container.classList.add('open');

    // Click handler
    container.querySelectorAll('.sr-item').forEach(item=>{
      item.addEventListener('click', ()=>{
        selectSearchResult(item);
      });
    });
  } catch(e) {
    if (e.name==='AbortError') return; // Cancelled by newer request
    clearSelectedSearchMovie();
    container.innerHTML = `<div style="padding:12px;color:var(--text2);font-size:0.85rem">TMDB 连接失败：${esc(e.message || '搜索失败')}</div>`;
    container.classList.add('open');
  }
}

// Close search on click outside
document.addEventListener('click', e=>{
  if (!e.target.closest('.search-wrap')) $['searchResults'].classList.remove('open');
});

// ===== FORM SUBMIT =====
$['movieForm'].addEventListener('submit', async e=>{
  e.preventDefault();
  const btn = $['submitBtn'];
  const origText = btn.textContent;
  btn.textContent = '保存中...';
  btn.disabled = true;
  try {
    const title = $['title'].value.trim();
    if (!title) { toast('请填写电影名称'); btn.textContent=origText; btn.disabled=false; return; }
    if (title.length < 2 || title.length > 100) { toast('片名需 2-100 个字符'); btn.textContent=origText; btn.disabled=false; return; }
    const yearVal = parseInt($['year'].value);
    if ($['year'].value && (isNaN(yearVal) || yearVal < 1900 || yearVal > 2100)) { toast('年份需在 1900-2100 之间'); btn.textContent=origText; btn.disabled=false; return; }

    const ratings = getMainRatings();
    const tmdbIdVal = parseInt($['tmdbId'].value) || null;
    const entryData = {
      user_id: currentUser.id,
      type: entryType,
      tmdb_id: tmdbIdVal,
      title,
      year: parseInt($['year'].value) || null,
      director: $['director'].value.trim(),
      poster_path: $['posterPath'].value,
      ratings,
      total_score: calcTotal(ratings),
      comment: $['comment'].value.trim(),
      updated_at: new Date().toISOString()
    };
    if (entryType === 'movie' && tmdbIdVal) {
      const cachedDetail = movieCache.get(tmdbIdVal);
      if (cachedDetail) applyMovieDetailToEntry(entryData, cachedDetail);
    }

    let entryId = editingEntryId;

    if (editingEntryId) {
      const {error: delErr} = await db.from('season_ratings').delete().eq('entry_id', editingEntryId).eq('user_id', currentUser.id);
      if (delErr) { toast('清除旧季数据失败: '+delErr.message); btn.textContent=origText; btn.disabled=false; return; }
      const {error: updateErr} = await db.from('entries').update(entryData).eq('id', editingEntryId);
      if (updateErr) { toast('更新失败: '+updateErr.message); btn.textContent=origText; btn.disabled=false; return; }
    } else {
      entryData.created_at = new Date().toISOString();
      // Verify session before insert
      const {data:{session}} = await db.auth.getSession();
      if (!session) { toast('登录已过期，请重新登录'); return; }
      const {data:inserted, error: insertErr} = await db.from('entries').insert(entryData).select('id').single();
      if (insertErr) {
        toast('保存失败: '+insertErr.message+' (code:'+insertErr.code+')');
        console.error('Insert error:', insertErr);
        return;
      }
      if (!inserted) { toast('保存失败：未返回数据'); return; }
      entryId = inserted.id;
    }

    if (entryType==='series') {
      const seasons = collectSeasonData().filter(s=>s.season_number>0);
      const snums = seasons.map(s=>s.season_number);
      const dup = snums.find((n,i)=>snums.indexOf(n)!==i);
      if (dup) { toast(`季号 S${dup} 重复，请修改后再保存`); btn.textContent=origText; btn.disabled=false; return; }
      for (const s of seasons) {
        await db.from('season_ratings').insert({
          entry_id: entryId,
          user_id: currentUser.id,
          season_number: s.season_number,
          season_title: s.season_title,
          ratings: s.ratings,
          total_score: s.total_score,
          comment: s.comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    toast(editingEntryId ? '评价已更新' : '评价已保存');
    const savedMediaType = entryTypeToMediaType(entryType);
    const savedListKey = tmdbIdVal ? listKey(savedMediaType, tmdbIdVal) : '';
    if (!editingEntryId && tmdbIdVal && watchlistIds.has(savedListKey)) {
      db.from('watchlist_movies')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('media_type', savedMediaType)
        .eq('tmdb_id', tmdbIdVal)
        .then(({error}) => {
          if (!error) {
            watchlistIds.delete(savedListKey);
            delete watchlistMovies[savedListKey];
          }
        });
    }
    if (!editingEntryId && tmdbIdVal && activeCouple && coupleQueue.some(q => listKey(q) === savedListKey)) {
      db.from('couple_watch_queue')
        .delete()
        .eq('couple_id', activeCouple.id)
        .eq('media_type', savedMediaType)
        .eq('tmdb_id', tmdbIdVal)
        .then(({error}) => {
          if (!error) {
            coupleQueue = coupleQueue.filter(q => listKey(q) !== savedListKey);
            normalizeCoupleQueuePositions(false);
          }
        });
    }
    // Fire-and-forget: warm KV cache + backfill normalized movie detail to saved entry
    if (entryType === 'movie' && entryData.tmdb_id) {
      fetchMovieDetail(entryData.tmdb_id).then(detail => {
        if (detail && entryId) {
          const e = allEntries.find(x => x.id === entryId) || { ...entryData, id: entryId };
          backfillMovieDetailToDB(e, detail);
        }
      });
    }
    resetForm();
    skipListRender = true;
    await loadAllData();
    skipListRender = false;
    locateAndGoToList(entryId);
    switchTab('list');
  } catch(err) {
    toast('保存出错: ' + (err.message||err));
    console.error('Save error:', err);
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
});

function resetForm() {
  editingEntryId = null;
  $['editId'].value = '';
  $['title'].value = '';
  $['year'].value = '';
  $['director'].value = '';
  $['tmdbId'].value = '';
  $['posterPath'].value = '';
  $['comment'].value = '';
  $['tmdbSearch'].value = '';
  $['seasonList'].innerHTML = '';
  $['submitBtn'].textContent = '保存评价';
  $['cancelEditBtn'].classList.add('hidden');
  // Reset type to movie
  setEntryType('movie');
  // Reset sliders to defaults
  $['mainDims'].innerHTML = buildDimSliders('main', {});
  bindDimSliders('main');
  updateTotalPreview();
}

$['cancelEditBtn'].addEventListener('click', resetForm);

// ===== EDIT =====
async function editEntry(id) {
  const entry = allEntries.find(m=>m.id===id);
  if (!entry) return;

  editingEntryId = id;
  $['editId'].value = id;
  $['title'].value = entry.title;
  $['year'].value = entry.year||'';
  $['director'].value = entry.director||'';
  $['tmdbId'].value = entry.tmdb_id||'';
  $['posterPath'].value = entry.poster_path||'';
  $['comment'].value = entry.comment||'';

  setEntryType(entry.type);
  $['formTitle'].textContent = entry.type==='series'?'编辑剧集评价':'编辑电影评价';

  // Set dimension sliders
  $['mainDims'].innerHTML = buildDimSliders('main', entry.ratings||{});
  bindDimSliders('main');
  updateTotalPreview();

  // Load season ratings
  $['seasonList'].innerHTML = '';
  if (entry.type==='series') {
    const seasons = allSeasonRatings.filter(s=>s.entry_id===id&&s.user_id===currentUser.id);
    seasons.forEach(s=>{
      addSeasonRow({ _idx: s.id, _id: s.id, season_number: s.season_number, season_title: s.season_title, ratings: s.ratings, comment: s.comment });
    });
  }

  $['submitBtn'].textContent = '更新评价';
  $['cancelEditBtn'].classList.remove('hidden');
  switchTab('rate');
  window.scrollTo({top:0,behavior:'smooth'});
}

async function deleteEntry(id) {
  if (!confirm('确定删除这条评价？此操作不可恢复。')) return;
  await db.from('entries').delete().eq('id', id);
  if (editingEntryId===id) resetForm();
  await loadAllData();
  closeModal();
  toast('已删除');
}

function addMyRating(entryId) {
  const entry = allEntries.find(e=>e.id===entryId);
  if (!entry) return;
  // Open quick rate modal (same as discover cards)
  openQuickRate({
    id: entry.tmdb_id,
    media_type: entry.type,
    title: entry.title,
    release_date: entry.year ? String(entry.year)+'-01-01' : '',
    poster_path: entry.poster_path
  });
}

function openEntryFormForListMovie(movieOrId) {
  const movie = normalizeListMovie(movieOrId);
  if (!movie) return;
  openQuickRate(movie);
}

// ===== USER COLOR =====
function getUserColor(userId) {
  const name = getUserName(userId);
  if (name==='fank1ng') return { key:'mine', main:'#d4a853', dim:'#3a3020' };
  if (name==='ceci') return { key:'ceci', main:'#FF69B4', dim:'#2a1525' };
  return { key:'friend', main:'#5b9db0', dim:'#1a2a30' };
}

// ===== TMDB DETAIL FETCH (shared cache) =====
const tmdbDetailCache = {};
const originalTitleCache = {}; // { [tmdbId]: original_title } — populated on detail fetch, used for English search
const creditsEnCache = {};
const searchIndex = {}; // { [entryId]: "lowercase search string" } — built sync, enriched async

function buildSearchIndex() {
  for (const e of allEntries) {
    let s = (e.title + '|' + (e.director||''));
    if (e.tmdb_id && originalTitleCache[e.tmdb_id]) s += '|' + originalTitleCache[e.tmdb_id];
    if (e.tmdb_id && creditsEnCache[e.tmdb_id]) {
      const ec = creditsEnCache[e.tmdb_id];
      s += '|' + (ec.d||'') + '|' + (ec.c||'') + '|' + (ec.d_zh||'') + '|' + (ec.c_zh||'');
    }
    searchIndex[e.id] = s.toLowerCase();
  }
}

async function fetchTmdbDetail(tmdbId) {
  const movie = await fetchMovieDetail(tmdbId);
  return movie ? { movie, details: movie, credits: null } : null;
}

// ===== RENDER LIST =====
let listMode = 'entries';
let listType = 'movie';
let ownerFilter = 'all';
let listPageSize = 20;
let listPageNum = 1;

$['listModeTabs'].addEventListener('click', e => {
  const btn = e.target.closest('button[data-lmode]');
  if (!btn) return;
  listMode = btn.dataset.lmode;
  document.querySelectorAll('#listModeTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (listMode === 'watchlist') {
    watchlistPage = 1;
  } else {
    listPageNum = 1;
  }
  renderList();
});

document.querySelectorAll('#listSubtabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#listSubtabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    listType = btn.dataset.ltype;
    listPageNum = 1; renderList();
  });
});

$['ownerFilter'].addEventListener('change', function(){
  ownerFilter = this.value;
  listPageNum = 1; renderList();
});

$['searchInput'].addEventListener('input', ()=>{ listPageNum = 1; renderList(); });
$['sortBy'].addEventListener('change', ()=>{ listPageNum = 1; renderList(); });
$['scoreFilter'].addEventListener('change', ()=>{ listPageNum = 1; renderList(); });

// Shared: build filtered, grouped, scored, and sorted groups from current list controls
function getFilteredSortedGroups() {
  const query = ($['searchInput'].value||'').toLowerCase();
  const sort = $['sortBy'].value;
  const scoreFilterVal = $['scoreFilter'].value;

  let filtered = allEntries.filter(e=>{
    if (e.type!==listType) return false;
    if (ownerFilter==='me' && e.user_id!==currentUser.id) return false;
    if (query) {
      const idx = searchIndex[e.id];
      if (!idx || !idx.includes(query)) return false;
    }
    return true;
  });

  if (!filtered.length) return [];

  // Group entries by tmdb_id or title+year
  const groups = [];
  const seen = new Set();
  filtered.forEach(e=>{
    const gkey = getGroupKey(e);
    if (seen.has(gkey)) return;
    seen.add(gkey);
    const group = filtered.filter(f=>getGroupKey(f)===gkey);
    group._avgScore = group.reduce((s,x)=>s+getEntryScore(x),0)/group.length;
    groups.push(group);
  });

  // Apply score filter on group averages
  let scoredGroups = groups;
  if (scoreFilterVal!=='all') {
    scoredGroups = groups.filter(g=>Math.floor(g._avgScore)===parseInt(scoreFilterVal));
  }

  // Sort groups
  scoredGroups.sort((a,b)=>{
    switch(sort) {
      case 'score-desc': return b._avgScore-a._avgScore;
      case 'score-asc': return a._avgScore-b._avgScore;
      case 'count-desc': return b.length-a.length;
      case 'date-desc': return new Date(b[0].created_at)-new Date(a[0].created_at);
      case 'date-asc': return new Date(a[0].created_at)-new Date(b[0].created_at);
      case 'title': return a[0].title.localeCompare(b[0].title,'zh');
      default: return 0;
    }
  });

  return scoredGroups;
}

function renderList() {
  const entriesView = $['listEntriesView'];
  const watchlistView = $['listWatchlistView'];
  if (listMode === 'watchlist') {
    entriesView?.classList.add('hidden');
    watchlistView?.classList.remove('hidden');
    renderWatchlistPanel();
    return;
  }
  entriesView?.classList.remove('hidden');
  watchlistView?.classList.add('hidden');
  const container = $['movieList'];
  const empty = $['emptyState'];
  const loading = $['loadingState'];

  loading.classList.add('hidden');
  const groups = getFilteredSortedGroups();

  if (!groups.length) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  // Pagination: slice groups for current page
  const start = (listPageNum - 1) * listPageSize;
  const pageGroups = groups.slice(start, start + listPageSize);
  container.innerHTML = pageGroups.map(group=>{
    const main = group.find(e=>e.user_id===currentUser.id) || group[0];
    const others = group.filter(e=>e.user_id!==currentUser.id);
    const isMine = main.user_id===currentUser.id;
    const uniqueUsers = new Set(group.map(e=>e.user_id));
    const merged = uniqueUsers.size > 1;
    const seasonCount = main.type==='series' ? allSeasonRatings.filter(s=>s.entry_id===main.id&&s.user_id===main.user_id).length : 0;

    const dimOrder = Object.keys(WEIGHTS);
    const dimTags = (entry, uc) => buildDimTagsHTML(entry.ratings||{}, uc);

    if (merged) {
      const priv = isPrivileged();
      const currentUserInGroup = group.some(e=>e.user_id===currentUser.id);

      let scoreBadges = '';
      let dimRowsHtml = '';
      let addBtnHtml = '';

      // Helper: render one entry row
      function renderOneRow(e, showActions) {
        const uc = getUserColor(e.user_id);
        const uname = allProfiles[e.user_id]?.display_name||'未知';
        scoreBadges += `<div class="mc-score-sm mc-score-${uc.key}" title="${esc(uname)}">
          <span class="mc-score-label">${esc(uname)}</span>${getEntryScore(e).toFixed(1)}</div>`;
        let act = '';
        if (showActions) {
          act = `<div class="mc-actions" onclick="event.stopPropagation()" style="margin-left:auto">
            <button class="btn btn-sm btn-secondary" onclick="${editActionForEntry(e)}" aria-label="编辑 ${esc(allProfiles[e.user_id]?.display_name||'')} 的评价">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteEntry('${e.id}')" aria-label="删除 ${esc(allProfiles[e.user_id]?.display_name||'')} 的评价">删除</button>
          </div>`;
        }
        dimRowsHtml += `<div class="mc-dim-row-user" style="display:flex;align-items:center;gap:6px;padding:2px 0">
          <span class="mc-dim-user" style="color:${uc.main}">${esc(uname)}</span><span class="mc-dim-dots">${dimTags(e,uc)}</span><span class="mc-dim-total" style="color:${uc.main}">总分 ${getEntryScore(e).toFixed(1)}</span>${act}</div>`;
      }

      // Helper: render average row for a list of entries
      function renderAvgRow(entries) {
        const avgTotal = entries.reduce((s,e)=>s+getEntryScore(e),0)/entries.length;
        const avgDims = {};
        for (const dim of Object.keys(WEIGHTS)) {
          avgDims[dim] = Math.round(entries.reduce((s,e)=>s+(e.ratings[dim]||5),0)/entries.length);
        }
        scoreBadges += `<div class="mc-score-sm mc-score-friend" title="平均">
          <span class="mc-score-label">平均</span>${avgTotal.toFixed(1)}</div>`;
        dimRowsHtml += `<div class="mc-dim-row-user" style="display:flex;align-items:center;gap:6px;padding:2px 0">
          <span class="mc-dim-user" style="color:var(--friend)">平均</span><span class="mc-dim-dots">${dimTags({ratings:avgDims},{key:'friend'})}</span><span class="mc-dim-total" style="color:var(--friend)">总分 ${avgTotal.toFixed(1)}</span></div>`;
      }

      if (priv) {
        // Fank1ng/ceci: own row + other privileged + average of rest
        const myEntry = group.find(e=>e.user_id===currentUser.id);
        const otherPriv = group.find(e=>{
          const n=getUserName(e.user_id);
          return (n==='fank1ng'||n==='ceci') && e.user_id!==currentUser.id;
        });
        const rest = group.filter(e=>{
          const n=getUserName(e.user_id);
          return n!=='fank1ng' && n!=='ceci' && e.user_id!==currentUser.id;
        });

        if (myEntry) renderOneRow(myEntry, true);
        if (otherPriv) renderOneRow(otherPriv, false);
        if (rest.length > 0) renderAvgRow(rest);
        if (!currentUserInGroup && rest.length > 0) {
          addBtnHtml = `<div style="text-align:right;padding-top:4px"><button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();addMyRating('${rest[0].id}')" aria-label="添加我的评分">＋我的评分</button></div>`;
        }
      } else {
        // Other user: self + Fank1ng + ceci
        const myEntry = group.find(e=>e.user_id===currentUser.id);
        const fank1ngEntry = group.find(e=>getUserName(e.user_id)==='fank1ng');
        const ceciEntry = group.find(e=>getUserName(e.user_id)==='ceci');

        if (myEntry) renderOneRow(myEntry, true);
        if (fank1ngEntry && fank1ngEntry.user_id!==currentUser.id) renderOneRow(fank1ngEntry, false);
        if (ceciEntry && ceciEntry.user_id!==currentUser.id) renderOneRow(ceciEntry, false);
        // Fallback: if no self/Fank1ng/ceci, show all other users
        const anyPrivileged = myEntry || (fank1ngEntry && fank1ngEntry.user_id!==currentUser.id) || (ceciEntry && ceciEntry.user_id!==currentUser.id);
        if (!anyPrivileged) {
          group.filter(e=>e.user_id!==currentUser.id).forEach(e => renderOneRow(e, false));
        }
        if (!currentUserInGroup) {
          const anyNonMe = group.find(e=>e.user_id!==currentUser.id);
          if (anyNonMe) addBtnHtml = `<div style="text-align:right;padding-top:4px"><button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();addMyRating('${anyNonMe.id}')" aria-label="添加我的评分">＋我的评分</button></div>`;
        }
      }

      let cardActionsHtml = '';
      const myEntryInGroup = group.find(e=>e.user_id===currentUser.id);
      if (myEntryInGroup) {
        cardActionsHtml = `<div class="mc-actions-mobile" onclick="event.stopPropagation()"><button class="btn btn-sm btn-secondary" onclick="${editActionForEntry(myEntryInGroup)}" aria-label="编辑我的评价">编辑</button><button class="btn btn-sm btn-danger" onclick="deleteEntry('${myEntryInGroup.id}')" aria-label="删除我的评价">删除</button></div>`;
      } else {
        const firstOther = group.find(e=>e.user_id!==currentUser.id);
        if (firstOther) cardActionsHtml = `<div class="mc-actions-mobile" onclick="event.stopPropagation()"><button class="btn btn-sm btn-secondary" onclick="addMyRating('${firstOther.id}')" aria-label="添加我的评分">＋我的评分</button></div>`;
      }

      return `
        <div class="movie-card" id="entry-${main.id}" onclick="showDetail('${main.id}')" aria-label="${esc(main.title)} — ${group.map(e=>allProfiles[e.user_id]?.display_name||'?').join('、')}">
          ${main.poster_path ? `<img class="mc-poster" src="${posterUrl(main.poster_path)}" alt="">` : '<div class="mc-poster"></div>'}
          <div class="mc-scores-compare" style="flex-wrap:wrap;gap:8px">${scoreBadges}</div>
          <div class="mc-info">
            <div class="mc-title">
              ${esc(main.title)}
              ${main.year ? '<span style="color:var(--text2);font-weight:400">('+main.year+')</span>':''}
              ${main.type==='series' ? '<span style="font-size:0.7rem;color:var(--gold)"> 剧集</span>' : ''}
            </div>
            <div class="mc-meta">
              ${main.director ? esc(main.director)+' · ':''}${fmtDate(main.created_at)}
              ${seasonCount>0 ? `<span class="mc-season-badge">S1-S${seasonCount}</span>` : ''}
            </div>
            <div class="mc-dim-scores" style="flex-direction:column;gap:2px">
              ${dimRowsHtml}
              ${addBtnHtml}
            </div>
          </div>
          ${cardActionsHtml}
        </div>
      `;
    } else {
      // Single entry — use same component styles as merged card
      const ownerName = allProfiles[main.user_id]?.display_name||'未知';
      const uc = getUserColor(main.user_id);
      return `
        <div class="movie-card" id="entry-${main.id}" onclick="showDetail('${main.id}')" aria-label="${esc(main.title)} - ${esc(ownerName)} ${getEntryScore(main).toFixed(1)}分">
          ${main.poster_path ? `<img class="mc-poster" src="${posterUrl(main.poster_path)}" alt="">` : '<div class="mc-poster"></div>'}
          <div class="mc-scores-compare">
            <div class="mc-score-sm mc-score-${uc.key}" title="${esc(ownerName)}">
              <span class="mc-score-label">${esc(ownerName)}</span>${getEntryScore(main).toFixed(1)}
            </div>
          </div>
          <div class="mc-info">
            <div class="mc-title">
              ${esc(main.title)}
              ${main.year ? '<span style="color:var(--text2);font-weight:400">('+main.year+')</span>':''}
              ${main.type==='series' ? '<span style="font-size:0.7rem;color:var(--gold)"> 剧集</span>' : ''}
            </div>
            <div class="mc-meta">
              ${main.director ? esc(main.director)+' · ':''}${fmtDate(main.created_at)}
              ${!isMine ? `<span class="mc-owner" style="color:${uc.main};background:${uc.dim}">${esc(ownerName)}</span>` : ''}
              ${seasonCount>0 ? `<span class="mc-season-badge">S1-S${seasonCount}</span>` : ''}
            </div>
            <div class="mc-dim-scores" style="flex-direction:column;gap:2px">
              <div class="mc-dim-row-user" style="display:flex;align-items:center;gap:6px;padding:2px 0">
                <span class="mc-dim-user" style="color:${uc.main}">${esc(ownerName)}</span>
                <span class="mc-dim-dots">${dimTags(main, uc)}</span>
                <span class="mc-dim-total" style="color:${uc.main}">总分 ${getEntryScore(main).toFixed(1)}</span>
                ${isMine ? `<div class="mc-actions" onclick="event.stopPropagation()" style="margin-left:auto"><button class="btn btn-sm btn-secondary" onclick="${editActionForEntry(main)}" aria-label="编辑 ${esc(ownerName)} 的评价">编辑</button><button class="btn btn-sm btn-danger" onclick="deleteEntry('${main.id}')" aria-label="删除 ${esc(ownerName)} 的评价">删除</button></div>` : `<div class="mc-actions" onclick="event.stopPropagation()" style="margin-left:auto"><button class="btn btn-sm btn-secondary" onclick="addMyRating('${main.id}')" aria-label="添加我对 ${esc(main.title)} 的评分">＋我的评分</button></div>`}
              </div>
            </div>
            ${main.comment ? `<div class="mc-comment">${esc(main.comment)}</div>` : ''}
          </div>
          ${isMine ? `
          <div class="mc-actions-mobile" onclick="event.stopPropagation()">
            <button class="btn btn-sm btn-secondary" onclick="${editActionForEntry(main)}" aria-label="编辑 ${esc(ownerName)} 的评价">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteEntry('${main.id}')" aria-label="删除 ${esc(ownerName)} 的评价">删除</button>
          </div>` : `
          <div class="mc-actions-mobile" onclick="event.stopPropagation()">
            <button class="btn btn-sm btn-secondary" onclick="addMyRating('${main.id}')" aria-label="添加我对 ${esc(main.title)} 的评分">＋我的评分</button>
          </div>`}
        </div>
      `;
    }
  }).join('');
  // ── Pagination
  const totalPages = Math.ceil(groups.length / listPageSize);
  container.innerHTML += buildPaginationHTML(listPageNum, totalPages, 'data-lp-pg', 'list-pages');
}

// ===== DETAIL MODAL =====
async function showDetail(id) {
  const entry = allEntries.find(e=>e.id===id);
  if (!entry) return;
  const cached = entry.tmdb_id ? movieCache.get(entry.tmdb_id) : null;
  const shouldFetchDetail = entry.tmdb_id && needsMovieDetailFetch(cached);
  const hasDetailCache = cached && !shouldFetchDetail;
  if (cached) applyMovieDetailToEntry(entry, cached);

  const isMine = entry.user_id===currentUser.id;
  const ownerName = allProfiles[entry.user_id]?.display_name||'未知';

  // Find friend ratings using same group key as renderList
  const entryKey = getGroupKey(entry);
  let friendEntries = allEntries.filter(e=>e.id!==id && getGroupKey(e)===entryKey);
  // Fallback: if no tmdb_id match, try title+year for manually-added entries
  if (!friendEntries.length && entry.tmdb_id) {
    const titleKey = 'title_'+entry.title.toLowerCase().trim()+'_'+(entry.year||0);
    friendEntries = allEntries.filter(e=>e.id!==id && getGroupKey(e)===titleKey);
  }

  // Season ratings for this entry
  const seasons = allSeasonRatings.filter(s=>s.entry_id===id);

  const modal = $['detailModal'];
  const content = $['modalContent'];
  content.innerHTML = `
    <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
      ${entry.poster_path ? `<img src="${posterUrl(entry.poster_path)}" style="width:80px;border-radius:8px" alt="">` : ''}
      <div>
        <h3 style="margin-bottom:4px">${esc(entry.title)} ${entry.year?'('+entry.year+')':''}</h3>
        ${entry.director ? `<p style="color:var(--text2);font-size:0.85rem">${esc(entry.director)}</p>` : ''}
        <p style="color:var(--text2);font-size:0.8rem">${ownerName} · ${fmtDate(entry.created_at)} ${entry.type==='series'?'· 剧集':''}</p>
        <p style="font-size:1.8rem;font-weight:800;color:${getUserColor(entry.user_id).main};margin-top:4px">${getEntryScore(entry).toFixed(1)} / 10</p>
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      ${buildDimTagsHTML(entry.ratings||{}, getUserColor(entry.user_id))}
    </div>
    ${entry.comment ? `<p style="font-style:italic;color:var(--text2);margin-bottom:12px">"${esc(entry.comment)}"</p>` : ''}
    ${seasons.length ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <h4 style="font-size:0.85rem;color:var(--text2);margin-bottom:8px">分季评分</h4>
        ${seasons.map(s=>`
          <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:6px;padding:10px 12px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.85rem">S${s.season_number} ${s.season_title?esc(s.season_title):''}</span>
            <span style="font-weight:700;color:var(--gold)">${s.total_score.toFixed(1)}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${friendEntries.length ? `
      <div class="friend-section">
        <h4>朋友评分</h4>
        ${friendEntries.map(f=>`
          <div class="friend-rating">
            <div class="fr-header">
              <span class="fr-name" style="color:${getUserColor(f.user_id).main}">${esc(allProfiles[f.user_id]?.display_name||'未知')}</span>
              <span class="fr-score" style="color:${getUserColor(f.user_id).main}">${getEntryScore(f).toFixed(1)} / 10</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.75rem">
              ${buildDimTagsHTML(f.ratings||{}, getUserColor(f.user_id))}
            </div>
            ${f.comment ? `<p style="font-size:0.8rem;color:var(--text2);font-style:italic;margin-top:4px">"${esc(f.comment)}"</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${(() => {
      if (!entry.tmdb_id) return '';
      const ovId = 'tmdbOv-' + entry.id;
      if (hasDetailCache) return `<div class="tmdb-section" id="tmdbDetail-${entry.id}">${buildTmdbDetailHTML(cached, ovId)}</div>`;
      if (cached?.overview) return `<div class="tmdb-section" id="tmdbDetail-${entry.id}">${buildOverviewHTML(ovId, cached.overview)}<div class="detail-spinner"></div> 加载演职员信息...</div>`;
      if (cached) return `<div class="tmdb-section" id="tmdbDetail-${entry.id}">${buildTmdbDetailHTML(cached, ovId)}<div class="detail-spinner"></div> 补充电影详情...</div>`;
      return `<div class="tmdb-section" id="tmdbDetail-${entry.id}"><div class="detail-spinner"></div> 加载电影详情...</div>`;
    })()}
    <div class="btn-group" style="justify-content:flex-end">
      ${isMine ? `<button class="btn btn-secondary btn-sm" onclick="${editActionForEntry(entry)};closeModal()">编辑</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">关闭</button>
    </div>
  `;
  modal.classList.add('open');

  if (entry.overview || cached?.overview) checkOverviewOverflow('tmdbOv-' + entry.id);

  // Async: fetch when normalized movie detail is missing, stale, or legacy-partial
  if (shouldFetchDetail) {
    fetchAndRenderTmdbDetail(entry.tmdb_id, 'tmdbDetail-' + entry.id, 'tmdbOv-' + entry.id,
      detail => backfillMovieDetailToDB(entry, detail));
  }
}

// Unified async: fetch TMDB detail, cache full data, render complete section
async function fetchAndRenderTmdbDetail(tmdbId, sectionId, ovId, onBackfill) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const detail = await fetchMovieDetail(tmdbId, { force: true });
  if (!detail) {
    if (section.querySelector('.detail-spinner')) {
      section.innerHTML = '<p style="font-size:0.8rem;color:var(--text2)">电影详情加载失败，请稍后重试</p>';
    }
    console.warn('Movie detail failed for tmdb_id:', tmdbId);
    return;
  }
  if (onBackfill) onBackfill(detail);
  section.innerHTML = buildTmdbDetailHTML(detail, ovId) || '<p style="font-size:0.8rem;color:var(--text2)">暂无详细信息</p>';
  checkOverviewOverflow(ovId);
}

// ── Movie detail from discover page (TMDB data focused) ──
async function showMovieDetail(tmdbId) {
  const movie = discoverMovieMap[tmdbId];
  if (!movie) return;

  const cached = movieCache.get(tmdbId);
  const shouldFetchDetail = needsMovieDetailFetch(cached);
  const hasDetailCache = cached && !shouldFetchDetail;
  if (cached?.overview && !movie.overview) movie.overview = cached.overview;

  const ratedTmdbIds = new Set(allEntries.filter(e=>e.user_id===currentUser.id && e.tmdb_id).map(e=>'tmdb_'+e.tmdb_id));
  const isRated = ratedTmdbIds.has('tmdb_'+tmdbId);
  const myEntry = isRated ? allEntries.find(e=>e.user_id===currentUser.id && e.tmdb_id===tmdbId) : null;

  const year = (movie.release_date||'').slice(0,4);
  const poster = movie.poster_path ? posterUrl(movie.poster_path) : '';
  const genres = (movie.genre_ids||[]).slice(0,4).map(id=>genreMap[id]||'').filter(Boolean);

  const ovId = 'tmdbOv-d-' + tmdbId;
  const content = $['modalContent'];
  content.innerHTML = `
    <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
      ${poster ? `<img src="${poster}" style="width:100px;border-radius:8px" alt="">` : ''}
      <div>
        <h3 style="margin-bottom:4px">${esc(movie.title)} ${year?'('+year+')':''}</h3>
        ${movie.original_language ? `<p style="color:var(--text2);font-size:0.8rem">${movie.original_language.toUpperCase()}</p>` : ''}
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
          ${movie.vote_average ? `<span style="font-size:1.3rem;font-weight:800;color:var(--gold)">⭐ ${movie.vote_average.toFixed(1)}</span>` : ''}
          ${genres.length ? genres.map(g=>`<span style="font-size:0.7rem;padding:2px 8px;border-radius:10px;background:rgba(255,255,255,0.06);color:var(--text2)">${esc(g)}</span>`).join('') : ''}
        </div>
        ${isRated && myEntry ? `<p style="font-size:0.85rem;color:var(--gold);margin-top:4px">已评价 · 你的评分 ${getEntryScore(myEntry).toFixed(1)}</p>` : ''}
      </div>
    </div>
    <div class="tmdb-section" id="tmdbDiscoverDetail">
      ${hasDetailCache ? buildTmdbDetailHTML(cached, ovId) : (cached?.overview ? buildOverviewHTML(ovId, cached.overview) + '<div class="detail-spinner"></div> 加载演职员信息...' : (cached ? buildTmdbDetailHTML(cached, ovId) + '<div class="detail-spinner"></div> 补充电影详情...' : '<div class="detail-spinner"></div> 加载电影详情...'))}
    </div>
    <div class="btn-group" style="justify-content:flex-end;margin-top:8px">
      ${!isRated ? `<button class="btn btn-primary btn-sm" onclick="closeModal();openQuickRate({id:${tmdbId},title:'${esc(movie.title).replace(/'/g,"\\'")}',release_date:'${movie.release_date||''}',poster_path:'${movie.poster_path||''}'})">＋我的评分</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">关闭</button>
    </div>
  `;
  $['detailModal'].classList.add('open');

  if (movie.overview || cached?.overview || hasDetailCache) checkOverviewOverflow(ovId);

  if (shouldFetchDetail) {
    fetchAndRenderTmdbDetail(tmdbId, 'tmdbDiscoverDetail', ovId,
      detail => {
        if (!movie.overview && detail?.overview) movie.overview = detail.overview;
      });
  }
}

async function showListItemDetail(movieOrId) {
  const item = normalizeListMovie(movieOrId);
  if (!item) return;
  if (item.media_type === 'movie') {
    discoverMovieMap[item.tmdb_id] = {
      ...(discoverMovieMap[item.tmdb_id] || {}),
      ...item,
      id: item.tmdb_id,
      release_date: item.release_date || (item.year ? String(item.year) : '')
    };
    showMovieDetail(item.tmdb_id);
    return;
  }

  const poster = item.poster_path ? posterUrl(item.poster_path) : '';
  const content = $['modalContent'];
  content.innerHTML = `
    <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
      ${poster ? `<img src="${poster}" style="width:100px;border-radius:8px" alt="">` : ''}
      <div>
        <h3 style="margin-bottom:4px">${esc(item.title)} ${item.year ? '(' + item.year + ')' : ''}</h3>
        <p style="color:var(--text2);font-size:0.8rem">剧集 · TMDB #${item.tmdb_id}</p>
      </div>
    </div>
    <div class="tmdb-section" id="tmdbSeriesDetail">
      <div class="detail-spinner"></div> 加载剧集详情...
    </div>
    <div class="btn-group" style="justify-content:flex-end;margin-top:8px">
      <button class="btn btn-primary btn-sm" onclick="closeModal();openEntryFormForListMovie({id:${item.tmdb_id},media_type:'series',title:'${esc(item.title).replace(/'/g,"\\'")}',year:${item.year || 'null'},poster_path:'${item.poster_path || ''}'})">＋我的评分</button>
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">关闭</button>
    </div>
  `;
  $['detailModal'].classList.add('open');

  try {
    const [detailRes, creditsRes] = await Promise.all([
      tmdbFetch(`/tv/${item.tmdb_id}?language=zh-CN`),
      tmdbFetch(`/tv/${item.tmdb_id}/credits?language=zh-CN`).catch(() => null)
    ]);
    const detail = await detailRes.json().catch(() => ({}));
    const credits = creditsRes ? await creditsRes.json().catch(() => ({})) : {};
    const genres = (detail.genres || []).map(g => g.name).filter(Boolean).slice(0, 5);
    const creators = (detail.created_by || []).map(c => c.name).filter(Boolean).slice(0, 3);
    const cast = (credits.cast || []).map(c => c.name).filter(Boolean).slice(0, 8);
    const section = document.getElementById('tmdbSeriesDetail');
    if (!section) return;
    section.innerHTML = `
      ${detail.overview ? buildOverviewHTML('tmdbSeriesOv-' + item.tmdb_id, detail.overview) : '<p style="font-size:0.8rem;color:var(--text2)">暂无简介</p>'}
      <div style="display:grid;gap:8px;margin-top:12px;font-size:0.82rem;color:var(--text2)">
        ${genres.length ? `<div><strong style="color:var(--text)">类型</strong> · ${genres.map(esc).join(' / ')}</div>` : ''}
        ${creators.length ? `<div><strong style="color:var(--text)">主创</strong> · ${creators.map(esc).join(' / ')}</div>` : ''}
        ${cast.length ? `<div><strong style="color:var(--text)">演员</strong> · ${cast.map(esc).join(' / ')}</div>` : ''}
        ${detail.number_of_seasons ? `<div><strong style="color:var(--text)">季数</strong> · ${detail.number_of_seasons}</div>` : ''}
        ${detail.vote_average ? `<div><strong style="color:var(--text)">TMDB</strong> · ${Number(detail.vote_average).toFixed(1)}</div>` : ''}
      </div>
    `;
    if (detail.overview) checkOverviewOverflow('tmdbSeriesOv-' + item.tmdb_id);
  } catch (e) {
    const section = document.getElementById('tmdbSeriesDetail');
    if (section) section.innerHTML = '<p style="font-size:0.8rem;color:var(--text2)">剧集详情加载失败，请稍后重试</p>';
  }
}

function closeModal() { $['detailModal'].classList.remove('open'); }
$['detailModal'].addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

// ===== STATS =====
let statsFilter = 'me';
let statsType = 'all';
let statsOtherUser = null;

document.querySelectorAll('#statsFilter button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#statsFilter button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    statsFilter = btn.dataset.sf;
    renderStats();
  });
});

document.querySelectorAll('#statsTypeFilter button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#statsTypeFilter button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    statsType = btn.dataset.st;
    renderStats();
  });
});

$['statsUserPicker'].addEventListener('change', function(){
  statsOtherUser = this.value || null;
  renderStats();
});

function calcStats(entries) {
  if (!entries.length) return null;
  const avgTotal = entries.reduce((s,m)=>s+getEntryScore(m),0)/entries.length;
  const best = entries.reduce((a,b)=>getEntryScore(a)>getEntryScore(b)?a:b);
  const worst = entries.reduce((a,b)=>getEntryScore(a)<getEntryScore(b)?a:b);
  const movies = entries.filter(e=>e.type==='movie').length;
  const series = entries.filter(e=>e.type==='series').length;
  const dimAvgs = {};
  for (const dim of Object.keys(WEIGHTS)) {
    dimAvgs[dim] = entries.reduce((s,m)=>s+(m.ratings[dim]||5),0)/entries.length;
  }
  const dist = new Array(10).fill(0);
  entries.forEach(m=>{ const b=Math.min(Math.floor(getEntryScore(m))-1,9); if(b>=0) dist[b]++; });
  return { avgTotal, best, worst, movies, series, dimAvgs, dist, count: entries.length };
}

function renderStatCards(stats, c) {
  if (!stats) return '<div class="stat-card"><div class="stat-value">-</div><div class="stat-label">无数据</div></div>';
  const mc = c?.main||'#d4a853';
  return `
    <div class="stat-card"><div class="stat-value" style="color:${mc}">${stats.avgTotal.toFixed(1)}</div><div class="stat-label">平均分</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${mc}">${stats.movies}</div><div class="stat-label">电影</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${mc}">${stats.series}</div><div class="stat-label">剧集</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${mc}">${getEntryScore(stats.best).toFixed(1)}</div><div class="stat-label">最高分 · ${esc(stats.best.title.slice(0,8))}</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${mc}">${getEntryScore(stats.worst).toFixed(1)}</div><div class="stat-label">最低分 · ${esc(stats.worst.title.slice(0,8))}</div></div>
  `;
}

function renderDimBars(dimAvgs, c) {
  const mc = c?.main||'#d4a853';
  return Object.entries(dimAvgs).map(([dim,avg])=>`
    <div class="stat-bar-row">
      <span class="stat-bar-label">${DIM_LABELS[dim]}</span>
      <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${(avg/10)*100}%;background:${mc}"></div></div>
      <span class="stat-bar-value">${avg.toFixed(1)}</span>
    </div>
  `).join('');
}

function renderDist(dist, c) {
  const maxDist = Math.max(...dist,1);
  const mc = c?.main||'#d4a853';
  return dist.map((c2,i)=>`
    <div class="score-dist-bar">
      <span class="score-dist-count" style="color:${mc}">${c2||''}</span>
      ${c2?`<div class="score-dist-fill" style="height:${Math.max((c2/maxDist)*100,4)}%;background:${mc}"></div>`:''}
      <span class="score-dist-label">${i+1}分</span>
    </div>
  `).join('');
}

function filterByType(entries) {
  if (statsType==='all') return entries;
  return entries.filter(e=>e.type===statsType);
}

// Stats sub-renderers
function buildMeStatsHTML(myStats, myColor, typeSuffix) {
  return `<div class="stats-grid">${renderStatCards(myStats, myColor)}</div>
    <h3 style="margin-bottom:10px;font-size:0.9rem;color:var(--text2)">各维度均分${typeSuffix}</h3>
    ${renderDimBars(myStats.dimAvgs, myColor)}
    <h3 style="margin:20px 0 10px;font-size:0.9rem;color:var(--text2)">评分分布${typeSuffix}</h3>
    <div class="score-dist">${renderDist(myStats.dist, myColor)}</div>`;
}

function buildOthersStatsHTML(otherStats, otherColor, typeSuffix, otherName) {
  return `<h3 style="margin-bottom:14px;font-size:0.9rem;color:${otherColor.main}">${esc(otherName)}${typeSuffix}</h3>
    <div class="stats-grid">${renderStatCards(otherStats, otherColor)}</div>
    <h3 style="margin-bottom:10px;font-size:0.9rem;color:var(--text2)">各维度均分</h3>
    ${renderDimBars(otherStats.dimAvgs, otherColor)}
    <h3 style="margin:20px 0 10px;font-size:0.9rem;color:var(--text2)">评分分布</h3>
    <div class="score-dist">${renderDist(otherStats.dist, otherColor)}</div>`;
}

function buildCompareStatsHTML(myStats, otherStats, myColor, otherColor, typeSuffix) {
  const myName = currentProfile?.display_name||'我';
  const otherLabel = statsOtherUser ? (allProfiles[statsOtherUser]?.display_name||'对方') : '所有他人';
  let html = `<div class="stats-grid">
    <div class="stat-card"><div class="stat-value" style="color:${myColor.main}">${myStats?myStats.avgTotal.toFixed(1):'-'}</div><div class="stat-label">${esc(myName)}均分${typeSuffix}</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${otherColor.main}">${otherStats?otherStats.avgTotal.toFixed(1):'-'}</div><div class="stat-label">${esc(otherLabel)}均分${typeSuffix}</div></div>
    <div class="stat-card"><div class="stat-value">${myStats?myStats.movies:0}/${otherStats?otherStats.movies:0}</div><div class="stat-label">电影 (我/${esc(otherLabel)})</div></div>
    <div class="stat-card"><div class="stat-value">${myStats?myStats.series:0}/${otherStats?otherStats.series:0}</div><div class="stat-label">剧集 (我/${esc(otherLabel)})</div></div>
    <div class="stat-card"><div class="stat-value">${myStats?myStats.count:0}/${otherStats?otherStats.count:0}</div><div class="stat-label">总计 (我/${esc(otherLabel)})</div></div>
  </div>
  <h3 style="margin-bottom:10px;font-size:0.9rem;color:var(--text2)">各维度均分对比 <span style="font-size:0.75rem"><span style="color:${myColor.main}">${esc(myName)}</span> / <span style="color:${otherColor.main}">${esc(otherLabel)}</span></span></h3>`;
  for (const dim of Object.keys(WEIGHTS)) {
    const mv = myStats?myStats.dimAvgs[dim]:0;
    const ov = otherStats?otherStats.dimAvgs[dim]:0;
    html += `<div class="stat-compare-row">
      <span class="stat-compare-label">${DIM_LABELS[dim]}</span>
      <div class="stat-compare-bars">
        <div style="height:7px;border-radius:3px;background:${myColor.main};width:${(mv/10)*100}%"></div>
        <div style="height:7px;border-radius:3px;background:${otherColor.main};width:${(ov/10)*100}%"></div>
      </div>
      <div class="stat-compare-values">
        <span style="color:${myColor.main}">${mv.toFixed(1)}</span>
        <span style="color:${otherColor.main}">${ov.toFixed(1)}</span>
      </div>
    </div>`;
  }
  html += `<h3 style="margin:20px 0 10px;font-size:0.9rem;color:var(--text2)">评分分布对比</h3>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:0.65rem">
    <span style="display:inline-block;width:10px;height:10px;background:${myColor.main};border-radius:2px"></span> ${esc(myName)}
    <span style="display:inline-block;width:10px;height:10px;background:${otherColor.main};border-radius:2px"></span> ${esc(otherLabel)}
  </div>
  <div class="compare-dist">
    ${(myStats?myStats.dist:new Array(10).fill(0)).map((c,i)=>{
      const oc = otherStats?otherStats.dist[i]:0;
      const maxAll = Math.max(...(myStats?myStats.dist:[]),...(otherStats?otherStats.dist:[]),1);
      return `<div class="cd-bar-group">
        <div class="cd-bars">
          ${c?`<div class="cd-bar" style="height:${Math.max((c/maxAll)*100,4)}%;background:${myColor.main}"><span class="cd-count">${c}</span></div>`:''}
          ${oc?`<div class="cd-bar" style="height:${Math.max((oc/maxAll)*100,4)}%;background:${otherColor.main}"><span class="cd-count">${oc}</span></div>`:''}
        </div>
        <span class="cd-label">${i+1}分</span>
      </div>`;
    }).join('')}
  </div>`;
  return html;
}

function renderStats() {
  const container = $['statsContent'];
  const userRow = document.getElementById('statsUserRow');
  const userPicker = $['statsUserPicker'];

  // Show/hide user picker for "others" and "compare" filters
  if (statsFilter==='others' || statsFilter==='compare') {
    userRow.classList.remove('hidden');
    const otherUsers = [...new Set(allEntries.filter(e=>e.user_id!==currentUser.id).map(e=>e.user_id))];
    const currentVal = userPicker.value;
    userPicker.innerHTML = '<option value="">所有他人</option>' + otherUsers.map(uid=>{
      const name = allProfiles[uid]?.display_name||uid.slice(0,8);
      return `<option value="${uid}"${currentVal===uid?' selected':''}>${esc(name)}</option>`;
    }).join('');
    if (!otherUsers.length) userRow.classList.add('hidden');
  } else {
    userRow.classList.add('hidden');
    statsOtherUser = null;
  }

  if (allEntries.length===0) {
    container.innerHTML = '<div class="empty-state"><p>暂无评价数据</p></div>';
    return;
  }

  const myEntries = filterByType(allEntries.filter(e=>e.user_id===currentUser.id));

  let otherEntries;
  if (statsOtherUser) {
    otherEntries = filterByType(allEntries.filter(e=>e.user_id===statsOtherUser));
  } else {
    otherEntries = filterByType(allEntries.filter(e=>e.user_id!==currentUser.id));
  }

  const myStats = calcStats(myEntries);
  const otherStats = calcStats(otherEntries);

  const myColor = getUserColor(currentUser.id);
  const otherColor = statsOtherUser ? getUserColor(statsOtherUser) : { key:'friend', main:'#5b9db0', dim:'#1a2a30' };

  const typeLabel = statsType==='movie'?'电影':(statsType==='series'?'剧集':'');
  const typeSuffix = typeLabel ? ` · ${typeLabel}` : '';

  let html = '';

  if (statsFilter==='me') {
    if (!myStats) { container.innerHTML = '<div class="empty-state"><p>暂无评价数据</p></div>'; return; }
    html = buildMeStatsHTML(myStats, myColor, typeSuffix);
  } else if (statsFilter==='others') {
    if (!otherStats) { container.innerHTML = '<div class="empty-state"><p>暂无评价数据</p></div>'; return; }
    const otherName = statsOtherUser ? (allProfiles[statsOtherUser]?.display_name||'用户') : '所有他人';
    html = buildOthersStatsHTML(otherStats, otherColor, typeSuffix, otherName);
  } else if (statsFilter==='compare') {
    html = buildCompareStatsHTML(myStats, otherStats, myColor, otherColor, typeSuffix);
  }

  container.innerHTML = html;
}

// ===== DISCOVER =====
let discoverTab = 'recommend';
let discoverPage = { recommend: 1, toprated: 1 };
let discoverCache = { recommend: null, week: null, toprated: null };
let topratedFilterUnwatched = false;
let discoverLastRefresh = 0;
let discoverCooldownTimer = null;
let discoverMovieMap = {};
let quickRateMovie = null;
let quickEditEntryId = null;
let discoverRatedCount = 0;
let discoverRefreshStreak = 0;
let discoverLastShownIds = [];

// Watchlist (想看)
let watchlistMovies = {};
let watchlistIds = new Set();
let watchlistPage = 1;
let watchlistAvailable = false;

// Blocked movies (不再推荐)
let blockedMovieIds = new Set();
let blockedMovieReasons = {};
let blockedMovieDetails = {};
let blockedPage = 1;
let partnerBlockedMovieIds = new Set();

function buildBlockedFeedback() {
  return [...blockedMovieIds].map(tmdbId => ({
    tmdb_id: tmdbId,
    reason: blockedMovieReasons[tmdbId] || ''
  }));
}

async function loadWatchlist() {
  if (!currentUser) return;
  let { data, error } = await db.from('watchlist_movies')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) {
    if (/watchlist_movies|schema cache|does not exist|relation/i.test(error.message || '')) {
      watchlistMovies = {};
      watchlistIds = new Set();
      watchlistAvailable = false;
    } else {
      console.warn('loadWatchlist failed:', error.message);
    }
    return;
  }
  watchlistAvailable = true;
  watchlistMovies = {};
  watchlistIds = new Set();
  (data || []).forEach(m => {
    const mediaType = normalizeMediaType(m.media_type);
    const key = listKey(mediaType, m.tmdb_id);
    const item = { ...m, media_type: mediaType };
    watchlistIds.add(key);
    watchlistMovies[key] = item;
    if (mediaType === 'movie' && !discoverMovieMap[m.tmdb_id]) {
      discoverMovieMap[m.tmdb_id] = {
        id: m.tmdb_id,
        media_type: mediaType,
        title: m.title,
        release_date: m.year ? String(m.year) : '',
        poster_path: m.poster_path || ''
      };
    }
  });
  if (getActiveTab() === 'list' && listMode === 'watchlist') renderWatchlistPanel();
  if (getActiveTab() === 'discover') renderDiscover();
}

async function loadBlockedMovies() {
  if (!currentUser) return;
  let { data, error } = await db.from('blocked_movies')
    .select('tmdb_id, reason')
    .eq('user_id', currentUser.id);
  if (error && /reason|column/i.test(error.message || '')) {
    const fallback = await db.from('blocked_movies')
      .select('tmdb_id')
      .eq('user_id', currentUser.id);
    data = fallback.data;
    error = fallback.error;
  }
  if (!error && data) {
    blockedMovieIds = new Set(data.map(r => r.tmdb_id));
    blockedMovieReasons = {};
    data.forEach(r => { if (r.reason) blockedMovieReasons[r.tmdb_id] = r.reason; });
  }
}

async function loadCoupleBlockedMovies() {
  partnerBlockedMovieIds = new Set();
  const partnerId = getCouplePartnerId();
  if (!currentUser || !partnerId) return;
  const { data, error } = await db.from('blocked_movies')
    .select('tmdb_id')
    .eq('user_id', partnerId);
  if (error) {
    console.warn('loadCoupleBlockedMovies failed:', error.message);
    return;
  }
  partnerBlockedMovieIds = new Set((data || []).map(r => r.tmdb_id));
}

function buildCoupleBlockedIds() {
  return [...new Set([...blockedMovieIds, ...partnerBlockedMovieIds])];
}

async function hydrateBlockedMovieDetails(tmdbIds) {
  const missing = tmdbIds.filter(id => !discoverMovieMap[id] && !blockedMovieDetails[id]);
  if (!missing.length) return;
  await Promise.allSettled(missing.map(async id => {
    const res = await tmdbFetch(`/movie/${id}?language=zh-CN`);
    if (!res.ok) return;
    const d = await res.json();
    if (d && d.id) {
      blockedMovieDetails[id] = {
        id,
        title: d.title || d.name || ('TMDB #' + id),
        release_date: d.release_date || '',
        poster_path: d.poster_path || ''
      };
    }
  }));
  if ($['blockedModal']?.classList.contains('open')) renderBlockedPanel(false);
}

function updateRecTabLabel() {
  const btn = document.getElementById('discoverRecTab');
  if (!btn) return;
  const ratedCount = allEntries.filter(e=>e.user_id===currentUser?.id && e.type==='movie').length;
  const uname = getUserName(currentUser?.id);
  btn.classList.remove('ceci-tab','fd-tab');
  btn.classList.remove('hidden');
  const advanced = ratedCount >= 100;
  if (uname === 'ceci') {
    btn.textContent = advanced ? 'FD精心推荐' : 'FD推荐';
    btn.classList.add('fd-tab');
  } else {
    btn.textContent = advanced ? 'Ceci精心推荐' : 'Ceci推荐';
    btn.classList.add('ceci-tab');
  }
}


function bindDiscoverRefresh() {
  const btn = document.getElementById('discoverRefreshBtn');
  if (!btn) return;
  btn.addEventListener('click', ()=>{
    const currentCount = allEntries.filter(e=>e.user_id===currentUser.id && e.type==='movie').length;

    if (currentCount === discoverRatedCount) {
      discoverRefreshStreak++;
    } else {
      discoverRatedCount = currentCount;
      discoverRefreshStreak = 0;
      discoverLastShownIds = [];
    }

    if (discoverRefreshStreak >= 3) {
      discoverRefreshStreak = 0;
      discoverLastShownIds = [];
    }

    discoverCache.recommend = null;
    discoverLastRefresh = Date.now();
    updateRefreshUI();
    renderDiscover();
  });
}

function updateRefreshUI() {
  const btn = document.getElementById('discoverRefreshBtn');
  const hint = document.getElementById('discoverRefreshHint');
  if (!btn || !hint) return;
  const elapsed = Math.floor((Date.now() - discoverLastRefresh) / 1000);
  const cooldown = 5;
  if (elapsed < cooldown) {
    btn.disabled = true;
    const remain = cooldown - elapsed;
    hint.textContent = `${remain}s 后可刷新`;
    if (!discoverCooldownTimer) {
      discoverCooldownTimer = setInterval(()=>{
        const e = Math.floor((Date.now() - discoverLastRefresh) / 1000);
        if (e >= cooldown) {
          clearInterval(discoverCooldownTimer);
          discoverCooldownTimer = null;
          updateRefreshUI();
        } else {
          const r = cooldown - e;
          const h = document.getElementById('discoverRefreshHint');
          if (h) h.textContent = `${r}s 后可刷新`;
        }
      }, 1000);
    }
  } else {
    btn.disabled = false;
    const ratedCount = allEntries.filter(e=>e.user_id===currentUser?.id && e.type==='movie').length;
    const uname = getUserName(currentUser?.id);
    const targetName = uname === 'ceci' ? 'FD' : 'ceci';
    if (ratedCount < 100 && ratedCount >= 25) {
      hint.textContent = `评价100部，${targetName}将为你精心推荐`;
    } else {
      hint.textContent = '';
    }
    if (discoverCooldownTimer) { clearInterval(discoverCooldownTimer); discoverCooldownTimer = null; }
  }
}

document.querySelectorAll('#discoverSubtabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#discoverSubtabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    discoverTab = btn.dataset.dt;
    renderDiscover();
  });
});

// Delegated click for +我的评分 buttons in discover grid
$['discoverContent'].addEventListener('click', e=>{
  const btn = e.target.closest('.dc-rate-btn');
  if (!btn) return;
  e.stopPropagation();
  const tmdbId = parseInt(btn.dataset.tmdbId);
  const mediaType = normalizeMediaType(btn.dataset.mediaType);
  const movie = discoverMovieMap[tmdbId];
  if (movie) openQuickRate({ ...movie, media_type: mediaType });
});

// Delegated click for "不再推荐" buttons in discover grid
$['discoverContent'].addEventListener('click', e => {
  const btn = e.target.closest('.dc-block-btn');
  if (!btn) return;
  e.stopPropagation();
  const tmdbId = parseInt(btn.dataset.tmdbId);
  if (!tmdbId) return;
  blockMovie(tmdbId, btn.closest('.discover-card'));
});

// Delegated click for watchlist buttons in discover grid
$['discoverContent'].addEventListener('click', e => {
  const btn = e.target.closest('.dc-watch-btn');
  if (!btn) return;
  e.stopPropagation();
  const tmdbId = parseInt(btn.dataset.tmdbId);
  const mediaType = normalizeMediaType(btn.dataset.mediaType);
  if (!tmdbId) return;
  toggleWatchlist(tmdbId, { ...(discoverMovieMap[tmdbId] || { id: tmdbId }), media_type: mediaType });
});

// Delegated click for couple queue buttons in discover grid
$['discoverContent'].addEventListener('click', e => {
  const btn = e.target.closest('.dc-next-btn');
  if (!btn) return;
  e.stopPropagation();
  const tmdbId = parseInt(btn.dataset.tmdbId);
  const mediaType = normalizeMediaType(btn.dataset.mediaType);
  if (!tmdbId) return;
  addToCoupleQueue({ ...(discoverMovieMap[tmdbId] || { id: tmdbId }), media_type: mediaType });
});

// Delegated click for discover cards → movie detail
$['discoverContent'].addEventListener('click', e=>{
  // Ignore clicks on buttons or inside rate-btn
  if (e.target.closest('button')) return;
  const card = e.target.closest('.discover-card');
  if (!card) return;
  const tmdbId = parseInt(card.dataset.tmdbId);
  if (!tmdbId) return;
  showMovieDetail(tmdbId);
});

// ===== BLOCKED MOVIES MANAGEMENT =====
function normalizeListMovie(movieOrId) {
  const raw = typeof movieOrId === 'object' && movieOrId ? movieOrId : { id: movieOrId };
  const tmdbId = Number(raw.tmdb_id || raw.id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;
  const mediaType = normalizeMediaType(raw.media_type || raw.type || (raw.name || raw.first_air_date ? 'series' : 'movie'));
  const release = raw.release_date || raw.first_air_date || '';
  return {
    id: tmdbId,
    tmdb_id: tmdbId,
    media_type: mediaType,
    title: raw.title || raw.name || ('TMDB #' + tmdbId),
    year: raw.year || parseInt(String(release).slice(0, 4)) || null,
    release_date: release,
    poster_path: raw.poster_path || '',
    genre_ids: raw.genre_ids || [],
    vote_average: raw.vote_average || 0,
    original_language: raw.original_language || ''
  };
}

async function toggleWatchlist(tmdbId, movieOverride = null) {
  if (!currentUser || !tmdbId) return;
  const movie = normalizeListMovie(movieOverride || discoverMovieMap[tmdbId] || { id: tmdbId });
  if (!movie) return;
  const key = listKey(movie);
  if (watchlistIds.has(key)) {
    const { error } = await db.from('watchlist_movies')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('media_type', movie.media_type)
      .eq('tmdb_id', movie.tmdb_id);
    if (error) { toast('移除想看失败: ' + error.message); return; }
    watchlistIds.delete(key);
    delete watchlistMovies[key];
    toast('已移出想看');
  } else {
    const { error } = await db.from('watchlist_movies').insert({
      user_id: currentUser.id,
      media_type: movie.media_type,
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      year: movie.year || null,
      poster_path: movie.poster_path || ''
    });
    if (error) {
      toast(/watchlist_movies|schema cache|does not exist|relation|media_type|column/i.test(error.message || '')
        ? '想看清单表尚未升级，请先执行升级 SQL'
        : '加入想看失败: ' + error.message);
      return;
    }
    watchlistIds.add(key);
    watchlistMovies[key] = {
      media_type: movie.media_type,
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      year: movie.year || null,
      poster_path: movie.poster_path || '',
      release_date: movie.release_date || ''
    };
    if (movie.media_type === 'movie') discoverMovieMap[movie.tmdb_id] = movie;
    toast('已加入想看');
  }
  renderDiscover();
  if (getActiveTab() === 'list' && listMode === 'watchlist') renderWatchlistPanel();
}

async function addToWatchlist(movieOrId) {
  const movie = normalizeListMovie(movieOrId);
  if (!movie) return;
  if (watchlistIds.has(listKey(movie))) {
    toast('已经在想看清单里');
    return;
  }
  await toggleWatchlist(movie.tmdb_id, movie);
}

// Delegated clicks inside list-page watchlist: rate + remove + pagination
$['listWatchlistView'].addEventListener('click', e => {
  const rateBtn = e.target.closest('.dc-watch-rate-btn');
  if (rateBtn) {
    e.stopPropagation();
    const tmdbId = parseInt(rateBtn.dataset.tmdbId);
    const mediaType = normalizeMediaType(rateBtn.dataset.mediaType);
    const movie = watchlistMovies[listKey(mediaType, tmdbId)] || discoverMovieMap[tmdbId];
    if (movie) {
      if (mediaType === 'movie') openQuickRate({ id: tmdbId, title: movie.title, year: movie.year, poster_path: movie.poster_path });
      else openEntryFormForListMovie(movie);
    }
    return;
  }
  const removeBtn = e.target.closest('.dc-watch-remove-btn');
  if (removeBtn) {
    e.stopPropagation();
    const tmdbId = parseInt(removeBtn.dataset.tmdbId);
    const mediaType = normalizeMediaType(removeBtn.dataset.mediaType);
    if (tmdbId) toggleWatchlist(tmdbId, watchlistMovies[listKey(mediaType, tmdbId)] || { id: tmdbId, media_type: mediaType });
    return;
  }
  const pgBtn = e.target.closest('button[data-wl-pg]');
  if (pgBtn) {
    watchlistPage = parseInt(pgBtn.getAttribute('data-wl-pg'));
    if (!isNaN(watchlistPage)) {
      renderWatchlistPanel();
      window.scrollTo({top:0, behavior:'smooth'});
    }
    return;
  }
  if (e.target.closest('button')) return;
  const card = e.target.closest('.discover-card');
  if (card) {
    const tmdbId = parseInt(card.dataset.tmdbId);
    const mediaType = normalizeMediaType(card.dataset.mediaType);
    const movie = watchlistMovies[listKey(mediaType, tmdbId)] || discoverMovieMap[tmdbId] || { id: tmdbId, media_type: mediaType };
    showListItemDetail(movie);
  }
});

function renderWatchlistPanel() {
  const ids = [...watchlistIds];
  if ($['watchlistCount']) $['watchlistCount'].textContent = ids.length;
  if (!$['watchlistMovieGrid']) return;

  if (!ids.length) {
    $['watchlistMovieGrid'].innerHTML = '<div class="empty-state"><p style="font-size:0.85rem">暂无想看的电影</p></div>';
    if ($['watchlistPagination']) $['watchlistPagination'].innerHTML = '';
    return;
  }

  const pageSize = 12;
  const totalPages = Math.ceil(ids.length / pageSize);
  if (watchlistPage > totalPages) watchlistPage = totalPages;
  const start = (watchlistPage - 1) * pageSize;
  const pageIds = ids.slice(start, start + pageSize);

  $['watchlistMovieGrid'].innerHTML = pageIds.map(key => {
    const movie = watchlistMovies[key] || null;
    const tmdbId = movie?.tmdb_id || Number(String(key).split(':')[1]);
    const mediaType = normalizeMediaType(movie?.media_type || String(key).split(':')[0]);
    const title = movie ? movie.title : 'TMDB #' + tmdbId;
    const poster = movie && movie.poster_path ? posterUrl(movie.poster_path) : '';
    const year = movie ? (movie.year || (movie.release_date || '').slice(0, 4)) : '';
    return `
      <div class="discover-card" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}">
        <div class="dc-poster-wrap">
          ${poster ? `<img src="${poster}" alt="${esc(title)}" loading="lazy">` : '<div class="dc-no-poster">☆</div>'}
        </div>
        <div class="dc-info">
          <div class="dc-title">${esc(title)}</div>
          <div class="dc-meta">${year || '未知'} · ${mediaTypeLabel(mediaType)}</div>
          <div class="dc-action">
            <div class="dc-action-row">
              <button class="btn btn-sm btn-secondary dc-watch-rate-btn" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}">＋我的评分</button>
              <button class="btn btn-xs dc-watch-remove-btn dc-watch-btn active" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}" title="移出想看">★</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if ($['watchlistPagination']) {
    $['watchlistPagination'].innerHTML = buildPaginationHTML(watchlistPage, totalPages, 'data-wl-pg', 'list-pages');
  }
}

// ===== COUPLE =====
function isMissingRelationError(error) {
  return /schema cache|does not exist|relation|couples|couple_watch_queue|media_type|column/i.test(error?.message || '');
}

function getCouplePartnerId(couple = activeCouple) {
  if (!couple || !currentUser) return null;
  return couple.user_a === currentUser.id ? couple.user_b : couple.user_a;
}

function invalidateCoupleRecommendations() {
  coupleRecommendations = null;
  coupleRecommendationLoading = false;
  coupleRecommendationState = 'idle';
}

async function loadCoupleState() {
  if (!currentUser) return;
  const { data, error } = await db.from('couples')
    .select('*')
    .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
    .order('updated_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) {
      couplesAvailable = false;
      activeCouple = null;
      pendingCouples = [];
      couplePartner = null;
    } else {
      console.warn('loadCoupleState failed:', error.message);
    }
    return;
  }
  couplesAvailable = true;
  const rows = data || [];
  activeCouple = rows.find(c => c.status === 'active') || null;
  pendingCouples = rows.filter(c => c.status === 'pending');
  const partnerId = getCouplePartnerId(activeCouple);
  couplePartner = partnerId ? allProfiles[partnerId] || { user_id: partnerId, display_name: '对方' } : null;
  if (!activeCouple) {
    coupleQueue = [];
  }
  invalidateCoupleRecommendations();
}

async function loadCoupleQueue() {
  if (!currentUser || !activeCouple) {
    coupleQueue = [];
    return;
  }
  const { data, error } = await db.from('couple_watch_queue')
    .select('*')
    .eq('couple_id', activeCouple.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingRelationError(error)) {
      coupleQueueAvailable = false;
      coupleQueue = [];
    } else {
      console.warn('loadCoupleQueue failed:', error.message);
    }
    return;
  }
  coupleQueueAvailable = true;
  coupleQueue = (data || []).map(m => ({ ...m, media_type: normalizeMediaType(m.media_type) }));
  coupleQueue.forEach(m => {
    if (normalizeMediaType(m.media_type) !== 'movie') return;
    discoverMovieMap[m.tmdb_id] = {
      id: m.tmdb_id,
      media_type: 'movie',
      title: m.title,
      year: m.year,
      release_date: m.year ? String(m.year) : '',
      poster_path: m.poster_path || ''
    };
  });
}

async function bindCoupleWith(userId) {
  if (!currentUser || !userId || userId === currentUser.id) return;
  if (activeCouple) {
    toast('已经绑定 Couple');
    return;
  }
  const { error } = await db.from('couples').insert({
    user_a: currentUser.id,
    user_b: userId,
    requested_by: currentUser.id,
    status: 'pending'
  });
  if (error) {
    toast(isMissingRelationError(error) ? 'Couple 表尚未创建，请先执行升级 SQL' : '绑定请求失败: ' + error.message);
    return;
  }
  toast('已发送绑定请求');
  await loadCoupleState();
  renderCoupleSurfaces();
}

async function confirmCouple(coupleId) {
  const { error } = await db.from('couples')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', coupleId);
  if (error) {
    toast('确认失败: ' + error.message);
    return;
  }
  toast('Couple 已绑定');
  await loadCoupleState();
  await loadCoupleBlockedMovies();
  await loadCoupleQueue();
  renderCoupleSurfaces();
  renderDiscover();
}

async function disconnectCouple(coupleId) {
  const couple = String(activeCouple?.id) === String(coupleId) ? activeCouple : pendingCouples.find(c => String(c.id) === String(coupleId));
  const wasActive = couple?.status === 'active';
  if (wasActive) {
    const requester = couple.disconnect_requested_by || null;
    if (!requester) {
      if (!confirm('将向对方发送解除 Couple 申请，对方同意后才会解除。确认发送？')) return;
      const { error } = await db.from('couples')
        .update({ disconnect_requested_by: currentUser.id, updated_at: new Date().toISOString() })
        .eq('id', coupleId);
      if (error) {
        toast(isMissingRelationError(error) ? 'Couple 表尚未升级，请先执行解除申请升级 SQL' : '发送解除申请失败: ' + error.message);
        return;
      }
      await loadCoupleState();
      toast('已发送解除申请');
      renderCoupleSurfaces();
      return;
    }
    if (requester === currentUser.id) {
      const { error } = await db.from('couples')
        .update({ disconnect_requested_by: null, updated_at: new Date().toISOString() })
        .eq('id', coupleId);
      if (error) {
        toast('撤销解除申请失败: ' + error.message);
        return;
      }
      await loadCoupleState();
      toast('已撤销解除申请');
      renderCoupleSurfaces();
      return;
    }
    if (!confirm('对方请求解除 Couple。同意后，共享下次看队列也会一起删除，确认同意？')) return;
  }
  const { error } = await db.from('couples').delete().eq('id', coupleId);
  if (error) {
    toast((wasActive ? '同意解除失败: ' : '撤销失败: ') + error.message);
    return;
  }
  await loadCoupleState();
  await loadCoupleBlockedMovies();
  await loadCoupleQueue();
  toast(wasActive ? '已同意解除 Couple' : '已撤销绑定请求');
  renderCoupleSurfaces();
  renderDiscover();
}

async function addToCoupleQueue(movieOrId) {
  if (!currentUser) return;
  if (!activeCouple) {
    toast('先绑定 Couple 后才能加入下次看');
    return;
  }
  const movie = normalizeListMovie(movieOrId);
  if (!movie) return;
  if (coupleQueue.some(m => listKey(m) === listKey(movie))) {
    toast('已经在下次看队列里');
    return;
  }
  const maxPosition = coupleQueue.reduce((max, m) => Math.max(max, Number(m.position || 0)), 0);
  const { data, error } = await db.from('couple_watch_queue').insert({
    couple_id: activeCouple.id,
    media_type: movie.media_type,
    tmdb_id: movie.tmdb_id,
    title: movie.title,
    year: movie.year || null,
    poster_path: movie.poster_path || '',
    position: maxPosition + 1,
    added_by: currentUser.id
  }).select('*').single();
  if (error) {
    toast(isMissingRelationError(error) ? '下次看表尚未创建，请先执行升级 SQL' : '加入下次看失败: ' + error.message);
    return;
  }
  if (data) coupleQueue.push({ ...data, media_type: normalizeMediaType(data.media_type) });
  if (movie.media_type === 'movie') discoverMovieMap[movie.tmdb_id] = movie;
  toast('已加入下次看');
  if (getActiveTab() === 'couple') renderCouple();
}

async function removeCoupleQueueItem(queueId) {
  const item = coupleQueue.find(q => q.id === queueId);
  if (!item) return;
  const { error } = await db.from('couple_watch_queue').delete().eq('id', queueId);
  if (error) {
    toast('移除失败: ' + error.message);
    return;
  }
  coupleQueue = coupleQueue.filter(q => q.id !== queueId);
  await normalizeCoupleQueuePositions(false);
  toast('已移出下次看');
  renderCouple();
}

async function normalizeCoupleQueuePositions(shouldReload = true) {
  if (!activeCouple || !coupleQueue.length) return;
  coupleQueue.sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  const updates = coupleQueue.map((item, idx) => ({
    id: item.id,
    position: idx + 1
  }));
  await Promise.all(updates.map(u => db.from('couple_watch_queue').update({ position: u.position }).eq('id', u.id)));
  coupleQueue.forEach((item, idx) => { item.position = idx + 1; });
  if (shouldReload) await loadCoupleQueue();
}

async function moveCoupleQueueItem(queueId, dir) {
  const idx = coupleQueue.findIndex(q => q.id === queueId);
  const nextIdx = idx + dir;
  if (idx < 0 || nextIdx < 0 || nextIdx >= coupleQueue.length) return;
  const a = coupleQueue[idx];
  const b = coupleQueue[nextIdx];
  const aPos = a.position;
  a.position = b.position;
  b.position = aPos;
  coupleQueue.splice(idx, 1, b);
  coupleQueue.splice(nextIdx, 1, a);
  await Promise.all([
    db.from('couple_watch_queue').update({ position: a.position }).eq('id', a.id),
    db.from('couple_watch_queue').update({ position: b.position }).eq('id', b.id)
  ]);
  renderCouple();
}

function getCommonCouplePairs() {
  const partnerId = getCouplePartnerId();
  if (!currentUser || !partnerId) return [];
  const mine = new Map();
  const theirs = new Map();
  allEntries.filter(e => e.type === 'movie' && e.tmdb_id).forEach(e => {
    if (e.user_id === currentUser.id && !mine.has(e.tmdb_id)) mine.set(e.tmdb_id, e);
    if (e.user_id === partnerId && !theirs.has(e.tmdb_id)) theirs.set(e.tmdb_id, e);
  });
  return [...mine.keys()].filter(id => theirs.has(id)).map(id => ({ tmdb_id: id, mine: mine.get(id), partner: theirs.get(id) }));
}

function calcCoupleCompatibility() {
  const pairs = getCommonCouplePairs();
  if (!pairs.length) return { sample: 0, total: 0, dim: 0, overall: 0, insufficient: true };
  const totalCompat = pairs.map(p => Math.max(0, 100 - Math.abs(getEntryScore(p.mine) - getEntryScore(p.partner)) * 10));
  const dimCompat = pairs.map(p => {
    const vals = Object.keys(WEIGHTS).map(dim => Math.max(0, 100 - Math.abs((p.mine.ratings?.[dim] || 5) - (p.partner.ratings?.[dim] || 5)) * 10));
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  });
  const total = totalCompat.reduce((s, v) => s + v, 0) / totalCompat.length;
  const dim = dimCompat.reduce((s, v) => s + v, 0) / dimCompat.length;
  return {
    sample: pairs.length,
    total: Math.round(total),
    dim: Math.round(dim),
    overall: Math.round(total * 0.7 + dim * 0.3),
    insufficient: pairs.length < 5
  };
}

function renderScoreMeter(label, value, sub = '') {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return `
    <div class="couple-meter">
      <div class="couple-meter-head"><span>${esc(label)}</span><strong>${Math.round(clamped)}</strong></div>
      <div class="couple-meter-track"><div style="width:${clamped}%"></div></div>
      ${sub ? `<p>${esc(sub)}</p>` : ''}
    </div>
  `;
}

function averageDims(entries) {
  const result = {};
  Object.keys(WEIGHTS).forEach(dim => {
    result[dim] = entries.length
      ? entries.reduce((s, e) => s + (e.ratings?.[dim] || 5), 0) / entries.length
      : 0;
  });
  return result;
}

function getEntryGenres(entry) {
  const detail = entry.tmdb_id ? movieCache.get(entry.tmdb_id) : null;
  if (detail?.genres?.length) return detail.genres;
  if (detail?.genre_ids?.length) return detail.genre_ids.map(id => genreMap[id]).filter(Boolean);
  return [];
}

function topGenrePreferences(entries) {
  const weights = {};
  entries.filter(e => getEntryScore(e) >= 7).forEach(e => {
    const w = Math.max(1, getEntryScore(e) - 6);
    getEntryGenres(e).forEach(g => { weights[g] = (weights[g] || 0) + w; });
  });
  return Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function decadePreferences(entries) {
  const byDecade = {};
  entries.forEach(e => {
    const y = Number(e.year || '');
    if (!y) return;
    const dec = Math.floor(y / 10) * 10;
    if (!byDecade[dec]) byDecade[dec] = { total: 0, count: 0 };
    byDecade[dec].total += getEntryScore(e);
    byDecade[dec].count += 1;
  });
  return Object.entries(byDecade)
    .map(([dec, v]) => ({ decade: dec, avg: v.total / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 4);
}

function calcCouplePreferenceComparison() {
  const partnerId = getCouplePartnerId();
  const mine = allEntries.filter(e => e.user_id === currentUser?.id && e.type === 'movie');
  const partner = allEntries.filter(e => e.user_id === partnerId && e.type === 'movie');
  const pairs = getCommonCouplePairs();
  let totalSplit = null;
  let dimSplit = null;
  pairs.forEach(p => {
    const totalDiff = Math.abs(getEntryScore(p.mine) - getEntryScore(p.partner));
    if (!totalSplit || totalDiff > totalSplit.diff) totalSplit = { diff: totalDiff, entry: p.mine, mine: getEntryScore(p.mine), partner: getEntryScore(p.partner) };
    Object.keys(WEIGHTS).forEach(dim => {
      const diff = Math.abs((p.mine.ratings?.[dim] || 5) - (p.partner.ratings?.[dim] || 5));
      if (!dimSplit || diff > dimSplit.diff) dimSplit = { diff, dim, entry: p.mine, mine: p.mine.ratings?.[dim] || 5, partner: p.partner.ratings?.[dim] || 5 };
    });
  });
  return {
    mineGenres: topGenrePreferences(mine),
    partnerGenres: topGenrePreferences(partner),
    mineDecades: decadePreferences(mine),
    partnerDecades: decadePreferences(partner),
    mineDims: averageDims(mine),
    partnerDims: averageDims(partner),
    totalSplit,
    dimSplit
  };
}

function warmCouplePreferenceDetails() {
  const partnerId = getCouplePartnerId();
  if (!partnerId) return;
  const ids = allEntries
    .filter(e => e.type === 'movie' && e.tmdb_id && (e.user_id === currentUser?.id || e.user_id === partnerId) && getEntryScore(e) >= 7)
    .map(e => e.tmdb_id)
    .filter((id, idx, arr) => arr.indexOf(id) === idx)
    .filter(id => !movieCache.get(id)?.genres?.length)
    .slice(0, 20);
  const key = ids.join(',');
  if (!ids.length || key === couplePreferenceWarmKey) return;
  couplePreferenceWarmKey = key;
  Promise.allSettled(ids.map(id => fetchMovieDetail(id))).then(() => {
    if (getActiveTab() === 'couple') renderCouple();
  });
}

function renderPreferenceChips(items, emptyText) {
  if (!items.length) return `<span class="couple-muted">${esc(emptyText)}</span>`;
  return items.map(([label, value]) => `<span class="couple-chip">${esc(label)} <em>${Number(value).toFixed(1)}</em></span>`).join('');
}

function renderDecadeChips(items, emptyText) {
  if (!items.length) return `<span class="couple-muted">${esc(emptyText)}</span>`;
  return items.map(d => `<span class="couple-chip">${esc(d.decade)}s <em>${d.avg.toFixed(1)}</em></span>`).join('');
}

function renderCouplePreferenceHTML(pref) {
  const partnerName = couplePartner?.display_name || '对方';
  const myColor = getUserColor(currentUser?.id);
  const partnerColor = getUserColor(getCouplePartnerId());
  const dimRows = Object.entries(DIM_LABELS).map(([dim, label]) => {
    const mine = pref.mineDims[dim] || 0;
    const partner = pref.partnerDims[dim] || 0;
    return `
      <div class="couple-compare-row">
        <span>${esc(label)}</span>
        <div class="couple-compare-bars">
          <i style="width:${mine * 10}%;background:${myColor.main}"></i>
          <b style="width:${partner * 10}%;background:${partnerColor.main}"></b>
        </div>
        <em>${mine.toFixed(1)} / ${partner.toFixed(1)}</em>
      </div>
    `;
  }).join('');
  return `
    <div class="couple-section">
      <div class="couple-section-title">偏好对比</div>
      <div class="couple-pref-grid">
        <div>
          <h4 style="color:${myColor.main}">我的类型</h4>
          <div class="couple-chip-row">${renderPreferenceChips(pref.mineGenres, '暂无类型数据')}</div>
        </div>
        <div>
          <h4 style="color:${partnerColor.main}">${esc(partnerName)} 的类型</h4>
          <div class="couple-chip-row">${renderPreferenceChips(pref.partnerGenres, '暂无类型数据')}</div>
        </div>
        <div>
          <h4 style="color:${myColor.main}">我的年代</h4>
          <div class="couple-chip-row">${renderDecadeChips(pref.mineDecades, '暂无年代数据')}</div>
        </div>
        <div>
          <h4 style="color:${partnerColor.main}">${esc(partnerName)} 的年代</h4>
          <div class="couple-chip-row">${renderDecadeChips(pref.partnerDecades, '暂无年代数据')}</div>
        </div>
      </div>
      <div class="couple-dim-compare">${dimRows}</div>
      <div class="couple-split-grid">
        <div>
          <span>总分分歧</span>
          <strong>${pref.totalSplit ? esc(pref.totalSplit.entry.title) : '暂无共同电影'}</strong>
          <p>${pref.totalSplit ? `差 ${pref.totalSplit.diff.toFixed(1)} 分，${pref.totalSplit.mine.toFixed(1)} / ${pref.totalSplit.partner.toFixed(1)}` : '共同样本越多越准'}</p>
        </div>
        <div>
          <span>维度分歧</span>
          <strong>${pref.dimSplit ? `${esc(pref.dimSplit.entry.title)} · ${esc(DIM_LABELS[pref.dimSplit.dim])}` : '暂无共同电影'}</strong>
          <p>${pref.dimSplit ? `差 ${pref.dimSplit.diff.toFixed(0)} 档，${pref.dimSplit.mine} / ${pref.dimSplit.partner}` : '共同样本越多越准'}</p>
        </div>
      </div>
    </div>
  `;
}

const COUPLE_TYPE_DIMENSIONS = [
  { key: 'action', label: '动作', ids: [28], names: ['动作'] },
  { key: 'adventureFantasy', label: '冒险/奇幻', ids: [12, 14], names: ['冒险', '奇幻'] },
  { key: 'sciFi', label: '科幻', ids: [878], names: ['科幻'] },
  { key: 'thrillerHorror', label: '惊悚/恐怖', ids: [53, 27, 9648], names: ['惊悚', '恐怖', '悬疑'] },
  { key: 'comedy', label: '喜剧', ids: [35], names: ['喜剧'] },
  { key: 'romance', label: '爱情', ids: [10749], names: ['爱情'] },
  { key: 'drama', label: '剧情', ids: [18], names: ['剧情'] },
  { key: 'historyWar', label: '历史/战争', ids: [36, 10752], names: ['历史', '战争'] },
  { key: 'animation', label: '动画', ids: [16], names: ['动画'] },
  { key: 'familyKids', label: '家庭/儿童', ids: [10751], names: ['家庭', '儿童'] },
  { key: 'musicDance', label: '音乐/歌舞', ids: [10402], names: ['音乐', '歌舞'] },
  { key: 'documentaryBiopic', label: '纪录/传记', ids: [99], names: ['纪录'], keywordPattern: /biograph|biopic|based on true|real person|historical figure|传记|真实人物/i }
];

function getCoupleMovieEntries(userId) {
  return allEntries.filter(e => e.user_id === userId && e.type === 'movie');
}

function getEntryDetail(entry) {
  if (!entry?.tmdb_id) return null;
  return movieCache.get(entry.tmdb_id) || discoverMovieMap[entry.tmdb_id] || null;
}

function getEntryPosterPath(entry) {
  return entry?.poster_path || getEntryDetail(entry)?.poster_path || '';
}

function getEntryGenreIds(entry) {
  const detail = getEntryDetail(entry);
  const ids = detail?.genre_ids || entry?.genre_ids || [];
  return ids.map(Number).filter(Boolean);
}

function getEntryGenreNames(entry) {
  const detail = getEntryDetail(entry);
  const names = detail?.genres || getEntryGenres(entry) || [];
  return names.map(g => String(g).trim()).filter(Boolean);
}

function getEntryKeywordNames(entry) {
  const detail = getEntryDetail(entry);
  return (detail?.keyword_names || []).map(String);
}

function getCoupleTypeKeys(entry) {
  const ids = new Set(getEntryGenreIds(entry));
  const names = new Set(getEntryGenreNames(entry));
  const keywords = getEntryKeywordNames(entry).join(' ');
  const keys = new Set();
  COUPLE_TYPE_DIMENSIONS.forEach(dim => {
    if (
      dim.ids.some(id => ids.has(id)) ||
      (dim.names || []).some(name => names.has(name)) ||
      (dim.keywordPattern && dim.keywordPattern.test(keywords))
    ) {
      keys.add(dim.key);
    }
  });
  return [...keys];
}

function calcCoupleTypeDistribution(entries) {
  const result = Object.fromEntries(COUPLE_TYPE_DIMENSIONS.map(dim => [dim.key, 0]));
  entries.forEach(entry => {
    const keys = getCoupleTypeKeys(entry);
    if (!keys.length) return;
    const weight = 1 / keys.length;
    keys.forEach(key => { result[key] += weight; });
  });
  return result;
}

function calcCoupleArchiveTime(pairs) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const datedPairs = pairs.map(p => {
    const mineDate = new Date(p.mine.created_at || p.mine.updated_at || 0);
    const partnerDate = new Date(p.partner.created_at || p.partner.updated_at || 0);
    return {
      ...p,
      latestDate: mineDate > partnerDate ? mineDate : partnerDate,
      avg: (getEntryScore(p.mine) + getEntryScore(p.partner)) / 2
    };
  }).filter(p => !Number.isNaN(p.latestDate.getTime()));
  const monthCount = datedPairs.filter(p => p.latestDate >= monthStart).length;
  const recentHigh = datedPairs
    .filter(p => p.avg >= 7)
    .sort((a, b) => b.latestDate - a.latestDate)[0] || null;
  const daysAgo = recentHigh ? Math.max(0, Math.floor((now - recentHigh.latestDate) / 86400000)) : null;
  const weekStart = d => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x.getTime();
  };
  const weeks = new Set(datedPairs.map(p => weekStart(p.latestDate)));
  let streak = 0;
  let cursor = weekStart(now);
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= 7 * 86400000;
  }
  return { monthCount, recentHigh, daysAgo, streak };
}

function calcCoupleArchiveData() {
  const partnerId = getCouplePartnerId();
  const mine = getCoupleMovieEntries(currentUser?.id);
  const partner = getCoupleMovieEntries(partnerId);
  const pairs = getCommonCouplePairs();
  const compat = calcCoupleCompatibility();
  const pref = calcCouplePreferenceComparison();
  const shared = pairs.map(p => {
    const mineScore = getEntryScore(p.mine);
    const partnerScore = getEntryScore(p.partner);
    return {
      ...p,
      mineScore,
      partnerScore,
      avg: (mineScore + partnerScore) / 2,
      diff: Math.abs(mineScore - partnerScore)
    };
  });
  const harmony = shared
    .filter(p => p.avg >= 7)
    .sort((a, b) => b.avg - a.avg || a.diff - b.diff)[0] || shared.sort((a, b) => a.diff - b.diff || b.avg - a.avg)[0] || null;
  const split = shared.sort((a, b) => b.diff - a.diff)[0] || null;
  const myTypeDist = calcCoupleTypeDistribution(mine);
  const partnerTypeDist = calcCoupleTypeDistribution(partner);
  const time = calcCoupleArchiveTime(pairs);
  const posterEntries = [
    harmony?.mine,
    split?.mine,
    ...shared.sort((a, b) => b.avg - a.avg).map(p => p.mine),
    ...coupleQueue
  ].filter(Boolean);
  return { mine, partner, pairs, compat, pref, harmony, split, myTypeDist, partnerTypeDist, time, posterEntries };
}

function warmCoupleArchiveDetails() {
  const partnerId = getCouplePartnerId();
  if (!partnerId) return;
  const ids = allEntries
    .filter(e => e.type === 'movie' && e.tmdb_id && (e.user_id === currentUser?.id || e.user_id === partnerId))
    .map(e => e.tmdb_id)
    .filter((id, idx, arr) => arr.indexOf(id) === idx)
    .filter(id => {
      const detail = movieCache.get(id);
      return !detail?.genre_ids?.length || !detail?.keyword_names?.length;
    })
    .slice(0, 36);
  const key = ids.join(',');
  if (!ids.length || key === couplePreferenceWarmKey) return;
  couplePreferenceWarmKey = key;
  Promise.allSettled(ids.map(id => fetchMovieDetail(id, { force: !!movieCache.get(id) }))).then(() => {
    if (getActiveTab() === 'couple') renderCouple();
  });
}

function renderPosterStack(entries) {
  const posters = entries.map(getEntryPosterPath).filter(Boolean).slice(0, 3);
  if (!posters.length) return '<div class="couple-poster-stack couple-poster-stack-empty"></div>';
  return `<div class="couple-poster-stack">${posters.map(p => `<img src="${posterUrl(p)}" alt="">`).join('')}</div>`;
}

function renderArchiveMetricCard(title, value, sub, color, entries = []) {
  return `
    <div class="couple-archive-card">
      ${renderPosterStack(entries)}
      <div class="couple-archive-card-body">
        <span>${esc(title)}</span>
        <strong style="color:${color}">${esc(value)}</strong>
        <p>${esc(sub)}</p>
      </div>
    </div>
  `;
}

function renderArchiveStoryCard(title, heading, accent, body, entries = []) {
  return `
    <div class="couple-story-card">
      ${renderPosterStack(entries)}
      <span>${esc(title)}</span>
      <strong>${esc(heading)}</strong>
      <em>${esc(accent)}</em>
      <p>${esc(body)}</p>
    </div>
  `;
}

function radarPoint(cx, cy, radius, index, total) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2 / total);
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
}

function radarPolygon(values, cx, cy, radius, maxValue) {
  return values.map((v, i) => {
    const [x, y] = radarPoint(cx, cy, radius * Math.min(Number(v) / maxValue, 1), i, values.length);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function renderCoupleRadar(axes, maxValue, myColor, partnerColor, isType = false) {
  const cx = 210;
  const cy = 210;
  const radius = isType ? 148 : 136;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const grid = levels.map(level => {
    const points = axes.map((_, i) => radarPoint(cx, cy, radius * level, i, axes.length).map(n => n.toFixed(1)).join(',')).join(' ');
    return `<polygon points="${points}" fill="none" stroke="var(--border)" stroke-width="1"/>`;
  }).join('');
  const spokes = axes.map((_, i) => {
    const [x, y] = radarPoint(cx, cy, radius, i, axes.length);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>`;
  }).join('');
  const labels = axes.map((axis, i) => {
    const [x, y] = radarPoint(cx, cy, radius + (isType ? 36 : 48), i, axes.length);
    const anchor = x < cx - 16 ? 'end' : x > cx + 16 ? 'start' : 'middle';
    return `
      <text x="${x.toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="${anchor}" class="couple-radar-label ${isType ? 'type' : ''}">${esc(axis.label)}</text>
      <text x="${x.toFixed(1)}" y="${(y + 13).toFixed(1)}" text-anchor="${anchor}" class="couple-radar-score">${axis.mine.toFixed(1)} / ${axis.partner.toFixed(1)}</text>
    `;
  }).join('');
  const minePoints = radarPolygon(axes.map(a => a.mine), cx, cy, radius, maxValue);
  const partnerPoints = radarPolygon(axes.map(a => a.partner), cx, cy, radius, maxValue);
  return `
    <svg class="couple-radar" viewBox="0 0 420 420" role="img" aria-label="${isType ? '类型分布雷达图' : '评分默契雷达图'}">
      ${grid}${spokes}
      <polygon points="${minePoints}" fill="${myColor.main}" fill-opacity="0.22" stroke="${myColor.main}" stroke-width="3" stroke-linejoin="round"></polygon>
      <polygon points="${partnerPoints}" fill="${partnerColor.main}" fill-opacity="0.22" stroke="${partnerColor.main}" stroke-width="3" stroke-linejoin="round"></polygon>
      <circle cx="${cx}" cy="${cy}" r="3" fill="var(--text2)"></circle>
      ${labels}
    </svg>
  `;
}

function renderCoupleArchiveChart(data, myColor, partnerColor) {
  const isType = coupleArchiveChart === 'type';
  const axes = isType
    ? COUPLE_TYPE_DIMENSIONS.map(dim => ({
        label: dim.label,
        mine: data.myTypeDist[dim.key] || 0,
        partner: data.partnerTypeDist[dim.key] || 0
      }))
    : Object.entries(DIM_LABELS).map(([dim, label]) => ({
        label,
        mine: data.pref.mineDims[dim] || 0,
        partner: data.pref.partnerDims[dim] || 0
      }));
  const maxValue = isType ? Math.max(1, ...axes.map(a => a.mine), ...axes.map(a => a.partner)) : 10;
  return `
    <div class="couple-archive-main">
      <div class="couple-section-head">
        <div>
          <div class="couple-section-title">主图切换区</div>
          <p class="couple-note">同一位置切换评分默契与 12 维类型分布</p>
        </div>
        <div class="couple-chart-toggle">
          <button class="${!isType ? 'active' : ''}" data-couple-chart="score">评分默契</button>
          <button class="${isType ? 'active' : ''}" data-couple-chart="type">类型分布</button>
        </div>
      </div>
      ${renderCoupleRadar(axes, maxValue, myColor, partnerColor, isType)}
      <div class="couple-radar-legend">
        <span><i style="background:${myColor.main}"></i>我</span>
        <span><i style="background:${partnerColor.main}"></i>${esc(couplePartner?.display_name || '对方')}</span>
        <em>${isType ? '多类型电影按命中大类平分权重' : '重叠面积越大，评分默契越高'}</em>
      </div>
    </div>
  `;
}

function renderArchiveAchievement(title, value, color) {
  return `<div class="couple-achievement"><strong style="color:${color}">${esc(title)}</strong><span>${esc(value)}</span></div>`;
}

function getTopTypeLabel(dist) {
  const top = COUPLE_TYPE_DIMENSIONS
    .map(dim => ({ label: dim.label, value: dist[dim.key] || 0 }))
    .sort((a, b) => b.value - a.value)[0];
  return top && top.value > 0 ? top.label : '剧情';
}

function scoreCoupleQueueItem(item, data) {
  const keys = getCoupleTypeKeys(item);
  const typeScore = keys.length
    ? keys.reduce((sum, key) => sum + (data.myTypeDist[key] || 0) + (data.partnerTypeDist[key] || 0), 0) / keys.length
    : 0;
  const safety = keys.some(key => ['drama', 'romance', 'comedy', 'adventureFantasy', 'sciFi'].includes(key)) ? 1.4 : 1;
  return Math.max(1, 1 + typeScore * 0.25) * safety;
}

function pickCoupleWheelItem(data) {
  const candidates = coupleQueue.filter(item => normalizeMediaType(item.media_type) === 'movie' || normalizeMediaType(item.media_type) === 'series');
  if (!candidates.length) return null;
  const weighted = candidates.map(item => ({ item, weight: scoreCoupleQueueItem(item, data) }));
  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  let needle = Math.random() * total;
  for (const w of weighted) {
    needle -= w.weight;
    if (needle <= 0) return w.item;
  }
  return weighted[0].item;
}

function renderWheelSegments() {
  const labels = ['剧情', '爱情', '科幻', '动画', '喜剧', '动作'];
  return labels.map((label, i) => `<span style="--i:${i}">${esc(label)}</span>`).join('');
}

function renderCoupleWheel(data) {
  const pick = coupleWheelPick && coupleQueue.find(q => q.id === coupleWheelPick.id) ? coupleWheelPick : null;
  const topType = getTopTypeLabel(data.myTypeDist);
  const hit = coupleQueue.length ? Math.min(coupleQueue.length, Math.max(0, coupleQueue.filter(item => getCoupleTypeKeys(item).includes(COUPLE_TYPE_DIMENSIONS.find(dim => dim.label === topType)?.key)).length)) : 0;
  return `
    <div class="couple-archive-side-card">
      <div class="couple-section-title">下次看：转盘抽一部</div>
      <p class="couple-note">从队列按默契权重随机</p>
      <div class="couple-wheel-row">
        <button class="couple-wheel" data-couple-spin aria-label="抽一部">
          ${renderWheelSegments()}
          <b>抽</b>
        </button>
        <div class="couple-wheel-stats">
          <span>今晚命中率</span><strong>${hit}/${coupleQueue.length || 0}</strong>
          <span>安全选择</span><strong>${esc(topType)}</strong>
        </div>
      </div>
      ${pick ? `
        <div class="couple-wheel-result" data-queue-id="${pick.id}">
          ${pick.poster_path ? `<img src="${posterUrl(pick.poster_path)}" alt="">` : '<div></div>'}
          <strong>${esc(pick.title)}</strong>
          <span>${pick.year || '未知'} · ${mediaTypeLabel(normalizeMediaType(pick.media_type))}</span>
          <button class="btn btn-xs btn-secondary" data-wheel-rate>评分</button>
          <button class="btn btn-xs btn-danger" data-wheel-remove>移除</button>
        </div>
      ` : `<p class="couple-muted">${coupleQueue.length ? '点击转盘抽一部' : '下次看队列为空'}</p>`}
    </div>
  `;
}

function renderDiffRadar(data) {
  const rows = Object.entries(DIM_LABELS).map(([dim, label]) => {
    const diff = Math.abs((data.pref.mineDims[dim] || 0) - (data.pref.partnerDims[dim] || 0));
    const color = diff >= 1 ? 'var(--ceci)' : diff >= 0.5 ? 'var(--gold)' : '#63c79d';
    return `
      <div class="couple-diff-row">
        <span>${esc(label)}</span>
        <i><b style="width:${Math.min(diff / 2, 1) * 100}%;background:${color}"></b></i>
        <em>${diff.toFixed(1)}</em>
      </div>
    `;
  }).join('');
  return `<div class="couple-archive-side-card"><div class="couple-section-title">分歧雷达</div><p class="couple-note">辅助评分默契图</p>${rows}</div>`;
}

function renderTimeCard(data) {
  const latest = data.time.daysAgo === null ? '暂无同步高分' : `最近一次同步高分：${data.time.daysAgo} 天前`;
  return `
    <div class="couple-archive-side-card">
      <div class="couple-section-title">时间动态</div>
      <strong class="couple-time-highlight">${esc(latest)}</strong>
      <p>本月共同评分 ${data.time.monthCount} 部</p>
      <p>连续 ${data.time.streak || 0} 周都有共同观影记录</p>
    </div>
  `;
}

function renderCoupleArchiveHTML() {
  const partnerName = couplePartner?.display_name || '对方';
  const myColor = getUserColor(currentUser?.id);
  const partnerColor = getUserColor(getCouplePartnerId());
  const data = calcCoupleArchiveData();
  const harmonyTitle = data.harmony?.mine?.title || '暂无共同电影';
  const splitTitle = data.split?.mine?.title || '暂无共同电影';
  const harmonySub = data.harmony ? `你 ${data.harmony.mineScore.toFixed(1)} / ${partnerName} ${data.harmony.partnerScore.toFixed(1)}` : '共同评分后生成';
  const wheelSub = `${coupleQueue.length} 部在队列 · 点击转盘抽一部`;
  return `
    <div class="couple-archive">
      <div class="couple-archive-top">
        ${renderArchiveMetricCard('关系仪表盘', String(data.compat.overall), `默契指数 · 共同样本 ${data.compat.sample} 部`, 'var(--gold)', data.posterEntries)}
        ${renderArchiveMetricCard('共同封神', harmonyTitle, harmonySub, partnerColor.main, [data.harmony?.mine])}
        ${renderArchiveMetricCard('下次看决策', `${coupleQueue.length} 部`, wheelSub, 'var(--friend)', coupleQueue)}
        ${renderArchiveMetricCard('时间节奏', `${data.time.monthCount} 部`, `本月共同评分 · 连续 ${data.time.streak || 0} 周`, '#63c79d', data.posterEntries)}
      </div>
      <div class="couple-archive-layout">
        <div class="couple-archive-left">
          ${renderArchiveStoryCard('最大共鸣', harmonyTitle, data.harmony ? `共同高分 · 差 ${data.harmony.diff.toFixed(1)}` : '共同样本越多越准', '统计像故事，不只是数字', [data.harmony?.mine])}
          ${renderArchiveStoryCard('最大分歧', splitTitle, data.split ? `总分差 ${data.split.diff.toFixed(1)}` : '共同样本越多越准', '保留一点饭后讨论的趣味', [data.split?.mine])}
          <div class="couple-story-card no-poster">
            <span>Couple 成就</span>
            ${renderArchiveAchievement('同步审美', `${data.pairs.filter(p => Math.abs(getEntryScore(p.mine) - getEntryScore(p.partner)) < 1).length} 部分差 < 1`, 'var(--gold)')}
            ${renderArchiveAchievement('分歧名场面', `${data.pairs.filter(p => Math.abs(getEntryScore(p.mine) - getEntryScore(p.partner)) >= 3).length} 部差距 >= 3`, 'var(--ceci)')}
            ${renderArchiveAchievement('意见领袖', `${coupleQueue.length} 部待验证`, 'var(--friend)')}
          </div>
        </div>
        ${renderCoupleArchiveChart(data, myColor, partnerColor)}
        <div class="couple-archive-right">
          ${renderCoupleWheel(data)}
          ${renderDiffRadar(data)}
          ${renderTimeCard(data)}
        </div>
      </div>
    </div>
  `;
}

async function loadCoupleRecommendations(force = false) {
  if (!activeCouple || !currentUser || coupleRecommendationLoading) return;
  if (!force && (coupleRecommendationState === 'ready' || coupleRecommendationState === 'insufficient' || coupleRecommendationState === 'error')) return;
  coupleRecommendationLoading = true;
  coupleRecommendationState = 'loading';
  try {
    const partnerId = getCouplePartnerId();
    const res = await fetch(TMDB_PROXY + '/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'couple',
        entries: buildRecommendationEntries(),
        userId: currentUser.id,
        partnerUserId: partnerId,
        blockedIds: buildCoupleBlockedIds(),
        blockedMovies: buildBlockedFeedback(),
        excludeIds: coupleQueue.map(m => m.tmdb_id)
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `双人推荐接口异常 (${res.status})`);
    if (data.movies === null) {
      coupleRecommendations = null;
      coupleRecommendationState = 'insufficient';
    } else {
      coupleRecommendations = (data.movies || []).map(m => ({ ...m, media_type: 'movie' }));
      coupleRecommendations.forEach(m => {
        const tmdbId = m.id || m.tmdb_id;
        if (tmdbId) discoverMovieMap[tmdbId] = { ...m, id: tmdbId, media_type: 'movie' };
      });
      coupleRecommendationState = 'ready';
    }
  } catch (e) {
    coupleRecommendations = [];
    coupleRecommendationState = 'error';
    toast('双人推荐失败: ' + (e.message || e));
  } finally {
    coupleRecommendationLoading = false;
  }
}

function renderCoupleRecommendationsHTML() {
  if (!activeCouple) return '';
  if (coupleRecommendationState === 'idle' && !coupleRecommendationLoading) {
    loadCoupleRecommendations().then(() => {
      if (getActiveTab() === 'couple') renderCouple();
    });
  }
  const ratedTmdbIds = new Set(allEntries.filter(e => e.user_id === currentUser?.id && e.tmdb_id).map(e => 'tmdb_' + e.tmdb_id));
  const body = coupleRecommendationLoading || coupleRecommendationState === 'loading'
    ? '<div class="discover-spinner"><div class="spinner"></div></div>'
    : coupleRecommendationState === 'insufficient'
      ? '<div class="empty-state"><p>双方各评价 5 部、合计 25 部电影后生成双人推荐</p></div>'
      : coupleRecommendations.length
        ? `<div class="discover-grid">${coupleRecommendations.slice(0, 8).map(m => renderDiscoverCard(m, ratedTmdbIds, false)).join('')}</div>`
        : '<div class="empty-state"><p>暂时没有可用的双人推荐</p></div>';
  return `
    <div class="couple-section">
      <div class="couple-section-head">
        <div class="couple-section-title">双人推荐</div>
        <button class="btn btn-xs btn-secondary" data-couple-refresh-rec>换一批</button>
      </div>
      ${body}
    </div>
  `;
}

function renderCoupleQueueHTML() {
  if (!activeCouple) return '';
  if (!coupleQueueAvailable) {
    return `<div class="couple-section"><div class="empty-state"><p>下次看表尚未创建，请先执行升级 SQL</p></div></div>`;
  }
  const rows = coupleQueue.length
    ? coupleQueue.map((m, idx) => {
        const addedBy = allProfiles[m.added_by]?.display_name || '未知';
        const addedByColor = getUserColor(m.added_by).main;
        const mediaType = normalizeMediaType(m.media_type);
        const poster = m.poster_path ? posterUrl(m.poster_path) : '';
        return `
          <div class="queue-row" data-queue-id="${m.id}" data-media-type="${mediaType}">
            <div class="queue-rank">${idx + 1}</div>
            ${poster ? `<img src="${poster}" alt="">` : '<div class="queue-poster"></div>'}
            <div class="queue-info">
              <strong>${esc(m.title)}</strong>
              <span>${m.year || '未知'} · ${mediaTypeLabel(mediaType)} · <em style="color:${addedByColor}">${esc(addedBy)}</em> 加入</span>
            </div>
            <div class="queue-actions">
              <button class="btn btn-xs btn-secondary" data-queue-up ${idx===0?'disabled':''}>上移</button>
              <button class="btn btn-xs btn-secondary" data-queue-down ${idx===coupleQueue.length-1?'disabled':''}>下移</button>
              <button class="btn btn-xs btn-secondary" data-queue-rate data-tmdb-id="${m.tmdb_id}" data-media-type="${mediaType}">评分</button>
              <button class="btn btn-xs btn-danger" data-queue-remove>移除</button>
            </div>
          </div>
        `;
      }).join('')
    : '<div class="empty-state"><p>还没有下次看的电影/剧集</p><p style="font-size:0.8rem;color:var(--text2);margin-top:8px">可从发现页或搜索结果加入</p></div>';
  return `
    <div class="couple-section">
      <div class="couple-section-title">下次看</div>
      <div class="queue-list">${rows}</div>
    </div>
  `;
}

function getPendingCoupleGroups() {
  return {
    received: pendingCouples.filter(c => c.requested_by !== currentUser?.id),
    sent: pendingCouples.filter(c => c.requested_by === currentUser?.id)
  };
}

function getProfileDisplayName(userId, fallback = '对方') {
  return allProfiles[userId]?.display_name || fallback;
}

function renderCouplePendingActions(received, sent) {
  const rows = [
    ...received.map(c => `<div class="couple-pending-row"><span>${esc(getProfileDisplayName(c.requested_by))} 请求绑定 Couple</span><button class="btn btn-sm btn-primary" data-confirm-couple="${c.id}">确认绑定</button></div>`),
    ...sent.map(c => {
      const partnerId = c.user_a === currentUser?.id ? c.user_b : c.user_a;
      return `<div class="couple-pending-row"><span>已向 ${esc(getProfileDisplayName(partnerId))} 发送请求，等待确认</span><button class="btn btn-sm btn-danger" data-disconnect-couple="${c.id}">撤销</button></div>`;
    })
  ];
  return rows.length ? `<div class="couple-pending">${rows.join('')}</div>` : '';
}

function renderCoupleUserResults(query = '') {
  const target = document.getElementById('coupleUserResults');
  if (!target) return;
  const q = query.trim().toLowerCase();
  const activePartnerIds = new Set([currentUser?.id, ...pendingCouples.flatMap(c => [c.user_a, c.user_b])]);
  const users = Object.values(allProfiles)
    .filter(p => p.user_id && !activePartnerIds.has(p.user_id))
    .filter(p => !q || (p.display_name || '').toLowerCase().includes(q))
    .slice(0, 8);
  target.innerHTML = users.length
    ? users.map(p => `<button class="couple-user-result" data-bind-user="${p.user_id}"><span>${esc(p.display_name || '未命名')}</span><em>发送绑定请求</em></button>`).join('')
    : '<div class="couple-muted">没有可绑定用户</div>';
}

function renderCoupleUnbound() {
  const { received, sent } = getPendingCoupleGroups();
  return `
    <div class="couple-empty">
      <h3>绑定 Couple 后启用双人观影功能</h3>
      <p>绑定后可查看评分默契度、偏好对比、双人推荐，并共同维护“下次看”队列。</p>
      ${renderCouplePendingActions(received, sent)}
      <div class="couple-bind-box">
        <input id="coupleUserSearch" type="text" placeholder="搜索用户名绑定 Couple">
        <div id="coupleUserResults" class="couple-user-results"></div>
      </div>
    </div>
  `;
}

function renderCoupleSurfaces() {
  renderCouple();
}

function renderCoupleSubtabs() {
  const tabs = [
    ['archive', '档案'],
    ['recommend', '双人推荐'],
    ['queue', '下次看']
  ];
  return `
    <div class="discover-subtabs couple-subtabs" id="coupleSubtabs">
      ${tabs.map(([key, label]) => `<button class="${coupleTab === key ? 'active' : ''}" data-couple-tab="${key}">${label}</button>`).join('')}
    </div>
  `;
}

function renderCouple() {
  const container = $['coupleContent'];
  if (!container) return;
  if (!couplesAvailable) {
    container.innerHTML = '<div class="empty-state"><p>Couple 表尚未创建，请先执行升级 SQL</p></div>';
    return;
  }
  if (!activeCouple) {
    container.innerHTML = renderCoupleUnbound();
    renderCoupleUserResults('');
    return;
  }
  const partnerName = couplePartner?.display_name || '对方';
  const myColor = getUserColor(currentUser?.id);
  const partnerColor = getUserColor(getCouplePartnerId());
  if (!['archive', 'recommend', 'queue'].includes(coupleTab)) coupleTab = 'archive';
  warmCoupleArchiveDetails();
  const disconnectRequester = activeCouple.disconnect_requested_by || null;
  const disconnectByMe = disconnectRequester === currentUser.id;
  const disconnectByPartner = disconnectRequester && !disconnectByMe;
  const disconnectButtonText = disconnectByMe ? '撤销解除申请' : (disconnectByPartner ? '同意解除 Couple' : '申请解除 Couple');
  const disconnectButtonClass = disconnectByPartner ? 'btn-primary' : (disconnectByMe ? 'btn-secondary' : 'btn-danger');
  const disconnectNotice = disconnectRequester
    ? `<div class="couple-section couple-disconnect-notice"><p>${disconnectByMe ? '已发送解除申请，等待对方同意。' : `${esc(partnerName)} 请求解除 Couple，同意后共享下次看队列会一起删除。`}</p></div>`
    : '';
  const activeContent = coupleTab === 'queue'
    ? renderCoupleQueueHTML()
    : coupleTab === 'archive'
      ? renderCoupleArchiveHTML()
      : renderCoupleRecommendationsHTML();
  container.innerHTML = `
    <div class="couple-hero">
      <div>
        <p>已绑定</p>
        <h3><span style="color:${myColor.main}">${esc(currentProfile?.display_name || '我')}</span> & <span style="color:${partnerColor.main}">${esc(partnerName)}</span></h3>
      </div>
      <button class="btn btn-xs ${disconnectButtonClass}" data-disconnect-couple="${activeCouple.id}">${disconnectButtonText}</button>
    </div>
    ${disconnectNotice}
    ${renderCoupleSubtabs()}
    ${activeContent}
  `;
}

$['coupleContent'].addEventListener('input', e => {
  if (e.target.id === 'coupleUserSearch') renderCoupleUserResults(e.target.value);
});

$['coupleContent'].addEventListener('click', async e => {
  const bindBtn = e.target.closest('[data-bind-user]');
  if (bindBtn) {
    await bindCoupleWith(bindBtn.dataset.bindUser);
    return;
  }
  const confirmBtn = e.target.closest('[data-confirm-couple]');
  if (confirmBtn) {
    await confirmCouple(confirmBtn.dataset.confirmCouple);
    return;
  }
  const disconnectBtn = e.target.closest('[data-disconnect-couple]');
  if (disconnectBtn) {
    await disconnectCouple(disconnectBtn.dataset.disconnectCouple);
    return;
  }
  const coupleTabBtn = e.target.closest('[data-couple-tab]');
  if (coupleTabBtn) {
    coupleTab = coupleTabBtn.dataset.coupleTab;
    renderCouple();
    return;
  }
  const refreshBtn = e.target.closest('[data-couple-refresh-rec]');
  if (refreshBtn) {
    coupleRecommendations = null;
    await loadCoupleRecommendations(true);
    renderCouple();
    return;
  }
  const chartBtn = e.target.closest('[data-couple-chart]');
  if (chartBtn) {
    coupleArchiveChart = chartBtn.dataset.coupleChart === 'type' ? 'type' : 'score';
    renderCouple();
    return;
  }
  const spinBtn = e.target.closest('[data-couple-spin]');
  if (spinBtn) {
    coupleWheelPick = pickCoupleWheelItem(calcCoupleArchiveData());
    if (!coupleWheelPick) toast('下次看队列为空');
    renderCouple();
    return;
  }
  const wheelResult = e.target.closest('.couple-wheel-result');
  if (wheelResult) {
    const queueId = wheelResult.dataset.queueId;
    const item = coupleQueue.find(q => q.id === queueId);
    if (!item) return;
    if (e.target.closest('[data-wheel-rate]')) {
      if (normalizeMediaType(item.media_type) === 'movie') openQuickRate({ id: item.tmdb_id, title: item.title, year: item.year, poster_path: item.poster_path });
      else openEntryFormForListMovie(item);
    } else if (e.target.closest('[data-wheel-remove]')) {
      await removeCoupleQueueItem(queueId);
      coupleWheelPick = null;
    } else {
      showListItemDetail(item);
    }
    return;
  }
  const queueRow = e.target.closest('.queue-row');
  if (queueRow) {
    const queueId = queueRow.dataset.queueId;
    if (e.target.closest('[data-queue-up]')) await moveCoupleQueueItem(queueId, -1);
    else if (e.target.closest('[data-queue-down]')) await moveCoupleQueueItem(queueId, 1);
    else if (e.target.closest('[data-queue-remove]')) await removeCoupleQueueItem(queueId);
    else if (e.target.closest('[data-queue-rate]')) {
      const item = coupleQueue.find(q => q.id === queueId);
      if (item) {
        if (normalizeMediaType(item.media_type) === 'movie') openQuickRate({ id: item.tmdb_id, title: item.title, year: item.year, poster_path: item.poster_path });
        else openEntryFormForListMovie(item);
      }
    } else {
      const item = coupleQueue.find(q => q.id === queueId);
      if (item) showListItemDetail(item);
    }
    return;
  }
  const rateBtn = e.target.closest('.dc-rate-btn');
  if (rateBtn) {
    e.stopPropagation();
    const tmdbId = parseInt(rateBtn.dataset.tmdbId);
    const mediaType = normalizeMediaType(rateBtn.dataset.mediaType);
    const movie = discoverMovieMap[tmdbId] || (coupleRecommendations || []).find(m => m.id === tmdbId);
    if (movie) openQuickRate({ ...movie, media_type: mediaType });
    return;
  }
  const watchBtn = e.target.closest('.dc-watch-btn');
  if (watchBtn) {
    e.stopPropagation();
    const tmdbId = parseInt(watchBtn.dataset.tmdbId);
    const mediaType = normalizeMediaType(watchBtn.dataset.mediaType);
    const movie = discoverMovieMap[tmdbId] || (coupleRecommendations || []).find(m => m.id === tmdbId);
    await toggleWatchlist(tmdbId, { ...(movie || { id: tmdbId }), media_type: mediaType });
    renderCouple();
    return;
  }
  const nextBtn = e.target.closest('.dc-next-btn');
  if (nextBtn) {
    e.stopPropagation();
    const tmdbId = parseInt(nextBtn.dataset.tmdbId);
    const mediaType = normalizeMediaType(nextBtn.dataset.mediaType);
    const movie = discoverMovieMap[tmdbId] || (coupleRecommendations || []).find(m => m.id === tmdbId);
    await addToCoupleQueue({ ...(movie || { id: tmdbId }), media_type: mediaType });
    return;
  }
  if (e.target.closest('button')) return;
  const card = e.target.closest('.discover-card');
  if (card) {
    const tmdbId = parseInt(card.dataset.tmdbId);
    if (tmdbId) showMovieDetail(tmdbId);
  }
});

// Open blocked movies modal from user dropdown
$['blockedMgmtBtn'].addEventListener('click', () => {
  $['userMenu'].classList.remove('open');
  blockedPage = 1;
  renderBlockedPanel();
  $['blockedModal'].classList.add('open');
});

// Close blocked modal
$['blockedModalClose'].addEventListener('click', () => {
  $['blockedModal'].classList.remove('open');
});
$['blockedModal'].addEventListener('click', e => {
  if (e.target === e.currentTarget) $['blockedModal'].classList.remove('open');
});

// Delegated clicks inside blocked modal: unblock + pagination
$['blockedModal'].addEventListener('click', e => {
  // Unblock button
  const unblockBtn = e.target.closest('.dc-unblock-btn');
  if (unblockBtn) {
    e.stopPropagation();
    const tmdbId = parseInt(unblockBtn.dataset.tmdbId);
    if (!tmdbId || !currentUser) return;
    db.from('blocked_movies').delete().eq('user_id', currentUser.id).eq('tmdb_id', tmdbId).then(({error}) => {
      if (!error) {
        blockedMovieIds.delete(tmdbId);
        delete blockedMovieReasons[tmdbId];
        discoverCache.recommend = null;
        const idsRemaining = blockedMovieIds.size;
        const totalPages = Math.ceil(idsRemaining / 12);
        if (blockedPage > totalPages) blockedPage = Math.max(1, totalPages);
        renderBlockedPanel();
        toast('已恢复推荐');
      }
    });
    return;
  }
  // Pagination
  const pgBtn = e.target.closest('button[data-bl-pg]');
  if (pgBtn) {
    blockedPage = parseInt(pgBtn.getAttribute('data-bl-pg'));
    if (!isNaN(blockedPage)) {
      renderBlockedPanel();
      $['blockedModal'].querySelector('.modal').scrollTop = 0;
    }
  }
});

// Discover sub-tab renderers
function renderWeekDiscover(container, movies, ratedTmdbIds) {
  const visibleMovies = movies.filter(m => !blockedMovieIds.has(m.id));
  container.innerHTML = `
    <div class="discover-topbar"><span class="topbar-count">共 ${visibleMovies.length} 部</span></div>
    <div class="discover-grid">
      ${visibleMovies.map(m=>renderDiscoverCard(m, ratedTmdbIds)).join('')}
    </div>
  `;
}

function renderTopRatedDiscover(container, movies, ratedTmdbIds) {
  const unblockedMovies = movies.filter(m => !blockedMovieIds.has(m.id));
  const filteredMovies = topratedFilterUnwatched ? unblockedMovies.filter(m=>!ratedTmdbIds.has('tmdb_'+m.id)) : unblockedMovies;
  const page = discoverPage.toprated || 1;
  const pageSize = 20;
  const totalPages = Math.ceil(filteredMovies.length / pageSize);
  const start = (page-1)*pageSize;
  const pageMovies = filteredMovies.slice(start, start+pageSize);

  container.innerHTML = `
    <div class="discover-topbar">
      <span class="topbar-count">${topratedFilterUnwatched ? '未看 ' : '共 '}${filteredMovies.length} 部</span>
      <button class="toggle-pill ${topratedFilterUnwatched?'active':''}" onclick="topratedFilterUnwatched=!topratedFilterUnwatched;discoverPage.toprated=1;renderDiscover()">只看未看</button>
    </div>
    <div class="discover-grid">
      ${pageMovies.map(m=>renderDiscoverCard(m, ratedTmdbIds)).join('')}
    </div>
    ${filteredMovies.length ? discoverPaginationHTML(page, totalPages) : '<div class="empty-state"><p>全部已看过</p></div>'}
  `;
}

function renderRecommendDiscover(container, movies, ratedTmdbIds) {
  const ratedCount = allEntries.filter(e=>e.user_id===currentUser.id && e.type==='movie').length;
  const advanced = ratedCount >= 100;
  const pageSize = advanced ? 24 : 12;

  // Filter out blocked movies (Worker already handles freshness via excludeIds)
  const unblockedMovies = movies.filter(m => !blockedMovieIds.has(m.id));
  const displayMovies = unblockedMovies.slice(0, pageSize);

  // Track shown tmdb_ids for next refresh freshness check
  discoverLastShownIds = displayMovies.map(m=>m.id);

  container.innerHTML = `
    <div class="discover-topbar">
      <button class="btn btn-sm btn-secondary" id="discoverRefreshBtn">🔄 刷新推荐</button>
      <span id="discoverRefreshHint" style="font-size:0.75rem;color:var(--text2)"></span>
    </div>
    <div class="discover-grid">
      ${displayMovies.map(m=>renderDiscoverCard(m, ratedTmdbIds, true)).join('')}
    </div>
  `;
  bindDiscoverRefresh();
  updateRefreshUI();
}

async function renderDiscover() {
  const container = $['discoverContent'];
  const tab = discoverTab; // snapshot — prevents mid-load tab switch from corrupting output
  container.innerHTML = '<div class="discover-spinner"><div class="spinner"></div></div>';

  let movies = [];
  try {
    if (tab === 'recommend') {
      movies = await loadRecommendations();
    } else if (tab === 'week') {
      movies = await loadTrending();
    } else {
      movies = await loadTopRated();
    }
  } catch(e) {
    if (discoverTab === tab) {
      container.innerHTML = `<div class="empty-state"><p>加载失败，请稍后重试</p><p style="font-size:0.8rem;color:var(--text2);margin-top:8px">${esc(e.message || '网络或接口异常')}</p></div>`;
    }
    return;
  }

  // Discard stale result if user already switched to a different sub-tab
  if (discoverTab !== tab) return;

  if (movies === null) {
    container.innerHTML = `<div class="empty-state"><p style="font-size:2rem">🎬</p><p>评价 ${25} 部以上电影后</p><p>Ceci 会为你生成个性化推荐</p><p style="font-size:0.8rem;color:var(--text2);margin-top:8px">当前已评价 ${allEntries.filter(e=>e.user_id===currentUser.id && e.type==='movie').length} 部</p></div>`;
    return;
  }
  if (!movies.length) {
    container.innerHTML = '<div class="empty-state"><p>暂无推荐，试试热门标签吧</p></div>';
    return;
  }

  // Build lookup map (TMDB uses 'id', not 'tmdb_id')
  discoverMovieMap = {};
  movies.forEach(m=>{ if(m.id) discoverMovieMap[m.id]=m; });

  const ratedTmdbIds = new Set(allEntries.filter(e=>e.user_id===currentUser.id && e.tmdb_id).map(e=>'tmdb_'+e.tmdb_id));

  if (tab === 'week') renderWeekDiscover(container, movies, ratedTmdbIds);
  else if (tab === 'toprated') renderTopRatedDiscover(container, movies, ratedTmdbIds);
  else renderRecommendDiscover(container, movies, ratedTmdbIds);
}

async function blockMovie(tmdbId, cardEl) {
  if (!currentUser || !tmdbId) return;
  const reason = prompt('为什么不再推荐？可填：已看过 / 类型不喜欢 / 太热门 / 太冷门 / 太旧 / 看过其他版本 / 不想看这个导演', '类型不喜欢');
  if (reason === null) return;
  const movie = discoverMovieMap[tmdbId];
  if (movie) blockedMovieDetails[tmdbId] = movie;
  let { error } = await db.from('blocked_movies').insert({
    user_id: currentUser.id,
    tmdb_id: tmdbId,
    reason: reason.trim().slice(0, 40)
  });
  if (error && /reason|column/i.test(error.message || '')) {
    const retry = await db.from('blocked_movies').insert({
      user_id: currentUser.id,
      tmdb_id: tmdbId
    });
    error = retry.error;
  }
  if (error) {
    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      toast('操作失败: ' + error.message);
      return;
    }
  }
  blockedMovieIds.add(tmdbId);
  if (reason.trim()) blockedMovieReasons[tmdbId] = reason.trim().slice(0, 40);
  discoverCache.recommend = null;
  if (cardEl) {
    cardEl.classList.add('blocked-removing');
    setTimeout(() => {
      cardEl.remove();
      const grid = $['discoverContent'].querySelector('.discover-grid');
      if (grid && !grid.querySelector('.discover-card')) {
        renderDiscover();
      }
    }, 300);
  }
  toast('已加入不再推荐列表');
}

function renderBlockedPanel(shouldHydrate = true) {
  const ids = [...blockedMovieIds];
  if ($['blockedCount']) $['blockedCount'].textContent = ids.length;
  if (!$['blockedMovieGrid']) return;

  if (!ids.length) {
    $['blockedMovieGrid'].innerHTML = '<div class="empty-state"><p style="font-size:0.85rem">暂无不推荐电影</p></div>';
    if ($['blockedPagination']) $['blockedPagination'].innerHTML = '';
    return;
  }

  const pageSize = 12;
  const totalPages = Math.ceil(ids.length / pageSize);
  if (blockedPage > totalPages) blockedPage = totalPages;
  const start = (blockedPage - 1) * pageSize;
  const pageIds = ids.slice(start, start + pageSize);
  if (shouldHydrate) hydrateBlockedMovieDetails(pageIds);

  $['blockedMovieGrid'].innerHTML = pageIds.map(tmdbId => {
    const movie = discoverMovieMap[tmdbId] || blockedMovieDetails[tmdbId];
    const title = movie ? movie.title : 'TMDB #' + tmdbId;
    const poster = movie && movie.poster_path ? posterUrl(movie.poster_path) : '';
    const year = movie ? (movie.release_date || '').slice(0, 4) : '';
    const reason = blockedMovieReasons[tmdbId] || '';
    return `
      <div class="discover-card" data-tmdb-id="${tmdbId}">
        <div class="dc-poster-wrap">
          ${poster ? `<img src="${poster}" alt="${esc(title)}" loading="lazy">` : '<div class="dc-no-poster">🚫</div>'}
        </div>
        <div class="dc-info">
          <div class="dc-title">${esc(title)}</div>
          <div class="dc-meta">${year || '未知'}</div>
          ${reason ? `<div class="dc-reasons"><span class="dc-reason">${esc(reason)}</span></div>` : ''}
          <div class="dc-action">
            <button class="btn btn-xs btn-secondary dc-unblock-btn" data-tmdb-id="${tmdbId}" style="width:100%">恢复推荐</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if ($['blockedPagination']) {
    $['blockedPagination'].innerHTML = buildPaginationHTML(blockedPage, totalPages, 'data-bl-pg', 'list-pages');
  }
}

let discoverPageDebounce = null;
let listPageDebounce = null;

function goDiscoverPage(n) {
  if (discoverPageDebounce) return;
  discoverPageDebounce = setTimeout(()=>{ discoverPageDebounce = null; }, 300);
  discoverPage[discoverTab] = n;
  renderDiscover();
  window.scrollTo({top: ($['discoverContent'].offsetTop||0)-80, behavior: 'smooth'});
}

// Delegated click on discover-pages container
$['discoverContent'].addEventListener('click', e=>{
  const btn = e.target.closest('.discover-pages button');
  if (!btn || btn.disabled) return;
  const pg = parseInt(btn.dataset.pg);
  if (isNaN(pg) || pg<1) return;
  goDiscoverPage(pg);
});

// Delegated click for list pagination
$['movieList'].addEventListener('click', e=>{
  const btn = e.target.closest('.list-pages button');
  if (!btn || btn.disabled) return;
  const pg = parseInt(btn.dataset.lpPg);
  if (isNaN(pg) || pg<1) return;
  if (listPageDebounce) return;
  listPageDebounce = setTimeout(()=>{ listPageDebounce = null; }, 300);
  listPageNum = pg;
  renderList();
  window.scrollTo({top:0,behavior:'smooth'});
});

function buildPaginationHTML(cp, total, attr, cls) {
  // attr: button data attribute (e.g. 'data-lp-pg' or 'data-pg')
  // cls: container class (e.g. 'list-pages' or 'discover-pages')
  if (total <= 1) return '';
  const nums = [];
  if (total <= 5) {
    for (let i=1; i<=total; i++) nums.push(i);
  } else {
    nums.push(1);
    let start, end;
    if (cp <= 3) { start=2; end=4; }
    else if (cp >= total-2) { start=total-3; end=total-1; }
    else { start=cp-1; end=cp+1; }
    if (start > 2) nums.push('...');
    for (let i=start; i<=end; i++) nums.push(i);
    if (end < total-1) nums.push('...');
    nums.push(total);
  }
  let html = `<div class="${cls}">`;
  html += `<button ${attr}="${cp-1}" ${cp<=1?'disabled':''}>‹</button>`;
  nums.forEach(n=>{
    if (n==='...') html += '<span style="color:var(--text2);padding:0 4px">…</span>';
    else if (n===cp) html += `<button class="active" disabled>${n}</button>`;
    else html += `<button ${attr}="${n}">${n}</button>`;
  });
  html += `<button ${attr}="${cp+1}" ${cp>=total?'disabled':''}>›</button>`;
  html += '</div>';
  return html;
}

function discoverPaginationHTML(page, totalPages) {
  return buildPaginationHTML(page, totalPages, 'data-pg', 'discover-pages');
}

function renderDiscoverCard(m, ratedTmdbIds, showBlockBtn) {
  // TMDB uses 'id', our DB uses 'tmdb_id' — both map to the same key format
  const tmdbId = m.id || m.tmdb_id;
  const mediaType = normalizeMediaType(m.media_type || m.type || 'movie');
  const key = tmdbId ? 'tmdb_'+tmdbId : '';
  const isRated = key && ratedTmdbIds.has(key);
  const listItemKey = tmdbId ? listKey(mediaType, tmdbId) : '';
  const isWatchlisted = listItemKey && watchlistIds.has(listItemKey);
  const isNextQueued = listItemKey && activeCouple && coupleQueue.some(q => listKey(q) === listItemKey);
  const poster = m.poster_path ? posterUrl(m.poster_path) : '';
  const year = (m.release_date||'').slice(0,4);
  const genres = (m.genre_ids||[]).slice(0,3).map(id=>genreMap[id]||'').filter(Boolean);
  const reasons = Array.isArray(m.reasons) ? m.reasons.slice(0, 2) : [];

  return `
    <div class="discover-card" data-tmdb-id="${tmdbId||''}" data-media-type="${mediaType}">
      <div class="dc-poster-wrap">
        ${poster ? `<img src="${poster}" alt="${esc(m.title)}" loading="lazy">` : '<div class="dc-no-poster">🎬</div>'}
        ${m.vote_average ? `<span class="dc-tmdb-score">⭐ ${m.vote_average.toFixed(1)}</span>` : ''}
      </div>
      <div class="dc-info">
        <div class="dc-title">${esc(m.title)}</div>
        <div class="dc-meta">${year||'未知'}${m.original_language ? ' · ' + m.original_language.toUpperCase() : ''}</div>
        ${genres.length ? `<div class="dc-genres">${genres.map(g=>`<span class="dc-genre">${g}</span>`).join('')}</div>` : ''}
        ${reasons.length ? `<div class="dc-reasons">${reasons.map(r=>`<span class="dc-reason">${esc(r)}</span>`).join('')}</div>` : ''}
        <div class="dc-action">
          ${isRated
            ? '<div class="dc-rated-badge">已评价 ✓</div>'
            : showBlockBtn
              ? `<div class="dc-action-row">
                   <button class="btn btn-sm btn-secondary dc-rate-btn" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}">＋我的评分</button>
                   <button class="btn btn-xs dc-watch-btn ${isWatchlisted?'active':''}" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}" title="${isWatchlisted?'移出想看':'加入想看'}">${isWatchlisted?'★':'☆'}</button>
                   ${activeCouple ? `<button class="btn btn-xs dc-next-btn ${isNextQueued?'active':''}" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}" title="${isNextQueued?'已在下次看':'加入下次看'}">▶</button>` : ''}
                   <button class="btn btn-xs dc-block-btn" data-tmdb-id="${tmdbId}" title="不再推荐">🚫</button>
                 </div>`
              : `<div class="dc-action-row">
                   <button class="btn btn-sm btn-secondary dc-rate-btn" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}">＋我的评分</button>
                   <button class="btn btn-xs dc-watch-btn ${isWatchlisted?'active':''}" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}" title="${isWatchlisted?'移出想看':'加入想看'}">${isWatchlisted?'★':'☆'}</button>
                   ${activeCouple ? `<button class="btn btn-xs dc-next-btn ${isNextQueued?'active':''}" data-tmdb-id="${tmdbId}" data-media-type="${mediaType}" title="${isNextQueued?'已在下次看':'加入下次看'}">▶</button>` : ''}
                 </div>`
          }
        </div>
      </div>
    </div>
  `;
}

// Genre map (TMDB genre IDs → Chinese)
const genreMap = {
  28:'动作',12:'冒险',16:'动画',35:'喜剧',80:'犯罪',99:'纪录',18:'剧情',10751:'家庭',
  14:'奇幻',36:'历史',27:'恐怖',10402:'音乐',9648:'悬疑',10749:'爱情',878:'科幻',
  10770:'电视电影',53:'惊悚',10752:'战争',37:'西部'
};

async function loadRecommendations() {
  if (discoverCache.recommend) return discoverCache.recommend;

  const myMovies = allEntries.filter(e=>e.user_id===currentUser.id && e.tmdb_id && e.type==='movie');
  const totalRated = allEntries.filter(e=>e.user_id===currentUser.id && e.type==='movie').length;
  const minRated = 25;

  if (totalRated < minRated) {
    discoverCache.recommend = null;
    return null;
  }

  // Worker path: offload TMDB fetching to Cloudflare edge
  if (TMDB_PROXY) {
    try {
      const res = await fetch(TMDB_PROXY + '/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: buildRecommendationEntries(),
          userId: currentUser.id,
          blockedIds: [...blockedMovieIds],
          blockedMovies: buildBlockedFeedback(),
          excludeIds: discoverLastShownIds
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `推荐接口异常 (${res.status})`);
      if (data.movies) {
        discoverCache.recommend = data.movies;
        return discoverCache.recommend;
      }
      throw new Error(data.error || '推荐接口未返回结果');
    } catch(e) {
      console.warn('Recommend fetch failed:', e.message);
      throw e;
    }
  }

  // Recommendation engine now runs exclusively in the Worker
  discoverCache.recommend = [];
  return [];
}

async function loadTrending() {
  if (discoverCache.week) return discoverCache.week;
  try {
    const res = await fetch(TMDB_PROXY + '/trending');
    const data = await res.json();
    discoverCache.week = data.results || [];
  } catch(e) { discoverCache.week = []; }
  return discoverCache.week;
}

async function loadTopRated() {
  if (discoverCache.toprated) return discoverCache.toprated;
  try {
    const res = await fetch(TMDB_PROXY + '/toprated');
    const data = await res.json();
    discoverCache.toprated = data.results || [];
  } catch(e) { discoverCache.toprated = []; }
  return discoverCache.toprated;
}

// ===== QUICK RATE =====
function resetQuickRateSeasons(mediaType, seasons = []) {
  if ($['qrSeasonList']) $['qrSeasonList'].innerHTML = '';
  const isSeries = normalizeMediaType(mediaType) === 'series';
  $['qrSeasonSection'].classList.toggle('hidden', !isSeries);
  if (isSeries) {
    seasons.forEach(s => addSeasonRow(s, 'qr'));
  }
}

function openQuickRate(movie) {
  const normalized = normalizeListMovie(movie) || (movie?.title ? {
    id: null,
    tmdb_id: null,
    media_type: normalizeMediaType(movie.media_type || movie.type || 'movie'),
    title: movie.title,
    year: movie.year || parseInt(String(movie.release_date || movie.first_air_date || '').slice(0, 4)) || null,
    release_date: movie.release_date || movie.first_air_date || '',
    poster_path: movie.poster_path || '',
    director: movie.director || ''
  } : null);
  if (!normalized) return;
  quickRateMovie = normalized;
  quickEditEntryId = null;
  $['qrTitle'].textContent = '评价 ' + normalized.title;
  $['qrDims'].innerHTML = buildDimSliders('qr', {});
  $['qrTotalScore'].textContent = '5.0';
  $['qrComment'].value = '';
  $['qrSubmit'].textContent = '保存评价';
  resetQuickRateSeasons(normalized.media_type);
  bindDimSliders('qr');
  updateQrTotal();
  $['quickRateModal'].classList.add('open');
}

function openQuickEdit(id) {
  const entry = allEntries.find(e=>e.id===id);
  if (!entry) return;
  quickEditEntryId = id;
  quickRateMovie = {
    id: entry.tmdb_id || null,
    tmdb_id: entry.tmdb_id || null,
    media_type: normalizeMediaType(entry.type),
    title: entry.title,
    year: entry.year || null,
    poster_path: entry.poster_path || '',
    director: entry.director || ''
  };
  $['qrTitle'].textContent = '编辑 ' + entry.title;
  $['qrDims'].innerHTML = buildDimSliders('qr', entry.ratings||{});
  $['qrTotalScore'].textContent = getEntryScore(entry).toFixed(1);
  $['qrComment'].value = entry.comment||'';
  $['qrSubmit'].textContent = '更新评价';
  const seasons = entry.type === 'series'
    ? allSeasonRatings
      .filter(s => s.entry_id === id && s.user_id === currentUser.id)
      .map(s => ({
        _idx: s.id,
        _id: s.id,
        season_number: s.season_number,
        season_title: s.season_title,
        ratings: s.ratings,
        comment: s.comment
      }))
    : [];
  resetQuickRateSeasons(entry.type, seasons);
  bindDimSliders('qr');
  updateQrTotal();
  $['quickRateModal'].classList.add('open');
}

function updateQrTotal() {
  const ratings = {};
  document.querySelectorAll('input[type="range"][data-prefix="qr"]').forEach(s=>{
    ratings[s.dataset.dim] = parseInt(s.value);
  });
  $['qrTotalScore'].textContent = calcTotal(ratings).toFixed(1);
}

// Hook QR slider changes to update total
document.addEventListener('input', e=>{
  if (e.target.matches('input[type="range"][data-prefix="qr"]')) updateQrTotal();
});

$['qrCancel'].addEventListener('click', ()=>{
  $['quickRateModal'].classList.remove('open');
  quickRateMovie = null;
  quickEditEntryId = null;
});

$['quickRateModal'].addEventListener('click', e=>{
  if (e.target===e.currentTarget) {
    $['quickRateModal'].classList.remove('open');
    quickRateMovie = null;
    quickEditEntryId = null;
  }
});

$['qrSubmit'].addEventListener('click', async ()=>{
  if (!quickRateMovie) return;
  const ratings = {};
  document.querySelectorAll('input[type="range"][data-prefix="qr"]').forEach(s=>{
    ratings[s.dataset.dim] = parseInt(s.value);
  });
  const comment = $['qrComment'].value.trim();
  const total = calcTotal(ratings);
  const isEdit = !!quickEditEntryId;
  const savedTmdbId = quickRateMovie.tmdb_id || null;
  const mediaType = normalizeMediaType(quickRateMovie.media_type || quickRateMovie.type || 'movie');
  const seasons = mediaType === 'series' ? collectSeasonData($['qrSeasonList']).filter(s=>s.season_number>0) : [];
  if (mediaType === 'series') {
    const snums = seasons.map(s=>s.season_number);
    const dup = snums.find((n,i)=>snums.indexOf(n)!==i);
    if (dup) { toast(`季号 S${dup} 重复，请修改后再保存`); return; }
  }

  const btn = $['qrSubmit'];
  const origText = btn.textContent;
  btn.textContent = '保存中...'; btn.disabled = true;

  let error;
  let entryId = quickEditEntryId;
  if (isEdit) {
    const {error: updateErr} = await db.from('entries').update({
      ratings,
      total_score: total,
      comment,
      updated_at: new Date().toISOString()
    }).eq('id', quickEditEntryId);
    error = updateErr;
    if (!error && mediaType === 'series') {
      const {error: delErr} = await db.from('season_ratings').delete().eq('entry_id', quickEditEntryId).eq('user_id', currentUser.id);
      error = delErr;
    }
  } else {
    const entryData = {
      user_id: currentUser.id,
      type: mediaType,
      tmdb_id: savedTmdbId,
      title: quickRateMovie.title,
      year: quickRateMovie.year || null,
      director: quickRateMovie.director || '',
      poster_path: quickRateMovie.poster_path || '',
      ratings,
      total_score: total,
      comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const cachedDetail = mediaType === 'movie' && savedTmdbId ? movieCache.get(savedTmdbId) : null;
    if (cachedDetail) applyMovieDetailToEntry(entryData, cachedDetail);
    const {data: inserted, error: insertErr} = await db.from('entries').insert(entryData).select('id').single();
    error = insertErr;
    if (inserted?.id) entryId = inserted.id;
  }

  if (!error && mediaType === 'series' && entryId) {
    for (const s of seasons) {
      const {error: seasonErr} = await db.from('season_ratings').insert({
        entry_id: entryId,
        user_id: currentUser.id,
        season_number: s.season_number,
        season_title: s.season_title,
        ratings: s.ratings,
        total_score: s.total_score,
        comment: s.comment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (seasonErr) {
        error = seasonErr;
        break;
      }
    }
  }

  if (error) {
    toast('保存失败: ' + error.message);
    btn.textContent = origText; btn.disabled = false;
    return;
  }

  toast(isEdit ? '评价已更新！' : '评价已保存！');
  const savedListKey = savedTmdbId ? listKey(mediaType, savedTmdbId) : '';
  if (!isEdit && savedTmdbId && watchlistIds.has(savedListKey)) {
    db.from('watchlist_movies')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('media_type', mediaType)
      .eq('tmdb_id', savedTmdbId)
      .then(({error}) => {
        if (!error) {
          watchlistIds.delete(savedListKey);
          delete watchlistMovies[savedListKey];
        }
      });
  }
  if (!isEdit && savedTmdbId && activeCouple && coupleQueue.some(q => listKey(q) === savedListKey)) {
    db.from('couple_watch_queue')
      .delete()
      .eq('couple_id', activeCouple.id)
      .eq('media_type', mediaType)
      .eq('tmdb_id', savedTmdbId)
      .then(({error}) => {
        if (!error) {
          coupleQueue = coupleQueue.filter(q => listKey(q) !== savedListKey);
          normalizeCoupleQueuePositions(false);
        }
      });
  }
  // Fire-and-forget: backfill normalized movie detail for new entries (non-blocking)
  if (mediaType === 'movie' && savedTmdbId) {
    fetchMovieDetail(savedTmdbId).then(detail => {
      if (!detail) return;
      const e = allEntries.find(x => x.tmdb_id === savedTmdbId && x.user_id === currentUser.id);
      if (e) {
        backfillMovieDetailToDB(e, detail);
      } else if (!isEdit) {
        const updates = {};
        if (detail.overview) updates.overview = detail.overview;
        if (detail.director) updates.director = detail.director;
        if (detail.poster_path) updates.poster_path = detail.poster_path;
        if (detail.year) updates.year = detail.year;
        if (Object.keys(updates).length) {
          db.from('entries').update(updates).eq('tmdb_id', savedTmdbId).eq('user_id', currentUser.id).then(()=>{}).catch(()=>{});
        }
      }
    });
  }
  $['quickRateModal'].classList.remove('open');
  quickRateMovie = null;
  quickEditEntryId = null;
  btn.textContent = origText; btn.disabled = false;
  const wasOnDiscover = getActiveTab()==='discover';
  const wasOnSearch = getActiveTab()==='rate';
  skipListRender = true;
  await loadAllData();
  skipListRender = false;
  if (wasOnSearch && !isEdit && entryId) {
    locateAndGoToList(entryId);
    switchTab('list');
  } else if (wasOnDiscover) {
    discoverCache = { recommend: null, week: null, toprated: null };
    renderActiveTab();
  } else {
    renderActiveTab();
  }
});

// ===== TABS =====
function switchTab(name) {
  document.querySelectorAll('nav button').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  const tabBtn = document.querySelector(`nav button[data-tab="${name}"]`);
  if (tabBtn) { tabBtn.classList.add('active'); tabBtn.setAttribute('aria-selected','true'); }
  document.getElementById(`panel-${name}`)?.classList.add('active');
  if (name==='list') { if (!highlightEntryId) listPageNum = 1; renderList(); scrollToHighlight(); }
  if (name==='couple') { renderCouple(); }
  if (name==='stats') { renderStats(); }
  if (name==='discover') { renderDiscover(); }
}

function scrollToHighlight() {
  if (!highlightEntryId) return;
  setTimeout(() => {
    const el = document.getElementById('entry-' + highlightEntryId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 3px var(--gold)';
      setTimeout(() => { el.style.boxShadow = ''; }, 2000);
    }
    highlightEntryId = null;
  }, 100);
}

// Find which page an entry will appear on given current list filters, then navigate there
function locateAndGoToList(entryId) {
  const entry = allEntries.find(e=>e.id===entryId);
  if (!entry) return;

  // Switch listType only if needed
  const entryListType = entry.type==='series' ? 'series' : 'movie';
  if (listType !== entryListType) {
    listType = entryListType;
    document.querySelectorAll('#listSubtabs button').forEach(b=>b.classList.remove('active'));
    const tabBtn = document.querySelector(`#listSubtabs button[data-ltype="${listType}"]`);
    if (tabBtn) tabBtn.classList.add('active');
  }

  // Switch ownerFilter only if needed
  if (ownerFilter === 'me' && entry.user_id !== currentUser.id) {
    ownerFilter = 'all';
    $['ownerFilter'].value = 'all';
  }

  // Only clear scoreFilter if entry's score doesn't match
  const scoreF = $['scoreFilter'].value;
  if (scoreF !== 'all' && Math.round(getEntryScore(entry)) !== parseInt(scoreF)) {
    $['scoreFilter'].value = 'all';
  }

  // Only clear search if entry doesn't match
  const search = ($['searchInput'].value||'').trim().toLowerCase();
  if (search && !(entry.title||'').toLowerCase().includes(search) && !(entry.director||'').toLowerCase().includes(search)) {
    $['searchInput'].value = '';
  }

  // Use shared function — guarantees identical filtering/sorting to renderList
  const groups = getFilteredSortedGroups();
  const groupIndex = groups.findIndex(g=>g.some(e=>e.id===entryId));
  listPageNum = groupIndex >= 0 ? Math.ceil((groupIndex+1)/listPageSize) : 1;
  highlightEntryId = entryId;
}
document.querySelectorAll('nav button').forEach(btn=>{ btn.addEventListener('click', ()=>switchTab(btn.dataset.tab)); });

// ===== EXPORT / IMPORT =====
$['exportBtn'].addEventListener('click', async ()=>{
  const data = {
    entries: allEntries.filter(e=>e.user_id===currentUser.id),
    season_ratings: allSeasonRatings.filter(s=>s.user_id===currentUser.id),
    exported_at: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=`filmnote-${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url);
});

$['importBtn'].addEventListener('click', ()=>{
  $['importFile'].click();
});

$['importFile'].addEventListener('change', async e=>{
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev=>{
    try {
      const data = JSON.parse(ev.target.result);
      const entries = data.entries || data; // support both formats
      if (!Array.isArray(entries)) throw new Error('格式错误');
      if (!confirm(`将导入 ${entries.length} 条记录，确认？`)) return;

      let count=0;
      for (const m of entries) {
        const {error} = await db.from('entries').insert({
          user_id: currentUser.id,
          type: m.type||'movie',
          tmdb_id: m.tmdb_id||null,
          title: m.title,
          year: m.year||null,
          director: m.director||'',
          poster_path: m.poster_path||'',
          ratings: m.ratings||{},
          total_score: m.total_score||calcTotal(m.ratings||{}),
          comment: m.comment||'',
          created_at: m.created_at||new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        if (!error) count++;
      }
      toast(`已导入 ${count} 条记录`);
      await loadAllData();
    } catch(err) {
      toast('导入失败：文件格式不正确');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ===== PAGE LOAD INIT =====
// Auth state listener (password recovery, login/logout)
db.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    $['newPwForm'].classList.remove('hidden');
    $['authPassword'].classList.add('hidden');
    $['loginBtn'].classList.add('hidden');
    $['forgotPwLink'].classList.add('hidden');
    $['resetPwForm'].classList.add('hidden');
    $['authLoginView'].querySelector('.subtitle').textContent = '设置新密码';
  }
});

// ===== PAGE LOAD INIT =====
(async ()=>{
  try {
    const {data:{session}, error} = await db.auth.getSession();
    if (error) throw error;
    if (session?.user) {
      await initApp(session.user);
    }
  } catch(e) {
    console.error('Session restore failed:', e);
    toast('登录状态恢复失败：' + (e.message || e));
  }
})();
