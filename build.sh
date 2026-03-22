#!/usr/bin/env bash
# ─────────────────────────────────────────────
# ACPT build script
# Requirements:
#   Rust toolchain  – https://rustup.rs
#   wasm-pack       – cargo install wasm-pack
# ─────────────────────────────────────────────
set -e

echo "==> Building WASM (release)..."
wasm-pack build --target web --out-dir www/pkg --release

echo "==> Build complete."
echo ""
echo "==> Starting local server (http://localhost:8080)..."
echo "    (COOP/COEP headers enabled for high-precision timing)"
echo ""
python3 www/server.py
