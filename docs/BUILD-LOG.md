# Build log — Gatekeeper, Verified

## 2026-11-19 — Registry core built + verified on testnet

**Agent registered in the CIS-8004 Agent Registry (testnet) and fully badge-valid.**

- Owner account: `3R9ftQ2vHsKWocVvX5SuUYNTRzwzcku6MFG3cHj2tg5sr8S5Am`
  (testnet identity via Concordium testnet IP — mock identity, no real documents)
- **token_id: 1284** · **token_address: `JyP9TxoMgKbY9QTpPqCRF`** · status: Active
- Agent Card: https://raw.githubusercontent.com/Klowor2002/gatekeeper-verified/main/agent-card.json
  - v1 (pre-mint) SHA-256 `ba45d659fa99a5bc90866d9dc500ec288dfd1583a6d343cce01983fe29df43d8`
  - v2 (token pinned) SHA-256 `528eb36eee7ea58a4487854284af410696771b0c82e2e908d155cf06aeb0b616` ← anchored on chain
- Register tx: `336f09f6de04e6cbba0bc78d30773c606a428587cf3f4f8aad7065ab5e86341d`
  (cost 18.109 test CCD) — https://ccdexplorer.io/testnet/transaction/336f09f6de04e6cbba0bc78d30773c606a428587cf3f4f8aad7065ab5e86341d
- setAgentURI tx (re-anchor v2 hash): `1ed4329f9a8a055b435f8a3e4e9077605117bf49cd048e2a28e23349da5f56e0`
  (cost 13.460 test CCD) — https://ccdexplorer.io/testnet/transaction/1ed4329f9a8a055b435f8a3e4e9077605117bf49cd048e2a28e23349da5f56e0
- Final verification (registry `check_badge`): **badge_valid = true, issues = []** —
  expected contract ✓, active ✓, card fetched ✓, SHA-256 == on-chain metadata_hash ✓,
  token address ✓, owner ✓. Our own `src/badge_check.py` returns ok=true (exit 0)
  on this badge, and also validates the workshop's example badge
  (`JyP9UhTu6PeHXpm6LAhSy`, token 43).

### How it was built
- Card composed with the hosted MCP server's `build_agent_card`
  (https://agent-registry-mcp.concordium.com/mcp), register + setAgentURI
  payloads from `build_register` / `build-set-agent-uri`.
- Signing: local, in-process — account keys derived from the wallet seed
  with `@concordium/web-sdk` (`ConcordiumHdWallet`); the derived key for
  (identityProvider 0, identity 0, credential 0) matches on-chain credential 0
  (verified by `tools/derive_check.mjs` before any signing). Seed/keys never
  printed or logged. Transactions submitted via a public testnet node
  (grpc.testnet.concordium.com:20000) with `tools/submit_update.mjs`.

### Remaining for the 9 Dec submission
- Badge-gated dealing wired into the live Gatekeeper endpoint (badge check
  before accepting a job; reduced-trust path for unverified counterparties).
- x402 micropayment demo for a verification call (sponsored fees).
- Demo video ≤ 3 min + CCDExplorer links + go-live plan in the submission form.
- Checkpoint 1 (22 Nov 23:59 UTC): create project + team + idea on the Encode
  platform — paste-ready text in `docs/CHECKPOINT1.md`.
