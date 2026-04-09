use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};

// ─────────────────────────────────────────────
// Animal code tables
// ─────────────────────────────────────────────

// Adult version (16 animals, sorted alphabetically)
// 0=大象 1=小孩 2=烏鴉 3=牛 4=狗 5=狼 6=猴子 7=獅子 8=羊 9=蛇 10=豬 11=貓(*) 12=雞 13=青蛙 14=鴨子 15=麻雀
pub const ADULT_ANIMAL_ZH: [&str; 16] = [
    "大象","小孩","烏鴉","牛","狗","狼","猴子","獅子",
    "羊",  "蛇",  "豬",  "貓","雞","青蛙","鴨子","麻雀",
];
pub const ADULT_NON_TARGET: u8 = 11; // 貓

// Child version (11 animals, sorted alphabetically by English name)
// 0=bird 1=cat(*) 2=chicken 3=cow 4=dog 5=duck 6=elephant 7=monkey 8=pig 9=sheep 10=tiger
pub const CHILD_ANIMAL_EN: [&str; 11] = [
    "bird","cat","chicken","cow","dog","duck","elephant","monkey","pig","sheep","tiger",
];
pub const CHILD_ANIMAL_ZH: [&str; 11] = [
    "鳥","貓","雞","牛","狗","鴨子","大象","猴子","豬","羊","老虎",
];
pub const CHILD_NON_TARGET: u8 = 1; // cat

// ─────────────────────────────────────────────
// Static trial sequences (from xlsx, column-major order)
// ─────────────────────────────────────────────

struct TrialData {
    animal: u8,
    duration_ms: u32,
    isi_ms: u32,
    is_target: bool,
    phase: &'static str,
}

static ADULT_TRIALS: &[TrialData] = &[
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "warmup" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 10, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 250, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 1750, is_target: false, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 750, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 3500, is_target: false, phase: "main" },
        TrialData { animal: 9, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 1750, is_target: false, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 750, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 250, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 250, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 250, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 1750, is_target: false, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 750, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 750, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 4, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 3500, is_target: false, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 3500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 750, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 750, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 750, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 750, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 750, isi_ms: 1250, is_target: false, phase: "main" },
        TrialData { animal: 0, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 750, is_target: false, phase: "main" },
        TrialData { animal: 7, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 750, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 750, isi_ms: 250, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 250, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 750, is_target: false, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 750, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 750, isi_ms: 250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 750, isi_ms: 250, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 1500, is_target: false, phase: "main" },
        TrialData { animal: 5, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 750, isi_ms: 1750, is_target: false, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 750, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 1500, is_target: false, phase: "main" },
        TrialData { animal: 11, duration_ms: 750, isi_ms: 1750, is_target: false, phase: "main" },
        TrialData { animal: 14, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 750, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 750, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 250, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 750, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 250, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 750, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 750, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 750, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 250, isi_ms: 3250, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 3500, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 750, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 3250, is_target: false, phase: "main" },
        TrialData { animal: 13, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 250, isi_ms: 3500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 250, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 3750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 500, is_target: false, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 14, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 12, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 13, duration_ms: 250, isi_ms: 500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 250, isi_ms: 750, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 250, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 250, isi_ms: 1250, is_target: false, phase: "main" },
        TrialData { animal: 4, duration_ms: 750, isi_ms: 1750, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1250, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 15, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 11, duration_ms: 500, isi_ms: 1500, is_target: false, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "cooldown" },
];

static CHILD_TRIALS: &[TrialData] = &[
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 9, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 3, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 1000, is_target: false, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 1000, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 10, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 7, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 4, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 8, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 0, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 6, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 2, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
        TrialData { animal: 1, duration_ms: 500, isi_ms: 2500, is_target: false, phase: "main" },
        TrialData { animal: 5, duration_ms: 500, isi_ms: 2500, is_target: true, phase: "main" },
];


// ─────────────────────────────────────────────
// Data types
// ─────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Trial {
    pub index: u32,
    pub stimulus_code: u8,
    pub is_target: bool,
    pub isi_ms: f64,
    pub duration_ms: f64,
    pub phase: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrialRecord {
    pub trial: Trial,
    pub stimulus_onset_ms: f64,
    pub response_ms: Option<f64>,
    pub reaction_time_ms: Option<f64>,
    pub response_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct TaskResults {
    pub user_name: String,
    pub age: u32,
    pub is_child: bool,
    pub test_date: String,
    pub total_trials: u32,
    pub main_trials: u32,
    pub target_count: u32,
    pub non_target_count: u32,
    pub hits: u32,
    pub misses: u32,
    pub false_alarms: u32,
    pub correct_rejects: u32,
    pub perseverations: u32,
    pub omission_rate_pct: f64,
    pub commission_rate_pct: f64,
    pub perseveration_rate_pct: f64,
    pub mean_rt_ms: f64,
    pub sd_rt_ms: f64,
    pub median_rt_ms: f64,
    pub block_stats: Vec<BlockStat>,
    pub trials: Vec<TrialRecord>,
    pub timing_notes: String,
}

#[derive(Serialize, Deserialize)]
pub struct BlockStat {
    pub block: String,
    pub trials: u32,
    pub hits: u32,
    pub misses: u32,
    pub false_alarms: u32,
    pub correct_rejects: u32,
    pub mean_rt_ms: f64,
    pub omission_pct: f64,
    pub commission_pct: f64,
}

// ─────────────────────────────────────────────
// Trial sequence construction
// ─────────────────────────────────────────────

fn build_trials(data: &[TrialData]) -> Vec<Trial> {
    data.iter().enumerate().map(|(i, d)| Trial {
        index: i as u32,
        stimulus_code: d.animal,
        is_target: d.is_target,
        isi_ms: d.isi_ms as f64,
        duration_ms: d.duration_ms as f64,
        phase: d.phase.to_string(),
    }).collect()
}

// ─────────────────────────────────────────────
// Statistics helpers
// ─────────────────────────────────────────────

fn mean(v: &[f64]) -> f64 {
    if v.is_empty() { return 0.0; }
    v.iter().sum::<f64>() / v.len() as f64
}

fn sd(v: &[f64]) -> f64 {
    if v.len() < 2 { return 0.0; }
    let m = mean(v);
    let var = v.iter().map(|x| (x - m).powi(2)).sum::<f64>() / (v.len() - 1) as f64;
    var.sqrt()
}

fn median(v: &mut Vec<f64>) -> f64 {
    if v.is_empty() { return 0.0; }
    v.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mid = v.len() / 2;
    if v.len() % 2 == 0 { (v[mid-1]+v[mid])/2.0 } else { v[mid] }
}

fn block_stat(records: &[TrialRecord], label: &str) -> BlockStat {
    let main: Vec<&TrialRecord> = records.iter().filter(|r| r.trial.phase=="main").collect();
    let targets    = main.iter().filter(|r|  r.trial.is_target).count() as u32;
    let non_targets= main.iter().filter(|r| !r.trial.is_target).count() as u32;
    let mut hits=0u32; let mut misses=0u32; let mut fa=0u32; let mut cr=0u32;
    let mut rts: Vec<f64> = Vec::new();
    for r in &main {
        match r.response_type.as_str() {
            "hit"            => { hits+=1; if let Some(rt)=r.reaction_time_ms { rts.push(rt); } }
            "miss"           => misses+=1,
            "false_alarm"    => fa+=1,
            "correct_reject" => cr+=1,
            _ => {}
        }
    }
    BlockStat {
        block: label.to_string(), trials: main.len() as u32,
        hits, misses, false_alarms: fa, correct_rejects: cr,
        mean_rt_ms: mean(&rts),
        omission_pct:   if targets>0     { misses as f64*100.0/targets     as f64 } else { 0.0 },
        commission_pct: if non_targets>0 { fa     as f64*100.0/non_targets as f64 } else { 0.0 },
    }
}

// ─────────────────────────────────────────────
// Main WASM-exported struct
// ─────────────────────────────────────────────

#[wasm_bindgen]
pub struct CptTask {
    user_name: String,
    age: u32,
    is_child: bool,
    trials: Vec<Trial>,
    records: Vec<Option<TrialRecord>>,
    task_start_ms: f64,
    test_date: String,
    timing_notes: String,
}

#[wasm_bindgen]
impl CptTask {
    /// age 4–7 → child (200 trials); age 8+ → adult (400 trials)
    #[wasm_bindgen(constructor)]
    pub fn new(user_name: String, age: u32, test_date: String) -> CptTask {
        console_error_panic_hook::set_once();
        let is_child = age <= 7;
        let trials = if is_child { build_trials(CHILD_TRIALS) } else { build_trials(ADULT_TRIALS) };
        let count = trials.len();
        CptTask {
            user_name, age, is_child, trials,
            records: vec![None; count],
            task_start_ms: 0.0, test_date,
            timing_notes: String::new(),
        }
    }

    pub fn set_task_start(&mut self, ms: f64) { self.task_start_ms = ms; }
    pub fn get_trial_count(&self) -> u32 { self.trials.len() as u32 }
    pub fn is_child_version(&self) -> bool { self.is_child }

    pub fn get_trial_json(&self, index: u32) -> String {
        match self.trials.get(index as usize) {
            Some(t) => serde_json::to_string(t).unwrap_or_default(),
            None    => "{}".to_string(),
        }
    }

    pub fn get_all_trials_json(&self) -> String {
        serde_json::to_string(&self.trials).unwrap_or_default()
    }

    pub fn record_stimulus_onset(&mut self, trial_index: u32, onset_ms: f64) {
        let idx = trial_index as usize;
        if let Some(trial) = self.trials.get(idx) {
            self.records[idx] = Some(TrialRecord {
                trial: trial.clone(),
                stimulus_onset_ms: onset_ms - self.task_start_ms,
                response_ms: None, reaction_time_ms: None,
                response_type: "pending".to_string(),
            });
        }
    }

    pub fn has_response(&self, trial_index: u32) -> bool {
        match self.records.get(trial_index as usize) {
            Some(Some(r)) => r.response_ms.is_some(),
            _ => false,
        }
    }

    pub fn record_response(&mut self, trial_index: u32, response_ms: f64) -> String {
        let idx = trial_index as usize;
        if let Some(Some(record)) = self.records.get_mut(idx) {
            if record.response_ms.is_some() { return "already_responded".to_string(); }
            let abs_ms = response_ms - self.task_start_ms;
            let rt     = abs_ms - record.stimulus_onset_ms;
            let rtype  = if rt < 100.0 { "too_fast" }
                         else if record.trial.is_target { "hit" }
                         else { "false_alarm" };
            record.response_ms      = Some(abs_ms);
            record.reaction_time_ms = Some(rt);
            record.response_type    = rtype.to_string();
            rtype.to_string()
        } else { "error".to_string() }
    }

    pub fn finalize_trial(&mut self, trial_index: u32) {
        let idx = trial_index as usize;
        if let Some(Some(record)) = self.records.get_mut(idx) {
            if record.response_type == "pending" {
                record.response_type = if record.trial.is_target {
                    "miss".to_string()
                } else { "correct_reject".to_string() };
            }
        }
    }

    pub fn set_timing_notes(&mut self, notes: String) { self.timing_notes = notes; }

    pub fn get_results_json(&self) -> String {
        let all_records: Vec<TrialRecord> = self.records.iter().flatten().cloned().collect();
        let main_records: Vec<&TrialRecord> = all_records.iter()
            .filter(|r| r.trial.phase=="main").collect();

        let target_count     = main_records.iter().filter(|r|  r.trial.is_target).count() as u32;
        let non_target_count = main_records.iter().filter(|r| !r.trial.is_target).count() as u32;

        let mut hits=0u32; let mut misses=0u32; let mut false_alarms=0u32;
        let mut correct_rejects=0u32; let mut perseverations=0u32;
        let mut rt_vals: Vec<f64> = Vec::new();

        for r in &main_records {
            match r.response_type.as_str() {
                "hit"            => { hits+=1; if let Some(rt)=r.reaction_time_ms { rt_vals.push(rt); } }
                "miss"           => misses+=1,
                "false_alarm"    => false_alarms+=1,
                "correct_reject" => correct_rejects+=1,
                "too_fast"       => perseverations+=1,
                _ => {}
            }
        }

        let omission_rate      = if target_count>0     { misses       as f64*100.0/target_count     as f64 } else {0.0};
        let commission_rate    = if non_target_count>0 { false_alarms as f64*100.0/non_target_count as f64 } else {0.0};
        let perseveration_rate = if target_count>0     { perseverations as f64*100.0/target_count   as f64 } else {0.0};

        let mean_rt = mean(&rt_vals);
        let sd_rt   = sd(&rt_vals);
        let mut rt_sorted = rt_vals.clone();
        let med_rt  = median(&mut rt_sorted);

        let main_owned: Vec<TrialRecord> = main_records.iter().map(|r|(*r).clone()).collect();
        let third = (main_owned.len()/3).max(1);
        let b1 = block_stat(&main_owned[..third.min(main_owned.len())], "早期");
        let b2 = block_stat(&main_owned[(third).min(main_owned.len())..(2*third).min(main_owned.len())], "中期");
        let b3 = block_stat(&main_owned[(2*third).min(main_owned.len())..], "後期");

        let results = TaskResults {
            user_name: self.user_name.clone(), age: self.age, is_child: self.is_child,
            test_date: self.test_date.clone(),
            total_trials: self.trials.len() as u32, main_trials: main_records.len() as u32,
            target_count, non_target_count, hits, misses, false_alarms, correct_rejects, perseverations,
            omission_rate_pct: omission_rate, commission_rate_pct: commission_rate,
            perseveration_rate_pct: perseveration_rate,
            mean_rt_ms: mean_rt, sd_rt_ms: sd_rt, median_rt_ms: med_rt,
            block_stats: vec![b1,b2,b3], trials: all_records,
            timing_notes: self.timing_notes.clone(),
        };
        serde_json::to_string(&results).unwrap_or_default()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Normative T-score computation — GAMLSS continuous model
// mu(age)    = a * exp(-b * age) + c
// sigma(age) = a * exp(-b * age) + c
// age clamped to [4.0, 25.0] (adults ≥18 anchored at 25-year baseline)
// metric order: omissions, commissions, HRT(ms), HRTSD(ms), Variability(ms),
//               BlockChange(ms), ISIChange(ms)
// ─────────────────────────────────────────────────────────────────────────────

const METRIC_KEYS: [&str; 7] = [
    "omissions","commissions","HRT","HRTSD","Variability","BlockChange","ISIChange",
];

// Fitted exponential decay params: ([a_mu, b_mu, c_mu], [a_sigma, b_sigma, c_sigma])
// Fitted from 8-point normative table (age midpoints 4.5–25.0) via scipy curve_fit.
const GAMLSS_PARAMS: &[(&str, [f64; 3], [f64; 3])] = &[
    ("omissions",   [ 0.2840255, 0.1727798,  0.0291572], [0.0802068, 0.0887475,  0.0114969]),
    ("commissions", [ 0.2824441, 0.2086317,  0.0445168], [0.0670958, 0.1083707,  0.0390588]),
    ("HRT",         [348.6010694, 0.1682010, 363.3327053], [71.4898476, 0.1021172, 54.0657428]),
    ("HRTSD",       [ 93.1769796, 0.1869642,  50.5952762], [34.5187831, 0.1318887, 13.8075427]),
    ("Variability", [ 86.1595572, 0.1428131,  40.6128179], [30.3429557, 0.1221945, 18.8015235]),
    ("BlockChange", [-27.0784366, 0.1415486,  -9.8915930], [10.8975794, 0.1392584,  4.3898895]),
    ("ISIChange",   [-11.7573017, 0.1483993,  -1.2716793], [ 6.5026453, 0.1407894,  4.5880394]),
];

/// Returns (mu, sigma) for a given metric at a continuous age.
fn gamlss_norm(key: &str, age: f64) -> Option<(f64, f64)> {
    let age_eff = age.clamp(4.0, 25.0);
    let p = GAMLSS_PARAMS.iter().find(|(k, _, _)| *k == key)?;
    let [am, bm, cm] = p.1;
    let [a_s, b_s, c_s] = p.2;
    let mu    = am * (-bm * age_eff).exp() + cm;
    let sigma = a_s * (-b_s * age_eff).exp() + c_s;
    Some((mu, sigma))
}

fn acpt_regress(key: &str, x: f64) -> Option<f64> {
    if !x.is_finite() { return None; }
    Some(match key {
        "omissions"   => -0.0089*x*x + 1.5198*x + 7.8197,
        "commissions" =>  0.0006*x*x + 0.3351*x + 21.389,
        "HRT"         => -0.0147*x*x + 2.5204*x - 43.465,
        "HRTSD"       => -0.0017*x*x + 0.6369*x +  8.4443,
        "Variability" =>  0.1249*x*x - 6.6492*x + 126.74,
        "BlockChange" => -0.0005*x*x + 0.3926*x + 20.722,
        "ISIChange"   =>  0.000001*x*x + 0.1207*x + 37.44,
        _ => return None,
    })
}

/// Compute T-scores for all 7 ACPT metrics using the GAMLSS continuous norm model.
///
/// `metrics_json`: `{"omissions":…,"commissions":…,"HRT":…,"HRTSD":…,
///                   "Variability":…,"BlockChange":…,"ISIChange":…}`
/// Returns JSON array: `[{"key":…,"tRaw":"47.3","tFinal":50}, …]`
#[wasm_bindgen]
pub fn compute_acpt_t_scores(metrics_json: &str, age: u32) -> String {
    let metrics: serde_json::Value =
        serde_json::from_str(metrics_json).unwrap_or(serde_json::Value::Null);

    let age_f = age as f64;

    let rows: Vec<serde_json::Value> = METRIC_KEYS.iter().map(|key| {
        let raw = metrics.get(*key).and_then(|v| v.as_f64());
        match raw {
            Some(r) if r.is_finite() => {
                match gamlss_norm(key, age_f) {
                    Some((mu, sigma)) if sigma > 0.0 => {
                        let z      = (r - mu) / sigma;
                        let t_raw  = 50.0 + 10.0 * z;
                        let t_fin  = acpt_regress(key, t_raw)
                            .map(|t| t.clamp(1.0, 99.0).round() as i64);
                        serde_json::json!({
                            "key":    key,
                            "tRaw":   format!("{:.1}", t_raw),
                            "tFinal": t_fin,
                        })
                    }
                    _ => serde_json::json!({ "key": key, "tRaw": null, "tFinal": null }),
                }
            }
            _ => serde_json::json!({ "key": key, "tRaw": null, "tFinal": null }),
        }
    }).collect();

    serde_json::to_string(&rows).unwrap_or_else(|_| "[]".to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// Password gate — SHA-256 hash comparison (no plaintext in binary)
// ─────────────────────────────────────────────────────────────────────────────

const PW_HASH: [u8; 32] = [
    0xf2, 0x04, 0x89, 0x23, 0xc0, 0x05, 0xc7, 0x59,
    0x7d, 0xd7, 0x98, 0x83, 0x27, 0xbb, 0x7e, 0x02,
    0x6d, 0x86, 0xc0, 0x2b, 0x94, 0x83, 0x08, 0x99,
    0x8d, 0xda, 0x07, 0x9c, 0x69, 0xdf, 0xf5, 0xd1,
];

#[wasm_bindgen]
pub fn verify_export_password(input: &str) -> bool {
    let mut h = Sha256::new();
    h.update(input.as_bytes());
    let result = h.finalize();
    result.as_slice() == PW_HASH
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy CSV code remapping (internal ↔ original Unity CSV codes)
// ─────────────────────────────────────────────────────────────────────────────

const CHILD_REMAP: [u32; 11] = [10, 0, 7, 5, 3, 6, 2, 1, 9, 8, 4];
const ADULT_REMAP: [u32; 16] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 12, 13, 14, 15];

/// Convert internal animal index → legacy CSV code.
#[wasm_bindgen]
pub fn remap_to_csv_code(internal_code: u32, is_child: bool) -> u32 {
    let remap: &[u32] = if is_child { &CHILD_REMAP } else { &ADULT_REMAP };
    remap.get(internal_code as usize).copied().unwrap_or(internal_code)
}

/// Convert legacy CSV code → internal animal index.
#[wasm_bindgen]
pub fn remap_from_csv_code(csv_code: u32, is_child: bool) -> u32 {
    let remap: &[u32] = if is_child { &CHILD_REMAP } else { &ADULT_REMAP };
    remap.iter().position(|&c| c == csv_code)
        .map(|i| i as u32)
        .unwrap_or(csv_code)
}
