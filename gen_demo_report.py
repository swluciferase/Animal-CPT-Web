#!/usr/bin/env python3
"""Generate BrainQ10 CPTW demo reports — child & adult versions."""
import math, random, os

random.seed(42)

# ── EEG logo SVG ──────────────────────────────────────────────────────────────
EEG_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 501.1 95.2"><defs><style>.els0{fill:#72c4a9}.els1{fill:#faf074}.els2{fill:#e2775a}.els3{fill:#9fc65c}.els4{fill:#c1946b}.els5{fill:#b254b2}.els6{fill:#4bb9db}.els7{fill:#e259b1}</style></defs><path d="M153.7,60.2c1,0,2.1-.1,3.1-.4,1-.3,1.9-.7,2.8-1.3.8-.6,1.5-1.3,2-2.1.5-.8.7-1.8.7-2.9s-.3-2.5-1-3.5c-.7-1-1.6-1.9-2.6-2.8-1.1-.8-2.3-1.6-3.7-2.4-1.4-.7-2.8-1.5-4.3-2.2-1.5-.7-2.9-1.5-4.3-2.4-1.4-.8-2.6-1.7-3.7-2.8-1.1-1-2-2.1-2.6-3.4-.7-1.2-1-2.7-1-4.3s.3-3.1.9-4.5c.6-1.4,1.5-2.6,2.7-3.6,1.2-1,2.6-1.8,4.3-2.4s3.7-.9,5.9-.9,3.8.2,5.4.6c1.6.4,3,1.1,4.2,1.9,1.2.8,2.2,1.9,3,3.1.8,1.2,1.5,2.6,2,4.2l-3.7,1.7c-.4-1.3-1-2.5-1.6-3.6-.7-1.1-1.5-2-2.4-2.8-.9-.8-2-1.4-3.2-1.8-1.2-.4-2.6-.6-4.1-.6s-2.5.2-3.5.6c-1,.4-1.8.9-2.5,1.5-.7.6-1.2,1.3-1.5,2.1-.3.8-.5,1.5-.5,2.3s.3,2.1,1,3.1c.7.9,1.6,1.8,2.7,2.6s2.4,1.6,3.9,2.4c1.4.8,2.9,1.5,4.4,2.3,1.5.8,3,1.6,4.4,2.5s2.7,1.8,3.9,2.8c1.1,1,2,2.1,2.7,3.3.7,1.2,1,2.6,1,4.1s-.3,3.3-1,4.8c-.6,1.5-1.6,2.8-2.9,3.9-1.3,1.1-2.9,2-4.8,2.6-1.9.6-4.1,1-6.6,1s-3.9-.2-5.5-.7c-1.6-.4-3-1.1-4.2-2-1.2-.9-2.3-1.9-3.2-3.1s-1.6-2.6-2.1-4.2l3.8-1.6c.4,1.4,1.1,2.6,1.8,3.7.8,1.1,1.6,2,2.6,2.8,1,.8,2.1,1.3,3.3,1.7,1.2.4,2.5.6,3.9.6Z"/><path d="M178.3,19.4h7.1v42.5h-7.1V19.4Z"/><path d="M221.1,21.5c-2.6,0-4.9.5-7.1,1.4-2.2.9-4,2.2-5.6,3.9-1.6,1.7-2.8,3.8-3.7,6.2-.9,2.4-1.3,5.1-1.3,8.1s.5,5.7,1.4,8.1c1,2.4,2.3,4.4,3.9,6.1s3.6,3,5.8,3.9,4.6,1.4,7.2,1.4,3.5-.3,5-.8c1.5-.5,2.8-1.2,4-2.2v-14.9h-8v-2.5h15.2v18.7c-1.2.7-2.5,1.2-3.7,1.8-1.3.5-2.6.9-4.1,1.3-1.5.3-3.1.6-4.8.8-1.8.2-3.7.3-6,.3s-4.6-.3-6.7-.8c-2.1-.5-4.1-1.3-5.9-2.2-1.8-1-3.4-2.1-4.9-3.4-1.5-1.3-2.7-2.8-3.7-4.4-1-1.6-1.8-3.4-2.4-5.2-.6-1.9-.8-3.8-.8-5.8s.3-3.9.8-5.8c.5-1.9,1.3-3.7,2.3-5.4,1-1.7,2.2-3.2,3.6-4.6s3-2.6,4.8-3.6c1.8-1,3.7-1.8,5.8-2.3,2.1-.6,4.3-.8,6.7-.8s4.3.3,6.2.9c1.9.6,3.7,1.4,5.2,2.4s3,2.2,4.2,3.5,2.3,2.7,3.1,4.1l-3.1,2.1c-1.8-3.4-3.8-6-6-7.5-2.2-1.6-4.7-2.4-7.5-2.4Z"/><path d="M249,19.4h7.3l16.5,32.6h.4l16.2-32.6h7.2v42.5h-7.2V27.1h-.2l-17.4,34.8h-1.5l-17.6-34.5h-.5v34.5h-3.2V19.4Z"/><path d="M324.7,18.5l20,43.5h-7.3l-6.5-14.2h-18.2l-6.7,14.2h-3.6l20.5-43.5h1.8ZM314,45h15.7l-7.7-16.8-7.9,16.8Z"/><path d="M356.2,40.8c0,3,.4,5.6,1.3,8,.9,2.4,2.1,4.4,3.7,6,1.6,1.6,3.4,2.9,5.6,3.8,2.1.9,4.5,1.3,7,1.3s2.9-.3,4.3-.9c1.4-.6,2.7-1.3,3.9-2.3,1.2-.9,2.2-2,3.2-3.1.9-1.2,1.7-2.3,2.3-3.5l3,1.9c-.9,1.4-1.9,2.8-3.1,4.1s-2.6,2.5-4.1,3.5c-1.6,1-3.3,1.8-5.3,2.4-2,.6-4.2.9-6.6.9-3.5,0-6.7-.6-9.6-1.8-2.9-1.2-5.3-2.8-7.4-4.8-2.1-2-3.6-4.4-4.8-7-1.1-2.7-1.7-5.5-1.7-8.5s.3-3.9.8-5.8,1.3-3.7,2.2-5.3c1-1.7,2.2-3.2,3.6-4.6,1.4-1.4,3-2.6,4.7-3.6,1.8-1,3.7-1.8,5.8-2.3,2.1-.5,4.3-.8,6.7-.8s4.4.3,6.3.9c1.9.6,3.7,1.4,5.2,2.4s3,2.2,4.2,3.5,2.3,2.7,3.2,4.1l-3.1,2.1c-1.8-3.4-3.8-6-6-7.5-2.2-1.6-4.7-2.4-7.6-2.4s-4.8.4-6.9,1.3c-2.1.9-4,2.2-5.6,3.8-1.6,1.7-2.8,3.7-3.7,6.1-.9,2.4-1.4,5.1-1.4,8.1Z"/><path d="M421.9,62.9c-3.3,0-6.4-.6-9.2-1.8-2.9-1.2-5.3-2.8-7.4-4.8s-3.8-4.4-5-7.1-1.8-5.6-1.8-8.7.3-4,.8-5.9,1.3-3.6,2.3-5.3c1-1.6,2.2-3.1,3.6-4.4,1.4-1.3,3-2.5,4.7-3.4,1.7-1,3.6-1.7,5.6-2.2s4.1-.8,6.3-.8,4.3.3,6.3.8,3.9,1.3,5.6,2.2c1.7,1,3.3,2.1,4.7,3.4,1.4,1.3,2.6,2.8,3.6,4.4,1,1.6,1.8,3.4,2.3,5.3.5,1.9.8,3.8.8,5.9s-.3,4-.8,5.9c-.5,1.9-1.3,3.7-2.3,5.4-1,1.7-2.2,3.2-3.6,4.5-1.4,1.4-3,2.5-4.7,3.5-1.7,1-3.6,1.7-5.6,2.3-2,.5-4.1.8-6.3.8ZM421.9,60.8c2.4,0,4.6-.5,6.5-1.5,1.9-1,3.4-2.4,4.7-4.2,1.3-1.8,2.2-4,2.9-6.4.7-2.5,1-5.2,1-8.1s-.3-5.6-1-8c-.7-2.4-1.6-4.5-2.9-6.3-1.3-1.8-2.9-3.1-4.7-4.1-1.9-1-4-1.5-6.5-1.5s-4.7.5-6.5,1.5c-1.9,1-3.4,2.3-4.7,4.1-1.3,1.8-2.2,3.9-2.9,6.3-.6,2.4-1,5.1-1,8s.3,5.7,1,8.1c.6,2.5,1.6,4.6,2.9,6.4,1.3,1.8,2.8,3.2,4.7,4.2,1.9,1,4,1.5,6.5,1.5Z"/><path d="M479.1,21.5c-2.6,0-4.9.5-7.1,1.4-2.2.9-4,2.2-5.6,3.9-1.6,1.7-2.8,3.8-3.7,6.2s-1.3,5.1-1.3,8.1.5,5.7,1.4,8.1c1,2.4,2.3,4.4,3.9,6.1,1.7,1.7,3.6,3,5.8,3.9s4.6,1.4,7.2,1.4,3.5-.3,5-.8c1.5-.5,2.8-1.2,4-2.2v-14.9h-8v-2.5h15.2v18.7c-1.2.7-2.5,1.2-3.7,1.8-1.3.5-2.6.9-4.1,1.3-1.5.3-3.1.6-4.8.8s-3.7.3-6,.3-4.6-.3-6.7-.8-4.1-1.3-5.9-2.2c-1.8-1-3.4-2.1-4.9-3.4-1.5-1.3-2.7-2.8-3.7-4.4-1-1.6-1.8-3.4-2.4-5.2-.6-1.9-.8-3.8-.8-5.8s.3-3.9.8-5.8,1.3-3.7,2.3-5.4,2.2-3.2,3.6-4.6,3-2.6,4.8-3.6,3.7-1.8,5.8-2.3c2.1-.6,4.3-.8,6.7-.8s4.3.3,6.2.9c1.9.6,3.7,1.4,5.2,2.4s3,2.2,4.2,3.5,2.3,2.7,3.1,4.1l-3.1,2.1c-1.8-3.4-3.8-6-6-7.5-2.2-1.6-4.7-2.4-7.5-2.4Z"/><g><path class="els3" d="M77.7,5.5c-7.3-.3-9.2,3.9-9.3,4.1,0,.2-.3.4-.5.4-6.9.6-9,2.4-9.5,3.7-.8,2,1.4,4.3,1.4,4.3.2.2.2.4.1.7s-.3.4-.5.4c-4.3.3-7.5,1.7-9.3,4.2-3,4.2-1.7,10.4-1,12.8,1.2,4,0,6.4-1.4,7.8.4.9,2.4,4,8.4,5.6.8-.5,3.4-1.8,6.7-1.8.4,0,.9,0,1.5.1,2.9.4,8.4,1,12.8-2.9,4.7-4.1,7.2-12.2,7.4-24.2,0-.2,0-.4.2-.5.1-.1.3-.2.5-.1,0,0,5.2.6,7.6,0,.5-.1,1.5-.5,2.3-1.4-5.4-5.8-11.2-9.8-16.1-12.6-.4-.2-.9-.5-1.4-.7Z"/><path class="els2" d="M48.5,75.6c.9-.8,1.9-1.3,2.9-1.6,5.9-1.8,7.5-4.3,7.8-4.9,0-.1,0-.2,0-.2h0s0,0,.1,0h0s0,0,.1,0c0,0,0,0,0,0,4.6,1.7,10.8-.3,15.6-2.3,5-2,9-1.3,10.1-1.1,5-4.6,3.4-9.7,2.8-11.1-6.8,1.1-12-2-12.3-2.2-.3-.2-.4-.5-.3-.8.6-1.6.4-3,.3-3.8-4.5,2.8-9.3,2.2-12.1,1.9-.5,0-1-.1-1.4-.1-3.6,0-6.2,1.7-6.2,1.7-.1,0-.2.1-.4.1s0,0-.2,0c-6.3-1.5-8.6-4.7-9.4-6.1-.8.5-1.5.8-1.5.8,0,0-.2,0-.3,0-16.1-2.7-20.9,12.3-21.1,12.9,0,.1-.1.2-.2.3l-.6.4c-.4,2.5-.8,9.7,7.2,14.4,6.7,4,14.2,2.9,18.3,1.8h0Z"/><path class="els6" d="M93.2,21.5c-2.1.6-5.8.4-7.4.2-.3,12-2.9,20.2-7.8,24.4-.2.2-.4.3-.6.5.2.7.6,2.4,0,4.5,1.4.7,5.9,2.7,11.4,1.7.3,0,.5,0,.7.3,0,0,3.8,7-2.8,13,.4.9,2.1,3.3,7.9,4.3.9.2,1.8.3,2.6.5,6.7-1.1,15.8-8.3,11.3-26.9-2.5-10.4-7.2-18.2-12.5-24.2-.7.8-1.7,1.4-2.8,1.7h0Z"/><path class="els5" d="M21.8,58.6l.9-.6c.7-1.9,6.3-16.2,22.3-13.6.8-.3,4.6-2,2.9-7.8-.8-2.6-2.2-9.3,1.1-13.9,1.9-2.6,4.9-4.2,9.1-4.7-.7-1.1-1.6-2.9-.9-4.7.9-2.4,4.3-4,10.2-4.5.6-1,2.6-3.9,7.6-4.5C64.1.1,40.9-4.1,19.8,7.7-4.5,21.4-1.8,42.8,3.8,52c4.5,7.4,14.3,7,18,6.6h0Z"/><path class="els7" d="M94.4,71.7c-6.7-1.1-8.5-4.1-9-5.2-1-.2-4.7-.9-9.3,1-4.9,2-11.1,4.1-16,2.5-.4,1.2-.9,4.2,2.8,6.9,0,0,0,0,0,0,.3.3,3.2,3.3,3.8,4.6,0,0,0,0,0,0,.4.3,2.8,0,5.1-.5.2,0,.3,0,.5,0l1.4.9c17.7,3,20.2-7.6,20.6-10.4h0Z"/><path class="els1" d="M72.1,82.4c-1.4.3-3,.6-4.2.6,1,1.6,2.5,3.9,3,4.8.4.8,0,3.4-.8,6,.6.8.9,1.2.9,1.2,5.9,1.2,6.5-3.4,6.5-3.4-3.7-3.9-4.8-7.5-5.1-9h-.2Z"/><path class="els0" d="M57.6,80.3c3.8-.3,5-1.1,5.3-1.5-.3-.3-.5-.6-.8-.8-2.9-2.1-3.6-4.4-3.6-6.2-1.3,1.1-3.4,2.4-6.8,3.5.7,1.4.6,1.9,5.6,4.9,0,0,.1,0,.2.1h0Z"/><path class="els4" d="M69.7,88.4c-.7-1.3-3.8-6.1-3.9-6.1h0s0,0,0,0c-.2-.5-1.1-1.4-1.9-2.5-.6.6-1.9,1.3-4.7,1.7,3.6,2.9,7.6,8,9.9,11,.5-2,.8-3.6.6-4h0Z"/></g></svg>'

CSS = '''*{box-sizing:border-box}
body{font-family:'Segoe UI','PingFang TC','Microsoft JhengHei',sans-serif;margin:0;padding:0;background:#F3F6F9;color:#1A2B3C}
.wrap{max-width:794px;margin:0 auto;padding:20px 16px}
.rpt-header{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;background:#fff;border-bottom:3px solid #4bb9db;margin-bottom:18px}
.rpt-tagline{text-align:right;font-size:.75rem;color:#666;line-height:1.5}
.rpt-tagline strong{display:block;font-size:.85rem;color:#1A2B3C}
.card{background:#fff;border-radius:10px;padding:22px 26px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.07);border:1px solid #E2EBF0;page-break-inside:avoid}
.rpt-title{font-size:1.6rem;font-weight:800;color:#1A2B3C;margin:0 0 4px}
.rpt-subtitle{font-size:.88rem;color:#4bb9db;font-weight:500;margin:0 0 16px}
h2{font-size:1rem;font-weight:800;color:#1A2B3C;margin:0 0 14px;padding-bottom:7px;border-bottom:2px solid #4bb9db;display:flex;align-items:baseline;gap:10px}
h2 .en{font-size:.75rem;color:#4bb9db;font-weight:400}
.info-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px 16px}
.info-item label{display:block;font-size:.68rem;color:#7a9ab0;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.info-item span{font-size:.95rem;font-weight:700;color:#1A2B3C}
.detect-box{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;background:#EEF7FB;border-radius:8px;padding:14px 16px;margin-bottom:14px}
.detect-item label{font-size:.7rem;color:#4bb9db;font-weight:700;display:block;letter-spacing:.04em;margin-bottom:3px}
.detect-item span{font-size:1.1rem;font-weight:800;color:#1A2B3C}
.raw-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.rs{background:#EEF7FB;border-radius:7px;padding:8px 10px;text-align:center;border:1px solid #C8E8F4}
.rs label{display:block;font-size:.66rem;color:#4bb9db;font-weight:700;margin-bottom:3px}
.rs span{display:block;font-size:.98rem;font-weight:800;color:#1A2B3C}
table{width:100%;border-collapse:collapse;font-size:.82rem}
thead th{background:#4bb9db;padding:9px 11px;text-align:center;font-weight:700;color:#fff;font-size:.73rem;letter-spacing:.04em}
tbody tr{border-bottom:1px solid #E2EBF0}
tbody tr:hover{background:#EEF7FB}
.rpt-footer{text-align:center;padding:20px 0 8px;border-top:1px solid #E2EBF0;margin-top:6px;color:#aaa;font-size:.72rem}
.btn-print{display:inline-block;padding:10px 26px;background:#4bb9db;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:.92rem;cursor:pointer;margin-bottom:16px}
.demo-badge{display:inline-block;background:#FF9800;color:#fff;font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:20px;margin-left:10px;vertical-align:middle}
.chart-blk{background:#EEF7FB;border-radius:10px;padding:14px 16px;margin-bottom:12px;border:1px solid #C8E8F4;page-break-inside:avoid}
.isi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.chart-isi{background:#EEF7FB;border-radius:10px;padding:12px 10px;border:1px solid #C8E8F4;page-break-inside:avoid}
.chart-title{font-size:.8rem;font-weight:700;color:#1A2B3C;margin-bottom:6px}
.ct{width:100%;border-collapse:collapse;font-size:.7rem;margin-top:8px}
.ct th{background:#4bb9db;color:#fff;padding:4px 6px;text-align:center;font-weight:700}
.ct td{padding:4px 6px;text-align:center;border-top:1px solid #C8E8F4}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{
  @page{size:A4;margin:10mm 13mm}
  body{background:#fff}
  .wrap{padding:0;max-width:100%}
  .card{box-shadow:none;border:1px solid #dde;padding:14px 18px;margin-bottom:10px}
  .btn-print{display:none}
  .isi-row{grid-template-columns:repeat(3,1fr)}
}'''

# ── Math helpers ──────────────────────────────────────────────────────────────
def erf_approx(x):
    s = 1 if x>=0 else -1; x=abs(x)
    t=1/(1+0.3275911*x)
    return s*(1-(((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t)*math.exp(-x*x))
def norm_cdf(z): return 0.5*(1+erf_approx(z/math.sqrt(2)))
def mean(a): return sum(a)/len(a) if a else float('nan')
def std_pop(a):
    if not a: return float('nan')
    m=mean(a); return math.sqrt(sum((v-m)**2 for v in a)/len(a))
def get_age_group(age):
    for lim,g in [(5,'4-5'),(7,'6-7'),(9,'8-9'),(11,'10-11'),(13,'12-13'),(15,'14-15'),(17,'16-17')]:
        if age<=lim: return g
    return '18-99'
NORMS = {
    '4-5': {'omissions':[0.155,0.062],'commissions':[0.151,0.078],'HRT':[520,98],'HRTSD':[89,32],'Variability':[84,36],'BlockChange':[-24,10],'ISIChange':[-7,8]},
    '6-7': {'omissions':[0.131,0.058],'commissions':[0.127,0.072],'HRT':[495,91],'HRTSD':[82,29],'Variability':[77,32],'BlockChange':[-21,9],'ISIChange':[-6,7]},
    '8-9': {'omissions':[0.092,0.055],'commissions':[0.09,0.072],'HRT':[441,87],'HRTSD':[69,27],'Variability':[68,31],'BlockChange':[-18,8],'ISIChange':[-5,7]},
    '10-11':{'omissions':[0.076,0.043],'commissions':[0.072,0.063],'HRT':[425,79],'HRTSD':[63,22],'Variability':[60,28],'BlockChange':[-16,7],'ISIChange':[-4,6]},
    '12-13':{'omissions':[0.063,0.039],'commissions':[0.065,0.052],'HRT':[405,73],'HRTSD':[59,20],'Variability':[54,25],'BlockChange':[-15,6],'ISIChange':[-3,6]},
    '14-15':{'omissions':[0.048,0.030],'commissions':[0.058,0.051],'HRT':[388,70],'HRTSD':[56,18],'Variability':[50,23],'BlockChange':[-13,6],'ISIChange':[-2,5]},
    '16-17':{'omissions':[0.041,0.026],'commissions':[0.052,0.048],'HRT':[382,65],'HRTSD':[54,17],'Variability':[47,22],'BlockChange':[-12,5],'ISIChange':[-2,5]},
    '18-99':{'omissions':[0.038,0.023],'commissions':[0.049,0.046],'HRT':[374,61],'HRTSD':[53,16],'Variability':[45,21],'BlockChange':[-11,5],'ISIChange':[-2,5]},
}
def regress(key, X):
    if X is None or not math.isfinite(X): return None
    if key=='omissions':   return -0.0089*X**2+1.5198*X+7.8197
    if key=='commissions': return  0.0006*X**2+0.3351*X+21.389
    if key=='HRT':         return -0.0147*X**2+2.5204*X-43.465
    if key=='HRTSD':       return -0.0017*X**2+0.6369*X+8.4443
    if key=='Variability': return  0.1249*X**2-6.6492*X+126.74
    if key=='BlockChange': return -0.0005*X**2+0.3926*X+20.722
    if key=='ISIChange':   return  0.000001*X**2+0.1207*X+37.44
def t_interp(t):
    if t is None: return '—','#888'
    if t<40: return '顯著偏低','#2196F3'
    if t<=44: return '偏低','#64B5F6'
    if t<=54: return '正常範圍','#43A047'
    if t<=59: return '輕微偏高','#FFA726'
    if t<=69: return '偏高','#EF6C00'
    return '顯著偏高','#C62828'
def acpt_advice(key, tf):
    if tf is None: return '—'
    domain = {'omissions':'不專心程度','commissions':'衝動性','HRT':'反應速度',
              'HRTSD':'反應一致性','Variability':'注意力穩定性','BlockChange':'持續專注力','ISIChange':'警覺性'}.get(key,'—')
    rec = {
        'fastHigh':'速度過快、可能影響穩定性；加入節奏控制與反應抑制練習，如節拍器配合慢速點擊、延遲回應遊戲。',
        'speedOk':'維持目前反應速度；可加入精細動作與注意轉移練習（如視覺搜尋、目標切換）。',
        'slow':'反應偏慢；先做警覺提升與熱身（如眼手協調、視聽雙模刺激），再進行定時反應任務，逐步縮短反應時間。',
        'okFocus':'可加入短時專注維持訓練：如 2–3 分鐘的目標偵測、逐字閱讀標記。',
        'okInhibit':'維持；可輕量融入抑制控制：如 Go/No-Go、等待 3 秒再點擊的節奏練習。',
        'okConsistency':'可加上節拍器下的等節奏反應以維持一致性。',
        'okStability':'維持當下穩定度；可加入分段任務以自我監測波動。',
        'okSustain':'維持；長任務時安排短暫微休息（如 2 分鐘/每 10 分鐘）。',
        'okAlert':'維持；可做不同間隔的反應任務以保持節奏適應。',
        'mildOmit':'採用視覺提示與任務分段，並運用短時集中的「番茄鐘」專注訓練。',
        'mildComm':'加入抑制練習（No-Go/Stop-Signal）、回應前口頭自我指令：「看清楚再按」。',
        'mildHRTSD':'在固定節拍下做持續反應，增加回合數並記錄波動；失焦即暫停整理再續。',
        'mildVar':'先縮短單回合時長（如 2–3 分鐘）再逐步拉長；在區塊間做自評穩定度。',
        'mildBlock':'任務分段並在每段前設定微目標；加入自我提醒卡避免後段疲乏。',
        'mildISI':'做不同 ISI 的隨機化訓練，練習節奏轉換與等待控制。',
        'highOmit':'先降低刺激複雜度並增加外顯提示；採短－休－短循環逐步拉長專注時間。',
        'highComm':'強化抑制與延遲回應；設定明確規則與回饋，必要時加入視覺倒數後才允許反應。',
        'highHRTSD':'以節拍器/計時器做固定節奏反應；每回合後回顧錯誤模式，調整節奏與呼吸。',
        'highVar':'縮短任務、提升回饋頻率；以多段任務+即時自評方式穩定注意波動。',
        'highBlock':'改為更短的 block 並在每段起點做提神程序（深呼吸/伸展），逐段觀察表現漂移。',
        'highISI':'專練不同 ISI 的等待與切換，先固定序列再轉隨機，強化警覺維持。',
    }
    ok_map  = {'omissions':'okFocus','commissions':'okInhibit','HRTSD':'okConsistency',
               'Variability':'okStability','BlockChange':'okSustain','ISIChange':'okAlert'}
    mild_map = {'omissions':'mildOmit','commissions':'mildComm','HRTSD':'mildHRTSD',
                'Variability':'mildVar','BlockChange':'mildBlock','ISIChange':'mildISI'}
    high_map = {'omissions':'highOmit','commissions':'highComm','HRTSD':'highHRTSD',
                'Variability':'highVar','BlockChange':'highBlock','ISIChange':'highISI'}
    if key == 'HRT':
        if tf < 40: return f'{domain}：顯著過快。建議：{rec["fastHigh"]}'
        if tf <= 44: return f'{domain}：輕微過快。建議：{rec["fastHigh"]}'
        if tf <= 54: return f'{domain}：正常範圍。建議：{rec["speedOk"]}'
        if tf <= 59: return f'{domain}：輕微過慢。建議：{rec["slow"]}'
        if tf <= 69: return f'{domain}：過慢。建議：{rec["slow"]}'
        return f'{domain}：顯著過慢。建議：{rec["slow"]}'
    def e(label, kind_map):
        r = rec.get(kind_map.get(key,''),'—')
        return f'{domain}：{label}。建議：{r}'
    if tf < 45:  return e('偏低', ok_map)
    if tf <= 54: return e('正常範圍', ok_map)
    if tf <= 59: return e('輕微過高', mild_map)
    if tf <= 69: return e('過高', mild_map)
    return e('顯著過高', high_map)

# ── SVG helpers ───────────────────────────────────────────────────────────────
def svg_bar(labels, vals, W, H, color):
    ml,mr,mt,mb=44,12,22,36; iw,ih=W-ml-mr,H-mt-mb
    finite=[v for v in vals if v is not None and math.isfinite(v)]
    ym=max(math.ceil(max(finite)/5)*5,5) if finite else 10
    g=bars=xg=''
    for k in range(5):
        y=ih*k/4; v=ym*(1-k/4)
        g+=f'<line x1="0" y1="{y:.1f}" x2="{iw}" y2="{y:.1f}" stroke="#eee" stroke-width="1"/>'
        g+=f'<text x="-4" y="{y+4:.1f}" text-anchor="end" font-size="10" fill="#999">{v:.0f}</text>'
    bw=iw/len(labels)*0.6; sp=iw/len(labels)
    for i,(l,v) in enumerate(zip(labels,vals)):
        vv=v or 0; bh=ih*vv/ym; by=ih-bh; bx=i*sp+sp/2-bw/2
        bars+=f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bw:.1f}" height="{bh:.1f}" fill="{color}" rx="2"/>'
        bars+=f'<text x="{bx+bw/2:.1f}" y="{by-3:.1f}" text-anchor="middle" font-size="9" fill="#555">{vv:.1f}</text>'
        xg+=f'<text x="{i*sp+sp/2:.1f}" y="{ih+14:.1f}" text-anchor="middle" font-size="10" fill="#666">{l}</text>'
    return (f'<svg viewBox="0 0 {W} {H}" width="100%" style="display:block;overflow:visible">'
            f'<g transform="translate({ml},{mt})">{g}{bars}{xg}'
            f'<line x1="0" y1="0" x2="0" y2="{ih}" stroke="#ccc"/>'
            f'<line x1="0" y1="{ih}" x2="{iw}" y2="{ih}" stroke="#ccc"/></g></svg>')

def svg_line(labels, vals, W, H):
    ml,mr,mt,mb=52,12,22,36; iw,ih=W-ml-mr,H-mt-mb
    finite=[v for v in vals if v is not None and math.isfinite(v)]
    if not finite: return f'<svg viewBox="0 0 {W} {H}" width="100%"></svg>'
    yn=math.floor((min(finite)-30)/10)*10; yx=math.ceil((max(finite)+30)/10)*10
    sy=lambda v:ih*(1-(v-yn)/(yx-yn)); sx=lambda i:iw/2 if len(labels)<2 else i*iw/(len(labels)-1)
    g=xg=pts=dots=dlbs=''
    for k in range(5):
        y=ih*k/4; v=yx-(yx-yn)*k/4
        g+=f'<line x1="0" y1="{y:.1f}" x2="{iw}" y2="{y:.1f}" stroke="#eee" stroke-width="1"/>'
        g+=f'<text x="-4" y="{y+4:.1f}" text-anchor="end" font-size="10" fill="#999">{v:.0f}</text>'
    for i,(l,v) in enumerate(zip(labels,vals)):
        xg+=f'<text x="{sx(i):.1f}" y="{ih+14:.1f}" text-anchor="middle" font-size="10" fill="#666">{l}</text>'
        if v is None: continue
        pts+=('M' if not pts else 'L')+f'{sx(i):.1f},{sy(v):.1f} '
        ci=sy(v)
        dots+=f'<circle cx="{sx(i):.1f}" cy="{ci:.1f}" r="4" fill="#4bb9db"/>'
        dlbs+=f'<text x="{sx(i):.1f}" y="{ci-8:.1f}" text-anchor="middle" font-size="9" fill="#555">{v:.0f}</text>'
    return (f'<svg viewBox="0 0 {W} {H}" width="100%" style="display:block;overflow:visible">'
            f'<g transform="translate({ml},{mt})">{g}'
            f'<path d="{pts.strip()}" fill="none" stroke="#4bb9db" stroke-width="2.5" stroke-linejoin="round"/>'
            f'{dots}{dlbs}{xg}'
            f'<line x1="0" y1="0" x2="0" y2="{ih}" stroke="#ccc"/>'
            f'<line x1="0" y1="{ih}" x2="{iw}" y2="{ih}" stroke="#ccc"/></g></svg>')

def ctable(headers, rows):
    ths=''.join(f'<th>{h}</th>' for h in headers)
    trs=''.join('<tr>'+''.join(f'<td>{c}</td>' for c in r)+'</tr>' for r in rows)
    return f'<table class="ct"><thead><tr>{ths}</tr></thead><tbody>{trs}</tbody></table>'

def t_bar(t):
    if t is None or not math.isfinite(t): return ''
    pct=max(0,min(100,(t-20)/60*100)); _,col=t_interp(t)
    return f'<div style="background:#eee;border-radius:4px;height:8px;width:100%;margin-top:4px"><div style="width:{pct:.1f}%;background:{col};height:8px;border-radius:4px"></div></div>'

# ── Report generator ──────────────────────────────────────────────────────────
def generate(is_child, seed_offset=0):
    random.seed(42 + seed_offset)
    age    = 6  if is_child else 25
    name   = '王○○' if is_child else '陳○○'
    gender = 'M'
    n_main = 200 if is_child else 360
    isi_pattern = [1.5, 3.0] if is_child else [1.0, 2.0, 4.0]
    n_group = 40 if is_child else 60
    ver_str = '兒童版（4–7歲）' if is_child else '成人版（8歲+）'
    mean_rt = 510.0 if is_child else 420.0
    sd_rt   = 95.0  if is_child else 82.0
    hit_rate_base = 0.82 if is_child else 0.88
    fa_rate_base  = 0.12 if is_child else 0.08

    stim = []
    for i in range(n_main):
        bd = isi_pattern[i % len(isi_pattern)]
        is_tgt = random.random() < 0.75
        fatigue = (i // n_group) * 0.03
        if is_tgt:
            if random.random() < (hit_rate_base - fatigue):
                rt = max(150, random.gauss(mean_rt + (i//n_group)*10, sd_rt))
                rtype = 'hit'
            else:
                rt, rtype = None, 'miss'
        else:
            if random.random() < (fa_rate_base + fatigue*0.5):
                rt = max(150, random.gauss(mean_rt*0.9, sd_rt*1.2))
                rtype = 'false_alarm'
            else:
                rt, rtype = None, 'no_response'
        stim.append({'is_tgt':is_tgt,'rtype':rtype,'rt':rt,'bd':bd})

    n_targ  = sum(1 for s in stim if s['is_tgt'])
    n_ntarg = sum(1 for s in stim if not s['is_tgt'])
    n_miss  = sum(1 for s in stim if s['rtype']=='miss')
    n_fa    = sum(1 for s in stim if s['rtype']=='false_alarm')
    n_allhit= sum(1 for s in stim if s['rt'] is not None)
    hit_rts = [s['rt'] for s in stim if s['rtype']=='hit']
    omissions   = n_miss/n_targ   if n_targ  else 0
    commissions = n_fa/n_ntarg    if n_ntarg else 0
    hr = (n_targ-n_miss)/n_targ   if n_targ  else 0
    far= n_fa/n_ntarg             if n_ntarg else 0
    Zhit,Zfalse = norm_cdf(hr), norm_cdf(far)
    detectability = -(Zhit-Zfalse)
    HRT, HRTSD = mean(hit_rts), std_pop(hit_rts)

    block_stats=[]
    for bi in range(0,n_main,n_group):
        blk=stim[bi:bi+n_group]
        rts=[s['rt'] for s in blk if s['rtype']=='hit']
        nT=sum(1 for s in blk if s['is_tgt']); nN=sum(1 for s in blk if not s['is_tgt'])
        block_stats.append({'hrtMean':mean(rts) if rts else None,'hrtSD':std_pop(rts) if rts else None,
                            'omPct':sum(1 for s in blk if s['rtype']=='miss')/nT*100 if nT else 0,
                            'coPct':sum(1 for s in blk if s['rtype']=='false_alarm')/nN*100 if nN else 0})
    bm=[b['hrtMean'] or 0 for b in block_stats]
    BlockChange=(bm[-1]-bm[0])/(len(bm)-1) if len(bm)>1 else 0
    sd_blks=[]
    for bi in range(0,n_main,20):
        rts=[s['rt'] for s in stim[bi:bi+20] if s['rtype']=='hit']
        sd=std_pop(rts); sd_blks.append(0 if math.isnan(sd) else sd)
    Variability=std_pop(sd_blks)

    isi_vals = [1.5,3.0] if is_child else [1.0,2.0,4.0]
    isi_labels = ['ISI-1.5s','ISI-3.0s'] if is_child else ['ISI-1.0s','ISI-2.0s','ISI-4.0s']
    isi_stats=[]
    for bd in isi_vals:
        g=[s for s in stim if s['bd']==bd]
        rts=[s['rt'] for s in g if s['rtype']=='hit']
        nT=sum(1 for s in g if s['is_tgt']); nN=sum(1 for s in g if not s['is_tgt'])
        isi_stats.append({'hrtMean':mean(rts) if rts else None,'hrtSD':std_pop(rts) if rts else None,
                          'omPct':sum(1 for s in g if s['rtype']=='miss')/nT*100 if nT else 0,
                          'coPct':sum(1 for s in g if s['rtype']=='false_alarm')/nN*100 if nN else 0})
    im=[g['hrtMean'] or 0 for g in isi_stats]
    ISIChange=(im[-1]-im[0])/(len(im)-1) if len(im)>1 else 0

    age_group=get_age_group(age)
    norm=NORMS[age_group]
    gender_str={'M':'男','F':'女','O':'其他'}.get(gender,gender)

    METRICS=[
        ('omissions',  '遺漏率 Omissions',     f'{omissions*100:.1f}%',  omissions),
        ('commissions','衝動率 Commissions',    f'{commissions*100:.1f}%',commissions),
        ('HRT',        '命中反應時間 HRT',      f'{HRT:.1f} ms',          HRT),
        ('HRTSD',      'HRT 標準差 HRT SD',    f'{HRTSD:.1f} ms',        HRTSD),
        ('Variability','變異性 Variability',    f'{Variability:.1f} ms',  Variability),
        ('BlockChange','區塊變化 Block Change', f'{BlockChange:.1f} ms',  BlockChange),
        ('ISIChange',  'ISI 變化 ISI Change',   f'{ISIChange:.1f} ms',    ISIChange),
    ]

    rows_html=''
    for key,label,raw_str,raw in METRICS:
        n=norm.get(key,[None,1])
        if raw is None or not math.isfinite(raw) or not n[1]:
            rows_html+=f'<tr><td style="padding:10px 12px;font-weight:600">{label}</td><td style="padding:10px 12px;text-align:center">—</td><td style="text-align:center">—</td><td style="padding:10px 12px">—</td></tr>'
            continue
        z=(raw-n[0])/n[1]; t_raw=50+10*z
        tf=regress(key,t_raw)
        tf_c=max(1,min(99,round(tf))) if tf is not None else None
        lbl,col=t_interp(tf_c)
        adv=acpt_advice(key, tf_c)
        bar=t_bar(tf_c)
        rows_html+=f'''<tr>
          <td style="padding:10px 12px;font-weight:600">{label}</td>
          <td style="padding:10px 12px;text-align:center">{raw_str}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:700;color:{col}">{tf_c if tf_c else "—"}<br><small style="font-weight:400">{lbl}</small>{bar}</td>
          <td style="padding:10px 12px;font-size:.81rem;line-height:1.5;color:#444">{adv}</td>
        </tr>'''

    # Charts
    BCW,BCH=680,200; ICW,ICH=280,180
    blk_lbl=[f'Block-{i+1}' for i in range(len(block_stats))]
    hrt_blk=svg_bar(blk_lbl,[b['hrtMean'] for b in block_stats],BCW,BCH,'#E65C00')
    hrt_blk_t=ctable(['']+blk_lbl,[['HRT (ms)']+[f"{b['hrtMean']:.0f}" if b['hrtMean'] else '—' for b in block_stats],
                                    ['HRT SD']+[f"{b['hrtSD']:.0f}" if b['hrtSD'] else '—' for b in block_stats]])
    om_blk=svg_bar(blk_lbl,[b['omPct'] for b in block_stats],BCW,BCH,'#5B9BD5')
    om_blk_t=ctable(['']+blk_lbl,[['Omissions (%)']+[f"{b['omPct']:.1f}" for b in block_stats]])
    co_blk=svg_bar(blk_lbl,[b['coPct'] for b in block_stats],BCW,BCH,'#ED7D31')
    co_blk_t=ctable(['']+blk_lbl,[['Commissions (%)']+[f"{b['coPct']:.1f}" for b in block_stats]])
    hrt_isi=svg_line(isi_labels,[g['hrtMean'] for g in isi_stats],ICW,ICH)
    hrt_isi_t=ctable(['']+isi_labels,[['HRT (ms)']+[f"{g['hrtMean']:.0f}" if g['hrtMean'] else '—' for g in isi_stats],
                                       ['HRT SD']+[f"{g['hrtSD']:.0f}" if g['hrtSD'] else '—' for g in isi_stats]])
    om_isi=svg_line(isi_labels,[g['omPct'] for g in isi_stats],ICW,ICH)
    om_isi_t=ctable(['']+isi_labels,[['Omissions (%)']+[f"{g['omPct']:.1f}" for g in isi_stats]])
    co_isi=svg_line(isi_labels,[g['coPct'] for g in isi_stats],ICW,ICH)
    co_isi_t=ctable(['']+isi_labels,[['Commissions (%)']+[f"{g['coPct']:.1f}" for g in isi_stats]])

    def bblk(title,svg,tbl):
        return f'<div class="chart-blk"><div class="chart-title">{title}</div>{svg}{tbl}</div>'
    def bisi(title,svg,tbl):
        return f'<div class="chart-isi"><div class="chart-title">{title}</div>{svg}{tbl}</div>'

    charts=f'''<div class="card">
  <h2>表現趨勢圖 — By Block <span class="en">Performance by Block</span></h2>
  {bblk("Hit Reaction Time by Block",hrt_blk,hrt_blk_t)}
  {bblk("Omissions by Block",om_blk,om_blk_t)}
  {bblk("Commissions by Block",co_blk,co_blk_t)}
</div>
<div class="card">
  <h2>表現趨勢圖 — By ISI <span class="en">Performance by ISI</span></h2>
  <div class="isi-row">
    {bisi("HRT by ISI",hrt_isi,hrt_isi_t)}
    {bisi("Omissions by ISI",om_isi,om_isi_t)}
    {bisi("Commissions by ISI",co_isi,co_isi_t)}
  </div>
</div>'''

    detect_str=f'{detectability:.2f} ({Zfalse:.2f}, {Zhit:.2f})'

    return f'''<!DOCTYPE html>
<html lang="zh-TW"><head><meta charset="UTF-8">
<title>BrainQ10 CPTW 注意力評估報告（DEMO）— {name}</title>
<style>{CSS}</style></head><body>
<div class="wrap">
  <div class="rpt-header">
    <div style="width:180px;flex-shrink:0">{EEG_SVG}</div>
    <div class="rpt-tagline"><strong>BrainQ10 CPTW 注意力評估測驗</strong>BrainQ10 Continuous Performance Test Web</div>
  </div>

  <button class="btn-print" onclick="window.print()">🖨 列印 / 儲存 PDF</button>

  <div class="card">
    <div class="rpt-title">注意力評估報告 <span class="demo-badge">DEMO 模擬資料</span></div>
    <div class="rpt-subtitle">BrainQ10 Continuous Performance Test — Assessment Report</div>
    <div class="info-grid">
      <div class="info-item"><label>姓名 Name</label><span>{name}</span></div>
      <div class="info-item"><label>年齡 Age</label><span>{age} 歲（{age_group}）</span></div>
      <div class="info-item"><label>性別 Gender</label><span>{gender_str}</span></div>
      <div class="info-item"><label>測驗版本 Version</label><span>{ver_str}</span></div>
      <div class="info-item"><label>施測日期 Date</label><span>2026-03-22</span></div>
      <div class="info-item"><label>試次總數 Trials</label><span>{n_main}</span></div>
    </div>
  </div>

  <div class="card">
    <h2>行為測量結果 <span class="en">Behavioral Metrics</span></h2>
    <div class="detect-box">
      <div class="detect-item"><label>辨識力 Detectability</label><span>{detect_str}</span></div>
      <div class="detect-item"><label>遺漏 Omissions</label><span>{omissions*100:.1f}%（{n_miss}/{n_targ}）</span></div>
      <div class="detect-item"><label>衝動 Commissions</label><span>{commissions*100:.1f}%（{n_fa}/{n_ntarg}）</span></div>
      <div class="detect-item"><label>堅持 Perseverations</label><span>0.0%（0/{n_allhit}）</span></div>
    </div>
    <div class="raw-stats">
      <div class="rs"><label>命中反應時間 HRT</label><span>{HRT:.1f} ms</span></div>
      <div class="rs"><label>反應時間標準差 HRT SD</label><span>{HRTSD:.1f} ms</span></div>
      <div class="rs"><label>變異性 Variability</label><span>{Variability:.1f} ms</span></div>
      <div class="rs"><label>區塊變化 Block Change</label><span>{BlockChange:.1f} ms</span></div>
      <div class="rs"><label>ISI 變化 ISI Change</label><span>{ISIChange:.1f} ms</span></div>
    </div>
  </div>

  <div class="card">
    <h2>T 分數與評估建議 <span class="en">T-Scores &amp; Recommendations（{age_group}）</span></h2>
    <table style="table-layout:fixed">
      <colgroup>
        <col style="width:24%"><col style="width:13%"><col style="width:18%"><col>
      </colgroup>
      <thead><tr>
        <th>指標<br>Index</th><th>原始分數<br>Raw Score</th><th>T 分數<br>T-Score</th><th>評估與建議<br>Assessment</th>
      </tr></thead>
      <tbody>{rows_html}</tbody>
    </table>
  </div>

  {charts}

  <div class="rpt-footer">
    <div style="display:inline-block;width:120px;margin-bottom:8px">{EEG_SVG}</div><br>
    本報告依據 Continuous Performance Test（CPT）常模資料結合 AI 演算自動產生，非供醫療診斷之目的，僅做為個人評估之參考。<br>
    <em>This report is automatically generated based on Continuous Performance Test (CPT) normative data combined with AI algorithms. It is not intended for medical diagnosis and should be used solely as a personal assessment reference.</em>
  </div>
</div></body></html>'''

# ── Generate both versions ────────────────────────────────────────────────────
for is_child, fname in [(True,'/tmp/ACPT_demo_child.html'),(False,'/tmp/ACPT_demo_adult.html')]:
    html = generate(is_child, seed_offset=0 if is_child else 1)
    with open(fname,'w',encoding='utf-8') as f: f.write(html)
    print(f'✅  {fname}  ({os.path.getsize(fname)//1024} KB)')
