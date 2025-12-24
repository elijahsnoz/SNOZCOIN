#!/usr/bin/env python3
"""Simple smoke test for the PMVP reference node.

Requires the reference node to be running at http://127.0.0.1:5001
"""
import json
import sys
import urllib.request

BASE = "http://127.0.0.1:5001"

def http_get(path):
    with urllib.request.urlopen(BASE + path, timeout=5) as r:
        return json.loads(r.read().decode())

def http_post(path, data):
    data_b = json.dumps(data).encode()
    req = urllib.request.Request(BASE + path, data=data_b, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())

def fail(msg):
    print("FAIL:", msg)
    sys.exit(2)

def main():
    print("Checking /chain...", end=" ")
    chain = http_get("/chain")
    if "chain" not in chain or len(chain["chain"]) < 1:
        fail("no chain returned")
    print("OK (height=%d)" % (len(chain["chain"]) - 1))

    print("Creating wallet...", end=" ")
    w = http_get("/new_wallet")
    if not all(k in w for k in ("privkey", "pubkey", "address")):
        fail("wallet response missing fields")
    miner = w["address"]
    print("OK (address=%s)" % miner)

    print("Balance before mining...", end=" ")
    b0 = http_get(f"/balance/{miner}")
    print(b0.get("balance", 0))

    print("Mining a block (this may take a second)...", end=" ")
    m = http_post("/mine", {"miner": miner})
    if not m.get("ok"):
        fail("mine failed: %s" % m)
    print("OK (block=%s)" % m.get("block_hash"))

    print("Balance after mining...", end=" ")
    b1 = http_get(f"/balance/{miner}")
    if b1.get("balance", 0) <= b0.get("balance", 0):
        fail("balance not increased after mining")
    print(b1.get("balance", 0))

    print("SMOKE TEST PASSED")

if __name__ == '__main__':
    main()
