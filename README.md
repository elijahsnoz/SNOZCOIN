# SNOZCOIN Website (SNOZ)

This is a lightweight, mobile-first one-page website scaffold for SNOZCOIN ($SNOZ). It uses a premium gold on dark theme, smooth animations, and is SEO-friendly.

Files added:
- `index.html` — main one-page site (hero, about, token overview placeholders, roadmap, community, footer)
- `css/style.css` — site styles (responsive, gold theme)
- `js/main.js` — minimal JS (mobile nav, smooth scroll, reveal on scroll)
- `assets/logo.svg` — placeholder gold butterfly coin (replace with your provided logo file if you have one)
 - `assets/SNOZCOIN-1024.png`, `assets/SNOZCOIN-512.png`, `assets/SNOZCOIN-128.png` — resized PNGs
 - `assets/SNOZCOIN-1024.webp`, `assets/SNOZCOIN-512.webp`, `assets/SNOZCOIN-128.webp` — WebP fallbacks (automatically generated)

How to view locally:

1. Open a terminal in this folder and run a simple static server (recommended):

```bash
cd /Users/xworld/Desktop/PROGRAMMING/PROGRAMING/alx/SNOZCOIN
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

2. Or open `index.html` directly in a browser (some features like `file://` cross-file requests are avoided here, so a local server is best).

Replace the logo:
- `SNOZCOIN.png` is already in `assets/`. I generated optimized sizes and WebP fallbacks. `index.html` now uses responsive `<picture>` tags so browsers will load WebP if supported and fallback to PNG.

- Add contract address and live token data when available.
- Add an audit badge and links to contract on explorers.
- Add analytics and social meta images for better link previews.
Next suggestions (low-risk improvements):
- Add contract address and live token data when available.
- Add an audit badge and links to contract on explorers.
- Add analytics and social meta images for better link previews.
- If you want, I can further compress WebP files, create SVG alternatives, or add a deploy pipeline for automatic image optimization.
- Add contract address and live token data when available.
- Add an audit badge and links to contract on explorers.
- Add analytics and social meta images for better link previews.

If you want, I can:
- Replace the placeholder SVG with the exact provided logo (upload or tell me filename/path).
- Create a deploy-ready package (Netlify/Vercel config) and OG images.

Built with care for speed, accessibility, and a community-first tone.
