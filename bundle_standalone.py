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
      <h1>動物持續表現測驗</h1>
      <p class="subtitle">Animal Continuous Performance Test (ACPT)</p>
    </div>
    <form id="form-register" autocomplete="off">
      <div class="field">
        <label for="inp-name">姓名</label>
        <input id="inp-name" type="text" placeholder="請輸入姓名" required>
      </div>
      <div class="field">
        <label for="inp-id">受試者編號</label>
        <input id="inp-id" type="text" placeholder="例：P001" required>
      </div>
      <div class="field">
        <label for="inp-age">年齡（歲）</label>
        <input id="inp-age" type="number" min="4" max="99" placeholder="例：8" required>
      </div>
      <div class="field">
        <label for="inp-gender">性別</label>
        <select id="inp-gender">
          <option value="M">男</option>
          <option value="F">女</option>
          <option value="O">其他</option>
        </select>
      </div>
      <div class="field">
        <label for="inp-note">備註（可留空）</label>
        <input id="inp-note" type="text" placeholder="例：施測地點、特殊情況等">
      </div>
      <button type="submit" class="btn-primary">開始準備 →</button>
    </form>
  </div>
</section>

<!-- ═══ Screen 2: Instructions ═══ -->
<section id="screen-instructions" class="screen">
  <div class="card">
    <h2>測驗說明</h2>
    <div id="instructions-content"></div>
    <div class="target-demo">
      <p class="demo-label">🎯 看到這隻動物時 <strong>不要</strong> 按鍵：</p>
      <div class="demo-animal non-target">🐱</div>
      <p class="demo-name">貓 (Cat) — 非目標</p>
      <p class="demo-label">✅ 看到其他動物時 <strong>按空白鍵</strong>：</p>
      <div class="demo-row" id="demo-targets"></div>
    </div>
    <button id="btn-start-task" class="btn-primary">我準備好了，開始測驗 →</button>
  </div>
</section>

<!-- ═══ Screen 3: Countdown ═══ -->
<section id="screen-countdown" class="screen">
  <div class="countdown-wrap">
    <p>測驗即將開始</p>
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
        <canvas id="task-canvas" width="320" height="320"></canvas>
      </div>
    </div>
    <div class="stage-leg"></div>
    <div class="stage-base"></div>
    <div class="stage-label">動物展示區</div>
  </div>
  <div class="hud">
    <div class="hud-item">
      <span class="hud-label">剩餘試次</span>
      <span class="hud-val" id="hud-remaining">—</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">階段</span>
      <span class="hud-val" id="hud-phase">—</span>
    </div>
  </div>
  <div class="task-hint">按 <kbd>空白鍵</kbd> 回應目標動物</div>
</section>

<!-- ═══ Screen 5: Results ═══ -->
<section id="screen-results" class="screen">
  <div class="results-wrap">
    <h2>測驗完成 🎉</h2>
    <div id="results-summary" class="results-grid"></div>
    <div class="results-blocks">
      <h3>各時段表現</h3>
      <div id="results-blocks-table"></div>
    </div>
    <div class="results-actions">
      <button id="btn-export" class="btn-primary">📥 下載 Excel 報告</button>
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

<!-- SheetJS (inlined) -->
<script>
{xlsx_js}
</script>

<!-- wasm-bindgen glue (no-modules) -->
<script>
{wasm_js}
</script>

<!-- Boot: decode WASM base64 → init wasm_bindgen → run app -->
<script>
(async () => {{
  // Decode inlined WASM
  const b64 = "{wasm_b64}";
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);

  // Initialise wasm_bindgen with the buffer (no fetch needed)
  await wasm_bindgen(buf);

  // Now run the app
  {app_js}
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
