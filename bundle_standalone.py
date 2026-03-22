#!/usr/bin/env python3
"""
Bundles ACPT into a single self-contained HTML file.
The output file can be opened directly in any modern browser (file://).

Run from the acpt-web directory:
    python3 bundle_standalone.py
"""
import base64, pathlib, sys, textwrap

ROOT  = pathlib.Path(__file__).parent
WWW   = ROOT / 'www'
OUT   = WWW / 'ACPT_standalone.html'

def read(path):
    return path.read_text(encoding='utf-8')

def read_bytes_b64(path):
    return base64.b64encode(path.read_bytes()).decode('ascii')

# ── Load assets ──────────────────────────────
print("Reading assets...")
css         = read(WWW / 'style.css')
wasm_b64    = read_bytes_b64(WWW / 'pkg_nm' / 'acpt_web_bg.wasm')
wasm_js     = read(WWW / 'pkg_nm' / 'acpt_web.js')
xlsx_js     = read(WWW / 'xlsx.min.js')
app_js      = read(WWW / 'app_standalone.js')

# ── HTML body (same as index.html but without external links) ─────────────
html_body = """
<!-- ═══ Screen 1: Registration ═══ -->
<section id="screen-register" class="screen active">
  <div class="card">
    <div class="logo-area">
      <div class="logo-icon">🐾</div>
      <h1 id="logo-title">BrainQ10 CPTW 注意力評估測驗</h1>
      <p class="subtitle" id="logo-subtitle">BrainQ10 Continuous Performance Test Web</p>
    </div>
    <div style="text-align:right;margin-bottom:10px;">
      <button id="btn-lang" style="background:none;border:1.5px solid #4bb9db;color:#4bb9db;border-radius:20px;padding:4px 16px;font-size:.85rem;cursor:pointer;font-weight:700;">EN</button>
    </div>
    <form id="form-register" autocomplete="off">
      <div class="field">
        <label for="inp-name" id="label-name">姓名</label>
        <input id="inp-name" type="text" placeholder="請輸入姓名" required>
      </div>
      <div class="field">
        <label for="inp-id" id="label-pid">受試者編號</label>
        <input id="inp-id" type="text" placeholder="例：P001" required>
      </div>
      <div class="field">
        <label for="inp-age" id="label-age">年齡（歲）</label>
        <input id="inp-age" type="number" min="4" max="99" placeholder="例：8" required>
      </div>
      <div class="field">
        <label for="inp-gender" id="label-gender">性別</label>
        <select id="inp-gender">
          <option value="M" id="opt-male">男</option>
          <option value="F" id="opt-female">女</option>
          <option value="O" id="opt-other">其他</option>
        </select>
      </div>
      <div class="field">
        <label for="inp-note" id="label-note">備註（可留空）</label>
        <input id="inp-note" type="text" placeholder="例：施測地點、特殊情況等">
      </div>
      <button type="submit" class="btn-primary" id="btn-submit">進入測驗 →</button>
      <button type="button" id="btn-load-csv" class="btn-secondary" style="width:100%;margin-top:8px;">📂 讀取 CSV 產生報告</button>
      <input type="file" id="csv-file-input" accept=".csv" style="display:none">
    </form>
  </div>
</section>

<!-- ═══ Screen 2: Instructions ═══ -->
<section id="screen-instructions" class="screen">
  <div class="card">
    <h2 id="instr-title">測驗說明</h2>
    <div id="instructions-content"></div>
    <div class="target-demo">
      <p class="demo-label" id="demo-label-nt">🎯 看到這隻動物時 <strong>不要</strong> 按鍵：</p>
      <div class="demo-animal non-target">🐱</div>
      <p class="demo-name" id="demo-name-nt">貓 (Cat) — 非目標</p>
      <p class="demo-label" id="demo-label-t">✅ 看到其他動物時 <strong>按空白鍵</strong>：</p>
      <div class="demo-row" id="demo-targets"></div>
    </div>
    <button id="btn-practice" class="btn-secondary" style="width:100%;margin-top:8px;">🐾 開始練習（1 分鐘）</button>
    <button id="btn-start-task" class="btn-primary" style="margin-top:8px;">我準備好了，開始測驗 →</button>
  </div>
</section>

<!-- ═══ Screen 3: Countdown ═══ -->
<section id="screen-countdown" class="screen">
  <div class="countdown-wrap">
    <p id="countdown-label">測驗即將開始</p>
    <div id="countdown-num">3</div>
  </div>
</section>

<!-- ═══ Screen 4: Task ═══ -->
<section id="screen-task" class="screen">
  <div class="zoo-sky"></div>
  <div class="zoo-trees"></div>
  <div class="zoo-ground"></div>
  <div class="zoo-stage">
    <div class="stage-top">
      <div class="stage-frame" id="stage-frame">
        <div id="stimulus-display" style="display:none;
          width:100%;height:100%;flex-direction:column;
          align-items:center;justify-content:center;
          border-radius:12px;cursor:pointer;"></div>
      </div>
    </div>
    <div class="stage-leg"></div>
    <div class="stage-base"></div>
    <div class="stage-label" id="stage-label">動物展示區</div>
  </div>
  <div class="hud">
    <div class="hud-item">
      <span class="hud-label" id="hud-label-remaining">剩餘試次</span>
      <span class="hud-val" id="hud-remaining">—</span>
    </div>
    <div class="hud-item">
      <span class="hud-label" id="hud-label-phase">階段</span>
      <span class="hud-val" id="hud-phase">—</span>
    </div>
  </div>
  <div class="task-hint" id="task-hint">按 <kbd>空白鍵</kbd> 回應目標動物</div>
</section>

<!-- ═══ Screen 5: Results ═══ -->
<section id="screen-results" class="screen">
  <div class="results-wrap">
    <h2 id="results-title">測驗完成 🎉</h2>
    <div id="results-summary" class="results-grid"></div>
    <div class="results-blocks">
      <h3 id="results-blocks-title">各時段表現</h3>
      <div id="results-blocks-table"></div>
    </div>
    <div class="results-actions">
      <button id="btn-export" class="btn-primary">📥 下載 Excel 報告</button>
      <button id="btn-export-csv" class="btn-secondary">📄 下載 CSV 原始資料</button>
      <button id="btn-report" class="btn-secondary">📊 分析報告</button>
      <button id="btn-new" class="btn-secondary">重新測驗</button>
    </div>
    <p class="timing-note" id="timing-note"></p>
  </div>
</section>
"""

# ── Assemble ──────────────────────────────────
print("Bundling...")
html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACPT 動物持續表現測驗</title>
  <style>
{css}
  </style>
</head>
<body>
{html_body}

<!-- Everything in ONE <script> block to avoid Safari "Script error." sanitisation -->
<script>
(function() {{
  // ── Visible error reporter ────────────────────────────────────────
  function showStartupError(msg, detail) {{
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;background:#c0392b;color:#fff;' +
      'padding:32px;font-family:monospace;font-size:14px;overflow:auto;z-index:9999">' +
      '<h2 style="margin:0 0 12px">Startup Error</h2>' +
      '<b>' + msg + '</b><br><br>' +
      '<pre style="white-space:pre-wrap">' + (detail||'') + '</pre></div>';
  }}

  try {{

    // ── 1. SheetJS ────────────────────────────────────────────────
    {xlsx_js}

    // ── 2. wasm-bindgen glue (no-modules) ────────────────────────
    {wasm_js}

    // ── 3. Decode WASM base64 → Uint8Array ───────────────────────
    var b64 = "{wasm_b64}";
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    // ── 4. Synchronous WASM init (no fetch, works from file://) ──
    wasm_bindgen.initSync({{ module: bytes }});

    // ── 5. App ────────────────────────────────────────────────────
    {app_js}

  }} catch(e) {{
    showStartupError('Caught exception', e.stack || e.message || String(e));
  }}
}})();
</script>

</body>
</html>
"""

OUT.write_text(html, encoding='utf-8')
size_kb = OUT.stat().st_size / 1024
print(f"✅  Written: {OUT}")
print(f"    Size:    {size_kb:.1f} KB ({size_kb/1024:.1f} MB)")
print(f"\nOpen in browser: file://{OUT}")
