#!/usr/bin/env bash
set -euo pipefail

echo "Building SNOZCOIN static site into ./dist/"
ROOTDIR=$(pwd)
rm -rf dist
mkdir -p dist/css dist/js dist/assets

echo "- Minifying CSS -> dist/css/style.css"
python3 - <<'PY'
import re
infile = 'css/style.css'
outfile = 'dist/css/style.css'
text = open(infile, 'r', encoding='utf-8').read()
# remove /* */ comments
text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
# collapse whitespace
text = re.sub(r'\s+', ' ', text)
# tighten around punctuation
text = re.sub(r'\s*([{}:;,])\s*', r'\1', text)
open(outfile, 'w', encoding='utf-8').write(text.strip())
print('Wrote', outfile)
PY

echo "- Minifying JS -> dist/js/main.js"
python3 - <<'PY'
import re
infile = 'js/main.js'
outfile = 'dist/js/main.js'
text = open(infile, 'r', encoding='utf-8').read()
# remove // comments
text = re.sub(r'//.*?$', '', text, flags=re.M)
# remove /* */ comments
text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
# collapse whitespace
text = re.sub(r'\s+', ' ', text)
open(outfile, 'w', encoding='utf-8').write(text.strip())
print('Wrote', outfile)
PY

echo "- Copying HTML and assets"
cp index.html dist/index.html
cp -R assets/* dist/assets/ || true

echo "- Done. dist/ is ready."
echo "To preview: python3 -m http.server --directory dist 8001 --bind 127.0.0.1"

exit 0
