#!/usr/bin/env python3
"""
Local dev server for ACPT.
Sets COOP/COEP headers so performance.now() runs at ~0.005 ms resolution
(required for SharedArrayBuffer and high-res timers in Chromium-based browsers).

Usage:
    python3 server.py          # serves on http://localhost:8080
    python3 server.py 9000     # custom port
"""
import sys
import os
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class ACPTHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy',   'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # suppress request logs; uncomment to debug


os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"ACPT server running at  http://localhost:{PORT}")
print("Press Ctrl+C to stop.\n")
HTTPServer(('', PORT), ACPTHandler).serve_forever()
