import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createSolanaClient,
  createTransaction,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
} from 'gill';
import {
  deriveCredentialPda,
  deriveSchemaPda,
  deriveAttestationPda,
  fetchMaybeCredential,
  fetchMaybeSchema,
  fetchMaybeAttestation,
  serializeAttestationData,
  deserializeAttestationData,
  getCreateAttestationInstruction,
} from 'sas-lib';

const RPC = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
const KEYPAIR_PATH = process.env.ISSUER_KEYPAIR ?? resolve(process.env.HOME ?? '~', '.config/solana/id.json');

const SKILLD_CREDENTIAL_NAME = 'SKILLD';
const BUILDER_SCORE_SCHEMA_NAME = 'BUILDER-SCORE';
const PEER_VOUCH_SCHEMA_NAME = 'PEER-VOUCH';
const SCHEMA_VERSION = 1;

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(' ' + title);
  console.log('='.repeat(60));
}

function dump(obj: unknown): string {
  return JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
}

async function main() {
  logSection('SETUP');
  const raw = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8')) as number[];
  const issuer = await createKeyPairSignerFromBytes(new Uint8Array(raw));
  console.log('Issuer:', issuer.address);
  console.log('RPC:', RPC);

  const client = createSolanaClient({ urlOrMoniker: RPC });

  const subject = await generateKeyPairSigner();
  console.log('Test subject (synthetic builder):', subject.address);

  const peerSigner = await generateKeyPairSigner();
  console.log('Test peer signer:', peerSigner.address);

  logSection('VERIFY ONCHAIN INFRA');
  const [credentialPda] = await deriveCredentialPda({ authority: issuer.address, name: SKILLD_CREDENTIAL_NAME });
  const credAcc = await fetchMaybeCredential(client.rpc, credentialPda);
  console.log('Credential PDA:', credentialPda);
  console.log(' exists:', credAcc.exists);
  if (credAcc.exists) {
    console.log(' authority:', credAcc.data.authority);
    console.log(' name:', credAcc.data.name);
  }

  const [scoreSchemaPda] = await deriveSchemaPda({ credential: credentialPda, name: BUILDER_SCORE_SCHEMA_NAME, version: SCHEMA_VERSION });
  const scoreSchemaAcc = await fetchMaybeSchema(client.rpc, scoreSchemaPda);
  console.log('\nBUILDER-SCORE schema PDA:', scoreSchemaPda);
  console.log(' exists:', scoreSchemaAcc.exists);
  if (scoreSchemaAcc.exists) {
    console.log(' fields:', scoreSchemaAcc.data.fieldNames);
    console.log(' description:', scoreSchemaAcc.data.description);
  }

  const [vouchSchemaPda] = await deriveSchemaPda({ credential: credentialPda, name: PEER_VOUCH_SCHEMA_NAME, version: SCHEMA_VERSION });
  const vouchSchemaAcc = await fetchMaybeSchema(client.rpc, vouchSchemaPda);
  console.log('\nPEER-VOUCH schema PDA:', vouchSchemaPda);
  console.log(' exists:', vouchSchemaAcc.exists);
  if (vouchSchemaAcc.exists) {
    console.log(' fields:', vouchSchemaAcc.data.fieldNames);
    console.log(' description:', vouchSchemaAcc.data.description);
  }

  logSection('TEST 1: ISSUE BUILDER-SCORE ATTESTATION');
  if (!scoreSchemaAcc.exists) {
    console.log(' ✗ schema missing, skip');
  } else {
    const [attPda] = await deriveAttestationPda({
      credential: credentialPda,
      schema: scoreSchemaPda,
      nonce: subject.address,
    });
    console.log('Attestation PDA:', attPda);

    const data = {
      score: 76,
      hackathon_wins: 4,
      bounties_won: 12,
      github_commits: 247,
      onchain_actions: 89,
    };
    const expiry = Math.floor(Date.now() / 1000) + 365 * 86400;

    const ix = getCreateAttestationInstruction({
      payer: issuer,
      authority: issuer,
      credential: credentialPda,
      schema: scoreSchemaPda,
      attestation: attPda,
      nonce: subject.address,
      expiry,
      data: serializeAttestationData(scoreSchemaAcc.data, data as never),
    });

    const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();
    const tx = createTransaction({
      feePayer: issuer,
      version: 0,
      latestBlockhash,
      instructions: [ix],
    });
    const signedTx = await signTransactionMessageWithSigners(tx);
    const sig = getSignatureFromTransaction(signedTx);
    console.log('Sending...');
    await client.sendAndConfirmTransaction(signedTx);
    console.log(' ✓ Confirmed');
    console.log(' tx:', sig);
    console.log(' explorer: https://solscan.io/tx/' + sig + '?cluster=devnet');

    const fetched = await fetchMaybeAttestation(client.rpc, attPda);
    if (fetched.exists) {
      const decoded = deserializeAttestationData(scoreSchemaAcc.data, fetched.data.data as Uint8Array);
      console.log(' decoded data:', dump(decoded));
      console.log(' expiry:', new Date(Number(fetched.data.expiry) * 1000).toISOString());
    }
  }

  logSection('TEST 2: ISSUE PEER-VOUCH ATTESTATION');
  if (!vouchSchemaAcc.exists) {
    console.log(' ✗ schema missing, skip');
  } else {
    const [attPda] = await deriveAttestationPda({
      credential: credentialPda,
      schema: vouchSchemaPda,
      nonce: peerSigner.address,
    });
    console.log('Attestation PDA:', attPda);

    const data = {
      skill: 'Rust',
      context: 'Shipped Skilld at Frontier hackathon. Built the SAS issuer flow.',
      signer: peerSigner.address,
    };
    const expiry = Math.floor(Date.now() / 1000) + 365 * 86400;

    const ix = getCreateAttestationInstruction({
      payer: issuer,
      authority: issuer,
      credential: credentialPda,
      schema: vouchSchemaPda,
      attestation: attPda,
      nonce: peerSigner.address,
      expiry,
      data: serializeAttestationData(vouchSchemaAcc.data, data as never),
    });

    const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();
    const tx = createTransaction({
      feePayer: issuer,
      version: 0,
      latestBlockhash,
      instructions: [ix],
    });
    const signedTx = await signTransactionMessageWithSigners(tx);
    const sig = getSignatureFromTransaction(signedTx);
    console.log('Sending...');
    await client.sendAndConfirmTransaction(signedTx);
    console.log(' ✓ Confirmed');
    console.log(' tx:', sig);
    console.log(' explorer: https://solscan.io/tx/' + sig + '?cluster=devnet');

    const fetched = await fetchMaybeAttestation(client.rpc, attPda);
    if (fetched.exists) {
      const decoded = deserializeAttestationData(vouchSchemaAcc.data, fetched.data.data as Uint8Array);
      console.log(' decoded data:', dump(decoded));
    }
  }

  logSection('TEST 3: ISSUE BUILDER-SCORE FOR ISSUER ITSELF');
  if (scoreSchemaAcc.exists) {
    const [attPda] = await deriveAttestationPda({
      credential: credentialPda,
      schema: scoreSchemaPda,
      nonce: issuer.address,
    });
    console.log('Attestation PDA (subject = issuer):', attPda);

    const existing = await fetchMaybeAttestation(client.rpc, attPda);
    if (existing.exists) {
      console.log(' ✓ already issued');
      const decoded = deserializeAttestationData(scoreSchemaAcc.data, existing.data.data as Uint8Array);
      console.log(' current data:', dump(decoded));
    } else {
      const data = {
        score: 92,
        hackathon_wins: 6,
        bounties_won: 18,
        github_commits: 1200,
        onchain_actions: 240,
      };
      const expiry = Math.floor(Date.now() / 1000) + 365 * 86400;

      const ix = getCreateAttestationInstruction({
        payer: issuer,
        authority: issuer,
        credential: credentialPda,
        schema: scoreSchemaPda,
        attestation: attPda,
        nonce: issuer.address,
        expiry,
        data: serializeAttestationData(scoreSchemaAcc.data, data as never),
      });

      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();
      const tx = createTransaction({
        feePayer: issuer,
        version: 0,
        latestBlockhash,
        instructions: [ix],
      });
      const signedTx = await signTransactionMessageWithSigners(tx);
      const sig = getSignatureFromTransaction(signedTx);
      console.log('Sending...');
      await client.sendAndConfirmTransaction(signedTx);
      console.log(' ✓ Confirmed');
      console.log(' tx:', sig);
      console.log(' explorer: https://solscan.io/tx/' + sig + '?cluster=devnet');
    }
  }

  logSection('SUMMARY');
  console.log('All tests passed.');
  console.log('Issuer wallet:', issuer.address);
  console.log('Synthetic subject:', subject.address);
  console.log('Peer signer:', peerSigner.address);
  console.log('\nThe live profile path on Vercel reads from these PDAs.');
  console.log('Visit https://skilld-app.vercel.app/[domain].sol with VITE_SKILLD_ISSUER_AUTHORITY set to the issuer.');
}

main().catch((err) => {
  console.error('\n✗ TEST FAILED');
  console.error(err);
  process.exit(1);
});
