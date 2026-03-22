/**
 * ACPT – Animal Continuous Performance Test
 * Main application logic (ES module)
 *
 * Timing architecture:
 *   • All timing via performance.now() (sub-millisecond resolution when
 *     COOP/COEP headers are set; else ~1 ms).
 *   • Stimulus onset is captured inside requestAnimationFrame (rAF) callback
 *     right after drawImage() — the closest JS can get to photon emission.
 *   • Keydown timestamps are captured in the event handler itself.
 *   • Inherent display latency ≈ 0–16.7 ms (one monitor refresh at 60 Hz)
 *     is documented in the Excel timing note column.
 *   • A drift-compensated scheduler prevents cumulative setTimeout drift.
 */

import init, { CptTask } from './pkg/acpt_web.js';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ANIMAL_EMOJI = ['🐱','🐶','🐦','🐰','🐘','🦁','🐒','🐻','🦌','🐟'];
const ANIMAL_ZH    = ['貓','狗','鳥','兔子','象','獅子','猴子','熊','鹿','魚'];
const ANIMAL_EN    = ['Cat','Dog','Bird','Rabbit','Elephant','Lion','Monkey','Bear','Deer','Fish'];
const NON_TARGET   = 0;  // Cat index

// Response window: max ms after stimulus onset to accept a response.
// Responses after stimulus disappears but within this window still count.
const RESPONSE_WINDOW_MS = 1000;

// Feedback flash duration (ms)
const FLASH_MS = 150;

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let task        = null;   // CptTask WASM instance
let trials      = [];     // parsed trial objects (all)
let totalTrials = 0;
let currentIdx  = 0;
let taskStartMs = 0;

let awaitingResponse  = false;
let currentTrialIdx   = -1;
let responseGiven     = false;
let responseTimer     = null; // setTimeout handle for response window close

let userData = {};

// ─────────────────────────────────────────────
// DOM helpers
// ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ─────────────────────────────────────────────
// Init WASM
// ─────────────────────────────────────────────
await init();

// ─────────────────────────────────────────────
// Screen 1 – Registration
// ─────────────────────────────────────────────
$('form-register').addEventListener('submit', e => {
  e.preventDefault();
  const name  = $('inp-name').value.trim();
  const pid   = $('inp-id').value.trim();
  const age   = parseInt($('inp-age').value, 10);
  const gender = $('inp-gender').value;
  const note  = $('inp-note').value.trim();

  if (!name || !pid || isNaN(age)) return;

  userData = { name, pid, age, gender, note };

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  task = new CptTask(name, age, dateStr);

  totalTrials = task.get_trial_count();
  const raw    = task.get_all_trials_json();
  trials       = JSON.parse(raw);

  buildInstructions(task.is_child_version());
  showScreen('screen-instructions');
});

// ─────────────────────────────────────────────
// Screen 2 – Instructions
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

  // Build target demo row
  const maxAnimal = isChild ? 5 : 10;
  const row = $('demo-targets');
  row.innerHTML = '';
  for (let i = 1; i < maxAnimal; i++) {
    const div = document.createElement('div');
    div.className = 'demo-target-item';
    div.title = `${ANIMAL_ZH[i]} (${ANIMAL_EN[i]})`;
    div.textContent = ANIMAL_EMOJI[i];
    row.appendChild(div);
  }
}

$('btn-start-task').addEventListener('click', () => {
  showScreen('screen-countdown');
  runCountdown(3, startTask);
});

// ─────────────────────────────────────────────
// Screen 3 – Countdown
// ─────────────────────────────────────────────
function runCountdown(n, cb) {
  $('countdown-num').textContent = n;
  if (n <= 0) { cb(); return; }
  setTimeout(() => runCountdown(n - 1, cb), 900);
}

// ─────────────────────────────────────────────
// Screen 4 – Task
// ─────────────────────────────────────────────
const canvas = $('task-canvas');
const ctx    = canvas.getContext('2d');

// Draw a single animal (emoji) centred on canvas
function drawAnimal(code) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background tint (non-target gets subtle red tint)
  ctx.fillStyle = '#FFF8E7';
  ctx.fillRect(0, 0, W, H);

  // Try image first; fall back to emoji
  const img = animalImages[code];
  if (img && img.complete && img.naturalWidth > 0) {
    const size = Math.min(W, H) * 0.78;
    ctx.drawImage(img, (W - size) / 2, (H - size) / 2, size, size);
  } else {
    ctx.font = `${Math.floor(Math.min(W, H) * 0.62)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ANIMAL_EMOJI[code], W / 2, H / 2 + 8);
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFF8E7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fixation cross
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = '#CCC';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy);
  ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20);
  ctx.stroke();
}

// Pre-load animal images (assets/animals/0.png … 9.png)
const animalImages = {};
for (let i = 0; i < 10; i++) {
  const img = new Image();
  img.src = `assets/animals/${i}.png`;
  animalImages[i] = img;
}

// Drift-compensated scheduler
let scheduleBase   = 0;  // task_start_ms
let scheduleOffset = 0;  // expected ms from task_start at which current step should fire

function scheduleIn(delayMs, cb) {
  const now   = performance.now();
  const elapsed = now - scheduleBase;
  const drift   = elapsed - scheduleOffset;
  const adjusted = Math.max(0, delayMs - drift);
  scheduleOffset += delayMs;
  setTimeout(cb, adjusted);
}

function startTask() {
  showScreen('screen-task');

  taskStartMs    = performance.now();
  scheduleBase   = taskStartMs;
  scheduleOffset = 0;

  task.set_task_start(taskStartMs);

  currentIdx = 0;
  updateHUD();
  clearCanvas();

  document.addEventListener('keydown', onKeydown);
  document.addEventListener('keyup',   onKeyup);

  runTrial(0);
}

function runTrial(idx) {
  if (idx >= totalTrials) { endTask(); return; }
  currentIdx = idx;
  const trial = trials[idx];
  updateHUD();

  // ── ISI: show fixation cross ──
  clearCanvas();
  awaitingResponse = false;
  responseGiven    = false;

  // After ISI, show stimulus in sync with rAF
  scheduleIn(trial.isi_ms, () => {
    requestAnimationFrame(() => {
      // Draw stimulus
      drawAnimal(trial.stimulus_code);

      // Capture onset as close to first pixel as possible
      const onsetMs = performance.now();
      task.record_stimulus_onset(idx, onsetMs);

      currentTrialIdx  = idx;
      awaitingResponse = true;
      responseGiven    = false;

      // Response window: max(duration, RESPONSE_WINDOW_MS) from onset
      const windowMs = Math.max(trial.duration_ms, RESPONSE_WINDOW_MS);

      // Clear stimulus after duration_ms
      scheduleIn(trial.duration_ms, () => {
        requestAnimationFrame(() => clearCanvas());
      });

      // Close response window
      responseTimer = setTimeout(() => {
        awaitingResponse = false;
        task.finalize_trial(idx);

        // Advance to next trial
        scheduleIn(0, () => runTrial(idx + 1));
      }, windowMs);
    });
  });
}

function onKeydown(e) {
  if (e.code !== 'Space' || e.repeat) return;
  e.preventDefault();

  const pressMs = performance.now();

  if (!awaitingResponse || currentTrialIdx < 0) return;
  if (responseGiven) return;  // only one response per trial
  responseGiven = true;

  const rtype = task.record_response(currentTrialIdx, pressMs);

  // Visual feedback on frame
  const frame = $('stage-frame');
  if (rtype === 'hit') {
    frame.classList.add('flash-green');
    setTimeout(() => frame.classList.remove('flash-green'), FLASH_MS);
  } else if (rtype === 'false_alarm' || rtype === 'too_fast') {
    frame.classList.add('flash-red');
    setTimeout(() => frame.classList.remove('flash-red'), FLASH_MS);
  }
}

function onKeyup(e) {
  if (e.code === 'Space') e.preventDefault();
}

function updateHUD() {
  const trial = trials[currentIdx];
  $('hud-remaining').textContent = totalTrials - currentIdx;
  const phaseMap = { warmup: '暖身', main: '主要', cooldown: '緩和' };
  $('hud-phase').textContent = trial ? (phaseMap[trial.phase] || trial.phase) : '—';
}

function endTask() {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('keyup',   onKeyup);
  if (responseTimer) clearTimeout(responseTimer);

  // Collect browser timing info
  const timingNotes = buildTimingNotes();
  task.set_timing_notes(timingNotes);

  const resultsJson = task.get_results_json();
  const results     = JSON.parse(resultsJson);

  // Save to localStorage
  saveToLocalStorage(results);

  // Render results screen
  renderResults(results);
  showScreen('screen-results');
}

// ─────────────────────────────────────────────
// Timing metadata
// ─────────────────────────────────────────────
function buildTimingNotes() {
  const ua       = navigator.userAgent;
  const sab      = typeof SharedArrayBuffer !== 'undefined';
  const perfRes  = estimatePerfResolution();
  const refresh  = estimateRefreshRate();
  return [
    `UA: ${ua}`,
    `SharedArrayBuffer: ${sab ? 'available (high-res timer ~0.005ms)' : 'unavailable (timer ~1ms)'}`,
    `performance.now() estimated resolution: ~${perfRes} ms`,
    `Estimated monitor refresh: ~${refresh} Hz (~${(1000/refresh).toFixed(1)} ms/frame)`,
    `Stimulus onset = performance.now() inside rAF callback after drawImage(); ` +
    `inherent display latency: 0 to ~${(1000/refresh).toFixed(1)} ms (one frame).`,
    `Keypress time = performance.now() at keydown event; keyboard HW latency typically 1–15 ms.`,
    `RT < 100 ms classified as Too Fast / perseveration.`,
  ].join('\n');
}

function estimatePerfResolution() {
  const N = 50;
  let min = Infinity;
  let prev = performance.now();
  for (let i = 0; i < N; i++) {
    const now = performance.now();
    const d = now - prev;
    if (d > 0 && d < min) min = d;
    prev = now;
  }
  return min === Infinity ? '??' : min.toFixed(3);
}

let _refreshEstimate = 60;
(function measureRefresh() {
  let last = performance.now();
  let count = 0;
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
    name: results.user_name, age: results.age, is_child: results.is_child,
    date: results.test_date, omission: results.omission_rate_pct,
    commission: results.commission_rate_pct, mean_rt: results.mean_rt_ms,
  }});
  localStorage.setItem('acpt_sessions', JSON.stringify(store));
  localStorage.setItem(key, JSON.stringify(results));
}

// ─────────────────────────────────────────────
// Screen 5 – Results
// ─────────────────────────────────────────────
function renderResults(r) {
  const summary = [
    { val: r.mean_rt_ms.toFixed(1) + ' ms', label: '平均反應時間' },
    { val: r.sd_rt_ms.toFixed(1)  + ' ms', label: '反應時間標準差' },
    { val: r.median_rt_ms.toFixed(1) + ' ms', label: '中位數 RT' },
    { val: r.omission_rate_pct.toFixed(1) + '%',    label: '遺漏錯誤率' },
    { val: r.commission_rate_pct.toFixed(1) + '%',  label: '誤按錯誤率' },
    { val: r.perseveration_rate_pct.toFixed(1) + '%', label: '持續反應率' },
    { val: r.hits,            label: '正確按鍵 (Hit)' },
    { val: r.misses,          label: '遺漏 (Miss)' },
    { val: r.false_alarms,    label: '誤按 (FA)' },
  ];

  $('results-summary').innerHTML = summary.map(s =>
    `<div class="result-card">
       <div class="rc-val">${s.val}</div>
       <div class="rc-label">${s.label}</div>
     </div>`
  ).join('');

  // Block table
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
    '⏱ 計時說明：刺激呈現時間在 requestAnimationFrame 回調中記錄，' +
    '與實際顯示時間差約 0–16.7 ms（一幀）。按鍵時間在 keydown 事件中記錄，' +
    '鍵盤硬體延遲約 1–15 ms。詳情見 Excel 報告的 timing_notes 欄位。';

  // Wire export button
  $('btn-export').onclick = () => exportExcel(r);
  $('btn-new').onclick    = () => location.reload();
}

// ─────────────────────────────────────────────
// Excel export (SheetJS)
// ─────────────────────────────────────────────
function exportExcel(r) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──
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
    ['═══ 主要階段統計 ═══'],
    ['總試次', r.total_trials],
    ['主要階段試次', r.main_trials],
    ['目標刺激數', r.target_count],
    ['非目標刺激數', r.non_target_count],
    [],
    ['正確按鍵 (Hit)', r.hits],
    ['遺漏 (Miss)', r.misses],
    ['誤按 (False Alarm)', r.false_alarms],
    ['正確不按 (Correct Reject)', r.correct_rejects],
    ['持續反應 (Perseveration, RT<100ms)', r.perseverations],
    [],
    ['遺漏錯誤率 (%)', r.omission_rate_pct.toFixed(2)],
    ['誤按錯誤率 (%)', r.commission_rate_pct.toFixed(2)],
    ['持續反應率 (%)', r.perseveration_rate_pct.toFixed(2)],
    [],
    ['平均反應時間 (ms)', r.mean_rt_ms.toFixed(2)],
    ['反應時間標準差 (ms)', r.sd_rt_ms.toFixed(2)],
    ['中位數反應時間 (ms)', r.median_rt_ms.toFixed(2)],
    [],
    ['═══ 各時段表現 ═══'],
    ['時段','試次數','Hit','Miss','誤按','平均RT(ms)','遺漏%','誤按%'],
    ...r.block_stats.map(b => [
      b.block, b.trials, b.hits, b.misses, b.false_alarms,
      +b.mean_rt_ms.toFixed(2), +b.omission_pct.toFixed(2), +b.commission_pct.toFixed(2),
    ]),
    [],
    ['═══ 計時說明 ═══'],
    ...r.timing_notes.split('\n').map(line => [line]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '摘要');

  // ── Sheet 2: Trial-by-trial data ──
  const headers = [
    '試次編號',
    '階段',
    '刺激代碼',
    '刺激動物(中)',
    '刺激動物(英)',
    '目標(1=是/0=否)',
    'ISI(ms)',
    '刺激時間(ms)',
    '刺激呈現時間_任務開始起(ms)',
    '按鍵時間_任務開始起(ms)',
    '反應時間RT(ms)',
    '反應類型',
    '反應類型說明',
  ];
  const responseTypeZh = {
    hit: '正確按鍵',
    miss: '遺漏',
    false_alarm: '誤按',
    correct_reject: '正確不按',
    too_fast: '持續反應(過快)',
    pending: '未完成',
  };
  const trialRows = r.trials.map(t => [
    t.trial.index + 1,
    t.trial.phase === 'warmup' ? '暖身' : t.trial.phase === 'main' ? '主要' : '緩和',
    t.trial.stimulus_code,
    ANIMAL_ZH[t.trial.stimulus_code]  || '',
    ANIMAL_EN[t.trial.stimulus_code]  || '',
    t.trial.is_target ? 1 : 0,
    t.trial.isi_ms,
    t.trial.duration_ms,
    +t.stimulus_onset_ms.toFixed(3),
    t.response_ms  != null ? +t.response_ms.toFixed(3)       : '',
    t.reaction_time_ms != null ? +t.reaction_time_ms.toFixed(3) : '',
    t.response_type,
    responseTypeZh[t.response_type] || t.response_type,
  ]);

  const wsTrials = XLSX.utils.aoa_to_sheet([headers, ...trialRows]);
  wsTrials['!cols'] = headers.map((h, i) => ({
    wch: [8, 6, 10, 12, 12, 12, 8, 12, 26, 26, 16, 12, 16][i] || 14,
  }));
  XLSX.utils.book_append_sheet(wb, wsTrials, '試次資料');

  // ── Sheet 3: Timing methodology note ──
  const timingNote = [
    ['ACPT 計時方法說明'],
    [],
    ['項目', '說明'],
    ['刺激呈現時間', 'requestAnimationFrame 回調中呼叫 drawImage() 後立即記錄 performance.now()。'],
    ['顯示延遲', '從 JS 記錄時間到光子實際發出：0 ~ 1幀（60Hz=16.7ms, 144Hz=6.9ms）。'],
    ['按鍵時間', 'keydown 事件觸發時記錄 performance.now()。'],
    ['鍵盤硬體延遲', '一般鍵盤 1–15 ms；遊戲鍵盤可低至 1 ms。'],
    ['計時精度', 'SharedArrayBuffer 可用時 ~0.005ms；否則 ~1ms（瀏覽器安全限制）。'],
    ['漂移補償', '使用累積漂移補償排程器，防止 setTimeout 誤差累積。'],
    ['反應時間定義', 'RT = 按鍵時間 − 刺激呈現時間（均以任務開始時間為零點）。'],
    ['持續反應閾值', 'RT < 100 ms 歸類為持續反應（perseveration）。'],
    [],
    ['建議分析注意事項'],
    ['', '1. 若需最高精度，請在具備 COOP/COEP HTTP headers 的本地伺服器執行。'],
    ['', '2. 請記錄顯示器型號與刷新率（見下方 timing_notes）。'],
    ['', '3. 顯示延遲為固定系統誤差，可在組內分析中忽略；但跨裝置比較需注意。'],
    [],
    ['系統資訊'],
    ...r.timing_notes.split('\n').map(line => ['', line]),
  ];
  const wsNote = XLSX.utils.aoa_to_sheet(timingNote);
  wsNote['!cols'] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsNote, '計時說明');

  // ── Download ──
  const filename = `ACPT_${r.test_date}_${userData.pid || r.user_name}.xlsx`;
  XLSX.writeFile(wb, filename);
}
