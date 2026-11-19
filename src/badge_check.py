#!/usr/bin/env python3
"""Counterparty badge verification for the Gatekeeper, Verified agent.

Implements the five checks recommended for the Concordium Agent Registry
(Workshop 6, Doris Benda): before dealing with another agent, verify
  1. the registry contract is the expected CIS-8004 deployment,
  2. the agent is active,
  3. the agent on chain is the agent described by its card (A2A),
  4. the card's SHA-256 still matches the on-chain metadata_hash,
  5. the owner on the card matches the owner on chain.

Uses the hosted Agent Registry MCP server's REST twins (read-only):
  GET /v1/check-badge/{id}            (badge token address or account)
  GET /v1/verify-agent-card/{token}   (card hash vs on-chain anchor)

Usage:
  badge_check.py <badge-token-address-or-account> [testnet|mainnet]
Exit code 0 = all checks pass, 1 = at least one check fails / no badge.
"""
import json
import subprocess
import sys

BASE = "https://agent-registry-mcp.concordium.com"

# Expected CIS-8004 registry deployments (genesis-hash-prefixed CAIP-10 forms
# as reported by the registry's own check-badge endpoint).
EXPECTED_CONTRACTS = {
    "testnet": "ccd:4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796:12802.0",
}


def get(path):
    proc = subprocess.run(
        ["curl", "-s", "-m", "60", f"{BASE}{path}"],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"GET {path} failed rc={proc.returncode}")
    return json.loads(proc.stdout)


def verify_counterparty(identifier, network="testnet"):
    """Return a verdict dict for one badge token address or owner account."""
    badge = get(f"/v1/check-badge/{identifier}?network={network}")
    verdict = {"identifier": identifier, "network": network, "checks": {}}

    agents = badge.get("agents")
    if agents is not None:
        # Account form: summarise every badge the account owns.
        verdict["account"] = badge.get("account")
        verdict["agent_count"] = badge.get("agent_count", 0)
        verdict["summary"] = badge.get("summary", {})
        verdict["checks"]["has_badge"] = verdict["agent_count"] > 0
        verdict["ok"] = bool(verdict["checks"]["has_badge"]) and \
            verdict["summary"].get("valid", 0) == verdict["agent_count"]
        return verdict

    # Single-badge form: the endpoint's own checks map onto the five
    # registry checks one-to-one.
    inner = badge.get("checks", {})
    verdict["checks"]["expected_contract"] = bool(inner.get("contracts_match"))
    verdict["checks"]["active"] = bool(inner.get("status_active"))
    verdict["checks"]["on_chain_match"] = bool(
        inner.get("on_chain_agent_found") and inner.get("token_address_matches")
    )
    verdict["checks"]["card_hash_match"] = bool(inner.get("hash_matches_on_chain"))
    verdict["checks"]["owner_match"] = bool(inner.get("owner_matches"))
    verdict["checks"]["badge_valid"] = bool(badge.get("badge_valid", False))
    verdict["on_chain"] = badge.get("on_chain", {})
    verdict["issues"] = badge.get("issues", [])
    verdict["ok"] = all(verdict["checks"].values())
    return verdict


if __name__ == "__main__":
    ident = sys.argv[1]
    net = sys.argv[2] if len(sys.argv) > 2 else "testnet"
    result = verify_counterparty(ident, net)
    print(json.dumps(result, indent=2)[:4000])
    sys.exit(0 if result.get("ok") else 1)
