# ACPT — Animal Continuous Performance Test

**動物持續注意力測驗 (Animal CPT Web)**
A fully offline, single-HTML-file continuous performance test for small animals, built with Rust/WebAssembly + plain JavaScript.

---

## Features

- **Fully offline** — single standalone HTML file, no server or internet required
- **Two versions**
  - Child mode (age 4–7): 11 animal stimuli, 200 trials
  - Adult mode (age 8+): 16 animal stimuli, 400 trials
- **Bilingual UI** — Traditional Chinese / English, switchable at any time
- **Rust/WASM core** — trial logic, timing, and scoring compiled from Rust
- **Automated report** — generates a full HTML report with T-scores, block analysis, ISI analysis, and personalized recommendations
- **CSV import** — re-generate reports from legacy `_PK_` / `_PA_` format CSV files
- **CSV export** — download raw trial data after every test session
- **PDF-ready report** — print-color-adjusted CSS for accurate PDF output

---

## Metrics Reported

| Metric | Description |
|--------|-------------|
| **Omission Rate** | Missed target stimuli (%) |
| **Commission Rate** | False alarms on non-target stimuli (%) |
| **Perseveration Rate** | Responses with RT < 100 ms (%) |
| **Hit RT (HRT)** | Mean reaction time for correct responses (ms) |
| **HRT Std Dev** | Variability of correct RT |
| **Variability** | Trial-by-trial RT variability |
| **Block Change** | Attention trend across time blocks |
| **ISI Change** | Effect of inter-stimulus interval on performance |

All metrics are converted to **T-scores** using age-stratified norms (ages 4–5 through 18+).

---

## Quick Start

1. Open `www/ACPT_standalone.html` in any modern browser (Safari, Chrome, Edge)
2. Enter subject name, age, and test date
3. Follow the on-screen instructions to complete the test
4. The report opens automatically in a new tab when the test ends
5. Print or save the report as PDF from the browser

---

## File Structure

```
www/
├── ACPT_standalone.html   ← Standalone output (open this in browser)
├── app_standalone.js      ← Main JS logic (test flow, report, CSV)
├── style.css              ← Stylesheet
├── index.html             ← Dev entry point (requires local server)
├── app.js                 ← Dev JS (references WASM via module)
├── pkg_nm/
│   ├── acpt_web.js        ← wasm-bindgen glue (auto-generated)
│   └── acpt_web_bg.wasm   ← Compiled Rust WASM (auto-generated)
└── assets/
    └── *.png              ← Animal stimulus images

src/
└── lib.rs                 ← Rust source (CptTask WASM interface)

bundle_standalone.py       ← Bundles CSS/JS/WASM into single HTML
build.sh                   ← Builds Rust WASM via wasm-pack
Cargo.toml                 ← Rust project config
```

---

## Development

### Requirements

- [Rust](https://rustup.rs/) + [wasm-pack](https://rustwasm.github.io/wasm-pack/)
- Python 3 (for bundling)

### Rebuild WASM (if `src/lib.rs` changed)

```bash
wasm-pack build --target no-modules --out-dir www/pkg_nm
```

### Bundle standalone HTML (after any JS/CSS change)

```bash
python3 bundle_standalone.py
```

This produces `www/ACPT_standalone.html` — the only file users need.

---

## CSV Import Format

Supports legacy `_PK_` (child) and `_PA_` (adult) CSV files:

```
Row 1: Username,Gender,Birthday,Testday,Mod,
Row 2: name,gender,,YYYY_MM_D_HHmmss,mod,
Row 3: Type,Event,Time(s),
Row 4+: Picture,<code>,<time_s>,  /  Response,OnClick!!,<time_s>,
```

The timestamp in Row 2 is parsed to extract the test date and time shown in the report.

---

## Report Fields

The generated report includes:

- Subject info: name, age, test date, test time, test version
- Summary metrics with T-scores and visual bar indicators
- Block-by-block analysis table (omission %, commission %, mean RT)
- ISI-group analysis table
- Personalized assessment and recommendations (Chinese/English)

---

## License

Copyright © Artise Biomedical Co., Ltd. All rights reserved.
Contact: sales@artisebio.com
