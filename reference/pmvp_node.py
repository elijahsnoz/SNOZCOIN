#!/usr/bin/env python3
"""PMVP reference node (minimal)

Single-file demo node with a tiny HTTP API for experimentation.

Features:
- keypair generation (secp256k1)
- UTXO model
- transaction creation/verification
- simple PoW mining with adjustable difficulty
- minimal Flask API: /new_wallet, /tx, /mine, /chain, /balance

This is a learning reference, not production software.
"""

import time
import os
import json
import hashlib
import threading
from typing import List, Dict, Any

from ecdsa import SigningKey, SECP256k1, VerifyingKey
from flask import Flask, request, jsonify

app = Flask(__name__)

# Config: allowed origins and optional API key for unsigned tx posting
# By default allow the local UI ports used in the demo. Configure via env or edit.
ALLOWED_ORIGINS = set(["http://127.0.0.1:8002", "http://localhost:8002"])
API_KEY = os.environ.get("PMVP_API_KEY")


@app.after_request
def add_cors_headers(response):
    # Respect Origin header and only echo if allowed (or if API_KEY is unset then allow demo origins)
    origin = request.headers.get('Origin')
    if API_KEY:
        # If API key is set, still allow UI origins for read-only access but require API key for unsigned posting
        if origin in ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
    else:
        # No API key configured: allow demo origins
        if origin in ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-API-Key'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

# Protocol params (small for demo)
REWARD_INITIAL = 50
HALVING_INTERVAL = 100  # small for demo
DIFFICULTY_PREFIX = "0000"  # simple leading-zeros target

# In-memory state (persists only while process runs)
CHAIN: List[Dict[str, Any]] = []
MEMPOOL: List[Dict[str, Any]] = []
UNSIGNED_MEMPOOL: List[Dict[str, Any]] = []  # unsigned tx proposals from UI
UTXO: Dict[str, Dict[str, Any]] = {}  # key: txid:index -> {amount, pubkey_hash}

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def address_from_pubkey_hex(pubkey_hex: str) -> str:
    # Address = first 40 chars of sha256(pubkey_hex)
    return sha256(bytes.fromhex(pubkey_hex))[:40]

def serialize_tx(tx: Dict[str, Any]) -> bytes:
    # deterministic JSON serialization
    return json.dumps(tx, sort_keys=True, separators=(",", ":")).encode()

def txid_of(tx: Dict[str, Any]) -> str:
    return sha256(serialize_tx(tx))

def mk_genesis():
    genesis = {
        "header": {
            "prev_hash": "0" * 64,
            "merkle_root": "",
            "timestamp": int(time.time()),
            "nonce": 0,
            "difficulty": DIFFICULTY_PREFIX,
        },
        "txs": [],
    }
    genesis_hash = sha256(json.dumps(genesis["header"], sort_keys=True).encode())
    CHAIN.append({"hash": genesis_hash, "block": genesis})

def rebuild_utxo():
    global UTXO
    UTXO = {}
    for entry in CHAIN:
        block = entry["block"]
        for tx in block["txs"]:
            tid = txid_of(tx)
            # consume inputs
            for inp in tx.get("inputs", []):
                key = f"{inp['txid']}:{inp['index']}"
                if key in UTXO:
                    del UTXO[key]
            # add outputs
            for i, out in enumerate(tx.get("outputs", [])):
                key = f"{tid}:{i}"
                UTXO[key] = {"amount": out["amount"], "pubkey_hash": out["pubkey_hash"]}

def verify_sig(pubkey_hex: str, sig_hex: str, message: bytes) -> bool:
    try:
        vk = VerifyingKey.from_string(bytes.fromhex(pubkey_hex), curve=SECP256k1)
        return vk.verify(bytes.fromhex(sig_hex), message)
    except Exception:
        return False

def verify_tx(tx: Dict[str, Any]):
    # simple checks
    inputs = tx.get("inputs", [])
    outputs = tx.get("outputs", [])
    total_in = 0
    for inp in inputs:
        key = f"{inp['txid']}:{inp['index']}"
        if key not in UTXO:
            return False, f"input {key} not found"
        ut = UTXO[key]
        total_in += ut["amount"]
        # verify signature covers serialized tx body (without sigs)
        # For simplicity, participants sign the full tx with empty sigs
        tx_copy = dict(tx)
        tx_copy["inputs"] = [dict(i) for i in tx_copy["inputs"]]
        # blank the sig in the matching input for verification
        for ii in tx_copy["inputs"]:
            ii["sig"] = ""
        message = serialize_tx(tx_copy)
        if not verify_sig(inp["pubkey"], inp.get("sig", ""), message):
            return False, "bad signature"
        # check pubkey hash matches referenced UTXO
        if address_from_pubkey_hex(inp["pubkey"]) != ut["pubkey_hash"]:
            return False, "pubkey hash mismatch"
    total_out = sum(out["amount"] for out in outputs)
    if total_out > total_in:
        return False, "outputs exceed inputs"
    return True, "ok"

def create_coinbase(miner_pubkey_hash: str, amount: int) -> Dict[str, Any]:
    # coinbase tx has no inputs; single output to miner
    return {"inputs": [], "outputs": [{"amount": amount, "pubkey_hash": miner_pubkey_hash}], "timestamp": int(time.time())}

def merkle_root(txs: List[Dict[str, Any]]) -> str:
    if not txs:
        return ""
    hs = [txid_of(tx) for tx in txs]
    while len(hs) > 1:
        if len(hs) % 2 == 1:
            hs.append(hs[-1])
        new = []
        for i in range(0, len(hs), 2):
            new.append(sha256((hs[i] + hs[i + 1]).encode()))
        hs = new
    return hs[0]

def current_height() -> int:
    return len(CHAIN) - 1

def block_reward(height: int) -> int:
    halvings = height // HALVING_INTERVAL
    return max(1, REWARD_INITIAL >> halvings)

def mine_block(miner_address: str, max_txs: int = 100) -> Dict[str, Any]:
    # pick pending txs that validate
    selected = []
    for tx in MEMPOOL[:]:
        ok, reason = verify_tx(tx)
        if ok:
            selected.append(tx)
            MEMPOOL.remove(tx)
        if len(selected) >= max_txs:
            break
    height = current_height()
    reward = block_reward(height + 1)
    coinbase = create_coinbase(miner_address, reward)
    txs = [coinbase] + selected
    root = merkle_root(txs)
    header = {
        "prev_hash": CHAIN[-1]["hash"],
        "merkle_root": root,
        "timestamp": int(time.time()),
        "nonce": 0,
        "difficulty": DIFFICULTY_PREFIX,
    }
    # simple PoW
    while True:
        header["nonce"] += 1
        h = sha256(json.dumps(header, sort_keys=True).encode())
        if h.startswith(DIFFICULTY_PREFIX):
            break
    block = {"header": header, "txs": txs}
    block_hash = sha256(json.dumps(header, sort_keys=True).encode())
    CHAIN.append({"hash": block_hash, "block": block})
    rebuild_utxo()
    return {"hash": block_hash, "block": block}

@app.route("/new_wallet", methods=["GET"]) 
def new_wallet():
    sk = SigningKey.generate(curve=SECP256k1)
    vk = sk.get_verifying_key()
    sk_hex = sk.to_string().hex()
    vk_hex = vk.to_string().hex()
    addr = address_from_pubkey_hex(vk_hex)
    return jsonify({"privkey": sk_hex, "pubkey": vk_hex, "address": addr})

@app.route("/chain", methods=["GET"]) 
def get_chain():
    return jsonify({"chain": CHAIN})


@app.route("/mempool", methods=["GET"]) 
def get_mempool():
    return jsonify({"mempool": MEMPOOL})


@app.route("/unsigned", methods=["GET"])
def get_unsigned():
    return jsonify({"unsigned": UNSIGNED_MEMPOOL})


@app.route("/unsigned", methods=["POST"])
def post_unsigned():
    data = request.get_json()
    # Basic validation: expect inputs list and outputs list
    if not data or "inputs" not in data or "outputs" not in data:
        return jsonify({"ok": False, "reason": "invalid unsigned tx format"}), 400
    # add timestamp if missing
    if "timestamp" not in data:
        data["timestamp"] = int(time.time())
    # Authorization: require either valid API key header (if API_KEY configured) or request Origin in ALLOWED_ORIGINS
    origin = request.headers.get('Origin')
    key = request.headers.get('X-API-Key')
    if API_KEY:
        if not key or key != API_KEY:
            return jsonify({"ok": False, "reason": "missing or invalid API key"}), 403
    else:
        # no API key configured: allow only from allowed origins
        if origin not in ALLOWED_ORIGINS:
            return jsonify({"ok": False, "reason": "origin not allowed"}), 403

    UNSIGNED_MEMPOOL.append(data)
    return jsonify({"ok": True, "index": len(UNSIGNED_MEMPOOL)-1})

@app.route("/tx", methods=["POST"]) 
def submit_tx():
    tx = request.get_json()
    ok, reason = verify_tx(tx)
    if not ok:
        return jsonify({"ok": False, "reason": reason}), 400
    MEMPOOL.append(tx)
    return jsonify({"ok": True, "txid": txid_of(tx)})

@app.route("/mine", methods=["POST"]) 
def mine():
    data = request.get_json() or {}
    miner = data.get("miner")
    if not miner:
        return jsonify({"ok": False, "reason": "miner address required"}), 400
    block = mine_block(miner)
    return jsonify({"ok": True, "block_hash": block["hash"]})

@app.route("/balance/<address>", methods=["GET"]) 
def balance(address):
    bal = 0
    outs = []
    for k, v in UTXO.items():
        if v["pubkey_hash"] == address:
            bal += v["amount"]
            outs.append({"utxo": k, "amount": v["amount"]})
    return jsonify({"address": address, "balance": bal, "utxos": outs})

def run_api(port=5001):
    app.run(port=port)

def main():
    mk_genesis()
    rebuild_utxo()
    print("PMVP reference node (demo) — starting HTTP API on port 5001")
    run_api(5001)

if __name__ == "__main__":
    main()
