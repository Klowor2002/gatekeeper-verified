/**
 * Submit a CIS contract-update transaction on Concordium TESTNET, signed by
 * the wallet derived from wallet.json (read IN-PROCESS; the seed and signing
 * key never leave this process and are never printed).
 *
 * Usage: node submit_update.mjs <payload.json>
 * payload.json shape (as produced by the registry MCP build_* tools):
 *   { contract_address: {index, subindex}, receive_name: "CIS-8004.register",
 *     parameter_hex: "...", suggested_energy: 30000, sender: "<base58>" }
 * Prints: tx hash, finalization outcome, explorer link. Full summary is
 * written next to the payload file as <name>.result.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import {
  AccountAddress,
  CcdAmount,
  ConcordiumHdWallet,
  ContractAddress,
  ContractName,
  Energy,
  EntrypointName,
  Parameter,
  ReceiveName,
  Transaction,
  TransactionExpiry,
  buildAccountSigner,
} from '@concordium/web-sdk';

const payloadFile = process.argv[2];
const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
const SENDER = payload.sender;
const EXPECTED_SENDER = '3R9ftQ2vHsKWocVvX5SuUYNTRzwzcku6MFG3cHj2tg5sr8S5Am';
if (SENDER !== EXPECTED_SENDER) {
  console.log(JSON.stringify({ ok: false, stage: 'guard', error: 'sender mismatch' }));
  process.exit(2);
}

const walletJson = JSON.parse(fs.readFileSync(process.env.WALLET_FILE, 'utf8'));
const hd = ConcordiumHdWallet.fromSeedPhrase(walletJson.seed_phrase.trim(), 'Testnet');
// Verified 2026-11-19: on-chain credential 0 key == derived (idp 0, identity 0, cred 0).
const signingKeyHex = hd.getAccountSigningKey(0, 0, 0).toString('hex');
const signer = buildAccountSigner(signingKeyHex);

const client = new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl());
const senderAddress = AccountAddress.fromBase58(SENDER);
const { nonce } = await client.getNextAccountNonce(senderAddress);

const [contractName, entrypoint] = payload.receive_name.split('.');
const updatePayload = {
  amount: CcdAmount.zero(),
  address: ContractAddress.create(BigInt(payload.contract_address.index), BigInt(payload.contract_address.subindex)),
  receiveName: ReceiveName.create(ContractName.fromString(contractName), EntrypointName.fromString(entrypoint)),
  message: Parameter.fromHexString(payload.parameter_hex),
};
const energy = Energy.create(BigInt(payload.suggested_energy) + 5000n);

const signable = Transaction.updateContract(updatePayload, energy)
  .addMetadata({ sender: senderAddress, nonce, expiry: TransactionExpiry.futureMinutes(60) })
  .build();

const finalized = await Transaction.signAndFinalize(signable, signer);
const sentHash = await client.sendTransaction(finalized);
console.log(JSON.stringify({ stage: 'sent', hash: sentHash.toString() }));

const summary = await client.waitForTransactionFinalization(sentHash, 180000);
const result = {
  ok: summary.summary.transactionType === 'accountTransaction' || !!summary.summary,
  hash: sentHash.toString(),
  explorer: `https://ccdexplorer.io/testnet/transaction/${sentHash.toString()}`,
  outcome: summary.summary?.outcome ?? summary.summary?.result?.outcome ?? 'unknown',
  summary: JSON.parse(JSON.stringify(summary, (k, v) => (typeof v === 'bigint' ? v.toString() : v))),
};
const outFile = payloadFile.replace(/\.json$/, '') + '.result.json';
fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ stage: 'finalized', hash: result.hash, outcome: result.outcome, explorer: result.explorer, resultFile: path.resolve(outFile) }, null, 2));
