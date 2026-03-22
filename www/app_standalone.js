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

const $ = id => document.getElementById(id);

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
  if (isChild) {
    box.innerHTML = `
      <p>這個測驗很簡單，你會在螢幕上看到各種 <strong>動物</strong> 出現。</p>
      <p>每次看到動物時，除了看到 <strong>貓咪</strong> 之外，<br>
         都要 <strong>盡快按一下空白鍵</strong>。</p>
      <p>看到貓咪的時候 <strong>不要按</strong>！</p>
      <p>記得：動物消失之後也可以按，只要在下一隻動物出現之前都算有效。</p>
      <p>共有 <strong>${totalTrials} 個試次</strong>，請保持專注！</p>`;
  } else {
    box.innerHTML = `
      <p>本測驗為持續注意力評估作業。</p>
      <p>螢幕上將依序出現 <strong>動物圖案</strong>，請您在看到動物時
         （除了 <strong>貓</strong> 之外）<strong>立即按下空白鍵</strong>。</p>
      <p>看到「貓」時請 <strong>不要按鍵</strong>。</p>
      <p>請在動物消失前盡快反應；動物消失後仍有短暫時間可以按鍵。</p>
      <p>全程共 <strong>${totalTrials} 個試次</strong>，分暖身、主要及緩和三個階段。</p>`;
  }

  const row = $('demo-targets');
  row.innerHTML = '';
  for (let i = 0; i < ANIMAL_EMOJI.length; i++) {
    if (i === NON_TARGET) continue;  // skip the non-target (already shown above)
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
  $('task-hint').innerHTML = isTouch
    ? '點擊螢幕回應目標動物（練習）'
    : '按 <kbd>空白鍵</kbd> 回應目標動物（練習）';

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
  $('hud-phase').textContent = '練習';
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
  div.innerHTML = '<div class="stim-emoji">✅</div><div class="stim-label">練習完成！</div>';
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
  div.innerHTML =
    '<div class="stim-emoji">' + ANIMAL_EMOJI[code] + '</div>' +
    '<div class="stim-label">' + ANIMAL_ZH[code] + '</div>';
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
    '<h2 style="color:#2C1A0E;margin-bottom:24px;font-size:1.4rem">測驗已暫停</h2>' +
    '<button id="btn-resume" style="display:block;width:100%;padding:13px;margin-bottom:12px;' +
    'background:#E65C00;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer">' +
    '▶ 繼續測驗</button>' +
    '<button id="btn-abort" style="display:block;width:100%;padding:13px;' +
    'background:#EEE;color:#333;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer">' +
    '✕ 中斷，回主畫面</button>' +
    '<p style="margin-top:16px;font-size:0.78rem;color:#999">按 P 繼續</p>' +
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
  $('task-hint').innerHTML = isTouch
    ? '點擊螢幕回應目標動物'
    : '按 <kbd>空白鍵</kbd> 回應目標動物';

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
  const phaseMap = { warmup: '暖身', main: '主要', cooldown: '緩和' };
  $('hud-phase').textContent = trial ? (phaseMap[trial.phase] || trial.phase) : '—';
}

function endTask() {
  document.removeEventListener('keydown',   onKeydown);
  document.removeEventListener('keyup',     onKeyup);
  document.removeEventListener('touchstart', onTouch);
  if (responseTimer) clearTimeout(responseTimer);

  task.set_timing_notes(buildTimingNotes());
  const results = JSON.parse(task.get_results_json());

  saveToLocalStorage(results);
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
    { val: r.mean_rt_ms.toFixed(1) + ' ms',  label: '平均反應時間' },
    { val: r.sd_rt_ms.toFixed(1)  + ' ms',   label: '反應時間標準差' },
    { val: r.median_rt_ms.toFixed(1) + ' ms', label: '中位數 RT' },
    { val: r.omission_rate_pct.toFixed(1) + '%',   label: '遺漏錯誤率' },
    { val: r.commission_rate_pct.toFixed(1) + '%',  label: '誤按錯誤率' },
    { val: r.perseveration_rate_pct.toFixed(1) + '%', label: '持續反應率' },
    { val: r.hits,         label: '正確按鍵 (Hit)' },
    { val: r.misses,       label: '遺漏 (Miss)' },
    { val: r.false_alarms, label: '誤按 (FA)' },
  ];

  $('results-summary').innerHTML = summary.map(s =>
    `<div class="result-card">
       <div class="rc-val">${s.val}</div>
       <div class="rc-label">${s.label}</div>
     </div>`
  ).join('');

  const thead = `<tr>
    <th>時段</th><th>試次</th><th>Hit</th><th>Miss</th><th>FA</th>
    <th>平均 RT (ms)</th><th>遺漏 %</th><th>誤按 %</th></tr>`;
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

  $('timing-note').textContent =
    '⏱ 刺激呈現時間在 requestAnimationFrame 回調中記錄，與實際顯示時間差約 0–16.7 ms（一幀）。' +
    '按鍵時間在 keydown 事件中記錄，鍵盤硬體延遲約 1–15 ms。詳情見 Excel 計時說明工作表。';

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
    '<h3 style="margin:0 0 8px;color:#5C3A1E;font-size:1.1rem;">🔒 下載 Excel 報告</h3>' +
    '<p style="margin:0 0 18px;font-size:.88rem;color:#7a6052;">請輸入密碼以下載完整報告</p>' +
    '<input id="pw-input" type="password" placeholder="輸入密碼" ' +
    '  style="width:100%;padding:10px 14px;border:1.5px solid #D8C9BB;border-radius:8px;' +
    '         font-size:.97rem;outline:none;box-sizing:border-box;" />' +
    '<p id="pw-err" style="color:#E53935;font-size:.82rem;margin:8px 0 0;min-height:1.2em;"></p>' +
    '<div style="display:flex;gap:10px;margin-top:18px;">' +
    '  <button id="pw-ok" style="flex:2;padding:11px;background:#E65C00;color:#fff;border:none;' +
    '    border-radius:9px;font-weight:700;font-size:.95rem;cursor:pointer;">確認下載</button>' +
    '  <button id="pw-cancel" style="flex:1;padding:11px;background:#EEE;border:none;' +
    '    border-radius:9px;font-weight:600;cursor:pointer;">取消</button>' +
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
    if (inp.value === 'swlucifer/artise@03-6581157') {
      close();
      exportExcel(r);
    } else {
      err.textContent = '密碼錯誤，請重試';
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

const ACPT_NORMS = {
  '4-5':  {omissions:[0.155,0.062],commissions:[0.151,0.078],HRT:[520,98], HRTSD:[89,32], Variability:[84,36], BlockChange:[-24,10],ISIChange:[-7,8]},
  '6-7':  {omissions:[0.131,0.058],commissions:[0.127,0.072],HRT:[495,91], HRTSD:[82,29], Variability:[77,32], BlockChange:[-21,9], ISIChange:[-6,7]},
  '8-9':  {omissions:[0.092,0.055],commissions:[0.09,0.072], HRT:[441,87], HRTSD:[69,27], Variability:[68,31], BlockChange:[-18,8], ISIChange:[-5,7]},
  '10-11':{omissions:[0.076,0.043],commissions:[0.072,0.063],HRT:[425,79], HRTSD:[63,22], Variability:[60,28], BlockChange:[-16,7], ISIChange:[-4,6]},
  '12-13':{omissions:[0.063,0.039],commissions:[0.065,0.052],HRT:[405,73], HRTSD:[59,20], Variability:[54,25], BlockChange:[-15,6], ISIChange:[-3,6]},
  '14-15':{omissions:[0.048,0.030],commissions:[0.058,0.051],HRT:[388,70], HRTSD:[56,18], Variability:[50,23], BlockChange:[-13,6], ISIChange:[-2,5]},
  '16-17':{omissions:[0.041,0.026],commissions:[0.052,0.048],HRT:[382,65], HRTSD:[54,17], Variability:[47,22], BlockChange:[-12,5], ISIChange:[-2,5]},
  '18-99':{omissions:[0.038,0.023],commissions:[0.049,0.046],HRT:[374,61], HRTSD:[53,16], Variability:[45,21], BlockChange:[-11,5], ISIChange:[-2,5]},
};

function acptRegress(key, X) {
  if (X === undefined || !isFinite(X)) return undefined;
  switch(key) {
    case 'omissions':   return -0.0089*X*X + 1.5198*X + 7.8197;
    case 'commissions': return  0.0006*X*X + 0.3351*X + 21.389;
    case 'HRT':         return -0.0147*X*X + 2.5204*X - 43.465;
    case 'HRTSD':       return -0.0017*X*X + 0.6369*X + 8.4443;
    case 'Variability': return  0.1249*X*X - 6.6492*X + 126.74;
    case 'BlockChange': return -0.0005*X*X + 0.3926*X + 20.722;
    case 'ISIChange':   return  0.000001*X*X + 0.1207*X + 37.44;
    default: return undefined;
  }
}

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
  const meanBlocks = [];
  for (let i = 0; i < stim.length; i += nGroup) {
    const rts = stim.slice(i, i+nGroup).filter(s => s.rtype==='hit').map(s => s.rt*1000);
    meanBlocks.push(isNaN(arrMean(rts)) ? 0 : arrMean(rts));
  }
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
  let isiGroups;
  if (isChild) {
    isiGroups = [stim.filter(s=>s.bd===1.5), stim.filter(s=>s.bd===3.0)];
  } else {
    isiGroups = [stim.filter(s=>s.bd===1.0), stim.filter(s=>s.bd===2.0), stim.filter(s=>s.bd===4.0)];
  }
  const isiMeans = isiGroups.map(g => {
    const rts = g.filter(s=>s.rtype==='hit').map(s=>s.rt*1000);
    return isNaN(arrMean(rts)) ? 0 : arrMean(rts);
  });
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
    meanBlocks, isiMeans,
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

function showACPTReport(r) {
  const m = computeACPTMetrics(r);
  if (!m) { alert('試次數量不足，無法產生分析報告。'); return; }

  const ageGroup = getAgeGroup(r.age);
  const norm = ACPT_NORMS[ageGroup];

  const metricDefs = [
    { key:'omissions',   label:'遺漏率 (Omissions)',   unit:'', fmt: v => (v*100).toFixed(1)+'%', raw: m.omissions },
    { key:'commissions', label:'衝動率 (Commissions)',  unit:'', fmt: v => (v*100).toFixed(1)+'%', raw: m.commissions },
    { key:'HRT',         label:'命中反應時間 (HRT)',    unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.HRT },
    { key:'HRTSD',       label:'HRT 標準差 (HRT SD)',  unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.HRTSD },
    { key:'Variability', label:'變異性 (Variability)',  unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.Variability },
    { key:'BlockChange', label:'區塊變化 (Block Change)',unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.BlockChange },
    { key:'ISIChange',   label:'ISI 變化 (ISI Change)', unit:'ms', fmt: v => v.toFixed(2)+'ms', raw: m.ISIChange },
  ];

  // Compute T-scores
  const tRows = metricDefs.map(({ key, label, fmt, raw }) => {
    const n = norm[key];
    if (raw == null || !isFinite(raw) || !n) return { key, label, rawStr:'—', tRaw:null, tFinal:null };
    const z = (raw - n[0]) / n[1];
    const tRaw = 50 + 10 * z;
    const tFinal = acptRegress(key, tRaw);
    const tF = tFinal != null ? Math.round(tFinal) : null;
    return { key, label, rawStr: fmt(raw), tRaw: tRaw.toFixed(1), tFinal: tF };
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
      <td style="padding:10px 12px;font-weight:600;white-space:nowrap">${row.label}</td>
      <td style="padding:10px 12px;text-align:center">${row.rawStr}</td>
      <td style="padding:10px 12px;text-align:center">${row.tRaw ?? '—'}</td>
      <td style="padding:10px 12px;text-align:center;font-weight:700;color:${interp.color}">${row.tFinal ?? '—'}<br><small style="font-weight:400">${interp.label}</small>
        ${row.tFinal != null ? tBar(row.tFinal) : ''}</td>
      <td style="padding:10px 12px;font-size:0.82rem;line-height:1.5;color:#444">${advice}</td>
    </tr>`;
  }).join('');

  const detectStr = `${m.detectability.toFixed(2)} (${m.Zfalse.toFixed(2)}, ${m.Zhit.toFixed(2)})`;

  const html = `<!DOCTYPE html>
<html lang="zh-TW"><head><meta charset="UTF-8">
<title>ACPT 分析報告 — ${r.user_name}</title>
<style>
  body{font-family:'Segoe UI','PingFang TC','Microsoft JhengHei',sans-serif;margin:0;padding:24px;background:#F5EEE6;color:#2C1A0E;}
  .wrap{max-width:900px;margin:0 auto;}
  .card{background:#fff;border-radius:14px;padding:28px 32px;margin-bottom:20px;box-shadow:0 2px 16px rgba(0,0,0,.08);}
  h1{font-size:1.4rem;color:#5C3A1E;margin:0 0 4px}
  h2{font-size:1.05rem;color:#5C3A1E;margin:0 0 14px;border-bottom:2px solid #F5EEE6;padding-bottom:6px}
  .info-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px 20px;margin-top:14px}
  .info-item label{display:block;font-size:.75rem;color:#7a6052;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .info-item span{font-size:1rem;font-weight:700}
  .detect-box{background:#F5EEE6;border-radius:10px;padding:16px 20px;margin-bottom:14px;display:flex;gap:32px;flex-wrap:wrap}
  .detect-item label{font-size:.78rem;color:#7a6052;font-weight:600;display:block}
  .detect-item span{font-size:1.25rem;font-weight:800;color:#E65C00}
  .raw-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:0}
  .rs{background:#FFF8E7;border-radius:8px;padding:10px 12px;text-align:center}
  .rs label{display:block;font-size:.72rem;color:#7a6052;font-weight:600}
  .rs span{display:block;font-size:1.1rem;font-weight:800;color:#2C1A0E}
  table{width:100%;border-collapse:collapse;font-size:0.88rem}
  thead tr{background:#F8F2EA}
  thead th{padding:10px 12px;text-align:left;font-weight:700;color:#7a6052;font-size:0.78rem;text-transform:uppercase;letter-spacing:.04em}
  tbody tr{border-bottom:1px solid #F5EEE6}
  tbody tr:hover{background:#FDFAF6}
  @media print{body{background:#fff;padding:0}.card{box-shadow:none;border:1px solid #eee}.no-print{display:none}}
  .btn-print{display:inline-block;padding:10px 24px;background:#E65C00;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:.95rem;cursor:pointer;margin-bottom:16px}
</style></head><body>
<div class="wrap">
  <button class="btn-print no-print" onclick="window.print()">🖨 列印 / 儲存 PDF</button>
  <div class="card">
    <h1>🐾 ACPT 動物持續表現測驗 — 分析報告</h1>
    <div class="info-grid">
      <div class="info-item"><label>姓名</label><span>${r.user_name}</span></div>
      <div class="info-item"><label>年齡</label><span>${r.age} 歲（${ageGroup}）</span></div>
      <div class="info-item"><label>性別</label><span>${gender}</span></div>
      <div class="info-item"><label>測驗版本</label><span>${vr}</span></div>
      <div class="info-item"><label>施測日期</label><span>${dateStr}</span></div>
      <div class="info-item"><label>試次總數</label><span>${r.main_trials || m.nTarg + m.nNtarg}</span></div>
    </div>
  </div>

  <div class="card">
    <h2>行為測量結果</h2>
    <div class="detect-box">
      <div class="detect-item"><label>辨識力（Detectability）</label><span>${detectStr}</span></div>
      <div class="detect-item"><label>遺漏（Omissions）</label><span>${(m.omissions*100).toFixed(1)}%（${m.nMiss}/${m.nTarg}）</span></div>
      <div class="detect-item"><label>衝動（Commissions）</label><span>${(m.commissions*100).toFixed(1)}%（${m.nFA}/${m.nNtarg}）</span></div>
      <div class="detect-item"><label>堅持（Perseverations）</label><span>${(m.persevRate*100).toFixed(1)}%（${m.nPersev}/${m.nAllHit}）</span></div>
    </div>
    <div class="raw-stats">
      <div class="rs"><label>HRT (ms)</label><span>${m.HRT != null ? m.HRT.toFixed(2) : '—'}</span></div>
      <div class="rs"><label>HRT SD (ms)</label><span>${m.HRTSD != null ? m.HRTSD.toFixed(2) : '—'}</span></div>
      <div class="rs"><label>Variability (ms)</label><span>${m.Variability != null ? m.Variability.toFixed(2) : '—'}</span></div>
      <div class="rs"><label>Block Change (ms)</label><span>${m.BlockChange.toFixed(2)}</span></div>
      <div class="rs"><label>ISI Change (ms)</label><span>${m.ISIChange.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="card">
    <h2>T 分數與評估建議（年齡組：${ageGroup}）</h2>
    <table>
      <thead><tr>
        <th>指標</th><th>原始分數</th><th>原始 T 分</th><th>回歸後 T 分</th><th>評估與建議</th>
      </tr></thead>
      <tbody>${metricRowsHTML}</tbody>
    </table>
    <p style="margin-top:14px;font-size:.75rem;color:#aaa">T 分數平均 = 50，標準差 = 10。回歸後 T 分以常模進行非線性校正。偏高表示注意力需求增加；HRT 偏低表示反應過快。</p>
  </div>

  <div class="card" style="font-size:.78rem;color:#aaa">
    <p>本報告依據 Animal Continuous Performance Test (ACPT) 常模資料自動產生，僅供臨床參考使用。</p>
  </div>
</div></body></html>`;

  const w = window.open('', '_blank', 'width=960,height=800,scrollbars=yes');
  if (w) { w.document.write(html); w.document.close(); }
  else alert('請允許此頁面開啟新視窗以顯示報告。');
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

  // Code remapping tables (our internal code → original Unity CSV code)
  // Child (from KidMapping.csv): our alphabetical order → original codes
  // our: 0=bird→10, 1=cat→0, 2=chicken→7, 3=cow→5, 4=dog→3,
  //      5=duck→6,  6=elephant→2, 7=monkey→1, 8=pig→9, 9=sheep→8, 10=tiger→4
  const CHILD_REMAP = [10, 0, 7, 5, 3, 6, 2, 1, 9, 8, 4];
  // Adult: our code 11 (貓) → 0; others shifted to avoid 0; no official mapping provided yet
  const ADULT_REMAP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 12, 13, 14, 15];
  const remap = r.is_child ? CHILD_REMAP : ADULT_REMAP;

  const fmt7 = v => v.toFixed(7);

  const lines = [];
  lines.push('Username,Gender,Birthday,Testday,Mod,');
  lines.push(`${r.user_name},${userData.gender || ''},,${stamp},${mod},`);
  lines.push('Type,Event,Time(s),');

  for (const t of r.trials) {
    if (t.stimulus_onset_ms == null) continue;
    if (t.trial.phase !== 'main') continue;  // exclude warmup/cooldown from legacy CSV
    const csvCode = remap[t.trial.stimulus_code] ?? t.trial.stimulus_code;
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
