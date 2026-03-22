use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

// ─────────────────────────────────────────────
// Simple deterministic LCG PRNG (no std::time in WASM)
// ─────────────────────────────────────────────
struct Rng { state: u64 }

impl Rng {
    fn new(seed: u64) -> Self { Rng { state: seed } }

    fn next_u32(&mut self) -> u32 {
        self.state = self.state
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        (self.state >> 33) as u32
    }

    fn below(&mut self, n: usize) -> usize {
        (self.next_u32() as usize) % n
    }

    fn shuffle<T>(&mut self, v: &mut Vec<T>) {
        for i in (1..v.len()).rev() {
            let j = self.below(i + 1);
            v.swap(i, j);
        }
    }
}

// ─────────────────────────────────────────────
// Data types
// ─────────────────────────────────────────────

/// Animal codes
/// 0 = Cat (NON-TARGET – do NOT press)
/// 1..=9  Adult targets:  Dog, Bird, Rabbit, Elephant, Lion, Monkey, Bear, Deer, Fish
/// 1..=4  Child targets:  Dog, Bird, Rabbit, Elephant
pub const ANIMAL_NAMES_ZH: [&str; 10] = [
    "貓", "狗", "鳥", "兔子", "象", "獅子", "猴子", "熊", "鹿", "魚",
];
pub const ANIMAL_NAMES_EN: [&str; 10] = [
    "Cat", "Dog", "Bird", "Rabbit", "Elephant",
    "Lion", "Monkey", "Bear", "Deer", "Fish",
];
pub const NON_TARGET_CODE: u8 = 0;  // Cat is always the non-target

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Trial {
    pub index: u32,
    pub stimulus_code: u8,
    pub is_target: bool,
    pub isi_ms: f64,           // blank-screen duration BEFORE stimulus
    pub duration_ms: f64,      // how long stimulus stays on screen
    pub phase: String,         // "warmup" | "main" | "cooldown"
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrialRecord {
    pub trial: Trial,
    /// ms elapsed from task_start when first pixel of stimulus was drawn (rAF-synced)
    pub stimulus_onset_ms: f64,
    /// ms elapsed from task_start when Space was pressed (None = no response)
    pub response_ms: Option<f64>,
    /// response_ms - stimulus_onset_ms  (None if no response)
    pub reaction_time_ms: Option<f64>,
    /// "hit" | "miss" | "false_alarm" | "correct_reject" | "too_fast"
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
    /// Block breakdown: each entry = (mean_rt, omission_pct, commission_pct) for that third
    pub block_stats: Vec<BlockStat>,
    pub trials: Vec<TrialRecord>,
    /// Browser-reported timing info (populated by JS before export)
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
// Trial sequence generation
// ─────────────────────────────────────────────

fn make_trial(
    index: u32, stim: u8, isi: f64, dur: f64, phase: &str,
) -> Trial {
    Trial {
        index,
        stimulus_code: stim,
        is_target: stim != NON_TARGET_CODE,
        isi_ms: isi,
        duration_ms: dur,
        phase: phase.to_string(),
    }
}

/// Adult: 400 trials  (20 warmup + 360 main + 20 cooldown)
/// ISI:  1 000 ms (40%) / 2 000 ms (40%) / 4 000 ms (20%)
/// Dur:    250 ms (40%) /   500 ms (40%) /   750 ms (20%)
/// Non-target rate: 10 % of main trials
fn generate_adult_trials() -> Vec<Trial> {
    let mut rng = Rng::new(20240101_u64);
    let mut trials: Vec<Trial> = Vec::with_capacity(400);

    // --- Warmup (20) ---
    for i in 0u32..20 {
        let stim = (rng.below(9) + 1) as u8;
        trials.push(make_trial(i, stim, 2000.0, 500.0, "warmup"));
    }

    // --- Main (360) ---
    const MAIN: usize = 360;
    const NON_T: usize = 36; // 10 %

    let mut flags: Vec<bool> = (0..MAIN).map(|i| i < NON_T).collect();
    rng.shuffle(&mut flags);

    let mut isis: Vec<f64> = (0..MAIN).map(|i| {
        if i < 144 { 1000.0 } else if i < 288 { 2000.0 } else { 4000.0 }
    }).collect();
    rng.shuffle(&mut isis);

    let mut durs: Vec<f64> = (0..MAIN).map(|i| {
        if i < 144 { 250.0 } else if i < 288 { 500.0 } else { 750.0 }
    }).collect();
    rng.shuffle(&mut durs);

    for i in 0..MAIN {
        let is_non_target = flags[i];
        let stim = if is_non_target {
            NON_TARGET_CODE
        } else {
            (rng.below(9) + 1) as u8
        };
        trials.push(make_trial((20 + i) as u32, stim, isis[i], durs[i], "main"));
    }

    // --- Cooldown (20) ---
    for i in 0u32..20 {
        let stim = (rng.below(9) + 1) as u8;
        trials.push(make_trial(380 + i, stim, 2000.0, 500.0, "cooldown"));
    }

    trials
}

/// Child: 240 trials  (20 warmup + 200 main + 20 cooldown)
/// ISI:  2 000 ms (33%) / 3 000 ms (33%) / 4 000 ms (34%)
/// Dur:  750 ms throughout
/// Non-target rate: 10 % of main trials
/// Animals: only codes 0–4 (Cat/Dog/Bird/Rabbit/Elephant)
fn generate_child_trials() -> Vec<Trial> {
    let mut rng = Rng::new(20240202_u64);
    let mut trials: Vec<Trial> = Vec::with_capacity(240);

    // --- Warmup (20) ---
    for i in 0u32..20 {
        let stim = (rng.below(4) + 1) as u8; // codes 1–4
        trials.push(make_trial(i, stim, 4000.0, 750.0, "warmup"));
    }

    // --- Main (200) ---
    const MAIN: usize = 200;
    const NON_T: usize = 20; // 10 %

    let mut flags: Vec<bool> = (0..MAIN).map(|i| i < NON_T).collect();
    rng.shuffle(&mut flags);

    let mut isis: Vec<f64> = (0..MAIN).map(|i| {
        if i < 66 { 2000.0 } else if i < 133 { 3000.0 } else { 4000.0 }
    }).collect();
    rng.shuffle(&mut isis);

    for i in 0..MAIN {
        let stim = if flags[i] {
            NON_TARGET_CODE
        } else {
            (rng.below(4) + 1) as u8
        };
        trials.push(make_trial((20 + i) as u32, stim, isis[i], 750.0, "main"));
    }

    // --- Cooldown (20) ---
    for i in 0u32..20 {
        let stim = (rng.below(4) + 1) as u8;
        trials.push(make_trial(220 + i, stim, 4000.0, 750.0, "cooldown"));
    }

    trials
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
    if v.len() % 2 == 0 {
        (v[mid - 1] + v[mid]) / 2.0
    } else {
        v[mid]
    }
}

fn block_stat(records: &[TrialRecord], label: &str) -> BlockStat {
    let main: Vec<&TrialRecord> = records.iter()
        .filter(|r| r.trial.phase == "main")
        .collect();
    let targets: u32 = main.iter().filter(|r| r.trial.is_target).count() as u32;
    let non_targets: u32 = main.iter().filter(|r| !r.trial.is_target).count() as u32;

    let mut hits = 0u32;
    let mut misses = 0u32;
    let mut fa = 0u32;
    let mut cr = 0u32;
    let mut rts: Vec<f64> = Vec::new();

    for r in &main {
        match r.response_type.as_str() {
            "hit" => { hits += 1; if let Some(rt) = r.reaction_time_ms { rts.push(rt); } }
            "miss" => misses += 1,
            "false_alarm" => fa += 1,
            "correct_reject" => cr += 1,
            _ => {}
        }
    }

    BlockStat {
        block: label.to_string(),
        trials: main.len() as u32,
        hits,
        misses,
        false_alarms: fa,
        correct_rejects: cr,
        mean_rt_ms: mean(&rts),
        omission_pct: if targets > 0 { misses as f64 * 100.0 / targets as f64 } else { 0.0 },
        commission_pct: if non_targets > 0 { fa as f64 * 100.0 / non_targets as f64 } else { 0.0 },
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
    /// Create a new task session.
    /// age < 18 → child version (240 trials, 5 animals)
    /// age >= 18 → adult version (400 trials, 10 animals)
    #[wasm_bindgen(constructor)]
    pub fn new(user_name: String, age: u32, test_date: String) -> CptTask {
        console_error_panic_hook::set_once();
        let is_child = age < 18;
        let trials = if is_child {
            generate_child_trials()
        } else {
            generate_adult_trials()
        };
        let count = trials.len();
        CptTask {
            user_name,
            age,
            is_child,
            trials,
            records: vec![None; count],
            task_start_ms: 0.0,
            test_date,
            timing_notes: String::new(),
        }
    }

    /// Call with performance.now() at the moment the first trial is about to start.
    pub fn set_task_start(&mut self, ms: f64) {
        self.task_start_ms = ms;
    }

    pub fn get_trial_count(&self) -> u32 {
        self.trials.len() as u32
    }

    pub fn is_child_version(&self) -> bool {
        self.is_child
    }

    /// Returns JSON of Trial at given index
    pub fn get_trial_json(&self, index: u32) -> String {
        match self.trials.get(index as usize) {
            Some(t) => serde_json::to_string(t).unwrap_or_default(),
            None => "{}".to_string(),
        }
    }

    /// Returns JSON array of ALL trials (for pre-loading in JS)
    pub fn get_all_trials_json(&self) -> String {
        serde_json::to_string(&self.trials).unwrap_or_default()
    }

    /// Called inside requestAnimationFrame callback right after drawing the stimulus.
    /// onset_ms = performance.now() at that moment.
    pub fn record_stimulus_onset(&mut self, trial_index: u32, onset_ms: f64) {
        let idx = trial_index as usize;
        if let Some(trial) = self.trials.get(idx) {
            self.records[idx] = Some(TrialRecord {
                trial: trial.clone(),
                stimulus_onset_ms: onset_ms - self.task_start_ms,
                response_ms: None,
                reaction_time_ms: None,
                response_type: "pending".to_string(),
            });
        }
    }

    /// Returns whether this trial already has a response recorded.
    pub fn has_response(&self, trial_index: u32) -> bool {
        match self.records.get(trial_index as usize) {
            Some(Some(r)) => r.response_ms.is_some(),
            _ => false,
        }
    }

    /// Record a spacebar press.
    /// response_ms = performance.now() at keydown event.
    /// Returns response type string: "hit" | "false_alarm" | "too_fast"
    pub fn record_response(&mut self, trial_index: u32, response_ms: f64) -> String {
        let idx = trial_index as usize;
        if let Some(Some(record)) = self.records.get_mut(idx) {
            if record.response_ms.is_some() {
                return "already_responded".to_string();
            }
            let abs_ms = response_ms - self.task_start_ms;
            let rt = abs_ms - record.stimulus_onset_ms;

            let rtype = if rt < 100.0 {
                "too_fast"
            } else if record.trial.is_target {
                "hit"
            } else {
                "false_alarm"
            };

            record.response_ms = Some(abs_ms);
            record.reaction_time_ms = Some(rt);
            record.response_type = rtype.to_string();
            rtype.to_string()
        } else {
            "error".to_string()
        }
    }

    /// Call when the response window for a trial closes (no keypress occurred).
    pub fn finalize_trial(&mut self, trial_index: u32) {
        let idx = trial_index as usize;
        if let Some(Some(record)) = self.records.get_mut(idx) {
            if record.response_type == "pending" {
                record.response_type = if record.trial.is_target {
                    "miss".to_string()
                } else {
                    "correct_reject".to_string()
                };
            }
        }
    }

    /// Store browser timing metadata (call before get_results_json)
    pub fn set_timing_notes(&mut self, notes: String) {
        self.timing_notes = notes;
    }

    /// Returns full results + all trial records as JSON.
    pub fn get_results_json(&self) -> String {
        let all_records: Vec<TrialRecord> = self.records.iter()
            .flatten()
            .cloned()
            .collect();

        let main_records: Vec<&TrialRecord> = all_records.iter()
            .filter(|r| r.trial.phase == "main")
            .collect();

        let target_count: u32 = main_records.iter().filter(|r| r.trial.is_target).count() as u32;
        let non_target_count: u32 = main_records.iter().filter(|r| !r.trial.is_target).count() as u32;

        let mut hits = 0u32;
        let mut misses = 0u32;
        let mut false_alarms = 0u32;
        let mut correct_rejects = 0u32;
        let mut perseverations = 0u32;
        let mut rt_vals: Vec<f64> = Vec::new();

        for r in &main_records {
            match r.response_type.as_str() {
                "hit" => {
                    hits += 1;
                    if let Some(rt) = r.reaction_time_ms { rt_vals.push(rt); }
                }
                "miss" => misses += 1,
                "false_alarm" => false_alarms += 1,
                "correct_reject" => correct_rejects += 1,
                "too_fast" => perseverations += 1,
                _ => {}
            }
        }

        let omission_rate = if target_count > 0 {
            misses as f64 * 100.0 / target_count as f64
        } else { 0.0 };
        let commission_rate = if non_target_count > 0 {
            false_alarms as f64 * 100.0 / non_target_count as f64
        } else { 0.0 };
        let perseveration_rate = if target_count > 0 {
            perseverations as f64 * 100.0 / target_count as f64
        } else { 0.0 };

        let mean_rt = mean(&rt_vals);
        let sd_rt = sd(&rt_vals);
        let mut rt_sorted = rt_vals.clone();
        let med_rt = median(&mut rt_sorted);

        // Block stats: split main trials into thirds
        let main_owned: Vec<TrialRecord> = main_records.iter().map(|r| (*r).clone()).collect();
        let third = (main_owned.len() / 3).max(1);
        let b1 = block_stat(&main_owned[..third.min(main_owned.len())], "早期");
        let b2 = block_stat(
            &main_owned[(third).min(main_owned.len())..(2 * third).min(main_owned.len())],
            "中期",
        );
        let b3 = block_stat(
            &main_owned[(2 * third).min(main_owned.len())..],
            "後期",
        );

        let results = TaskResults {
            user_name: self.user_name.clone(),
            age: self.age,
            is_child: self.is_child,
            test_date: self.test_date.clone(),
            total_trials: self.trials.len() as u32,
            main_trials: main_records.len() as u32,
            target_count,
            non_target_count,
            hits,
            misses,
            false_alarms,
            correct_rejects,
            perseverations,
            omission_rate_pct: omission_rate,
            commission_rate_pct: commission_rate,
            perseveration_rate_pct: perseveration_rate,
            mean_rt_ms: mean_rt,
            sd_rt_ms: sd_rt,
            median_rt_ms: med_rt,
            block_stats: vec![b1, b2, b3],
            trials: all_records,
            timing_notes: self.timing_notes.clone(),
        };

        serde_json::to_string(&results).unwrap_or_default()
    }
}
