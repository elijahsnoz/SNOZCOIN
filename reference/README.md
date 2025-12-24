# PMVP reference node — reference/README.md

This folder contains a minimal reference implementation of the Post-Money Value Protocol (PMVP). It is educational software only — not for production.

Quick start (macOS / Linux)

1) Create and activate a virtualenv (recommended):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r reference/requirements.txt
```

2) Run the node (starts HTTP API on port 5001):

```bash
python reference/pmvp_node.py
```

3) Example usage (in another terminal):

Get a new wallet:

```bash
curl http://127.0.0.1:5001/new_wallet
```

Check the chain:

```bash
curl http://127.0.0.1:5001/chain
```

Mine a block (replace <address> with returned address):

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"miner":"<address>"}' http://127.0.0.1:5001/mine
```

Submit a transaction:

The reference requires clients to construct and sign transactions using their private key. The code is intentionally minimal: the tx-signing flow is left as an exercise. See `PROTOCOL_SPEC.md` for wire formats.

UI (visualizer)

There is a tiny unbundled React visualizer in `reference/ui/`. You can serve it with a static file server while the node is running:

```bash
# from repository root
python3 -m http.server --directory reference/ui 8002
```

Then open http://127.0.0.1:8002 in your browser. The UI fetches the node at http://127.0.0.1:5001 by default.

Client helper

`reference/client.py` is a small helper that creates wallets, mines to one of them, builds and signs a transaction, submits it, and mines again to include the tx. Run it while `pmvp_node.py` is running.

Unsigned tx posting auth
------------------------

For safety the reference node supports two simple modes to restrict posting unsigned tx proposals to `/unsigned`:

- API key mode: set the environment variable `PMVP_API_KEY` before starting the node. Clients must include the header `X-API-Key: <value>` to POST to `/unsigned`.
- Origin restriction mode (default): if `PMVP_API_KEY` is not set the node only accepts `/unsigned` posts from the demo UI origins `http://127.0.0.1:8002` and `http://localhost:8002`.

Examples:

Start node with an API key (server will still allow UI origins for read-only requests):

```bash
export PMVP_API_KEY=mysupersecretkey
python reference/pmvp_node.py
```

Post an unsigned tx using the API key:

```bash
curl -X POST -H "Content-Type: application/json" -H "X-API-Key: mysupersecretkey" \
  -d '{"inputs":[{"txid":"...","index":0}],"outputs":[{"amount":1,"pubkey_hash":"addr"}]}' \
  http://127.0.0.1:5001/unsigned
```



Notes
- Difficulty and halving values are tiny to make local testing easy. Adjust in `reference/pmvp_node.py` for experiments.
- The reference uses JSON and Flask. Production nodes may use binary encodings and peer-to-peer networking.
