import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createSolanaClient,
  createTransaction,
  createKeyPairSignerFromBytes,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
} from 'gill';
import {
  deriveCredentialPda,
  deriveSchemaPda,
  fetchMaybeCredential,
  fetchMaybeSchema,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
} from 'sas-lib';

const RPC = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
const KEYPAIR_PATH = process.env.ISSUER_KEYPAIR ?? resolve(process.env.HOME ?? '~', '.config/solana/id.json');

const SKILLD_CREDENTIAL_NAME = 'SKILLD';
const BUILDER_SCORE_SCHEMA_NAME = 'BUILDER-SCORE';
const PEER_VOUCH_SCHEMA_NAME = 'PEER-VOUCH';
const SCHEMA_VERSION = 1;

const BUILDER_SCORE_FIELDS = ['score', 'hackathon_wins', 'bounties_won', 'github_commits', 'onchain_actions'];
const BUILDER_SCORE_LAYOUT = new Uint8Array([4, 4, 4, 4, 4]);

const PEER_VOUCH_FIELDS = ['skill', 'context', 'signer'];
const PEER_VOUCH_LAYOUT = new Uint8Array([12, 12, 12]);

async function main() {
  const raw = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8')) as number[];
  const issuer = await createKeyPairSignerFromBytes(new Uint8Array(raw));
  console.log('Issuer authority:', issuer.address);
  console.log('RPC:', RPC);

  const client = createSolanaClient({ urlOrMoniker: RPC });

  const [credentialPda] = await deriveCredentialPda({ authority: issuer.address, name: SKILLD_CREDENTIAL_NAME });
  console.log('Credential PDA:', credentialPda);

  const credAccount = await fetchMaybeCredential(client.rpc, credentialPda);
  if (credAccount.exists) {
    console.log('Credential already exists. Skipping creation.');
  } else {
    console.log('Creating credential...');
    const ix = getCreateCredentialInstruction({
      payer: issuer,
      credential: credentialPda,
      authority: issuer,
      name: SKILLD_CREDENTIAL_NAME,
      signers: [issuer.address],
    });
    await sendOne(client, [ix], issuer);
  }

  const [scoreSchemaPda] = await deriveSchemaPda({ credential: credentialPda, name: BUILDER_SCORE_SCHEMA_NAME, version: SCHEMA_VERSION });
  const [vouchSchemaPda] = await deriveSchemaPda({ credential: credentialPda, name: PEER_VOUCH_SCHEMA_NAME, version: SCHEMA_VERSION });
  console.log('BUILDER-SCORE PDA:', scoreSchemaPda);
  console.log('PEER-VOUCH PDA:', vouchSchemaPda);

  const scoreSchemaAcc = await fetchMaybeSchema(client.rpc, scoreSchemaPda);
  if (scoreSchemaAcc.exists) {
    console.log('BUILDER-SCORE schema already exists.');
  } else {
    console.log('Creating BUILDER-SCORE schema...');
    const ix = getCreateSchemaInstruction({
      authority: issuer,
      payer: issuer,
      name: BUILDER_SCORE_SCHEMA_NAME,
      credential: credentialPda,
      description: 'Builder Score across hackathons bounties github onchain',
      fieldNames: BUILDER_SCORE_FIELDS,
      schema: scoreSchemaPda,
      layout: Buffer.from(BUILDER_SCORE_LAYOUT),
    });
    await sendOne(client, [ix], issuer);
  }

  const vouchSchemaAcc = await fetchMaybeSchema(client.rpc, vouchSchemaPda);
  if (vouchSchemaAcc.exists) {
    console.log('PEER-VOUCH schema already exists.');
  } else {
    console.log('Creating PEER-VOUCH schema...');
    const ix = getCreateSchemaInstruction({
      authority: issuer,
      payer: issuer,
      name: PEER_VOUCH_SCHEMA_NAME,
      credential: credentialPda,
      description: 'Peer signed vouch for a builder skill or collaboration',
      fieldNames: PEER_VOUCH_FIELDS,
      schema: vouchSchemaPda,
      layout: Buffer.from(PEER_VOUCH_LAYOUT),
    });
    await sendOne(client, [ix], issuer);
  }

  console.log('\nBootstrap complete. Add this to .env:');
  console.log(`VITE_SKILLD_ISSUER_AUTHORITY=${issuer.address}`);
}

async function sendOne(client: ReturnType<typeof createSolanaClient>, instructions: unknown[], signer: Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>) {
  const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();
  const tx = createTransaction({
    feePayer: signer,
    version: 0,
    latestBlockhash,
    instructions: instructions as never,
  });
  const signedTx = await signTransactionMessageWithSigners(tx);
  const sig = getSignatureFromTransaction(signedTx);
  await client.sendAndConfirmTransaction(signedTx);
  console.log(' →', sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
