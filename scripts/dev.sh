#!/bin/sh
# SessionStart hook: start the playground dev server once (it opens the browser) and print a short status.
cd "$(dirname "$0")/.." || exit 0
URL=http://localhost:5280
[ -d node_modules ] || npm install --silent >/dev/null 2>&1
if curl -s --max-time 1 "$URL/" | grep -q '<title>playground</title>'; then
  echo "Playground already running at $URL"
else
  mkdir -p .playground
  nohup npm run dev > .playground/dev.log 2>&1 < /dev/null &
  echo "Started the playground at $URL (it opens in the browser)"
fi
echo "On screen: $(sed -n "s/^export default '\(.*\)'.*/\1/p" src/current.ts). Scenes: $(ls src/scenes | sed 's/\.ts$//' | tr '\n' ' ')"
