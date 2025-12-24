#!/usr/bin/env python3
"""Reference client helper: builds and signs transactions end-to-end against the PMVP node.

Usage: run while `reference/pmvp_node.py` is running.

The script:
- creates two wallets (A and B)
- mines a block to A
- builds a tx sending most of A's coinbase to B (leaving 1 unit fee)
- signs the tx with A's private key and submits it
- mines a block to include the tx
- shows balances for A and B
"""
import json
import sys
import urllib.request
from ecdsa import SigningKey, SECP256k1

BASE = "http://127.0.0.1:5001"

def http_get(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return json.loads(r.read().decode())

def http_post(path, data):
    data_b = json.dumps(data).encode()
    req = urllib.request.Request(BASE + path, data=data_b, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def from_priv_hex(hexstr: str) -> SigningKey:
    return SigningKey.from_string(bytes.fromhex(hexstr), curve=SECP256k1)

def main():
    print("Creating wallet A (sender)...")
    wa = http_get("/new_wallet")
    print("A address:", wa["address"])

    print("Creating wallet B (recipient)...")
    wb = http_get("/new_wallet")
    print("B address:", wb["address"])

    print("Mining a block to A to get funds...")
    m = http_post("/mine", {"miner": wa["address"]})
    if not m.get("ok"):
        print("Mine failed:", m)
        sys.exit(1)
    print("Mined block", m.get("block_hash"))

    bal_a = http_get(f"/balance/{wa['address']}")
    print("A balance:", bal_a.get("balance"))

    # pick a UTXO from A
    utxos = bal_a.get("utxos", [])
    if not utxos:
        print("No UTXOs for A")
        sys.exit(1)
    ut = utxos[0]["utxo"]  # format txid:index
    txid, idx = ut.split(":")
    idx = int(idx)
    amount = utxos[0]["amount"]

    send_amount = max(1, amount - 1)  # leave fee=1

    # build tx template with empty sigs
    tx = {
        "inputs": [{"txid": txid, "index": idx, "sig": "", "pubkey": wa["pubkey"]}],
        "outputs": [{"amount": send_amount, "pubkey_hash": wb["address"]}],
        "timestamp": int(__import__("time").time()),
    }

    # prepare message to sign (server verifies signature over tx with empty sigs)
    tx_copy = json.loads(json.dumps(tx))
    # sign with A's private key
    sk = from_priv_hex(wa["privkey"]) 
    message = json.dumps(tx_copy, sort_keys=True, separators=(",", ":")).encode()
    sig = sk.sign(message).hex()
    tx["inputs"][0]["sig"] = sig

    print("Submitting transaction...")
    r = http_post("/tx", tx)
    if not r.get("ok"):
        print("tx submit failed:", r)
        sys.exit(1)
    print("tx submitted, txid:", r.get("txid"))

    print("Mining to include the tx...")
    m2 = http_post("/mine", {"miner": wa["address"]})
    if not m2.get("ok"):
        print("mine failed:", m2)
        sys.exit(1)
    print("Mined block", m2.get("block_hash"))

    bal_a2 = http_get(f"/balance/{wa['address']}")
    bal_b2 = http_get(f"/balance/{wb['address']}")
    print("A balance after:", bal_a2.get("balance"))
    print("B balance after:", bal_b2.get("balance"))
    print("Done")

if __name__ == '__main__':
    main()
