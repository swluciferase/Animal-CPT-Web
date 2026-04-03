declare namespace wasm_bindgen {
    /* tslint:disable */
    /* eslint-disable */

    export class CptTask {
        free(): void;
        [Symbol.dispose](): void;
        /**
         * Call when the response window for a trial closes (no keypress occurred).
         */
        finalize_trial(trial_index: number): void;
        /**
         * Returns JSON array of ALL trials (for pre-loading in JS)
         */
        get_all_trials_json(): string;
        /**
         * Returns full results + all trial records as JSON.
         */
        get_results_json(): string;
        get_trial_count(): number;
        /**
         * Returns JSON of Trial at given index
         */
        get_trial_json(index: number): string;
        /**
         * Returns whether this trial already has a response recorded.
         */
        has_response(trial_index: number): boolean;
        is_child_version(): boolean;
        /**
         * Create a new task session.
         * age < 18 → child version (240 trials, 5 animals)
         * age >= 18 → adult version (400 trials, 10 animals)
         */
        constructor(user_name: string, age: number, test_date: string);
        /**
         * Record a spacebar press.
         * response_ms = performance.now() at keydown event.
         * Returns response type string: "hit" | "false_alarm" | "too_fast"
         */
        record_response(trial_index: number, response_ms: number): string;
        /**
         * Called inside requestAnimationFrame callback right after drawing the stimulus.
         * onset_ms = performance.now() at that moment.
         */
        record_stimulus_onset(trial_index: number, onset_ms: number): void;
        /**
         * Call with performance.now() at the moment the first trial is about to start.
         */
        set_task_start(ms: number): void;
        /**
         * Store browser timing metadata (call before get_results_json)
         */
        set_timing_notes(notes: string): void;
    }

}
declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_cpttask_free: (a: number, b: number) => void;
    readonly cpttask_finalize_trial: (a: number, b: number) => void;
    readonly cpttask_get_all_trials_json: (a: number) => [number, number];
    readonly cpttask_get_results_json: (a: number) => [number, number];
    readonly cpttask_get_trial_count: (a: number) => number;
    readonly cpttask_get_trial_json: (a: number, b: number) => [number, number];
    readonly cpttask_has_response: (a: number, b: number) => number;
    readonly cpttask_is_child_version: (a: number) => number;
    readonly cpttask_new: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly cpttask_record_response: (a: number, b: number, c: number) => [number, number];
    readonly cpttask_record_stimulus_onset: (a: number, b: number, c: number) => void;
    readonly cpttask_set_task_start: (a: number, b: number) => void;
    readonly cpttask_set_timing_notes: (a: number, b: number, c: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
declare function wasm_bindgen (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
