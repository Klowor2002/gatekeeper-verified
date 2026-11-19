# Checkpoint 1 — paste-ready (Encode platform, due Sun 22 Nov 2026, 23:59 UTC)

Checkpoint 1 asks for: **create project + add team + share idea** (a rough
draft; editable afterwards). Everything below is truthful and ready to paste.

- **Project name:** Gatekeeper, Verified
- **Team:** Solo — Rendi (add self as the only member)
- **One-liner:** Our already-live zkVerify Gatekeeper agent — which verifies
  zero-knowledge proofs before money moves — gains a Concordium
  accountability layer: an Agent Registry entry with an ERC-8004 Agent Card,
  a "Verified by Concordium" badge other agents check before dealing with
  it, and x402 micropayments for verification calls on testnet.
- **Idea / description:** Before accepting a verification job from another
  agent, the Gatekeeper checks the counterparty's Verified-by-Concordium
  badge via the hosted Agent Registry MCP server / registry lookup;
  unverified counterparties get a reduced-trust path. Verification calls are
  paid via x402 with sponsored fees, and the registry serves as the audit
  trail of what the agent did.
- **Concordium components:** Agent Registry (CIS-8004) + ERC-8004 Agent Card,
  Verified by Concordium badge (testnet identity), x402 payments with
  sponsored transactions, MCP server.
- **Repo:** https://github.com/Klowor2002/gatekeeper-verified
- **Existing agent:** klowor-gatekeeper —
  https://klowor-gatekeeper.netlify.app/agent (live in the zkVerify Agent
  Games)
- **Path to production:** the same badge and registry entry move to mainnet,
  making the agent hirable by strangers who can verify a real, accountable
  human stands behind it before any money moves.
