/**
 * Derivation check for the Concordium testnet wallet.
 * Reads wallet.json IN-PROCESS; the seed phrase never leaves this process
 * and is never printed. Prints only public data: which (identityProvider,
 * identity, credential) indices derive the on-chain credential key of the
 * known account, plus nonce + balance.
 */
import fs from 'node:fs';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import {
  AccountAddress,
  ConcordiumHdWallet,
} from '@concordium/web-sdk';

const WALLET_FILE = process.env.WALLET_FILE;
const KNOWN_ADDRESS = '3R9ftQ2vHsKWocVvX5SuUYNTRzwzcku6MFG3cHj2tg5sr8S5Am';

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${label}`)), ms),
    ),
  ]);
}

const walletJson = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
const seedPhrase = walletJson.seed_phrase;
if (typeof seedPhrase !== 'string' || seedPhrase.trim().split(/\s+/).length < 12) {
  console.log(JSON.stringify({ ok: false, stage: 'seed', error: 'seed_phrase missing or malformed' }));
  process.exit(2);
}
const hd = ConcordiumHdWallet.fromSeedPhrase(seedPhrase.trim(), 'Testnet');

const client = new ConcordiumGRPCNodeClient(
  'grpc.testnet.concordium.com',
  20000,
  credentials.createSsl(),
);

let info;
try {
  info = await withTimeout(
    client.getAccountInfo(AccountAddress.fromBase58(KNOWN_ADDRESS)),
    45000,
    'getAccountInfo',
  );
} catch (e) {
  console.log(JSON.stringify({ ok: false, stage: 'grpc', error: String(e && e.message || e).slice(0, 300) }));
  process.exit(3);
}

// Collect on-chain verification keys per credential index.
// SDK v12 shape: cred.value.contents.credentialPublicKeys.keys {idx: {verifyKey}}
const onChain = {};
for (const [credIdx, cred] of Object.entries(info.accountCredentials)) {
  const keys = cred.value?.contents?.credentialPublicKeys?.keys ?? {};
  onChain[credIdx] = Object.values(keys).map((k) => k.verifyKey);
}

let match = null;
for (let idp = 0; idp < 4 && !match; idp++) {
  for (let identity = 0; identity < 2 && !match; identity++) {
    for (let cred = 0; cred < 2 && !match; cred++) {
      let pub;
      try {
        pub = hd.getAccountPublicKey(idp, identity, cred).toString('hex');
      } catch {
        continue;
      }
      for (const [credIdx, keys] of Object.entries(onChain)) {
        if (keys.includes(pub)) {
          match = { identityProviderIndex: idp, identityIndex: identity, credentialCounter: cred, onChainCredIndex: Number(credIdx) };
        }
      }
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  address: KNOWN_ADDRESS,
  nonce: Number(info.accountNonce),
  balanceMicroCcd: String(info.accountAmount.microCcdAmount),
  credentialsOnChain: Object.keys(onChain).length,
  match,
}, null, 2));
process.exit(match ? 0 : 4);
