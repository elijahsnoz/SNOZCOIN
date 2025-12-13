#!/usr/bin/env bash
# Generate assets/SNOZCOIN_whitepaper.pdf from assets/whitepaper.html
set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HTML_FILE="$ROOT_DIR/assets/whitepaper.html"
OUT_PDF="$ROOT_DIR/assets/SNOZCOIN_whitepaper.pdf"

echo "Generating PDF: $OUT_PDF"

if command -v wkhtmltopdf >/dev/null 2>&1; then
  echo "Using wkhtmltopdf"
  wkhtmltopdf "$HTML_FILE" "$OUT_PDF"
  echo "Done."
  exit 0
fi

# Try Google Chrome / Chromium headless print
CHROME_PATHS=(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
)

for p in "${CHROME_PATHS[@]}"; do
  if [ -x "$p" ]; then
    echo "Using headless Chrome: $p"
    # file:// path
    FILE_URL="file://$HTML_FILE"
    "$p" --headless --disable-gpu --no-sandbox --print-to-pdf="$OUT_PDF" "$FILE_URL"
    echo "Done."
    exit 0
  fi
done

echo "No wkhtmltopdf or headless Chrome found."
echo "Options:"
echo "  1) Install wkhtmltopdf and re-run: brew install wkhtmltopdf"
echo "  2) Install Chrome and re-run the script"
echo "  3) Generate PDF manually from browser: open $HTML_FILE and Print → Save as PDF"
exit 2
