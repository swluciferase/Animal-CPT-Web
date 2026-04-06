/**
 * ACPT – app_standalone.js
 * Works without ES modules / a server.
 * Expects window.wasm_bindgen already initialised before this script runs.
 */

window.onerror = function(msg, src, line, col, err) {
  var o = document.getElementById('err-overlay');
  if (!o) {
    o = document.createElement('div');
    o.id = 'err-overlay';
    o.style.cssText = 'position:fixed;inset:0;background:#c0392b;color:white;' +
      'z-index:9999;padding:32px;font-family:monospace;font-size:14px;overflow-y:auto;';
    document.body.appendChild(o);
  }
  var detail = (err && err.stack) ? err.stack : ('at ' + src + ':' + line);
  o.innerHTML = '<h2 style="margin:0 0 12px">Error</h2>' +
    '<b>Uncaught: ' + msg + '</b><br><br>' +
    '<pre style="white-space:pre-wrap">' + detail + '</pre>';
  return true;
};
window.onunhandledrejection = function(e) {
  var o = document.getElementById('err-overlay');
  if (!o) {
    o = document.createElement('div');
    o.id = 'err-overlay';
    o.style.cssText = 'position:fixed;inset:0;background:#c0392b;color:white;' +
      'z-index:9999;padding:32px;font-family:monospace;font-size:14px;overflow-y:auto;';
    document.body.appendChild(o);
  }
  var detail = e.reason && e.reason.stack ? e.reason.stack : String(e.reason);
  o.innerHTML = '<h2 style="margin:0 0 12px">Error</h2>' +
    '<b>Unhandled Promise</b><br><br>' +
    '<pre style="white-space:pre-wrap">' + detail + '</pre>';
};

// Adult version (16 animals, codes 0-15)
// 0=大象 1=小孩 2=烏鴉 3=牛 4=狗 5=狼 6=猴子 7=獅子 8=羊 9=蛇 10=豬 11=貓(*) 12=雞 13=青蛙 14=鴨子 15=麻雀
const ADULT_EMOJI = ['🐘','👧','🐦','🐮','🐶','🐺','🐒','🦁','🐑','🐍','🐷','🐱','🐔','🐸','🦆','🐦'];
const ADULT_ZH    = ['大象','小孩','烏鴉','牛','狗','狼','猴子','獅子','羊','蛇','豬','貓','雞','青蛙','鴨子','麻雀'];
const ADULT_EN    = ['Elephant','Child','Crow','Cow','Dog','Wolf','Monkey','Lion','Sheep','Snake','Pig','Cat','Chicken','Frog','Duck','Sparrow'];
const ADULT_NON_TARGET = 11; // 貓

// Child version (11 animals, codes 0-10)
// 0=bird 1=cat(*) 2=chicken 3=cow 4=dog 5=duck 6=elephant 7=monkey 8=pig 9=sheep 10=tiger
const CHILD_EMOJI = ['🐦','🐱','🐔','🐮','🐶','🦆','🐘','🐒','🐷','🐑','🐯'];
const CHILD_ZH    = ['鳥','貓','雞','牛','狗','鴨子','大象','猴子','豬','羊','老虎'];
const CHILD_EN    = ['Bird','Cat','Chicken','Cow','Dog','Duck','Elephant','Monkey','Pig','Sheep','Tiger'];
const CHILD_NON_TARGET = 1; // cat

// Helpers — set after task is created
let ANIMAL_EMOJI = ADULT_EMOJI;
let ANIMAL_ZH    = ADULT_ZH;
let ANIMAL_EN    = ADULT_EN;
let NON_TARGET   = ADULT_NON_TARGET;
const RESPONSE_WINDOW_MS = 1000;
const FLASH_MS = 150;

// ─────────────────────────────────────────────
// i18n — Language system
// ─────────────────────────────────────────────
let curLang = 'zh';

const LANG = {
  zh: {
    logoTitle: 'VeloMynd',
    logoSubtitle: 'Continuous Performance Test Web',
    langBtn: 'EN',
    labelName: '姓名', labelPid: '受試者編號', labelAge: '年齡（歲）',
    labelGender: '性別', labelNote: '備註（可留空）',
    phName: '請輸入姓名', phPid: '例：P001', phAge: '例：8', phNote: '例：施測地點、特殊情況等',
    optMale: '男', optFemale: '女', optOther: '其他',
    btnSubmit: '進入測驗 →',
    btnLoadCSV: '📂 讀取 CSV 產生報告',
    csvModalTitle: '讀取 CSV 報告',
    csvModalDesc: '請補充以下資訊以產生分析報告',
    csvModalAge: '年齡（歲）*', csvModalPid: '受試者編號（可選）',
    csvModalOk: '產生報告', csvModalCancel: '取消',
    csvModalAgeErr: '請輸入有效年齡（4–99）',
    csvModalParseErr: '解析失敗：', csvModalTooFew: '試次數量不足（最少需 60 筆）',
    csvVerChild: '兒童版（4–7歲）', csvVerAdult: '成人版（8歲+）',
    csvFieldName: '姓名', csvFieldVersion: '施測版本', csvFieldDate: '測驗日期',
    instrTitle: '測驗說明',
    demoLabelNt: '🎯 看到這隻動物時 <strong>不要</strong> 按鍵：',
    demoNameNt: '貓 (Cat) — 非目標',
    demoLabelT: '✅ 看到其他動物時 <strong>按空白鍵</strong>：',
    btnPractice: '🐾 開始練習（1 分鐘）',
    btnStartTask: '我準備好了，開始測驗 →',
    countdownLabel: '測驗即將開始',
    stageLabel: '動物展示區',
    hudRemaining: '剩餘試次', hudPhase: '階段',
    taskHintSpace: '按 <kbd>空白鍵</kbd> 回應目標動物',
    taskHintTouch: '點擊螢幕回應目標動物',
    taskHintSpacePrac: '按 <kbd>空白鍵</kbd> 回應目標動物（練習）',
    taskHintTouchPrac: '點擊螢幕回應目標動物（練習）',
    phaseWarmup: '暖身', phaseMain: '主要', phaseCooldown: '緩和', phasePractice: '練習',
    pauseTitle: '測驗已暫停',
    btnResume: '▶ 繼續測驗', btnAbort: '✕ 中斷，回主畫面', pauseHint: '按 P 繼續',
    practiceComplete: '練習完成！',
    resultsTitle: '測驗完成 🎉',
    resultsBlocksTitle: '各時段表現',
    rcMeanRT: '平均反應時間', rcSDRT: '反應時間標準差', rcMedianRT: '中位數 RT',
    rcOmission: '遺漏錯誤率', rcCommission: '誤按錯誤率', rcPersev: '持續反應率',
    rcHits: '正確按鍵 (Hit)', rcMisses: '遺漏 (Miss)', rcFA: '誤按 (FA)',
    thBlock: '時段', thTrials: '試次', thHit: 'Hit', thMiss: 'Miss', thFA: 'FA',
    thMeanRT: '平均 RT (ms)', thOmPct: '遺漏 %', thCoPct: '誤按 %',
    btnExport: '📥 下載 Excel 報告', btnExportCSV: '📄 下載 CSV 原始資料',
    btnReport: '📊 分析報告', btnNew: '重新測驗',
    timingNote: '⏱ 刺激呈現時間在 requestAnimationFrame 回調中記錄，與實際顯示時間差約 0–16.7 ms（一幀）。按鍵時間在 keydown 事件中記錄，鍵盤硬體延遲約 1–15 ms。詳情見 Excel 計時說明工作表。',
    pwTitle: '🔒 下載 Excel 報告', pwDesc: '請輸入密碼以下載完整報告',
    pwPh: '輸入密碼', pwOk: '確認下載', pwCancel: '取消', pwErr: '密碼錯誤，請重試',
    instrChildText: function(n) { return '<p>這個測驗很簡單，你會在螢幕上看到各種 <strong>動物</strong> 出現。</p>' +
      '<p>每次看到動物時，除了看到 <strong>貓咪</strong> 之外，<br>' +
      '   都要 <strong>盡快按一下空白鍵</strong>。</p>' +
      '<p>看到貓咪的時候 <strong>不要按</strong>！</p>' +
      '<p>記得：動物消失之後也可以按，只要在下一隻動物出現之前都算有效。</p>' +
      '<p>共有 <strong>' + n + ' 個試次</strong>，請保持專注！</p>'; },
    instrAdultText: function(n) { return '<p>本測驗為持續注意力評估作業。</p>' +
      '<p>螢幕上將依序出現 <strong>動物圖案</strong>，請您在看到動物時' +
      '   （除了 <strong>貓</strong> 之外）<strong>立即按下空白鍵</strong>。</p>' +
      '<p>看到「貓」時請 <strong>不要按鍵</strong>。</p>' +
      '<p>請在動物消失前盡快反應；動物消失後仍有短暫時間可以按鍵。</p>' +
      '<p>全程共 <strong>' + n + ' 個試次</strong>，分暖身、主要及緩和三個階段。</p>'; },
  },
  en: {
    logoTitle: 'VeloMynd',
    logoSubtitle: 'Continuous Performance Test Web',
    langBtn: '中文',
    labelName: 'Name', labelPid: 'Participant ID', labelAge: 'Age (years)',
    labelGender: 'Gender', labelNote: 'Notes (optional)',
    phName: 'Enter name', phPid: 'e.g. P001', phAge: 'e.g. 8', phNote: 'e.g. location, notes',
    optMale: 'Male', optFemale: 'Female', optOther: 'Other',
    btnSubmit: 'Start Test →',
    btnLoadCSV: '📂 Load CSV Report',
    csvModalTitle: 'Load CSV Report',
    csvModalDesc: 'Please fill in the details below to generate the report',
    csvModalAge: 'Age (years) *', csvModalPid: 'Participant ID (optional)',
    csvModalOk: 'Generate Report', csvModalCancel: 'Cancel',
    csvModalAgeErr: 'Please enter a valid age (4–99)',
    csvModalParseErr: 'Parse error: ', csvModalTooFew: 'Not enough trials (min. 60 required)',
    csvVerChild: 'Child (4–7 yrs)', csvVerAdult: 'Adult (8+ yrs)',
    csvFieldName: 'Name', csvFieldVersion: 'Version', csvFieldDate: 'Date',
    instrTitle: 'Instructions',
    demoLabelNt: '🎯 Do <strong>NOT</strong> press when you see this animal:',
    demoNameNt: 'Cat — Non-Target',
    demoLabelT: '✅ Press <strong>SPACEBAR</strong> for all other animals:',
    btnPractice: '🐾 Start Practice (1 minute)',
    btnStartTask: "I'm ready — Start Test →",
    countdownLabel: 'Test is about to begin',
    stageLabel: 'Animal Display',
    hudRemaining: 'Remaining', hudPhase: 'Phase',
    taskHintSpace: 'Press <kbd>SPACEBAR</kbd> to respond to target animals',
    taskHintTouch: 'Tap the screen to respond to target animals',
    taskHintSpacePrac: 'Press <kbd>SPACEBAR</kbd> to respond to target animals (Practice)',
    taskHintTouchPrac: 'Tap the screen to respond to target animals (Practice)',
    phaseWarmup: 'Warm-up', phaseMain: 'Main', phaseCooldown: 'Cool-down', phasePractice: 'Practice',
    pauseTitle: 'Test Paused',
    btnResume: '▶ Resume', btnAbort: '✕ Quit & Return', pauseHint: 'Press P to resume',
    practiceComplete: 'Practice complete!',
    resultsTitle: 'Test Complete 🎉',
    resultsBlocksTitle: 'Performance by Block',
    rcMeanRT: 'Mean RT', rcSDRT: 'RT Std Dev', rcMedianRT: 'Median RT',
    rcOmission: 'Omission Rate', rcCommission: 'Commission Rate', rcPersev: 'Perseveration Rate',
    rcHits: 'Hits', rcMisses: 'Misses', rcFA: 'False Alarms',
    thBlock: 'Block', thTrials: 'Trials', thHit: 'Hit', thMiss: 'Miss', thFA: 'FA',
    thMeanRT: 'Mean RT (ms)', thOmPct: 'Omission %', thCoPct: 'Commission %',
    btnExport: '📥 Download Excel Report', btnExportCSV: '📄 Download CSV Data',
    btnReport: '📊 Analysis Report', btnNew: 'Restart Test',
    timingNote: '⏱ Stimulus onset recorded via requestAnimationFrame callback; display latency ~0–16.7 ms (one frame). Keypress time recorded at keydown event; keyboard hardware latency ~1–15 ms. See Excel timing notes sheet for details.',
    pwTitle: '🔒 Download Excel Report', pwDesc: 'Please enter the password to download',
    pwPh: 'Enter password', pwOk: 'Download', pwCancel: 'Cancel', pwErr: 'Incorrect password, please try again',
    instrChildText: function(n) { return '<p>This is a simple test! You will see various <strong>animals</strong> appear on the screen.</p>' +
      '<p>Press the <strong>spacebar</strong> as quickly as possible each time you see an animal, <em>except</em> for the <strong>Cat</strong>.</p>' +
      '<p>When you see the Cat, do <strong>NOT</strong> press!</p>' +
      '<p>You can still press after the animal disappears, as long as it is before the next animal appears.</p>' +
      '<p>There are <strong>' + n + ' trials</strong> in total. Stay focused!</p>'; },
    instrAdultText: function(n) { return '<p>This is a sustained attention test.</p>' +
      '<p>A series of <strong>animal images</strong> will appear on screen. Press the <strong>spacebar</strong> each time you see an animal, <em>except</em> for the <strong>Cat</strong>.</p>' +
      '<p>Do <strong>NOT</strong> press when you see the Cat.</p>' +
      '<p>Please respond as quickly as possible; a brief response window remains after the animal disappears.</p>' +
      '<p>There are <strong>' + n + ' trials</strong> total, divided into warm-up, main, and cool-down phases.</p>'; },
  },
};

function t(key) { return LANG[curLang][key]; }

function toggleLang() {
  curLang = curLang === 'zh' ? 'en' : 'zh';
  pauseOverlay = null;  // force rebuild with new language if shown
  applyLang();
}

function applyLang() {
  var L = LANG[curLang];
  var el;
  function set(id, prop, val) { el = document.getElementById(id); if (el) el[prop] = val; }
  function setHTML(id, val) { el = document.getElementById(id); if (el) el.innerHTML = val; }
  // Registration
  set('logo-title', 'textContent', L.logoTitle);
  set('logo-subtitle', 'textContent', L.logoSubtitle);
  set('btn-lang', 'textContent', L.langBtn);
  set('label-name', 'textContent', L.labelName);
  set('label-pid', 'textContent', L.labelPid);
  set('label-age', 'textContent', L.labelAge);
  set('label-gender', 'textContent', L.labelGender);
  set('label-note', 'textContent', L.labelNote);
  set('inp-name', 'placeholder', L.phName);
  set('inp-id', 'placeholder', L.phPid);
  set('inp-age', 'placeholder', L.phAge);
  set('inp-note', 'placeholder', L.phNote);
  set('opt-male', 'textContent', L.optMale);
  set('opt-female', 'textContent', L.optFemale);
  set('opt-other', 'textContent', L.optOther);
  set('btn-submit', 'textContent', L.btnSubmit);
  set('btn-load-csv', 'textContent', L.btnLoadCSV);
  // Instructions
  set('instr-title', 'textContent', L.instrTitle);
  setHTML('demo-label-nt', L.demoLabelNt);
  set('demo-name-nt', 'textContent', L.demoNameNt);
  setHTML('demo-label-t', L.demoLabelT);
  set('btn-practice', 'textContent', L.btnPractice);
  set('btn-start-task', 'textContent', L.btnStartTask);
  // Countdown
  set('countdown-label', 'textContent', L.countdownLabel);
  // Task
  set('stage-label', 'textContent', L.stageLabel);
  set('hud-label-remaining', 'textContent', L.hudRemaining);
  set('hud-label-phase', 'textContent', L.hudPhase);
  // Results
  set('results-title', 'textContent', L.resultsTitle);
  set('results-blocks-title', 'textContent', L.resultsBlocksTitle);
  set('btn-export', 'textContent', L.btnExport);
  set('btn-export-csv', 'textContent', L.btnExportCSV);
  set('btn-report', 'textContent', L.btnReport);
  set('btn-new', 'textContent', L.btnNew);
}

let task        = null;
let trials      = [];
let totalTrials = 0;
let currentIdx  = 0;
let taskStartMs = 0;

let awaitingResponse  = false;
let currentTrialIdx   = -1;
let responseGiven     = false;
let responseTimer     = null;

let userData = {};

// ─── Session token support (artisebio-web integration) ──────────────────────
const ARTISEBIO_API = 'https://www.sigmacog.xyz/api';
let _sessionId = null;
let _sessionToken = null;

(function initSessionFromURL() {
  const params = new URLSearchParams(location.search);
  const token = params.get('session_token');
  if (!token) return;
  _sessionToken = token;
  fetch(`${ARTISEBIO_API}/sessions/token/${encodeURIComponent(token)}`)
    .then(r => {
      if (!r.ok) throw r.status;
      return r.json();
    })
    .then(data => {
      _sessionId = data.session_id;
      if (data.client_name) {
        const nameEl = document.getElementById('inp-name');
        if (nameEl && !nameEl.value) nameEl.value = data.client_name;
      }
      if (data.subject_id) {
        const pidEl = document.getElementById('inp-id');
        if (pidEl && !pidEl.value) pidEl.value = data.subject_id;
      }
      if (data.birth_date) {
        const ageEl = document.getElementById('inp-age');
        if (ageEl && !ageEl.value) {
          const age = Math.floor((Date.now() - new Date(data.birth_date).getTime()) / (1000*60*60*24*365.25));
          if (age > 0) ageEl.value = age;
        }
      }
      if (data.gender) {
        const gEl = document.getElementById('inp-gender');
        if (gEl) {
          const map = { M:'M', F:'F', O:'O' };
          if (map[data.gender]) gEl.value = map[data.gender];
        }
      }
      if (data.notes) {
        const noteEl = document.getElementById('inp-note');
        if (noteEl && !noteEl.value) noteEl.value = data.notes;
      }
    })
    .catch(() => {
      // Session expired, completed, or deleted — block form submission
      var submitBtn = document.getElementById('btn-submit');
      if (submitBtn) submitBtn.disabled = true;
      var notice = document.createElement('div');
      notice.style.cssText = 'margin-top:12px;padding:12px 16px;background:#7f1d1d;color:#fca5a5;border-radius:8px;font-size:0.9rem;text-align:center;';
      notice.textContent = '此測驗連結已失效或已完成，無法進行測驗。';
      if (submitBtn) submitBtn.parentNode.insertBefore(notice, submitBtn);
    });
})();

function _saveSessionResult(results) {
  if (!_sessionId || !_sessionToken) return;
  fetch(`${ARTISEBIO_API}/sessions/${_sessionId}/result`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_token: _sessionToken,
      results: {
        omission_rate:  results.omission_rate_pct,
        commission_rate: results.commission_rate_pct,
        mean_rt:        results.mean_rt_ms,
        d_prime:        results.d_prime,
        hits:           results.hits,
        misses:         results.misses,
        false_alarms:   results.false_alarms,
        correct_rejections: results.correct_rejections,
        total_trials:   results.total_trials,
        is_child:       results.is_child,
      },
    }),
  }).catch(() => {});
}
// ────────────────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

$('btn-lang').addEventListener('click', toggleLang);
$('btn-load-csv').addEventListener('click', function() { $('csv-file-input').click(); });
$('csv-file-input').addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var meta = peekCSVMeta(ev.target.result);
      showCSVMetaModal(meta, ev.target.result);
    } catch(err) {
      alert((curLang === 'zh' ? '無法解析 CSV 檔案：' : 'Cannot parse CSV: ') + err.message);
    }
    e.target.value = '';
  };
  reader.readAsText(file, 'utf-8');
});

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────
$('form-register').addEventListener('submit', e => {
  e.preventDefault();
  const name   = $('inp-name').value.trim();
  const pid    = $('inp-id').value.trim();
  const age    = parseInt($('inp-age').value, 10);
  const gender = $('inp-gender').value;
  const note   = $('inp-note').value.trim();
  if (!name || !pid || isNaN(age)) return;

  userData = { name, pid, age, gender, note };

  const dateStr = new Date().toISOString().split('T')[0];
  const CptTask = wasm_bindgen.CptTask;
  task = new CptTask(name, age, dateStr);

  totalTrials = task.get_trial_count();
  trials      = JSON.parse(task.get_all_trials_json());

  const isChild = task.is_child_version();
  if (isChild) {
    ANIMAL_EMOJI = CHILD_EMOJI; ANIMAL_ZH = CHILD_ZH;
    ANIMAL_EN = CHILD_EN; NON_TARGET = CHILD_NON_TARGET;
  } else {
    ANIMAL_EMOJI = ADULT_EMOJI; ANIMAL_ZH = ADULT_ZH;
    ANIMAL_EN = ADULT_EN; NON_TARGET = ADULT_NON_TARGET;
  }
  buildInstructions(isChild);
  showScreen('screen-instructions');
});

// ─────────────────────────────────────────────
// Instructions
// ─────────────────────────────────────────────
function buildInstructions(isChild) {
  const box = $('instructions-content');
  box.innerHTML = isChild ? t('instrChildText')(totalTrials) : t('instrAdultText')(totalTrials);

  const row = $('demo-targets');
  row.innerHTML = '';
  for (let i = 0; i < ANIMAL_EMOJI.length; i++) {
    if (i === NON_TARGET) continue;
    const div = document.createElement('div');
    div.className = 'demo-target-item';
    div.title = `${ANIMAL_ZH[i]} (${ANIMAL_EN[i]})`;
    div.textContent = ANIMAL_EMOJI[i];
    row.appendChild(div);
  }
}

$('btn-practice').addEventListener('click', () => {
  showScreen('screen-countdown');
  runCountdown(3, startPractice);
});

$('btn-start-task').addEventListener('click', () => {
  showScreen('screen-countdown');
  runCountdown(3, startTask);
});

// ─────────────────────────────────────────────
// Countdown
// ─────────────────────────────────────────────
function runCountdown(n, cb) {
  $('countdown-num').textContent = n;
  if (n <= 0) { cb(); return; }
  setTimeout(() => runCountdown(n - 1, cb), 900);
}

// ─────────────────────────────────────────────
// Practice mode (1 minute, all animals, no data recording)
// ─────────────────────────────────────────────
let practiceMode    = false;
let practiceTimeout = null;
let practiceHudTimer= null;
let practiceEndTime = 0;
let practiceQueue   = [];

function shuffled(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startPractice() {
  practiceMode = true;
  showScreen('screen-task');

  const isTouch = navigator.maxTouchPoints > 0;
  $('task-hint').innerHTML = isTouch ? t('taskHintTouchPrac') : t('taskHintSpacePrac');

  awaitingResponse = false;
  currentTrialIdx  = -1;
  responseGiven    = false;
  clearCanvas();

  practiceQueue   = shuffled(ANIMAL_EMOJI.length);
  practiceEndTime = performance.now() + 60000;

  updatePracticeHUD();
  practiceHudTimer = setInterval(updatePracticeHUD, 500);

  document.addEventListener('keydown',   onPracticeKey);
  document.addEventListener('keyup',     onKeyup);
  document.addEventListener('touchstart', onPracticeTouch, { passive: false });

  runPracticeTrial();
}

function updatePracticeHUD() {
  const secs = Math.max(0, Math.ceil((practiceEndTime - performance.now()) / 1000));
  $('hud-remaining').textContent = secs + 's';
  $('hud-phase').textContent = t('phasePractice');
}

function runPracticeTrial() {
  if (!practiceMode) return;
  if (performance.now() >= practiceEndTime) { endPractice(); return; }

  if (practiceQueue.length === 0) practiceQueue = shuffled(ANIMAL_EMOJI.length);
  const code = practiceQueue.shift();

  const isChild = task ? task.is_child_version() : true;
  const isi = isChild ? 1500 : 1000;

  clearCanvas();
  practiceTimeout = setTimeout(() => {
    if (!practiceMode) return;
    if (performance.now() >= practiceEndTime) { endPractice(); return; }
    drawAnimal(code);
    practiceTimeout = setTimeout(() => {
      if (!practiceMode) return;
      clearCanvas();
      runPracticeTrial();
    }, 500);
  }, isi);
}

function onPracticeKey(e) {
  if (e.code !== 'Space' || e.repeat) return;
  e.preventDefault();
  flashPracticeFrame();
}

function onPracticeTouch(e) {
  if (e.touches.length > 1) return;
  const tag = e.target.tagName;
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'A') return;
  e.preventDefault();
  flashPracticeFrame();
}

function flashPracticeFrame() {
  const frame = $('stage-frame');
  frame.classList.add('flash-green');
  setTimeout(() => frame.classList.remove('flash-green'), FLASH_MS);
}

function endPractice() {
  practiceMode = false;
  if (practiceTimeout)  { clearTimeout(practiceTimeout);   practiceTimeout  = null; }
  if (practiceHudTimer) { clearInterval(practiceHudTimer); practiceHudTimer = null; }
  document.removeEventListener('keydown',    onPracticeKey);
  document.removeEventListener('keyup',      onKeyup);
  document.removeEventListener('touchstart', onPracticeTouch);

  // Show "practice done" message for 2 s, then back to instructions
  const div = $('stimulus-display');
  div.style.background = '#C8E6C9';
  div.innerHTML = '<div class="stim-emoji">✅</div><div class="stim-label">' + t('practiceComplete') + '</div>';
  div.style.display = 'flex';

  setTimeout(() => {
    clearCanvas();
    $('hud-remaining').textContent = '—';
    $('hud-phase').textContent = '—';
    showScreen('screen-instructions');
  }, 2000);
}

// ─────────────────────────────────────────────
// Task
// ─────────────────────────────────────────────
// Per-animal background colours
const ANIMAL_BG = [
  '#FFCDD2','#BBDEFB','#C8E6C9','#FFF9C4','#E1BEE7',
  '#FFE0B2','#B2EBF2','#F8BBD9','#DCEDC8','#B2DFDB',
  '#FCE4EC','#F3E5F5','#E8EAF6','#E0F7FA','#FFF8E1','#F1F8E9',
];

function drawAnimal(code) {
  const div = $('stimulus-display');
  div.style.background = ANIMAL_BG[code] || '#E3F2FD';
  const label = curLang === 'zh' ? ANIMAL_ZH[code] : ANIMAL_EN[code];
  div.innerHTML =
    '<div class="stim-emoji">' + ANIMAL_EMOJI[code] + '</div>' +
    '<div class="stim-label">' + label + '</div>';
  div.style.display = 'flex';
}

function clearCanvas() {
  const div = $('stimulus-display');
  div.style.display = 'none';
  div.innerHTML = '<div class="stim-cross">＋</div>';
}

// ─────────────────────────────────────────────
// Error display (visible on screen, not just console)
// ─────────────────────────────────────────────
function showError(msg, detail) {
  let o = document.getElementById('err-overlay');
  if (!o) {
    o = document.createElement('div');
    o.id = 'err-overlay';
    Object.assign(o.style, {
      position:'fixed', inset:'0', background:'#c0392b', color:'white',
      zIndex:'9999', padding:'32px', fontFamily:'monospace', fontSize:'14px',
      overflowY:'auto',
    });
    document.body.appendChild(o);
  }
  o.innerHTML = '<h2 style="margin:0 0 12px">Error</h2>' +
    '<b>' + msg + '</b><br><br>' +
    '<pre style="white-space:pre-wrap">' + (detail||'') + '</pre>';
}

// Drift-compensated scheduler
let scheduleBase   = 0;
let scheduleOffset = 0;
let trialGeneration = 0;   // incremented on pause-resume/abort to cancel stale callbacks

function scheduleIn(delayMs, cb) {
  const gen      = trialGeneration;
  const elapsed  = performance.now() - scheduleBase;
  const drift    = elapsed - scheduleOffset;
  const adjusted = Math.max(0, delayMs - drift);
  scheduleOffset += delayMs;
  setTimeout(() => {
    if (trialGeneration !== gen) return;  // stale — ignore
    try { cb(); }
    catch(e) { showError('scheduleIn callback error', e.stack || e.message || String(e)); }
  }, adjusted);
}

// ─────────────────────────────────────────────
// Pause / resume / abort
// ─────────────────────────────────────────────
let paused       = false;
let pauseOverlay = null;

function ensurePauseOverlay() {
  if (pauseOverlay) return;
  pauseOverlay = document.createElement('div');
  Object.assign(pauseOverlay.style, {
    position: 'fixed', inset: '0', zIndex: '500',
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  pauseOverlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;padding:40px 48px;' +
    'text-align:center;max-width:320px;width:90vw;box-shadow:0 8px 40px rgba(0,0,0,.3)">' +
    '<div style="font-size:2.8rem;margin-bottom:8px">⏸</div>' +
    '<h2 style="color:#2C1A0E;margin-bottom:24px;font-size:1.4rem">' + t('pauseTitle') + '</h2>' +
    '<button id="btn-resume" style="display:block;width:100%;padding:13px;margin-bottom:12px;' +
    'background:#E65C00;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer">' +
    t('btnResume') + '</button>' +
    '<button id="btn-abort" style="display:block;width:100%;padding:13px;' +
    'background:#EEE;color:#333;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer">' +
    t('btnAbort') + '</button>' +
    '<p style="margin-top:16px;font-size:0.78rem;color:#999">' + t('pauseHint') + '</p>' +
    '</div>';
  document.body.appendChild(pauseOverlay);
  document.getElementById('btn-resume').onclick = resumeTask;
  document.getElementById('btn-abort').onclick  = abortTask;
}

function pauseTask() {
  if (paused || practiceMode) return;
  paused = true;
  if (responseTimer) { clearTimeout(responseTimer); responseTimer = null; }
  awaitingResponse = false;
  ensurePauseOverlay();
  pauseOverlay.style.display = 'flex';
}

function resumeTask() {
  if (!paused) return;
  paused = false;
  pauseOverlay.style.display = 'none';
  trialGeneration++;          // invalidate all stale scheduleIn callbacks
  scheduleBase   = performance.now();
  scheduleOffset = 0;
  clearCanvas();
  runTrial(currentIdx);       // restart current trial from its ISI
}

function abortTask() {
  paused = false;
  trialGeneration++;
  if (pauseOverlay) pauseOverlay.style.display = 'none';
  if (responseTimer) { clearTimeout(responseTimer); responseTimer = null; }
  document.removeEventListener('keydown',   onKeydown);
  document.removeEventListener('keyup',     onKeyup);
  document.removeEventListener('touchstart', onTouch);
  location.reload();
}

function startTask() {
  try {
  showScreen('screen-task');

  // Update hint based on input mode
  const isTouch = navigator.maxTouchPoints > 0;
  $('task-hint').innerHTML = isTouch ? t('taskHintTouch') : t('taskHintSpace');

  paused         = false;
  trialGeneration++;
  taskStartMs    = performance.now();
  scheduleBase   = taskStartMs;
  scheduleOffset = 0;

  task.set_task_start(taskStartMs);
  currentIdx = 0;
  updateHUD();
  clearCanvas();

  document.addEventListener('keydown',   onKeydown);
  document.addEventListener('keyup',     onKeyup);
  document.addEventListener('touchstart', onTouch, { passive: false });
  runTrial(0);
  } catch(e) {
    showError('startTask error', e.stack || e.message || String(e));
  }
}

function runTrial(idx) {
  if (idx >= totalTrials) { endTask(); return; }
  currentIdx = idx;
  const trial = trials[idx];
  updateHUD();
  clearCanvas();
  awaitingResponse = false;
  responseGiven    = false;

  scheduleIn(trial.isi_ms, () => {
    requestAnimationFrame(() => {
      try {
        drawAnimal(trial.stimulus_code);
      } catch(e) {
        showError('drawAnimal failed (code=' + trial.stimulus_code + ')', e.stack || e.message || String(e));
        return;
      }

      let onsetMs;
      try {
        onsetMs = performance.now();
        task.record_stimulus_onset(idx, onsetMs);
      } catch(e) {
        showError('WASM record_stimulus_onset failed (trial=' + idx + ')', e.stack || e.message || String(e));
        return;
      }

      currentTrialIdx  = idx;
      awaitingResponse = true;
      responseGiven    = false;

      const windowMs = Math.max(trial.duration_ms, RESPONSE_WINDOW_MS);

      scheduleIn(trial.duration_ms, () => {
        requestAnimationFrame(() => clearCanvas());
      });

      responseTimer = setTimeout(() => {
        try {
          awaitingResponse = false;
          task.finalize_trial(idx);
          scheduleIn(0, () => runTrial(idx + 1));
        } catch(e) {
          showError('Trial finalize error (trial=' + idx + ')', e.stack || e.message || String(e));
        }
      }, windowMs);
    });
  });
}

function onKeydown(e) {
  if (e.code === 'KeyP' && !e.repeat) {
    e.preventDefault();
    if (paused) resumeTask(); else pauseTask();
    return;
  }
  if (e.code !== 'Space' || e.repeat) return;
  e.preventDefault();
  if (paused) return;
  const pressMs = performance.now();
  if (!awaitingResponse || currentTrialIdx < 0 || responseGiven) return;
  responseGiven = true;

  const rtype = task.record_response(currentTrialIdx, pressMs);

  const frame = $('stage-frame');
  if (rtype === 'hit') {
    frame.classList.add('flash-green');
    setTimeout(() => frame.classList.remove('flash-green'), FLASH_MS);
  } else if (rtype === 'false_alarm' || rtype === 'too_fast') {
    frame.classList.add('flash-red');
    setTimeout(() => frame.classList.remove('flash-red'), FLASH_MS);
  }
}

function onKeyup(e) { if (e.code === 'Space') e.preventDefault(); }

function onTouch(e) {
  // Ignore multi-touch (pinch/zoom) and taps on buttons/inputs
  if (e.touches.length > 1) return;
  const tag = e.target.tagName;
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'A') return;
  e.preventDefault();
  const pressMs = performance.now();
  if (!awaitingResponse || currentTrialIdx < 0 || responseGiven) return;
  responseGiven = true;

  const rtype = task.record_response(currentTrialIdx, pressMs);

  const frame = $('stage-frame');
  if (rtype === 'hit') {
    frame.classList.add('flash-green');
    setTimeout(() => frame.classList.remove('flash-green'), FLASH_MS);
  } else if (rtype === 'false_alarm' || rtype === 'too_fast') {
    frame.classList.add('flash-red');
    setTimeout(() => frame.classList.remove('flash-red'), FLASH_MS);
  }
}

function updateHUD() {
  const trial = trials[currentIdx];
  $('hud-remaining').textContent = totalTrials - currentIdx;
  const phaseMap = { warmup: t('phaseWarmup'), main: t('phaseMain'), cooldown: t('phaseCooldown') };
  $('hud-phase').textContent = trial ? (phaseMap[trial.phase] || trial.phase) : '—';
}

function endTask() {
  document.removeEventListener('keydown',   onKeydown);
  document.removeEventListener('keyup',     onKeyup);
  document.removeEventListener('touchstart', onTouch);
  if (responseTimer) clearTimeout(responseTimer);

  task.set_timing_notes(buildTimingNotes());
  const results = JSON.parse(task.get_results_json());
  const _now = new Date();
  results.test_time = _now.getHours().toString().padStart(2,'0') + ':' +
                      _now.getMinutes().toString().padStart(2,'0') + ':' +
                      _now.getSeconds().toString().padStart(2,'0');

  saveToLocalStorage(results);
  _saveSessionResult(results);
  renderResults(results);
  showScreen('screen-results');
}

// ─────────────────────────────────────────────
// Timing metadata
// ─────────────────────────────────────────────
function buildTimingNotes() {
  const sab     = typeof SharedArrayBuffer !== 'undefined';
  const perfRes = estimatePerfResolution();
  const refresh = estimateRefreshRate();
  return [
    `UA: ${navigator.userAgent}`,
    `SharedArrayBuffer: ${sab ? 'available (high-res timer ~0.005ms)' : 'unavailable (timer ~1ms)'}`,
    `performance.now() estimated resolution: ~${perfRes} ms`,
    `Estimated monitor refresh: ~${refresh} Hz (~${(1000/refresh).toFixed(1)} ms/frame)`,
    `Stimulus onset = performance.now() inside rAF callback after drawImage(). ` +
      `Inherent display latency: 0 ~ ${(1000/refresh).toFixed(1)} ms (one frame).`,
    `Keypress time = performance.now() at keydown event; keyboard HW latency ~1–15 ms.`,
    `RT < 100 ms classified as Too Fast / perseveration.`,
  ].join('\n');
}

function estimatePerfResolution() {
  let min = Infinity, prev = performance.now();
  for (let i = 0; i < 50; i++) {
    const now = performance.now();
    const d = now - prev;
    if (d > 0 && d < min) min = d;
    prev = now;
  }
  return min === Infinity ? '??' : min.toFixed(3);
}

let _refreshEstimate = 60;
(function measureRefresh() {
  let last = performance.now(), count = 0;
  const samples = [];
  function tick(ts) {
    if (count > 0) samples.push(ts - last);
    last = ts; count++;
    if (count < 30) requestAnimationFrame(tick);
    else {
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      _refreshEstimate = Math.round(1000 / avg);
    }
  }
  requestAnimationFrame(tick);
})();

function estimateRefreshRate() { return _refreshEstimate; }

// ─────────────────────────────────────────────
// localStorage
// ─────────────────────────────────────────────
function saveToLocalStorage(results) {
  const key   = `acpt_${results.test_date}_${userData.pid}`;
  const store = JSON.parse(localStorage.getItem('acpt_sessions') || '[]');
  store.push({ key, timestamp: Date.now(), summary: {
    name: results.user_name, age: results.age,
    is_child: results.is_child, date: results.test_date,
    omission: results.omission_rate_pct, commission: results.commission_rate_pct,
    mean_rt: results.mean_rt_ms,
  }});
  localStorage.setItem('acpt_sessions', JSON.stringify(store));
  localStorage.setItem(key, JSON.stringify(results));
}

// ─────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────
function renderResults(r) {
  const summary = [
    { val: r.mean_rt_ms.toFixed(1) + ' ms',              label: t('rcMeanRT') },
    { val: r.sd_rt_ms.toFixed(1)  + ' ms',               label: t('rcSDRT') },
    { val: r.median_rt_ms.toFixed(1) + ' ms',            label: t('rcMedianRT') },
    { val: r.omission_rate_pct.toFixed(1) + '%',         label: t('rcOmission') },
    { val: r.commission_rate_pct.toFixed(1) + '%',       label: t('rcCommission') },
    { val: r.perseveration_rate_pct.toFixed(1) + '%',    label: t('rcPersev') },
    { val: r.hits,         label: t('rcHits') },
    { val: r.misses,       label: t('rcMisses') },
    { val: r.false_alarms, label: t('rcFA') },
  ];

  $('results-summary').innerHTML = summary.map(s =>
    `<div class="result-card">
       <div class="rc-val">${s.val}</div>
       <div class="rc-label">${s.label}</div>
     </div>`
  ).join('');

  const thead = `<tr>
    <th>${t('thBlock')}</th><th>${t('thTrials')}</th><th>${t('thHit')}</th><th>${t('thMiss')}</th><th>${t('thFA')}</th>
    <th>${t('thMeanRT')}</th><th>${t('thOmPct')}</th><th>${t('thCoPct')}</th></tr>`;
  const tbody = r.block_stats.map(b =>
    `<tr>
      <td>${b.block}</td><td>${b.trials}</td>
      <td>${b.hits}</td><td>${b.misses}</td><td>${b.false_alarms}</td>
      <td>${b.mean_rt_ms.toFixed(1)}</td>
      <td>${b.omission_pct.toFixed(1)}</td>
      <td>${b.commission_pct.toFixed(1)}</td>
    </tr>`
  ).join('');
  $('results-blocks-table').innerHTML =
    `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;

  $('timing-note').textContent = t('timingNote');

  $('btn-export').onclick     = () => promptExcelPassword(r);
  $('btn-export-csv').onclick = () => exportLegacyCSV(r);
  $('btn-report').onclick     = () => showACPTReport(r);
  $('btn-new').onclick        = () => location.reload();
}

// ─────────────────────────────────────────────
// Excel download password gate
// ─────────────────────────────────────────────
function promptExcelPassword(r) {
  // Build a simple modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;' +
    'display:flex;align-items:center;justify-content:center;';

  const box = document.createElement('div');
  box.style.cssText =
    'background:#fff;border-radius:14px;padding:36px 40px;width:min(400px,90vw);' +
    'box-shadow:0 8px 40px rgba(0,0,0,.3);font-family:inherit;';
  box.innerHTML =
    '<h3 style="margin:0 0 8px;color:#5C3A1E;font-size:1.1rem;">' + t('pwTitle') + '</h3>' +
    '<p style="margin:0 0 18px;font-size:.88rem;color:#7a6052;">' + t('pwDesc') + '</p>' +
    '<input id="pw-input" type="password" placeholder="' + t('pwPh') + '" ' +
    '  style="width:100%;padding:10px 14px;border:1.5px solid #D8C9BB;border-radius:8px;' +
    '         font-size:.97rem;outline:none;box-sizing:border-box;" />' +
    '<p id="pw-err" style="color:#E53935;font-size:.82rem;margin:8px 0 0;min-height:1.2em;"></p>' +
    '<div style="display:flex;gap:10px;margin-top:18px;">' +
    '  <button id="pw-ok" style="flex:2;padding:11px;background:#E65C00;color:#fff;border:none;' +
    '    border-radius:9px;font-weight:700;font-size:.95rem;cursor:pointer;">' + t('pwOk') + '</button>' +
    '  <button id="pw-cancel" style="flex:1;padding:11px;background:#EEE;border:none;' +
    '    border-radius:9px;font-weight:600;cursor:pointer;">' + t('pwCancel') + '</button>' +
    '</div>';

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const inp = box.querySelector('#pw-input');
  const err = box.querySelector('#pw-err');
  inp.focus();

  function close() { document.body.removeChild(overlay); }

  box.querySelector('#pw-cancel').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };

  function attempt() {
    if (wasm_bindgen.verify_export_password(inp.value)) {
      close();
      exportExcel(r);
    } else {
      err.textContent = t('pwErr');
      inp.value = '';
      inp.focus();
    }
  }

  box.querySelector('#pw-ok').onclick = attempt;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}

// ─────────────────────────────────────────────
// Excel export
// ─────────────────────────────────────────────
function exportExcel(r) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['ACPT 測驗結果報告'],
    [],
    ['受試者姓名', r.user_name],
    ['受試者編號', userData.pid || ''],
    ['年齡', r.age],
    ['版本', r.is_child ? '兒童版' : '成人版'],
    ['性別', userData.gender || ''],
    ['測驗日期', r.test_date],
    ['備註', userData.note || ''],
    [],
    ['─── 主要階段統計 ───'],
    ['總試次', r.total_trials],
    ['主要階段試次', r.main_trials],
    ['目標刺激數', r.target_count],
    ['非目標刺激數', r.non_target_count],
    [],
    ['正確按鍵 (Hit)', r.hits],
    ['遺漏 (Miss)', r.misses],
    ['誤按 (False Alarm)', r.false_alarms],
    ['正確不按 (Correct Reject)', r.correct_rejects],
    ['持續反應 (Perseveration RT<100ms)', r.perseverations],
    [],
    ['遺漏錯誤率 (%)', +r.omission_rate_pct.toFixed(2)],
    ['誤按錯誤率 (%)', +r.commission_rate_pct.toFixed(2)],
    ['持續反應率 (%)', +r.perseveration_rate_pct.toFixed(2)],
    [],
    ['平均反應時間 (ms)', +r.mean_rt_ms.toFixed(2)],
    ['反應時間標準差 (ms)', +r.sd_rt_ms.toFixed(2)],
    ['中位數反應時間 (ms)', +r.median_rt_ms.toFixed(2)],
    [],
    ['─── 各時段表現 ───'],
    ['時段','試次數','Hit','Miss','誤按','平均RT(ms)','遺漏%','誤按%'],
    ...r.block_stats.map(b => [
      b.block, b.trials, b.hits, b.misses, b.false_alarms,
      +b.mean_rt_ms.toFixed(2), +b.omission_pct.toFixed(2), +b.commission_pct.toFixed(2),
    ]),
    [],
    ['─── 計時說明 ───'],
    ...r.timing_notes.split('\n').map(l => [l]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '摘要');

  const responseTypeZh = {
    hit: '正確按鍵', miss: '遺漏', false_alarm: '誤按',
    correct_reject: '正確不按', too_fast: '持續反應(過快)', pending: '未完成',
  };
  const headers = [
    '試次編號','階段','刺激代碼','刺激動物(中)','刺激動物(英)',
    '目標(1=是/0=否)','ISI(ms)','刺激時間(ms)',
    '刺激呈現時間_任務開始起(ms)','按鍵時間_任務開始起(ms)',
    '反應時間RT(ms)','反應類型','反應類型說明',
  ];
  const phaseMap = { warmup: '暖身', main: '主要', cooldown: '緩和' };
  const trialRows = r.trials.map(t => [
    t.trial.index + 1,
    phaseMap[t.trial.phase] || t.trial.phase,
    t.trial.stimulus_code,
    ANIMAL_ZH[t.trial.stimulus_code]  || '',
    ANIMAL_EN[t.trial.stimulus_code]  || '',
    t.trial.is_target ? 1 : 0,
    t.trial.isi_ms,
    t.trial.duration_ms,
    +t.stimulus_onset_ms.toFixed(3),
    t.response_ms       != null ? +t.response_ms.toFixed(3)       : '',
    t.reaction_time_ms  != null ? +t.reaction_time_ms.toFixed(3)  : '',
    t.response_type,
    responseTypeZh[t.response_type] || t.response_type,
  ]);

  const wsTrials = XLSX.utils.aoa_to_sheet([headers, ...trialRows]);
  wsTrials['!cols'] = [8,6,10,12,12,12,8,12,26,26,16,12,16].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsTrials, '試次資料');

  const timingNote = [
    ['ACPT 計時方法說明'],
    [],
    ['項目','說明'],
    ['刺激呈現時間','requestAnimationFrame 回調中 drawImage() 後立即記錄 performance.now()'],
    ['顯示延遲','0 ~ 1幀（60Hz=16.7ms, 144Hz=6.9ms）'],
    ['按鍵時間','keydown 事件觸發時記錄 performance.now()'],
    ['鍵盤硬體延遲','一般鍵盤 1–15 ms'],
    ['計時精度','SharedArrayBuffer 可用時 ~0.005ms；否則 ~1ms'],
    ['反應時間定義','RT = 按鍵時間 − 刺激呈現時間'],
    ['持續反應閾值','RT < 100 ms 歸類為持續反應（perseveration）'],
    [],
    ['系統資訊'],
    ...r.timing_notes.split('\n').map(l => ['', l]),
  ];
  const wsNote = XLSX.utils.aoa_to_sheet(timingNote);
  wsNote['!cols'] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsNote, '計時說明');

  XLSX.writeFile(wb, `ACPT_${r.test_date}_${userData.pid || r.user_name}.xlsx`);
}

// ─────────────────────────────────────────────
// Legacy CSV export (matches _PK_ / _PA_ format from original Unity system)
// Format:
//   Row 1: Username,Gender,Birthday,Testday,Mod,
//   Row 2: <name>,<gender>,<birthday>,<timestamp>,<mod>,
//   Row 3: Type,Event,Time(s),
//   Data:  Picture,<code>,<time_s>,  and  Response,OnClick!!,<time_s>,
//
// Animal code mapping — non-target is always code 0 to match original:
//   Child  (our→csv): bird=0→1, cat=1→0, chicken=2→2, cow=3→3, dog=4→4,
//                     duck=5→5, elephant=6→6, monkey=7→7, pig=8→8, sheep=9→9, tiger=10→10
//   Adult  (our→csv): 大象=0→1, 小孩=1→2, 烏鴉=2→3, 牛=3→4, 狗=4→5, 狼=5→6,
//                     猴子=6→7, 獅子=7→8, 羊=8→9, 蛇=9→10, 豬=10→11, 貓=11→0,
//                     雞=12→12, 青蛙=13→13, 鴨子=14→14, 麻雀=15→15
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// CSV import
// ─────────────────────────────────────────────
function peekCSVMeta(text) {
  var lines = text.trim().split(/\r?\n/).map(function(l){ return l.split(','); });
  if (lines.length < 4) throw new Error('File too short');
  var name   = (lines[1][0] || '').trim();
  var gender = (lines[1][1] || '').trim();
  var stamp  = (lines[1][3] || '').trim();
  var mod    = (lines[1][4] || '').trim();
  var isChild = mod.toLowerCase().includes('kid');
  var sp = stamp.split('_');
  var testDate = sp.length >= 3
    ? sp[0] + '-' + sp[1] + '-' + sp[2].padStart(2,'0')
    : new Date().toISOString().split('T')[0];
  var testTime = '';
  if (sp.length >= 4 && sp[3].length >= 6) {
    var ts = sp[3];
    testTime = ts.slice(0,2) + ':' + ts.slice(2,4) + ':' + ts.slice(4,6);
  }
  return { name, gender, stamp, testDate, testTime, isChild, mod };
}

function showCSVMetaModal(meta, rawText) {
  var L = LANG[curLang];
  var zh = curLang === 'zh';
  var versionLabel = meta.isChild ? L.csvVerChild : L.csvVerAdult;

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:14px;padding:32px 36px;width:min(420px,92vw);box-shadow:0 8px 40px rgba(0,0,0,.3);font-family:inherit;">' +
    '<h3 style="margin:0 0 4px;color:#1A2B3C;font-size:1.1rem;">📂 ' + L.csvModalTitle + '</h3>' +
    '<p style="margin:0 0 16px;font-size:.83rem;color:#777;">' + L.csvModalDesc + '</p>' +
    '<table style="width:100%;font-size:.85rem;margin-bottom:16px;border-collapse:collapse;">' +
    '<tr><td style="color:#888;padding:3px 0;width:42%">' + L.csvFieldName + '</td><td style="font-weight:600">' + (meta.name||'—') + '</td></tr>' +
    '<tr><td style="color:#888;padding:3px 0">' + L.csvFieldVersion + '</td><td style="font-weight:600">' + versionLabel + '</td></tr>' +
    '<tr><td style="color:#888;padding:3px 0">' + L.csvFieldDate + '</td><td style="font-weight:600">' + meta.testDate + '</td></tr>' +
    '</table>' +
    '<div style="margin-bottom:12px;">' +
    '<label style="display:block;font-size:.8rem;color:#4bb9db;font-weight:700;margin-bottom:4px;">' + L.csvModalAge + '</label>' +
    '<input id="csv-age-input" type="number" min="4" max="99" placeholder="' + (zh?'例：8':'e.g. 8') + '" style="width:100%;padding:9px 12px;border:1.5px solid #D8C9BB;border-radius:8px;font-size:.95rem;outline:none;box-sizing:border-box;">' +
    '</div>' +
    '<div style="margin-bottom:6px;">' +
    '<label style="display:block;font-size:.8rem;color:#4bb9db;font-weight:700;margin-bottom:4px;">' + L.csvModalPid + '</label>' +
    '<input id="csv-pid-input" type="text" placeholder="' + (zh?'例：P001':'e.g. P001') + '" style="width:100%;padding:9px 12px;border:1.5px solid #D8C9BB;border-radius:8px;font-size:.95rem;outline:none;box-sizing:border-box;">' +
    '</div>' +
    '<p id="csv-err" style="color:#E53935;font-size:.8rem;min-height:1.2em;margin:6px 0 12px;"></p>' +
    '<div style="display:flex;gap:10px;">' +
    '<button id="csv-ok" style="flex:2;padding:11px;background:#4bb9db;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:.95rem;cursor:pointer;">' + L.csvModalOk + '</button>' +
    '<button id="csv-cancel" style="flex:1;padding:11px;background:#EEE;border:none;border-radius:9px;font-weight:600;cursor:pointer;">' + L.csvModalCancel + '</button>' +
    '</div></div>';

  document.body.appendChild(overlay);
  var ageInp = overlay.querySelector('#csv-age-input');
  var pidInp = overlay.querySelector('#csv-pid-input');
  var errEl  = overlay.querySelector('#csv-err');
  ageInp.focus();

  function close() { document.body.removeChild(overlay); }
  overlay.querySelector('#csv-cancel').onclick = close;
  overlay.onclick = function(e) { if (e.target === overlay) close(); };

  function generate() {
    var age = parseInt(ageInp.value, 10);
    if (isNaN(age) || age < 4 || age > 99) {
      errEl.textContent = LANG[curLang].csvModalAgeErr;
      return;
    }
    try {
      var r = buildResultsFromCSV(rawText, age, pidInp.value.trim(), meta);
      userData = { name: meta.name, pid: pidInp.value.trim(), age, gender: meta.gender, note: '' };
      close();
      showACPTReport(r);
    } catch(err) {
      errEl.textContent = LANG[curLang].csvModalParseErr + err.message;
    }
  }

  overlay.querySelector('#csv-ok').onclick = generate;
  ageInp.addEventListener('keydown', function(e) { if (e.key === 'Enter') generate(); });
}

function buildResultsFromCSV(text, age, pid, meta) {
  var lines = text.trim().split(/\r?\n/).map(function(l){ return l.split(','); });
  var isChild = meta.isChild;

  // Parse events from row 3 onwards
  var events = [];
  for (var i = 3; i < lines.length; i++) {
    var row = lines[i];
    var type = (row[0] || '').trim();
    if (!type) continue;
    events.push({ type: type, event: (row[1] || '').trim(), time_s: parseFloat(row[2]) });
  }
  if (events.length < 10) throw new Error('Not enough data rows');

  // Build trials
  var trials = [];
  for (var j = 0; j < events.length; j++) {
    var ev = events[j];
    if (ev.type !== 'Picture') continue;
    var csvCode  = parseInt(ev.event);
    var ourCode  = wasm_bindgen.remap_from_csv_code(csvCode, isChild);
    var onsetMs  = ev.time_s * 1000;
    var isTarget = (csvCode !== 0);
    var responseMs = null;
    if (j + 1 < events.length && events[j+1].type === 'Response') {
      responseMs = events[j+1].time_s * 1000;
    }
    var rtMs = responseMs != null ? responseMs - onsetMs : null;
    var rtype;
    if (responseMs == null) {
      rtype = isTarget ? 'miss' : 'correct_reject';
    } else if (rtMs < 100) {
      rtype = 'too_fast';
    } else {
      rtype = isTarget ? 'hit' : 'false_alarm';
    }
    trials.push({
      trial: { index: trials.length, phase: 'main', stimulus_code: ourCode,
               is_target: isTarget, isi_ms: 1000, duration_ms: 500 },
      stimulus_onset_ms: onsetMs,
      response_ms: responseMs,
      reaction_time_ms: rtMs,
      response_type: rtype,
    });
  }

  if (trials.length < 60) throw new Error(LANG[curLang].csvModalTooFew);

  return {
    user_name:   meta.name,
    age:         age,
    test_date:   meta.testDate,
    test_time:   meta.testTime || '',
    is_child:    isChild,
    main_trials: trials.length,
    trials:      trials,
    timing_notes: '',
  };
}

// ─────────────────────────────────────────────
// ACPT Behavior Analysis + T-score Report
// ─────────────────────────────────────────────

function erfApprox(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const t2 = 1.0 / (1.0 + p * x);
  const y = 1 - (((((a5*t2+a4)*t2+a3)*t2+a2)*t2+a1)*t2)*Math.exp(-x*x);
  return sign * y;
}
function normCdf(z) { return 0.5*(1+erfApprox(z/Math.SQRT2)); }
function arrMean(a) { return a.length ? a.reduce((s,v)=>s+v,0)/a.length : NaN; }
function arrStdPop(a) {  // population std (ddof=0), matches numpy default
  if (a.length < 1) return NaN;
  const m = arrMean(a);
  return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length);
}

function getAgeGroup(age) {
  if (age <= 5) return '4-5';
  if (age <= 7) return '6-7';
  if (age <= 9) return '8-9';
  if (age <= 11) return '10-11';
  if (age <= 13) return '12-13';
  if (age <= 15) return '14-15';
  if (age <= 17) return '16-17';
  return '18-99';
}

// Normative data and regression coefficients are protected inside the WASM binary.
// Use wasm_bindgen.compute_acpt_t_scores() to obtain T-scores.

function computeACPTMetrics(r) {
  const BDO = [1.0, 1.5, 2.0, 3.0, 4.0];
  const main = r.trials.filter(t => t.trial.phase === 'main' && t.stimulus_onset_ms != null);
  if (main.length < 60) return null;
  const isChild = r.is_child;

  // Assign block_dur (onset-to-onset mapped to nearest canonical value)
  const stim = main.map((t, i) => {
    let bd;
    if (i < main.length - 1) {
      const sp = (main[i+1].stimulus_onset_ms - t.stimulus_onset_ms) / 1000.0;
      bd = BDO.reduce((b,v) => Math.abs(v-sp) < Math.abs(b-sp) ? v : b);
    } else {
      bd = null;
    }
    return { is_target: t.trial.is_target, time: t.stimulus_onset_ms/1000.0,
             rt: t.reaction_time_ms != null ? t.reaction_time_ms/1000.0 : null,
             rtype: t.response_type, bd };
  });
  if (stim.length > 1) stim[stim.length-1].bd = stim[stim.length-2].bd;
  else if (stim.length === 1) stim[0].bd = isChild ? 1.5 : 1.0;

  const nTarg   = stim.filter(s => s.is_target).length;
  const nNtarg  = stim.filter(s => !s.is_target).length;
  const nMiss   = stim.filter(s => s.rtype === 'miss').length;
  const nFA     = stim.filter(s => s.rtype === 'false_alarm').length;
  const nPersev = stim.filter(s => s.rtype === 'too_fast').length;
  const nAllHit = stim.filter(s => s.rt !== null).length;
  const hitRTs  = stim.filter(s => s.rtype === 'hit').map(s => s.rt);

  const omissions   = nTarg  > 0 ? nMiss / nTarg  : 0;
  const commissions = nNtarg > 0 ? nFA   / nNtarg  : 0;
  const persevRate  = nAllHit > 0 ? nPersev / nAllHit : 0;

  const HRT    = arrMean(hitRTs) * 1000;
  const HRTSD  = arrStdPop(hitRTs) * 1000;

  // Detectability (as in ACPT.py: -1*(normCdf(hitrate) - normCdf(farate)))
  const Zhit   = normCdf(nTarg  > 0 ? (nTarg-nMiss)/nTarg : 0);
  const Zfalse = normCdf(nNtarg > 0 ? nFA/nNtarg : 0);
  const detectability = -(Zhit - Zfalse);

  // Groups of n_group for HRT_mean_block (BlockChange)
  const nGroup  = isChild ? 40 : 60;
  const blockStats = [];
  for (let i = 0; i < stim.length; i += nGroup) {
    const blk = stim.slice(i, i+nGroup);
    const rts = blk.filter(s=>s.rtype==='hit').map(s=>s.rt*1000);
    const nT = blk.filter(s=>s.is_target).length;
    const nN = blk.filter(s=>!s.is_target).length;
    blockStats.push({
      hrtMean: isNaN(arrMean(rts)) ? null : arrMean(rts),
      hrtSD:   isNaN(arrStdPop(rts)) ? null : arrStdPop(rts),
      omPct:   nT > 0 ? blk.filter(s=>s.rtype==='miss').length / nT * 100 : 0,
      coPct:   nN > 0 ? blk.filter(s=>s.rtype==='false_alarm').length / nN * 100 : 0,
    });
  }
  const meanBlocks = blockStats.map(b => b.hrtMean ?? 0);
  const BlockChange = meanBlocks.length > 1
    ? (meanBlocks[meanBlocks.length-1] - meanBlocks[0]) / (meanBlocks.length - 1) : 0;

  // Groups of 20 for HRT_SD_block (Variability)
  const sdBlocks = [];
  for (let i = 0; i < stim.length; i += 20) {
    const rts = stim.slice(i, i+20).filter(s => s.rtype==='hit').map(s => s.rt*1000);
    const sd = arrStdPop(rts);
    sdBlocks.push(isNaN(sd) ? 0 : sd);
  }
  const Variability = arrStdPop(sdBlocks);

  // ISI groups
  let isiGroups, isiLabels;
  if (isChild) {
    isiGroups = [stim.filter(s=>s.bd===1.5), stim.filter(s=>s.bd===3.0)];
    isiLabels = ['ISI-1.5s', 'ISI-3.0s'];
  } else {
    isiGroups = [stim.filter(s=>s.bd===1.0), stim.filter(s=>s.bd===2.0), stim.filter(s=>s.bd===4.0)];
    isiLabels = ['ISI-1.0s', 'ISI-2.0s', 'ISI-4.0s'];
  }
  const isiStats = isiGroups.map(g => {
    const rts = g.filter(s=>s.rtype==='hit').map(s=>s.rt*1000);
    const nT = g.filter(s=>s.is_target).length;
    const nN = g.filter(s=>!s.is_target).length;
    return {
      hrtMean: isNaN(arrMean(rts)) ? null : arrMean(rts),
      hrtSD:   isNaN(arrStdPop(rts)) ? null : arrStdPop(rts),
      omPct:   nT > 0 ? g.filter(s=>s.rtype==='miss').length / nT * 100 : 0,
      coPct:   nN > 0 ? g.filter(s=>s.rtype==='false_alarm').length / nN * 100 : 0,
    };
  });
  const isiMeans = isiStats.map(s => s.hrtMean ?? 0);
  const ISIChange = isiMeans.length > 1
    ? (isiMeans[isiMeans.length-1] - isiMeans[0]) / (isiMeans.length-1) : 0;

  return {
    nTarg, nNtarg, nMiss, nFA, nPersev, nAllHit,
    omissions, commissions, persevRate,
    HRT: isNaN(HRT) ? null : HRT,
    HRTSD: isNaN(HRTSD) ? null : HRTSD,
    Variability: isNaN(Variability) ? null : Variability,
    BlockChange, ISIChange,
    Zhit, Zfalse, detectability,
    blockStats, isiStats, isiLabels,
  };
}

function acptAdvice(key, tFinal) {
  if (tFinal === undefined || !isFinite(tFinal)) return '—';
  const t = tFinal;
  const domain = {omissions:'不專心程度',commissions:'衝動性',HRT:'反應速度',
                  HRTSD:'反應一致性',Variability:'注意力穩定性',BlockChange:'持續專注力',ISIChange:'警覺性'}[key]||'—';
  const rec = {
    fastHigh:'速度過快、可能影響穩定性；加入節奏控制與反應抑制練習，如節拍器配合慢速點擊、延遲回應遊戲。',
    speedOk:'維持目前反應速度；可加入精細動作與注意轉移練習（如視覺搜尋、目標切換）。',
    slow:'反應偏慢；先做警覺提升與熱身（如眼手協調、視聽雙模刺激），再進行定時反應任務，逐步縮短反應時間。',
    okFocus:'可加入短時專注維持訓練：如 2–3 分鐘的目標偵測、逐字閱讀標記。',
    okInhibit:'維持；可輕量融入抑制控制：如 Go/No-Go、等待 3 秒再點擊的節奏練習。',
    okConsistency:'可加上節拍器下的等節奏反應以維持一致性。',
    okStability:'維持當下穩定度；可加入分段任務以自我監測波動。',
    okSustain:'維持；長任務時安排短暫微休息（如 2 分鐘/每 10 分鐘）。',
    okAlert:'維持；可做不同間隔的反應任務以保持節奏適應。',
    mildOmit:'採用視覺提示與任務分段，並運用短時集中的「番茄鐘」專注訓練。',
    mildComm:'加入抑制練習（No-Go/Stop-Signal）、回應前口頭自我指令：「看清楚再按」。',
    mildHRTSD:'在固定節拍下做持續反應，增加回合數並記錄波動；失焦即暫停整理再續。',
    mildVar:'先縮短單回合時長（如 2–3 分鐘）再逐步拉長；在區塊間做自評穩定度。',
    mildBlock:'任務分段並在每段前設定微目標；加入自我提醒卡避免後段疲乏。',
    mildISI:'做不同 ISI 的隨機化訓練，練習節奏轉換與等待控制。',
    highOmit:'先降低刺激複雜度並增加外顯提示；採短－休－短循環逐步拉長專注時間。',
    highComm:'強化抑制與延遲回應；設定明確規則與回饋，必要時加入視覺倒數後才允許反應。',
    highHRTSD:'以節拍器/計時器做固定節奏反應；每回合後回顧錯誤模式，調整節奏與呼吸。',
    highVar:'縮短任務、提升回饋頻率；以多段任務+即時自評方式穩定注意波動。',
    highBlock:'改為更短的 block 並在每段起點做提神程序（深呼吸/伸展），逐段觀察表現漂移。',
    highISI:'專練不同 ISI 的等待與切換，先固定序列再轉隨機，強化警覺維持。',
  };
  if (key === 'HRT') {
    if (t < 40) return `${domain}：顯著過快。建議：${rec.fastHigh}`;
    if (t <= 44) return `${domain}：輕微過快。建議：${rec.fastHigh}`;
    if (t <= 54) return `${domain}：正常範圍。建議：${rec.speedOk}`;
    if (t <= 59) return `${domain}：輕微過慢。建議：${rec.slow}`;
    if (t <= 69) return `${domain}：過慢。建議：${rec.slow}`;
    return `${domain}：顯著過慢。建議：${rec.slow}`;
  }
  const e = (label, kind) => {
    const rMap = {omissions:{ok:rec.okFocus,mild:rec.mildOmit,high:rec.highOmit},
                  commissions:{ok:rec.okInhibit,mild:rec.mildComm,high:rec.highComm},
                  HRTSD:{ok:rec.okConsistency,mild:rec.mildHRTSD,high:rec.highHRTSD},
                  Variability:{ok:rec.okStability,mild:rec.mildVar,high:rec.highVar},
                  BlockChange:{ok:rec.okSustain,mild:rec.mildBlock,high:rec.highBlock},
                  ISIChange:{ok:rec.okAlert,mild:rec.mildISI,high:rec.highISI}};
    return `${domain}：${label}。建議：${(rMap[key]||{})[kind]||'—'}`;
  };
  if (t < 45) return e('偏低','ok');
  if (t <= 54) return e('正常範圍','ok');
  if (t <= 59) return e('輕微過高','mild');
  if (t <= 69) return e('過高','mild');
  return e('顯著過高','high');
}

function tInterpretLabel(t) {
  if (!isFinite(t)) return { label: '—', color: '#888' };
  if (t < 40)  return { label: '顯著偏低', color: '#2196F3' };
  if (t <= 44) return { label: '偏低', color: '#64B5F6' };
  if (t <= 54) return { label: '正常範圍', color: '#43A047' };
  if (t <= 59) return { label: '輕微偏高', color: '#FFA726' };
  if (t <= 69) return { label: '偏高', color: '#EF6C00' };
  return { label: '顯著偏高', color: '#C62828' };
}

// SVG chart helpers — use viewBox so SVGs scale to container width
function svgLineChart(labels, vals, sdVals, W, H) {
  const ml=52, mr=12, mt=22, mb=36;
  const iw=W-ml-mr, ih=H-mt-mb;
  const finite = vals.filter(v=>v!=null&&isFinite(v));
  if (!finite.length) return `<svg viewBox="0 0 ${W} ${H}" width="100%"></svg>`;
  const yMin = Math.floor((Math.min(...finite)-30)/10)*10;
  const yMax = Math.ceil((Math.max(...finite)+30)/10)*10;
  const sy = v => ih*(1-(v-yMin)/(yMax-yMin));
  const sx = i => labels.length<2 ? iw/2 : i*iw/(labels.length-1);
  let g='', xg='', pts='', dots='', dlbs='';
  for (let k=0;k<=4;k++) {
    const y=ih*k/4, v=yMax-(yMax-yMin)*k/4;
    g+=`<line x1="0" y1="${y.toFixed(1)}" x2="${iw}" y2="${y.toFixed(1)}" stroke="#eee" stroke-width="1"/>`;
    g+=`<text x="-4" y="${(y+4).toFixed(1)}" text-anchor="end" font-size="10" fill="#999">${v.toFixed(0)}</text>`;
  }
  vals.forEach((v,i)=>{
    xg+=`<text x="${sx(i).toFixed(1)}" y="${(ih+14).toFixed(1)}" text-anchor="middle" font-size="10" fill="#666">${labels[i]}</text>`;
    if(v==null) return;
    pts+=(pts?'L':'M')+`${sx(i).toFixed(1)},${sy(v).toFixed(1)} `;
    const ci=sy(v);
    dots+=`<circle cx="${sx(i).toFixed(1)}" cy="${ci.toFixed(1)}" r="4" fill="#E65C00"/>`;
    dlbs+=`<text x="${sx(i).toFixed(1)}" y="${(ci-8).toFixed(1)}" text-anchor="middle" font-size="9" fill="#555">${v.toFixed(0)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible"><g transform="translate(${ml},${mt})">`+
    g+`<path d="${pts.trim()}" fill="none" stroke="#E65C00" stroke-width="2.5" stroke-linejoin="round"/>`+dots+dlbs+xg+
    `<line x1="0" y1="0" x2="0" y2="${ih}" stroke="#ccc"/><line x1="0" y1="${ih}" x2="${iw}" y2="${ih}" stroke="#ccc"/>`+
    `</g></svg>`;
}
function svgBarChart(labels, vals, W, H, color) {
  const ml=44, mr=12, mt=22, mb=36;
  const iw=W-ml-mr, ih=H-mt-mb;
  const finite = vals.filter(v=>v!=null&&isFinite(v));
  const yMax = finite.length ? Math.max(Math.ceil(Math.max(...finite)/5)*5, 5) : 10;
  const sy = v => ih*(1-v/yMax);
  let g='', bars='', xg='';
  for (let k=0;k<=4;k++) {
    const y=ih*k/4, v=yMax*(1-k/4);
    g+=`<line x1="0" y1="${y.toFixed(1)}" x2="${iw}" y2="${y.toFixed(1)}" stroke="#eee" stroke-width="1"/>`;
    g+=`<text x="-4" y="${(y+4).toFixed(1)}" text-anchor="end" font-size="10" fill="#999">${v.toFixed(0)}</text>`;
  }
  const bw = iw/labels.length*0.6, sp = iw/labels.length;
  vals.forEach((v,i)=>{
    const x=i*sp+sp/2-bw/2, vv=v??0, h=ih*vv/yMax, y=ih-h;
    bars+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" rx="2"/>`;
    bars+=`<text x="${(x+bw/2).toFixed(1)}" y="${(y-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#555">${vv.toFixed(1)}</text>`;
    xg+=`<text x="${(i*sp+sp/2).toFixed(1)}" y="${(ih+14).toFixed(1)}" text-anchor="middle" font-size="10" fill="#666">${labels[i]}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible"><g transform="translate(${ml},${mt})">`+
    g+bars+xg+
    `<line x1="0" y1="0" x2="0" y2="${ih}" stroke="#ccc"/><line x1="0" y1="${ih}" x2="${iw}" y2="${ih}" stroke="#ccc"/>`+
    `</g></svg>`;
}
function chartTable(headers, rows) {
  const ths = headers.map(h=>`<th>${h}</th>`).join('');
  const trs = rows.map(r=>'<tr>'+r.map(c=>`<td>${c}</td>`).join('')+'</tr>').join('');
  return `<table class="ct"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

async function showACPTReport(r) {
  const m = computeACPTMetrics(r);
  if (!m) { alert('試次數量不足，無法產生分析報告。'); return; }

  // ── Build chart sections ──────────────────────────────────────
  const nBlocks = m.blockStats.length;
  const blockLabels = m.blockStats.map((_,i)=>`Block-${i+1}`);
  const BCW=680, BCH=200;  // block charts: wide viewBox, full-width display
  const ICW=280, ICH=180;  // ISI charts: 3-column display

  // Block charts — all bar charts (直方圖)
  const hrtByBlockSvg = svgBarChart(blockLabels, m.blockStats.map(b=>b.hrtMean), BCW, BCH, '#E65C00');
  const hrtBlockTable = chartTable(
    ['', ...blockLabels],
    [['HRT (ms)', ...m.blockStats.map(b=>b.hrtMean!=null?b.hrtMean.toFixed(0):'—')],
     ['HRT SD',   ...m.blockStats.map(b=>b.hrtSD!=null?b.hrtSD.toFixed(0):'—')]]
  );
  const omBlockSvg = svgBarChart(blockLabels, m.blockStats.map(b=>b.omPct), BCW, BCH, '#5B9BD5');
  const omBlockTable = chartTable(
    ['', ...blockLabels],
    [['Omissions (%)', ...m.blockStats.map(b=>b.omPct.toFixed(1))]]
  );
  const coBlockSvg = svgBarChart(blockLabels, m.blockStats.map(b=>b.coPct), BCW, BCH, '#ED7D31');
  const coBlockTable = chartTable(
    ['', ...blockLabels],
    [['Commissions (%)', ...m.blockStats.map(b=>b.coPct.toFixed(1))]]
  );

  // ISI charts — all line charts (折線圖)
  const hrtIsiSvg = svgLineChart(m.isiLabels, m.isiStats.map(s=>s.hrtMean), m.isiStats.map(s=>s.hrtSD), ICW, ICH);
  const hrtIsiTable = chartTable(
    ['', ...m.isiLabels],
    [['HRT (ms)', ...m.isiStats.map(s=>s.hrtMean!=null?s.hrtMean.toFixed(0):'—')],
     ['HRT SD',   ...m.isiStats.map(s=>s.hrtSD!=null?s.hrtSD.toFixed(0):'—')]]
  );
  const omIsiSvg = svgLineChart(m.isiLabels, m.isiStats.map(s=>s.omPct), null, ICW, ICH);
  const omIsiTable = chartTable(
    ['', ...m.isiLabels],
    [['Omissions (%)', ...m.isiStats.map(s=>s.omPct.toFixed(1))]]
  );
  const coIsiSvg = svgLineChart(m.isiLabels, m.isiStats.map(s=>s.coPct), null, ICW, ICH);
  const coIsiTable = chartTable(
    ['', ...m.isiLabels],
    [['Commissions (%)', ...m.isiStats.map(s=>s.coPct.toFixed(1))]]
  );

  // Block: each chart full-width, table below
  function blockChartBox(title, svg, table) {
    return `<div class="chart-blk"><div class="chart-title">${title}</div>${svg}${table}</div>`;
  }
  // ISI: 3-column, table below each
  function isiChartBox(title, svg, table) {
    return `<div class="chart-isi"><div class="chart-title">${title}</div>${svg}${table}</div>`;
  }

  const chartsHTML = `
  <div class="card">
    <h2>表現趨勢圖 — By Block</h2>
    ${blockChartBox('Hit Reaction Time by Block', hrtByBlockSvg, hrtBlockTable)}
    ${blockChartBox('Omissions by Block', omBlockSvg, omBlockTable)}
    ${blockChartBox('Commissions by Block', coBlockSvg, coBlockTable)}
  </div>
  <div class="card">
    <h2>表現趨勢圖 — By ISI</h2>
    <div class="isi-row">
      ${isiChartBox('HRT by ISI', hrtIsiSvg, hrtIsiTable)}
      ${isiChartBox('Omissions by ISI', omIsiSvg, omIsiTable)}
      ${isiChartBox('Commissions by ISI', coIsiSvg, coIsiTable)}
    </div>
  </div>`;
  const CHART_CSS = `
    .chart-blk{background:#EEF7FB;border-radius:10px;padding:14px 16px;margin-bottom:12px;border:1px solid #C8E8F4;page-break-inside:avoid}
    .isi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .chart-isi{background:#EEF7FB;border-radius:10px;padding:12px 10px;border:1px solid #C8E8F4;page-break-inside:avoid}
    .chart-title{font-size:.8rem;font-weight:700;color:#1A2B3C;margin-bottom:6px}
    .ct{width:100%;border-collapse:collapse;font-size:.7rem;margin-top:8px}
    .ct th{background:#4bb9db;color:#fff;padding:4px 6px;text-align:center;font-weight:700}
    .ct td{padding:4px 6px;text-align:center;border-top:1px solid #C8E8F4}
    @media print{.chart-blk,.chart-isi{page-break-inside:avoid}.isi-row{grid-template-columns:repeat(3,1fr)}}
  `;

  const metricDefs = [
    { key:'omissions',   label:'遺漏率 (Omissions)',   unit:'', fmt: v => (v*100).toFixed(1)+'%', raw: m.omissions },
    { key:'commissions', label:'衝動率 (Commissions)',  unit:'', fmt: v => (v*100).toFixed(1)+'%', raw: m.commissions },
    { key:'HRT',         label:'命中反應時間 (HRT)',    unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.HRT },
    { key:'HRTSD',       label:'HRT 標準差 (HRT SD)',  unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.HRTSD },
    { key:'Variability', label:'變異性 (Variability)',  unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.Variability },
    { key:'BlockChange', label:'區塊變化 (Block Change)',unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.BlockChange },
    { key:'ISIChange',   label:'ISI 變化 (ISI Change)', unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.ISIChange },
  ];

  // Compute T-scores via WASM (norms + regression coefficients are inside the binary)
  const _rawMetrics = { omissions:m.omissions, commissions:m.commissions,
    HRT:m.HRT, HRTSD:m.HRTSD, Variability:m.Variability,
    BlockChange:m.BlockChange, ISIChange:m.ISIChange };
  const _tScoreMap = {};
  try {
    JSON.parse(wasm_bindgen.compute_acpt_t_scores(JSON.stringify(_rawMetrics), r.age))
      .forEach(t => { _tScoreMap[t.key] = t; });
  } catch(_) {}

  const tRows = metricDefs.map(({ key, label, fmt, raw }) => {
    const ts = _tScoreMap[key];
    return { key, label, rawStr: raw != null && isFinite(raw) ? fmt(raw) : '—',
             tRaw: ts?.tRaw ?? null, tFinal: ts?.tFinal ?? null };
  });

  const vr = r.is_child ? '兒童版（4–7歲）' : '成人版（8歲+）';
  const gender = { M:'男', F:'女', O:'其他' }[userData.gender] || userData.gender || '';
  const dateStr = r.test_date || '';

  // Build HTML for the T-score bar (visual)
  function tBar(t) {
    if (!isFinite(t)) return '';
    const pct = Math.max(0, Math.min(100, (t - 20) / 60 * 100));
    const col = tInterpretLabel(t).color;
    return `<div style="background:#eee;border-radius:4px;height:10px;width:100%;margin-top:4px">
      <div style="width:${pct.toFixed(1)}%;background:${col};height:10px;border-radius:4px"></div></div>`;
  }

  const metricRowsHTML = tRows.map(row => {
    const interp = tInterpretLabel(row.tFinal);
    const advice = acptAdvice(row.key, row.tFinal);
    return `<tr>
      <td style="padding:10px 12px;font-weight:600">${row.label}</td>
      <td style="padding:10px 12px;text-align:center">${row.rawStr}</td>
      <td style="padding:10px 12px;text-align:center;font-weight:700;color:${interp.color}">${row.tFinal ?? '—'}<br><small style="font-weight:400">${interp.label}</small>
        ${row.tFinal != null ? tBar(row.tFinal) : ''}</td>
      <td style="padding:10px 12px;font-size:0.82rem;line-height:1.5;color:#444">${advice}</td>
    </tr>`;
  }).join('');

  const detectStr = `${m.detectability.toFixed(2)} (${m.Zfalse.toFixed(2)}, ${m.Zhit.toFixed(2)})`;

  const EEG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 501.1 95.2" role="img" aria-label="SIGMACOG EEG Logo">
<defs><style>.els0{fill:#72c4a9}.els1{fill:#faf074}.els2{fill:#e2775a}.els3{fill:#9fc65c}.els4{fill:#c1946b}.els5{fill:#b254b2}.els6{fill:#4bb9db}.els7{fill:#e259b1}</style></defs>
<path d="M153.7,60.2c1,0,2.1-.1,3.1-.4,1-.3,1.9-.7,2.8-1.3.8-.6,1.5-1.3,2-2.1.5-.8.7-1.8.7-2.9s-.3-2.5-1-3.5c-.7-1-1.6-1.9-2.6-2.8-1.1-.8-2.3-1.6-3.7-2.4-1.4-.7-2.8-1.5-4.3-2.2-1.5-.7-2.9-1.5-4.3-2.4-1.4-.8-2.6-1.7-3.7-2.8-1.1-1-2-2.1-2.6-3.4-.7-1.2-1-2.7-1-4.3s.3-3.1.9-4.5c.6-1.4,1.5-2.6,2.7-3.6,1.2-1,2.6-1.8,4.3-2.4s3.7-.9,5.9-.9,3.8.2,5.4.6c1.6.4,3,1.1,4.2,1.9,1.2.8,2.2,1.9,3,3.1.8,1.2,1.5,2.6,2,4.2l-3.7,1.7c-.4-1.3-1-2.5-1.6-3.6-.7-1.1-1.5-2-2.4-2.8-.9-.8-2-1.4-3.2-1.8-1.2-.4-2.6-.6-4.1-.6s-2.5.2-3.5.6c-1,.4-1.8.9-2.5,1.5-.7.6-1.2,1.3-1.5,2.1-.3.8-.5,1.5-.5,2.3s.3,2.1,1,3.1c.7.9,1.6,1.8,2.7,2.6s2.4,1.6,3.9,2.4c1.4.8,2.9,1.5,4.4,2.3,1.5.8,3,1.6,4.4,2.5s2.7,1.8,3.9,2.8c1.1,1,2,2.1,2.7,3.3.7,1.2,1,2.6,1,4.1s-.3,3.3-1,4.8c-.6,1.5-1.6,2.8-2.9,3.9-1.3,1.1-2.9,2-4.8,2.6-1.9.6-4.1,1-6.6,1s-3.9-.2-5.5-.7c-1.6-.4-3-1.1-4.2-2-1.2-.9-2.3-1.9-3.2-3.1s-1.6-2.6-2.1-4.2l3.8-1.6c.4,1.4,1.1,2.6,1.8,3.7.8,1.1,1.6,2,2.6,2.8,1,.8,2.1,1.3,3.3,1.7,1.2.4,2.5.6,3.9.6Z"/>
<path d="M178.3,19.4h7.1v42.5h-7.1V19.4Z"/>
<path d="M221.1,21.5c-2.6,0-4.9.5-7.1,1.4-2.2.9-4,2.2-5.6,3.9-1.6,1.7-2.8,3.8-3.7,6.2-.9,2.4-1.3,5.1-1.3,8.1s.5,5.7,1.4,8.1c1,2.4,2.3,4.4,3.9,6.1s3.6,3,5.8,3.9,4.6,1.4,7.2,1.4,3.5-.3,5-.8c1.5-.5,2.8-1.2,4-2.2v-14.9h-8v-2.5h15.2v18.7c-1.2.7-2.5,1.2-3.7,1.8-1.3.5-2.6.9-4.1,1.3-1.5.3-3.1.6-4.8.8-1.8.2-3.7.3-6,.3s-4.6-.3-6.7-.8c-2.1-.5-4.1-1.3-5.9-2.2-1.8-1-3.4-2.1-4.9-3.4-1.5-1.3-2.7-2.8-3.7-4.4-1-1.6-1.8-3.4-2.4-5.2-.6-1.9-.8-3.8-.8-5.8s.3-3.9.8-5.8c.5-1.9,1.3-3.7,2.3-5.4,1-1.7,2.2-3.2,3.6-4.6s3-2.6,4.8-3.6c1.8-1,3.7-1.8,5.8-2.3,2.1-.6,4.3-.8,6.7-.8s4.3.3,6.2.9c1.9.6,3.7,1.4,5.2,2.4s3,2.2,4.2,3.5,2.3,2.7,3.1,4.1l-3.1,2.1c-1.8-3.4-3.8-6-6-7.5-2.2-1.6-4.7-2.4-7.5-2.4Z"/>
<path d="M249,19.4h7.3l16.5,32.6h.4l16.2-32.6h7.2v42.5h-7.2V27.1h-.2l-17.4,34.8h-1.5l-17.6-34.5h-.5v34.5h-3.2V19.4Z"/>
<path d="M324.7,18.5l20,43.5h-7.3l-6.5-14.2h-18.2l-6.7,14.2h-3.6l20.5-43.5h1.8ZM314,45h15.7l-7.7-16.8-7.9,16.8Z"/>
<path d="M356.2,40.8c0,3,.4,5.6,1.3,8,.9,2.4,2.1,4.4,3.7,6,1.6,1.6,3.4,2.9,5.6,3.8,2.1.9,4.5,1.3,7,1.3s2.9-.3,4.3-.9c1.4-.6,2.7-1.3,3.9-2.3,1.2-.9,2.2-2,3.2-3.1.9-1.2,1.7-2.3,2.3-3.5l3,1.9c-.9,1.4-1.9,2.8-3.1,4.1s-2.6,2.5-4.1,3.5c-1.6,1-3.3,1.8-5.3,2.4-2,.6-4.2.9-6.6.9-3.5,0-6.7-.6-9.6-1.8-2.9-1.2-5.3-2.8-7.4-4.8-2.1-2-3.6-4.4-4.8-7-1.1-2.7-1.7-5.5-1.7-8.5s.3-3.9.8-5.8,1.3-3.7,2.2-5.3c1-1.7,2.2-3.2,3.6-4.6,1.4-1.4,3-2.6,4.7-3.6,1.8-1,3.7-1.8,5.8-2.3,2.1-.5,4.3-.8,6.7-.8s4.4.3,6.3.9c1.9.6,3.7,1.4,5.2,2.4s3,2.2,4.2,3.5,2.3,2.7,3.2,4.1l-3.1,2.1c-1.8-3.4-3.8-6-6-7.5-2.2-1.6-4.7-2.4-7.6-2.4s-4.8.4-6.9,1.3c-2.1.9-4,2.2-5.6,3.8-1.6,1.7-2.8,3.7-3.7,6.1-.9,2.4-1.4,5.1-1.4,8.1Z"/>
<path d="M421.9,62.9c-3.3,0-6.4-.6-9.2-1.8-2.9-1.2-5.3-2.8-7.4-4.8s-3.8-4.4-5-7.1-1.8-5.6-1.8-8.7.3-4,.8-5.9,1.3-3.6,2.3-5.3c1-1.6,2.2-3.1,3.6-4.4,1.4-1.3,3-2.5,4.7-3.4,1.7-1,3.6-1.7,5.6-2.2s4.1-.8,6.3-.8,4.3.3,6.3.8,3.9,1.3,5.6,2.2c1.7,1,3.3,2.1,4.7,3.4,1.4,1.3,2.6,2.8,3.6,4.4,1,1.6,1.8,3.4,2.3,5.3.5,1.9.8,3.8.8,5.9s-.3,4-.8,5.9c-.5,1.9-1.3,3.7-2.3,5.4-1,1.7-2.2,3.2-3.6,4.5-1.4,1.4-3,2.5-4.7,3.5-1.7,1-3.6,1.7-5.6,2.3-2,.5-4.1.8-6.3.8ZM421.9,60.8c2.4,0,4.6-.5,6.5-1.5,1.9-1,3.4-2.4,4.7-4.2,1.3-1.8,2.2-4,2.9-6.4.7-2.5,1-5.2,1-8.1s-.3-5.6-1-8c-.7-2.4-1.6-4.5-2.9-6.3-1.3-1.8-2.9-3.1-4.7-4.1-1.9-1-4-1.5-6.5-1.5s-4.7.5-6.5,1.5c-1.9,1-3.4,2.3-4.7,4.1-1.3,1.8-2.2,3.9-2.9,6.3-.6,2.4-1,5.1-1,8s.3,5.7,1,8.1c.6,2.5,1.6,4.6,2.9,6.4,1.3,1.8,2.8,3.2,4.7,4.2,1.9,1,4,1.5,6.5,1.5Z"/>
<path d="M479.1,21.5c-2.6,0-4.9.5-7.1,1.4-2.2.9-4,2.2-5.6,3.9-1.6,1.7-2.8,3.8-3.7,6.2s-1.3,5.1-1.3,8.1.5,5.7,1.4,8.1c1,2.4,2.3,4.4,3.9,6.1,1.7,1.7,3.6,3,5.8,3.9s4.6,1.4,7.2,1.4,3.5-.3,5-.8c1.5-.5,2.8-1.2,4-2.2v-14.9h-8v-2.5h15.2v18.7c-1.2.7-2.5,1.2-3.7,1.8-1.3.5-2.6.9-4.1,1.3-1.5.3-3.1.6-4.8.8s-3.7.3-6,.3-4.6-.3-6.7-.8-4.1-1.3-5.9-2.2c-1.8-1-3.4-2.1-4.9-3.4-1.5-1.3-2.7-2.8-3.7-4.4-1-1.6-1.8-3.4-2.4-5.2-.6-1.9-.8-3.8-.8-5.8s.3-3.9.8-5.8,1.3-3.7,2.3-5.4,2.2-3.2,3.6-4.6,3-2.6,4.8-3.6,3.7-1.8,5.8-2.3c2.1-.6,4.3-.8,6.7-.8s4.3.3,6.2.9c1.9.6,3.7,1.4,5.2,2.4s3,2.2,4.2,3.5,2.3,2.7,3.1,4.1l-3.1,2.1c-1.8-3.4-3.8-6-6-7.5-2.2-1.6-4.7-2.4-7.5-2.4Z"/>
<g><path class="els3" d="M77.7,5.5c-7.3-.3-9.2,3.9-9.3,4.1,0,.2-.3.4-.5.4-6.9.6-9,2.4-9.5,3.7-.8,2,1.4,4.3,1.4,4.3.2.2.2.4.1.7s-.3.4-.5.4c-4.3.3-7.5,1.7-9.3,4.2-3,4.2-1.7,10.4-1,12.8,1.2,4,0,6.4-1.4,7.8.4.9,2.4,4,8.4,5.6.8-.5,3.4-1.8,6.7-1.8.4,0,.9,0,1.5.1,2.9.4,8.4,1,12.8-2.9,4.7-4.1,7.2-12.2,7.4-24.2,0-.2,0-.4.2-.5.1-.1.3-.2.5-.1,0,0,5.2.6,7.6,0,.5-.1,1.5-.5,2.3-1.4-5.4-5.8-11.2-9.8-16.1-12.6-.4-.2-.9-.5-1.4-.7Z"/>
<path class="els2" d="M48.5,75.6c.9-.8,1.9-1.3,2.9-1.6,5.9-1.8,7.5-4.3,7.8-4.9,0-.1,0-.2,0-.2h0s0,0,.1,0c0,0,0,0,.1,0s0,0,.1,0c0,0,0,0,0,0,4.6,1.7,10.8-.3,15.6-2.3,5-2,9-1.3,10.1-1.1,5-4.6,3.4-9.7,2.8-11.1-6.8,1.1-12-2-12.3-2.2-.3-.2-.4-.5-.3-.8.6-1.6.4-3,.3-3.8-4.5,2.8-9.3,2.2-12.1,1.9-.5,0-1-.1-1.4-.1-3.6,0-6.2,1.7-6.2,1.7-.1,0-.2.1-.4.1s0,0-.2,0c-6.3-1.5-8.6-4.7-9.4-6.1-.8.5-1.5.8-1.5.8,0,0-.2,0-.3,0-16.1-2.7-20.9,12.3-21.1,12.9,0,.1-.1.2-.2.3l-.6.4c-.4,2.5-.8,9.7,7.2,14.4,6.7,4,14.2,2.9,18.3,1.8h0Z"/>
<path class="els6" d="M93.2,21.5c-2.1.6-5.8.4-7.4.2-.3,12-2.9,20.2-7.8,24.4-.2.2-.4.3-.6.5.2.7.6,2.4,0,4.5,1.4.7,5.9,2.7,11.4,1.7.3,0,.5,0,.7.3,0,0,3.8,7-2.8,13,.4.9,2.1,3.3,7.9,4.3.9.2,1.8.3,2.6.5,6.7-1.1,15.8-8.3,11.3-26.9-2.5-10.4-7.2-18.2-12.5-24.2-.7.8-1.7,1.4-2.8,1.7h0Z"/>
<path class="els5" d="M21.8,58.6l.9-.6c.7-1.9,6.3-16.2,22.3-13.6.8-.3,4.6-2,2.9-7.8-.8-2.6-2.2-9.3,1.1-13.9,1.9-2.6,4.9-4.2,9.1-4.7-.7-1.1-1.6-2.9-.9-4.7.9-2.4,4.3-4,10.2-4.5.6-1,2.6-3.9,7.6-4.5C64.1.1,40.9-4.1,19.8,7.7-4.5,21.4-1.8,42.8,3.8,52c4.5,7.4,14.3,7,18,6.6h0Z"/>
<path class="els7" d="M94.4,71.7c-6.7-1.1-8.5-4.1-9-5.2-1-.2-4.7-.9-9.3,1-4.9,2-11.1,4.1-16,2.5-.4,1.2-.9,4.2,2.8,6.9,0,0,0,0,0,0,.3.3,3.2,3.3,3.8,4.6,0,0,0,0,0,0,.4.3,2.8,0,5.1-.5.2,0,.3,0,.5,0l1.4.9c17.7,3,20.2-7.6,20.6-10.4h0Z"/>
<path class="els1" d="M72.1,82.4c-1.4.3-3,.6-4.2.6,1,1.6,2.5,3.9,3,4.8.4.8,0,3.4-.8,6,.6.8.9,1.2.9,1.2,5.9,1.2,6.5-3.4,6.5-3.4-3.7-3.9-4.8-7.5-5.1-9h-.2Z"/>
<path class="els0" d="M57.6,80.3c3.8-.3,5-1.1,5.3-1.5-.3-.3-.5-.6-.8-.8-2.9-2.1-3.6-4.4-3.6-6.2-1.3,1.1-3.4,2.4-6.8,3.5.7,1.4.6,1.9,5.6,4.9,0,0,.1,0,.2.1h0Z"/>
<path class="els4" d="M69.7,88.4c-.7-1.3-3.8-6.1-3.9-6.1h0s0,0,0,0c-.2-.5-1.1-1.4-1.9-2.5-.6.6-1.9,1.3-4.7,1.7,3.6,2.9,7.6,8,9.9,11,.5-2,.8-3.6.6-4h0Z"/></g>
</svg>`;

  const html = `<!DOCTYPE html>
<html lang="zh-TW"><head><meta charset="UTF-8">
<title>BrainQ10 CPTW 注意力評估報告 — ${r.user_name}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI','PingFang TC','Microsoft JhengHei',sans-serif;margin:0;padding:0;background:#F3F6F9;color:#1A2B3C}
  .wrap{max-width:794px;margin:0 auto;padding:20px 16px}
  /* ── Page header ── */
  .rpt-header{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;background:#fff;border-bottom:3px solid #4bb9db;margin-bottom:18px}
  .rpt-tagline{text-align:right;font-size:.75rem;color:#666;line-height:1.5}
  .rpt-tagline strong{display:block;font-size:.85rem;color:#1A2B3C}
  /* ── Cards ── */
  .card{background:#fff;border-radius:10px;padding:22px 26px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.07);border:1px solid #E2EBF0;page-break-inside:avoid}
  /* ── Title block ── */
  .rpt-title{font-size:1.6rem;font-weight:800;color:#1A2B3C;margin:0 0 4px}
  .rpt-subtitle{font-size:.88rem;color:#4bb9db;font-weight:500;margin:0 0 16px}
  /* ── Section h2 ── */
  h2{font-size:1rem;font-weight:800;color:#1A2B3C;margin:0 0 14px;padding-bottom:7px;border-bottom:2px solid #4bb9db;display:flex;align-items:baseline;gap:10px}
  h2 .en{font-size:.75rem;color:#4bb9db;font-weight:400}
  /* ── Info grid ── */
  .info-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px 16px}
  .info-item label{display:block;font-size:.68rem;color:#7a9ab0;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
  .info-item span{font-size:.95rem;font-weight:700;color:#1A2B3C}
  /* ── Detect box ── */
  .detect-box{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;background:#EEF7FB;border-radius:8px;padding:14px 16px;margin-bottom:14px}
  .detect-item label{font-size:.7rem;color:#4bb9db;font-weight:700;display:block;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
  .detect-item span{font-size:1.1rem;font-weight:800;color:#1A2B3C}
  /* ── Raw stats ── */
  .raw-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
  .rs{background:#EEF7FB;border-radius:7px;padding:8px 10px;text-align:center;border:1px solid #C8E8F4}
  .rs label{display:block;font-size:.66rem;color:#4bb9db;font-weight:700;margin-bottom:3px}
  .rs span{display:block;font-size:.98rem;font-weight:800;color:#1A2B3C}
  /* ── T-score table ── */
  table{width:100%;border-collapse:collapse;font-size:.82rem}
  thead tr{background:#4bb9db}
  thead th{background:#4bb9db;padding:9px 11px;text-align:center;font-weight:700;color:#fff;font-size:.73rem;letter-spacing:.04em}
  tbody tr{border-bottom:1px solid #E2EBF0}
  tbody tr:hover{background:#EEF7FB}
  /* ── Footer ── */
  .rpt-footer{text-align:center;padding:20px 0 8px;border-top:1px solid #E2EBF0;margin-top:6px;color:#aaa;font-size:.72rem}
  /* ── Print button ── */
  .btn-print{display:inline-block;padding:10px 26px;background:#4bb9db;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:.92rem;cursor:pointer;margin-bottom:16px}
  /* ── Force background colours in print/PDF ── */
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* ── Print ── */
  @media print{
    @page{size:A4;margin:10mm 13mm}
    body{background:#fff}
    .wrap{padding:0;max-width:100%}
    .rpt-header{margin-bottom:12px}
    .card{box-shadow:none;border:1px solid #dde;padding:14px 18px;margin-bottom:10px;page-break-inside:avoid}
    .no-print{display:none}
    .raw-stats{grid-template-columns:repeat(5,1fr)}
  }
  ${CHART_CSS}
</style></head><body>
<div class="wrap">

  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <div class="rpt-header">
    <div style="width:180px;flex-shrink:0">${EEG_SVG}</div>
    <div class="rpt-tagline"><strong>BrainQ10 CPTW 注意力評估測驗</strong>BrainQ10 Continuous Performance Test Web</div>
    <div id="acpt-qr-box" style="margin-left:auto;text-align:center;flex-shrink:0;padding:6px 0 0 12px">
      <div id="acpt-qr-inner" style="display:inline-flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:0.68rem;color:#64748b;font-weight:600">掃描下載 / Scan</div>
        <div style="width:128px;height:128px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#94a3b8">上傳中…</div>
        <div style="font-size:0.62rem;color:#94a3b8">有效期 48 小時</div>
      </div>
    </div>
  </div>

  <button class="btn-print no-print" onclick="window.print()">🖨 列印 / 儲存 PDF</button>

  <div class="card">
    <div class="rpt-title">注意力評估報告</div>
    <div class="rpt-subtitle">BrainQ10 Continuous Performance Test Web — Assessment Report</div>
    <div class="info-grid">
      <div class="info-item"><label>姓名 Name</label><span>${r.user_name}</span></div>
      <div class="info-item"><label>年齡 Age</label><span>${r.age} 歲（${ageGroup}）</span></div>
      <div class="info-item"><label>性別 Gender</label><span>${gender}</span></div>
      <div class="info-item"><label>測驗版本 Version</label><span>${vr}</span></div>
      <div class="info-item"><label>施測日期 Date</label><span>${dateStr}</span></div>
      <div class="info-item"><label>施測時間 Time</label><span>${r.test_time || '—'}</span></div>
      <div class="info-item"><label>試次總數 Trials</label><span>${r.main_trials || m.nTarg + m.nNtarg}</span></div>
    </div>
  </div>

  <div class="card">
    <h2>行為測量結果 <span class="en">Behavioral Metrics</span></h2>
    <div class="detect-box">
      <div class="detect-item"><label>辨識力 Detectability</label><span>${detectStr}</span></div>
      <div class="detect-item"><label>遺漏 Omissions</label><span>${(m.omissions*100).toFixed(1)}%（${m.nMiss}/${m.nTarg}）</span></div>
      <div class="detect-item"><label>衝動 Commissions</label><span>${(m.commissions*100).toFixed(1)}%（${m.nFA}/${m.nNtarg}）</span></div>
      <div class="detect-item"><label>堅持 Perseverations</label><span>${(m.persevRate*100).toFixed(1)}%（${m.nPersev}/${m.nAllHit}）</span></div>
    </div>
    <div class="raw-stats">
      <div class="rs"><label>命中反應時間 HRT</label><span>${m.HRT != null ? m.HRT.toFixed(1) : '—'} ms</span></div>
      <div class="rs"><label>反應時間標準差 HRT SD</label><span>${m.HRTSD != null ? m.HRTSD.toFixed(1) : '—'} ms</span></div>
      <div class="rs"><label>變異性 Variability</label><span>${m.Variability != null ? m.Variability.toFixed(1) : '—'} ms</span></div>
      <div class="rs"><label>區塊變化 Block Change</label><span>${m.BlockChange.toFixed(1)} ms</span></div>
      <div class="rs"><label>ISI 變化 ISI Change</label><span>${m.ISIChange.toFixed(1)} ms</span></div>
    </div>
  </div>

  <div class="card">
    <h2>T 分數與評估建議 <span class="en">T-Scores &amp; Recommendations（${ageGroup}）</span></h2>
    <table style="table-layout:fixed">
      <colgroup>
        <col style="width:24%">
        <col style="width:13%">
        <col style="width:18%">
        <col>
      </colgroup>
      <thead><tr>
        <th>指標<br>Index</th><th>原始分數<br>Raw Score</th><th>T 分數<br>T-Score</th><th>評估與建議<br>Assessment</th>
      </tr></thead>
      <tbody>${metricRowsHTML}</tbody>
    </table>
  </div>

  ${chartsHTML}

  <div class="rpt-footer">
    <div style="display:inline-block;width:120px;margin-bottom:8px">${EEG_SVG}</div><br>
    本報告依據 Continuous Performance Test（CPT）常模資料結合 AI 演算自動產生，非供醫療診斷之目的，僅做為個人評估之參考。<br>
    <em>This report is automatically generated based on Continuous Performance Test (CPT) normative data combined with AI algorithms. It is not intended for medical diagnosis and should be used solely as a personal assessment reference.</em>
  </div>

</div></body></html>`;

  // Open window immediately (must be in user-gesture context to avoid popup blocker)
  const w = window.open('', '_blank', 'width=960,height=800,scrollbars=yes');
  if (!w) { alert('請允許此頁面開啟新視窗以顯示報告。'); return; }
  w.document.write(html);
  w.document.close();

  // Upload report async → generate QR in the opened window
  try {
    const resp = await fetch(`${ARTISEBIO_API}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html,
    });
    if (!resp.ok) throw new Error('upload failed');
    const { url } = await resp.json();

    // Wait for qrcodejs to load in the new window (CDN script)
    let tries = 0;
    while (!w.QRCode && tries++ < 30) {
      await new Promise(res => setTimeout(res, 200));
    }
    if (!w.QRCode || !w.document) throw new Error('QRCode lib unavailable');

    const inner = w.document.getElementById('acpt-qr-inner');
    if (inner) {
      inner.innerHTML = '<div style="font-size:0.68rem;color:#64748b;font-weight:600;margin-bottom:4px">掃描下載 / Scan to download</div><div id="acpt-qr-canvas"></div><div style="font-size:0.62rem;color:#94a3b8;margin-top:4px">有效期 48 小時 · Expires in 48 h</div>';
      new w.QRCode(w.document.getElementById('acpt-qr-canvas'), {
        text: url,
        width: 128, height: 128,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: w.QRCode.CorrectLevel.H,
      });
    }
  } catch (_e) {
    // Gracefully degrade — report already visible, just no QR
    try {
      const inner = w.document && w.document.getElementById('acpt-qr-inner');
      if (inner) inner.innerHTML = '<div style="font-size:0.68rem;color:#ef4444">QR 產生失敗</div>';
    } catch (_) { /* ignore */ }
  }
}

function exportLegacyCSV(r) {
  // Build timestamp: YYYY_MM_D_HHmmss (month zero-padded, day/hour not padded)
  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = String(now.getMonth() + 1).padStart(2, '0');
  const dy  = now.getDate();
  const hh  = now.getHours();
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const stamp = `${yr}_${mo}_${dy}_${hh}${mm}${ss}`;

  const prefix = r.is_child ? '_PK' : '_PA';
  const mod    = r.is_child ? 'Picture_Kid' : 'Picture_Adult';
  const filename = `${prefix}_${stamp}.csv`;

  const fmt7 = v => v.toFixed(7);

  const lines = [];
  lines.push('Username,Gender,Birthday,Testday,Mod,');
  lines.push(`${r.user_name},${userData.gender || ''},,${stamp},${mod},`);
  lines.push('Type,Event,Time(s),');

  for (const t of r.trials) {
    if (t.stimulus_onset_ms == null) continue;
    if (t.trial.phase !== 'main') continue;  // exclude warmup/cooldown from legacy CSV
    const csvCode = wasm_bindgen.remap_to_csv_code(t.trial.stimulus_code, r.is_child);
    const onsetS  = t.stimulus_onset_ms / 1000;
    lines.push(`Picture,${csvCode},${fmt7(onsetS)},`);

    // First response (if any)
    if (t.response_ms != null) {
      const respS = t.response_ms / 1000;
      lines.push(`Response,OnClick!!,${fmt7(respS)},`);
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
