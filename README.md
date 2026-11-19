# Gatekeeper, Verified

**Concordium × Encode — Trusted Agents Hackathon** (build window 19 Nov – 9 Dec 2026, testnet)
Checkpoint 1: 22 Nov 2026, 23:59 UTC · Final deadline: 9 Dec 2026, 23:59 UTC

## One-liner

Our already-live zkVerify Gatekeeper agent — which verifies zero-knowledge proofs before money moves — gains a Concordium accountability layer: an Agent Registry entry with an ERC-8004 Agent Card, a "Verified by Concordium" badge other agents check before dealing with it, and x402 micropayments for verification calls on testnet.

## What it does

The Gatekeeper (`klowor-gatekeeper`, live endpoint
https://klowor-gatekeeper.netlify.app/agent) receives a signed JSON envelope
(HMAC-verified), runs deterministic checks on a zkVerify proof and its
conditions (verification key, threshold, recipient, amount, expiry),
generates a local Groth16 proof, and returns a signed APPROVE / REJECT
decision. It already works end-to-end in the zkVerify Agent Games.

This project adds the accountability layer on Concordium testnet:

1. **Registry entry + Agent Card.** The agent is registered in the CIS-8004
   Agent Registry with a combined ERC-8004 / A2A Agent Card
   ([`agent-card.json`](agent-card.json)) carrying the *Verified by
   Concordium* badge extension (owner = a testnet identity-backed account,
   mock identity via the Concordium testnet IP — no real documents).
   The card's SHA-256 is anchored on chain; every card update re-anchors it.
2. **Badge-gated dealing.** Before accepting a verification job from another
   agent, the Gatekeeper checks the counterparty's badge and card with the
   five registry checks — expected contract, active status, on-chain/agent
   match, card-hash match, owner match — via the hosted Agent Registry MCP
   server. Unverified counterparties get a reduced-trust path.
   Reference implementation: [`src/badge_check.py`](src/badge_check.py).
3. **x402 micropayments.** Verification calls are payable agent-to-agent via
   x402 with sponsored fees; the registry is the public audit trail.

## Concordium components used

Agent Registry (CIS-8004) · ERC-8004 Agent Card (A2A v1.0) · Verified by
Concordium badge (testnet identity) · hosted Agent Registry MCP server ·
x402 payments with sponsored transactions.

## Testnet facts

- Owner account: `3R9ftQ2vHsKWocVvX5SuUYNTRzwzcku6MFG3cHj2tg5sr8S5Am`
- CIS-8004 registry (testnet): contract index 12802
- **Registered agent: token_id 1284 · token_address `JyP9TxoMgKbY9QTpPqCRF` · status Active · badge_valid = true (registry check, 2026-11-19)**
- Agent Card: [`agent-card.json`](agent-card.json) — metadata SHA-256
  `528eb36eee7ea58a4487854284af410696771b0c82e2e908d155cf06aeb0b616` (anchored on chain)
- Registration status: see `docs/BUILD-LOG.md`

## Path to production

The same badge and registry entry move to mainnet (real IdP-verified
identity), making the agent hirable by strangers who can verify that a real,
accountable human stands behind it before any money moves — and the
Gatekeeper can demand the same of every agent that hires it.

## Team

Solo — Rendi (GitHub [@Klowor2002](https://github.com/Klowor2002)).

## Layout

- `agent-card.json` — the canonical ERC-8004 / A2A Agent Card (built with the
  registry's `build_agent_card` tool; hosted at its own `url`)
- `src/badge_check.py` — counterparty badge verification (five checks)
- `scripts/mcp_call.py` — minimal client for the hosted registry MCP server
- `scripts/` — build/register payload arguments used with the MCP tools
- `docs/` — checkpoint paste-ready text + build log
