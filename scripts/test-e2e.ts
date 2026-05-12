import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
import {
  createSolanaClient,
  createTransaction as gillCreateTransaction,
  createKeyPairSignerFromBytes,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  address as toAddress,
} from 'gill';
import {
  deriveCredentialPda,
  deriveSchemaPda,
  deriveAttestationPda,
  fetchMaybeAttestation,
  fetchMaybeSchema,
  serializeAttestationData,
  deserializeAttestationData,
  getCreateAttestationInstruction,
} from 'sas-lib';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

const RPC = 'https://api.devnet.solana.com';
const ISSUER_PATH = '/Users/mac/skilld/.keys/skilld-issuer.json';
const USER_PATH = '/Users/mac/skilld/.keys/skilld-test-user.json';

const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_DECIMALS = 6;
const INTRO_PRICE = 1;

const SKILLD_CREDENTIAL_NAME = 'SKILLD';
const BUILDER_SCORE_SCHEMA_NAME = 'BUILDER-SCORE';
const PEER_VOUCH_SCHEMA_NAME = 'PEER-VOUCH';
const SCHEMA_VERSION = 1;

const RECIPIENT_FRAMEW0RK = 'GZsQbu6cKqLHZdtcsupp7E1G81fVH9bnTLnHQVgjF1HK';

function logSection(title: string) {
  console.log('\n' + '='.repeat(64));
  console.log(' ' + title);
  console.log('='.repeat(64));
}

function dump(obj: unknown): string {
  return JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
}

async function main() {
  logSection('SETUP');
  const issuerRaw = JSON.parse(readFileSync(ISSUER_PATH, 'utf8')) as number[];
  const userRaw = JSON.parse(readFileSync(USER_PATH, 'utf8')) as number[];
  const issuer = Keypair.fromSecretKey(new Uint8Array(issuerRaw));
  const user = Keypair.fromSecretKey(new Uint8Array(userRaw));
  console.log('Issuer:', issuer.publicKey.toBase58());
  console.log('Test user:', user.publicKey.toBase58());
  const recipient = new PublicKey(RECIPIENT_FRAMEW0RK);
  console.log('Intro recipient (framew0rk escrow):', recipient.toBase58());

  const conn = new Connection(RPC, 'confirmed');
  const issuerSigner = await createKeyPairSignerFromBytes(new Uint8Array(issuerRaw));
  const client = createSolanaClient({ urlOrMoniker: RPC });

  logSection('STEP 1: TEST USER SIGNS PEER VOUCH MESSAGE');
  const vouchMessage = [
    'Skilld Attestation v1',
    `From: testuser_${user.publicKey.toBase58().slice(0, 8)}.wallet`,
    'To: framew0rk.sol',
    'Skill: Rust',
    'Context: Shipped Skilld at Frontier 2026. Solid SAS integration.',
    `Signed: ${new Date().toISOString()}`,
  ].join('\n');
  const messageBytes = new TextEncoder().encode(vouchMessage);
  const signatureBytes = nacl.sign.detached(messageBytes, user.secretKey);
  const signatureB58 = bs58.encode(signatureBytes);
  console.log('Vouch message:', vouchMessage.slice(0, 80) + '...');
  console.log(' ✓ User signed (nacl detached)');
  console.log(' signature:', signatureB58.slice(0, 24) + '...');

  const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, user.publicKey.toBytes());
  console.log(' ✓ Signature verifies:', verified);

  logSection('STEP 2: ISSUER WRITES PEER-VOUCH SAS ATTESTATION');
  const [credentialPda] = await deriveCredentialPda({
    authority: toAddress(issuer.publicKey.toBase58()),
    name: SKILLD_CREDENTIAL_NAME,
  });
  const [vouchSchemaPda] = await deriveSchemaPda({
    credential: credentialPda,
    name: PEER_VOUCH_SCHEMA_NAME,
    version: SCHEMA_VERSION,
  });
  const vouchSchemaAcc = await fetchMaybeSchema(client.rpc, vouchSchemaPda);
  if (!vouchSchemaAcc.exists) throw new Error('PEER-VOUCH schema missing');

  const [vouchAttPda] = await deriveAttestationPda({
    credential: credentialPda,
    schema: vouchSchemaPda,
    nonce: toAddress(user.publicKey.toBase58()),
  });
  console.log('Vouch attestation PDA (nonce = signer):', vouchAttPda);

  const existing = await fetchMaybeAttestation(client.rpc, vouchAttPda);
  let vouchTxSig: string | null = null;
  if (existing.exists) {
    console.log(' already exists, skipping');
  } else {
    const ix = getCreateAttestationInstruction({
      payer: issuerSigner,
      authority: issuerSigner,
      credential: credentialPda,
      schema: vouchSchemaPda,
      attestation: vouchAttPda,
      nonce: toAddress(user.publicKey.toBase58()),
      expiry: Math.floor(Date.now() / 1000) + 365 * 86400,
      data: serializeAttestationData(vouchSchemaAcc.data, {
        skill: 'Rust',
        context: 'Shipped Skilld at Frontier 2026. Solid SAS integration.',
        signer: user.publicKey.toBase58(),
      } as never),
    });
    const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();
    const tx = gillCreateTransaction({
      feePayer: issuerSigner,
      version: 0,
      latestBlockhash,
      instructions: [ix],
    });
    const signedTx = await signTransactionMessageWithSigners(tx);
    vouchTxSig = getSignatureFromTransaction(signedTx);
    console.log(' Sending...');
    await client.sendAndConfirmTransaction(signedTx);
    console.log(' ✓ Confirmed');
    console.log(' tx:', vouchTxSig);
    console.log(' explorer: https://solscan.io/tx/' + vouchTxSig + '?cluster=devnet');
  }

  const fetched = await fetchMaybeAttestation(client.rpc, vouchAttPda);
  if (fetched.exists) {
    const decoded = deserializeAttestationData(vouchSchemaAcc.data, fetched.data.data as Uint8Array);
    console.log(' ✓ Read back from chain:');
    console.log('   ' + dump(decoded).split('\n').join('\n   '));
  }

  logSection('STEP 3: TEST USER PAYS x402 USDC INTRO TO framew0rk');
  const mint = new PublicKey(USDC_MINT);
  const userAta = getAssociatedTokenAddressSync(mint, user.publicKey);
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient);
  console.log('User USDC ATA:', userAta.toBase58());
  console.log('Recipient USDC ATA:', recipientAta.toBase58());

  const userAccBefore = await getAccount(conn, userAta);
  console.log('User USDC before:', Number(userAccBefore.amount) / 10 ** USDC_DECIMALS);

  let recipientBefore = 0;
  try {
    const acc = await getAccount(conn, recipientAta);
    recipientBefore = Number(acc.amount) / 10 ** USDC_DECIMALS;
    console.log('Recipient USDC before:', recipientBefore);
  } catch {
    console.log('Recipient ATA does not exist yet, will create');
  }

  const { blockhash } = await conn.getLatestBlockhash();
  const tx = new Transaction({ feePayer: user.publicKey, recentBlockhash: blockhash });
  const recipientInfo = await conn.getAccountInfo(recipientAta);
  if (!recipientInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      user.publicKey, recipientAta, recipient, mint,
      TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    ));
  }
  tx.add(createTransferCheckedInstruction(
    userAta, mint, recipientAta, user.publicKey,
    BigInt(INTRO_PRICE * 10 ** USDC_DECIMALS),
    USDC_DECIMALS, [], TOKEN_PROGRAM_ID,
  ));

  console.log(' Signing as test user (recruiter simulating)...');
  const introSig = await sendAndConfirmTransaction(conn, tx, [user], { commitment: 'confirmed' });
  console.log(' ✓ Confirmed');
  console.log(' tx:', introSig);
  console.log(' explorer: https://solscan.io/tx/' + introSig + '?cluster=devnet');

  const userAccAfter = await getAccount(conn, userAta);
  const recipientAccAfter = await getAccount(conn, recipientAta);
  console.log('User USDC after:', Number(userAccAfter.amount) / 10 ** USDC_DECIMALS);
  console.log('Recipient USDC after:', Number(recipientAccAfter.amount) / 10 ** USDC_DECIMALS);

  logSection('STEP 4: ISSUER WRITES BUILDER-SCORE FOR TEST USER');
  const [scoreSchemaPda] = await deriveSchemaPda({
    credential: credentialPda,
    name: BUILDER_SCORE_SCHEMA_NAME,
    version: SCHEMA_VERSION,
  });
  const scoreSchemaAcc = await fetchMaybeSchema(client.rpc, scoreSchemaPda);
  if (!scoreSchemaAcc.exists) throw new Error('BUILDER-SCORE schema missing');

  const [scoreAttPda] = await deriveAttestationPda({
    credential: credentialPda,
    schema: scoreSchemaPda,
    nonce: toAddress(user.publicKey.toBase58()),
  });
  console.log('Score attestation PDA:', scoreAttPda);

  const existingScore = await fetchMaybeAttestation(client.rpc, scoreAttPda);
  let scoreTxSig: string | null = null;
  if (existingScore.exists) {
    console.log(' already exists, skipping');
  } else {
    const data = {
      score: 68,
      hackathon_wins: 2,
      bounties_won: 5,
      github_commits: 156,
      onchain_actions: 42,
    };
    const ix = getCreateAttestationInstruction({
      payer: issuerSigner,
      authority: issuerSigner,
      credential: credentialPda,
      schema: scoreSchemaPda,
      attestation: scoreAttPda,
      nonce: toAddress(user.publicKey.toBase58()),
      expiry: Math.floor(Date.now() / 1000) + 365 * 86400,
      data: serializeAttestationData(scoreSchemaAcc.data, data as never),
    });
    const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();
    const gillTx = gillCreateTransaction({
      feePayer: issuerSigner,
      version: 0,
      latestBlockhash,
      instructions: [ix],
    });
    const signedTx = await signTransactionMessageWithSigners(gillTx);
    scoreTxSig = getSignatureFromTransaction(signedTx);
    console.log(' Sending...');
    await client.sendAndConfirmTransaction(signedTx);
    console.log(' ✓ Confirmed');
    console.log(' tx:', scoreTxSig);
    console.log(' explorer: https://solscan.io/tx/' + scoreTxSig + '?cluster=devnet');
    console.log(' issued data:', dump(data));
  }

  const fetchedScore = await fetchMaybeAttestation(client.rpc, scoreAttPda);
  if (fetchedScore.exists) {
    const decoded = deserializeAttestationData(scoreSchemaAcc.data, fetchedScore.data.data as Uint8Array);
    console.log(' ✓ Read back from chain:');
    console.log('   ' + dump(decoded).split('\n').join('\n   '));
  }

  logSection('SUMMARY');
  console.log('\nFULL E2E FLOW PASSED');
  console.log('\nTransactions broadcast:');
  if (vouchTxSig) console.log('  PEER-VOUCH SAS attestation:', vouchTxSig);
  console.log('  x402 USDC paid intro:        ', introSig);
  if (scoreTxSig) console.log('  BUILDER-SCORE SAS attestation:', scoreTxSig);
  console.log('\nWallets used:');
  console.log('  Issuer (Skilld credential authority):', issuer.publicKey.toBase58());
  console.log('  Test user (recruiter + builder subject):', user.publicKey.toBase58());
  console.log('\nAttestations live onchain:');
  console.log('  PEER-VOUCH PDA:', vouchAttPda);
  console.log('  BUILDER-SCORE PDA:', scoreAttPda);
  console.log('\nOpen profile: https://skilld-app.vercel.app/' + user.publicKey.toBase58().slice(0, 8) + '.sol');
}

main().catch((err) => {
  console.error('\n✗ TEST FAILED');
  console.error(err);
  process.exit(1);
});
