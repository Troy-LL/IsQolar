#!/usr/bin/env python3
"""
build_single.py — IsQolar single-file bundler
Produces IsQolar.html: one self-contained file that opens by double-click
with no network, no server, and no install.

STATUS: skeleton (M1). Completed in M7.
Run now: python tools/build_single.py
"""

import sys

def main():
    print("Build not yet finalized (M7).")
    print("Run M1-M6 via: python3 -m http.server 8080  (from the project root)")
    print("Then open:     http://localhost:8080/")

if __name__ == "__main__":
    main()

# ---------------------------------------------------------------------------
# TODO (M7)
# ---------------------------------------------------------------------------
# 1. Resolve entry point: index.html
# 2. Run: npx esbuild app.js --bundle --format=esm --outfile=.build/app.bundle.js
# 3. Inline all CSS files in load order (tokens, components, gradient, screens, landing)
# 4. Inline fonts as base64 data URIs inside the CSS @font-face rules
# 5. Inline js/vendor/qrcode.js as a <script> block (it's a classic UMD, not a module)
# 6. Inline data/colleges.json: already handled by js/colleges.js module
# 7. Set window.__PQ_DEMO = true in the bundle preamble
# 8. Write the assembled HTML to IsQolar.html
# 9. Verify: open IsQolar.html from file://, confirm zero console errors
# 10. Run: IQ_URL=file:///abs/path/IsQolar.html python3 tests/audit.py
