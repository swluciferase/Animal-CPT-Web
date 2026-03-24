# ACPT Web — Claude Code 開發說明

## 專案概述
BrainQ10 CPTW 注意力評估測驗（Continuous Performance Test Web）
一個完全離線的單一 HTML 檔案，內嵌 Rust/WASM 核心邏輯。

## 雙資料夾結構
**兩個資料夾必須保持同步：**
- `/Users/swryociao/Documents/GitHub/Animal CPT Web/` — GitHub repo
- `/Users/swryociao/acpt-web/` — 本地開發目錄（含 Rust 原始碼）

修改 JS/CSS 後，兩個資料夾都要更新，並**重新執行 bundle** 產生新的 standalone HTML：
```bash
cd /Users/swryociao/acpt-web && python3 bundle_standalone.py
cp www/ACPT_standalone.html "/Users/swryociao/Documents/GitHub/Animal CPT Web/www/ACPT_standalone.html"
```

## 關鍵檔案
| 檔案 | 說明 |
|------|------|
| `www/app_standalone.js` | 主要 JS 邏輯（測驗流程、報告、CSV 匯入/匯出） |
| `www/style.css` | 全站 CSS |
| `www/ACPT_standalone.html` | **打包輸出** — 勿直接修改，由 bundle_standalone.py 產生 |
| `bundle_standalone.py` | 打包腳本，將 CSS/JS/WASM 嵌入單一 HTML |
| `www/pkg_nm/acpt_web.js` | wasm-bindgen glue JS（勿修改） |
| `www/pkg_nm/acpt_web_bg.wasm` | Rust 編譯的 WASM（勿修改） |
| `src/lib.rs` | Rust 原始碼（需重新編譯才能改 WASM） |

## 架構重點

### JS IIFE 結構
`app_standalone.js` 全部包在 `(function(){...})()` 內，因此：
- inline `onclick="fn()"` 無法存取 IIFE 內的函數
- 必須用 `addEventListener` 綁定事件

### 語言切換
- `LANG` 物件含 `zh`/`en` 兩組字串
- `t(key)` helper 取得當前語言字串
- `applyLang()` 更新所有靜態 DOM 元素
- `curLang` 變數追蹤目前語言（'zh' 或 'en'）

### WASM 介面
- `CptTask` class：`constructor(name, age, date)`、`record_stimulus_onset`、`record_response`、`finalize_trial`、`get_results_json`
- `stimulus_onset_ms` 和 `response_ms` 均為**相對於 task_start 的毫秒數**
- `too_fast` 閾值：RT < 100ms
- 兒童版（age 4–7）：200 試次；成人版（age 8+）：400 試次

### CSV 匯入（Legacy _PK_/_PA_ 格式）
- Row 1: `Username,Gender,Birthday,Testday,Mod,`
- Row 2: `name,gender,,timestamp,mod,`（timestamp 格式 `YYYY_MM_D_HHmmss`）
- Row 3: `Type,Event,Time(s),`
- Row 4+: `Picture,<csvCode>,<time_s>,` 和 `Response,OnClick!!,<time_s>,`
- 非目標動物 csvCode 永遠為 0
- Child REMAP（our→csv）: `[10,0,7,5,3,6,2,1,9,8,4]`
- Adult REMAP（our→csv）: `[1,2,3,4,5,6,7,8,9,10,11,0,12,13,14,15]`

### 報告產生
- `computeACPTMetrics(r)` — 從 trial 資料計算所有指標
- `showACPTReport(r)` — 產生完整 HTML 報告，開新視窗顯示
- `acptAdvice(key, tFinal)` — 依 T 分數給出評估建議
- BlockChange 分組：兒童 nGroup=40，成人 nGroup=60
- ISI 分組：兒童 [1.5s, 3.0s]；成人 [1.0s, 2.0s, 4.0s]（依 onset 差值判斷）

### PDF 列印
CSS 已加入 `*{-webkit-print-color-adjust:exact;print-color-adjust:exact}` 確保底色正常列印。

## 常見修改流程

### 修改 UI 文字
1. 修改 `app_standalone.js` 的 `LANG` 物件（zh/en 各一）
2. 若涉及靜態 HTML 元素，同步修改 `bundle_standalone.py` 的 `html_body`
3. 執行 bundle，同步兩個資料夾

### 修改報告樣式/內容
只需修改 `app_standalone.js` 的 `showACPTReport` 函數，再重新 bundle。

### 修改 WASM 邏輯
需修改 `src/lib.rs`，然後：
```bash
cd /Users/swryociao/acpt-web
wasm-pack build --target no-modules --out-dir www/pkg_nm
```
再重新 bundle。
