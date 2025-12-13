SNOZCOIN — Build & Deploy

This repository is a simple static site. The `build.sh` script creates a production-ready `dist/` directory containing minified CSS/JS and copied assets.

Quick steps

1. Build locally:

```bash
./build.sh
```

2. Preview the built site:

```bash
python3 -m http.server --directory dist 8001 --bind 127.0.0.1
# open http://127.0.0.1:8001 in your browser
```

3. Create a new Git repo and push (example):

```bash
git init
git add .
git commit -m "Initial site"
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

4. Deploy options

- GitHub Pages: push the `dist/` content to the `gh-pages` branch or configure GitHub Pages to serve from `main`/`docs/`.
- Netlify / Vercel: point to this repo and set the build command (if any). For this static site you can skip a build step and set the publish directory to `dist` (after running `build.sh` in CI).

Notes
- The build script performs simple minification. For more advanced optimizations (asset hashing, cache busting, tree shaking), consider a small node-based toolchain (Parcel/Vite) or GitHub Actions to build and deploy automatically.
