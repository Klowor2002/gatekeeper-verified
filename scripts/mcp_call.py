#!/usr/bin/env python3
"""Minimal JSON-RPC client for the hosted Concordium Agent Registry MCP server.

Usage: mcp_call.py <tool_name> <args_json_file>
Prints the tool result (JSON) to stdout. Read/build tools only prepare
payloads server-side; nothing is signed here.
"""
import json
import subprocess
import sys

MCP_URL = "https://agent-registry-mcp.concordium.com/mcp"


def rpc(method, params, req_id=1):
    payload = {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params}
    proc = subprocess.run(
        [
            "curl", "-s", "-m", "60",
            "-H", "Content-Type: application/json",
            "-H", "Accept: application/json, text/event-stream",
            "-d", json.dumps(payload),
            MCP_URL,
        ],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise SystemExit(f"curl failed rc={proc.returncode}: {proc.stderr[:200]}")
    return json.loads(proc.stdout)


def main():
    tool = sys.argv[1]
    with open(sys.argv[2]) as f:
        args = json.load(f)
    resp = rpc("tools/call", {"name": tool, "arguments": args})
    if "error" in resp:
        print(json.dumps(resp["error"], indent=2))
        raise SystemExit(1)
    result = resp["result"]
    # MCP tool results carry content blocks; print the text payload if present.
    texts = [c.get("text", "") for c in result.get("content", []) if c.get("type") == "text"]
    if texts:
        print("\n".join(texts))
    else:
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
