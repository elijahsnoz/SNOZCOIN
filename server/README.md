SnozCoin Sample Backend (development)
===================================

This folder contains a small demo Express backend used by the local frontend to serve:

- /api/creators
- /api/creator/:slug
- /api/unlock/verify  (demo verification -> returns signed URL)

This is a minimal example for local development and prototyping. Do NOT use this code as-is in production.

Run locally:

```bash
cd server
npm install
npm start
```

The server will run on port 3000 by default and serves the project root as static files so you can visit http://localhost:3000/creators.html or http://localhost:3000/creator.html?slug=luna-arts

Notes:
- The unlock verification endpoint is a stub: in production you must verify on-chain transactions (indexer or node) before returning signed asset URLs.
- For signed URLs: store them server-side with expiry and validate before serving content.
