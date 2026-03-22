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
