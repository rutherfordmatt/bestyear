#!/usr/bin/env bash
# Launch headless Chrome, run the browser tests, then shut it down.
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=9333
PROFILE="$(mktemp -d)"

if [ ! -x "$CHROME" ]; then
  echo "Google Chrome not found at $CHROME" >&2
  exit 1
fi

if ! curl -sf --max-time 2 "${BASE:-http://localhost:4321}" > /dev/null; then
  echo "Dev server not reachable at ${BASE:-http://localhost:4321} — run 'npm run dev' first." >&2
  exit 1
fi

"$CHROME" --headless=new --disable-gpu --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE" --window-size=1280,1000 \
  --no-first-run --no-default-browser-check about:blank > /dev/null 2>&1 &
CHROME_PID=$!
trap 'kill $CHROME_PID 2>/dev/null || true; rm -rf "$PROFILE"' EXIT

for _ in $(seq 1 20); do
  curl -sf --max-time 1 "http://127.0.0.1:$PORT/json/version" > /dev/null && break
  sleep 0.5
done

node test/browser/audit.mjs
echo
node test/browser/workflow.mjs
