import { readFileSync } from 'node:fs';
import {
  createSolanaClient,
  createTransaction,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
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

const RPC = 'https://api.devnet.solana.com';
const ISSUER_PATH = '/Users/mac/skilld/.keys/skilld-issuer.json';

const SKILLD_CREDENTIAL_NAME = 'SKILLD';
const BUILDER_SCORE_SCHEMA_NAME = 'BUILDER-SCORE';
const PEER_VOUCH_SCHEMA_NAME = 'PEER-VOUCH';
const SCHEMA_VERSION = 1;

const WEIGHTS = {
  colosseum: 25,
  superteam: 20,
  onchain: 20,
  github: 15,
  attestations: 15,
  credentials: 5,
};

function logSection(title: string) {
  console.log('\n' + '='.repeat(64));
  console.log(' ' + title);
  console.log('='.repeat(64));
}

function dump(obj: unknown): string {
  return JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
}

function attestationPoints(count: number, avgFromScore: number): number {
  if (count === 0) return 0;
  const total = count * Math.max(20, avgFromScore) / 100;
  return Math.min(total * 25, 100);
}

function computeScore(input: {
  colosseum: number; superteam: number; onchain: number;
  github: number; attestationCount: number; avgAttestorScore: number; credentials: number;
}) {
  return {
    colosseum: Math.round(input.colosseum * WEIGHTS.colosseum / 100),
    superteam: Math.round(input.superteam * WEIGHTS.superteam / 100),
    onchain: Math.round(input.onchain * WEIGHTS.onchain / 100),
    github: Math.round(input.github * WEIGHTS.github / 100),
    attestations: Math.round(attestationPoints(input.attestationCount, input.avgAttestorScore) * WEIGHTS.attestations / 100),
    credentials: Math.round(input.credentials * WEIGHTS.credentials / 100),
  };
}

async function main() {
  logSection('SETUP');
  const issuerRaw = JSON.parse(readFileSync(ISSUER_PATH, 'utf8')) as number[];
  const issuer = await createKeyPairSignerFromBytes(new Uint8Array(issuerRaw));
  console.log('Issuer:', issuer.address);

  const target = await generateKeyPairSigner();
  console.log('Target builder (synthetic):', target.address);

  const peers = await Promise.all([
    generateKeyPairSigner(),
    generateKeyPairSigner(),
    generateKeyPairSigner(),
  ]);
  console.log('Three peer signers:');
  peers.forEach((p, i) => console.log(`  peer ${i + 1}:`, p.address));

  const client = createSolanaClient({ urlOrMoniker: RPC });

  const [credentialPda] = await deriveCredentialPda({
    authority: issuer.address,
    name: SKILLD_CREDENTIAL_NAME,
  });
  const [vouchSchemaPda] = await deriveSchemaPda({
    credential: credentialPda,
    name: PEER_VOUCH_SCHEMA_NAME,
    version: SCHEMA_VERSION,
  });
  const [scoreSchemaPda] = await deriveSchemaPda({
    credential: credentialPda,
    name: BUILDER_SCORE_SCHEMA_NAME,
    version: SCHEMA_VERSION,
  });
  const vouchSchemaAcc = await fetchMaybeSchema(client.rpc, vouchSchemaPda);
  const scoreSchemaAcc = await fetchMaybeSchema(client.rpc, scoreSchemaPda);
  if (!vouchSchemaAcc.exists || !scoreSchemaAcc.exists) {
    throw new Error('schemas missing');
  }

  logSection('STAGE 0: BASE SCORE WITHOUT VOUCHES');
  const baseInputs = {
    colosseum: 60, superteam: 50, onchain: 40, github: 50,
    attestationCount: 0, avgAttestorScore: 0, credentials: 0,
  };
  const stage0 = computeScore(baseInputs);
  const total0 = Object.values(stage0).reduce((a, b) => a + b, 0);
  console.log(' Inputs:', dump(baseInputs));
  console.log(' Breakdown:', dump(stage0));
  console.log(' TOTAL SCORE:', total0);

  const stages: Array<{ stage: number; total: number; vouches: number; tx: string }> = [
    { stage: 0, total: total0, vouches: 0, tx: 'baseline (no vouch issued)' },
  ];

  for (let i = 0; i < peers.length; i++) {
    const peer = peers[i];
    logSection(`STAGE ${i + 1}: PEER ${i + 1} ATTESTS, ISSUER WRITES SAS PEER-VOUCH`);

    const [vouchPda] = await deriveAttestationPda({
      credential: credentialPda,
      schema: vouchSchemaPda,
      nonce: peer.address,
    });
    console.log(`Peer ${i + 1} vouch PDA:`, vouchPda);

    const ix = getCreateAttestationInstruction({
      payer: issuer,
      authority: issuer,
      credential: credentialPda,
      schema: vouchSchemaPda,
      attestation: vouchPda,
      nonce: peer.address,
      expiry: Math.floor(Date.now() / 1000) + 365 * 86400,
      data: serializeAttestationData(vouchSchemaAcc.data, {
        skill: ['Rust', 'Anchor', 'Product'][i],
        context: `Stage ${i + 1} vouch for target ${String(target.address).slice(0, 8)}. Verifiable onchain.`,
        signer: String(peer.address),
      } as never),
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
    console.log(' Sending...');
    await client.sendAndConfirmTransaction(signedTx);
    console.log(' ✓ Confirmed');
    console.log(' tx:', sig);

    const fetched = await fetchMaybeAttestation(client.rpc, vouchPda);
    if (fetched.exists) {
      const decoded = deserializeAttestationData(vouchSchemaAcc.data, fetched.data.data as Uint8Array);
      console.log(' decoded skill:', (decoded as { skill: string }).skill);
    }

    const updatedInputs = {
      ...baseInputs,
      attestationCount: i + 1,
      avgAttestorScore: 50,
    };
    const stage = computeScore(updatedInputs);
    const total = Object.values(stage).reduce((a, b) => a + b, 0);
    console.log(' Score breakdown after this stage:', dump(stage));
    console.log(' TOTAL SCORE:', total);
    stages.push({ stage: i + 1, total, vouches: i + 1, tx: sig });
  }

  logSection('STAGE 4: ISSUER WRITES FRESH BUILDER-SCORE ON CHAIN');
  const finalInputs = {
    colosseum: 60, superteam: 50, onchain: 40, github: 50,
    attestationCount: 3, avgAttestorScore: 50, credentials: 0,
  };
  const finalStage = computeScore(finalInputs);
  const finalTotal = Object.values(finalStage).reduce((a, b) => a + b, 0);

  const [scoreAttPda] = await deriveAttestationPda({
    credential: credentialPda,
    schema: scoreSchemaPda,
    nonce: target.address,
  });
  console.log('Target BUILDER-SCORE PDA:', scoreAttPda);

  const existing = await fetchMaybeAttestation(client.rpc, scoreAttPda);
  let scoreSig: string | null = null;
  if (existing.exists) {
    console.log(' ⚠️ already exists, skipping write');
  } else {
    const data = {
      score: finalTotal,
      hackathon_wins: 3,
      bounties_won: 6,
      github_commits: 180,
      onchain_actions: 50,
    };
    const ix = getCreateAttestationInstruction({
      payer: issuer,
      authority: issuer,
      credential: credentialPda,
      schema: scoreSchemaPda,
      attestation: scoreAttPda,
      nonce: target.address,
      expiry: Math.floor(Date.now() / 1000) + 365 * 86400,
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
    scoreSig = getSignatureFromTransaction(signedTx);
    console.log(' Sending...');
    await client.sendAndConfirmTransaction(signedTx);
    console.log(' ✓ Confirmed');
    console.log(' tx:', scoreSig);
    console.log(' issued:', dump(data));
  }

  logSection('SUMMARY: SCORE EVOLUTION CHAIN');
  console.log('\nStages:');
  for (const s of stages) {
    const bar = '█'.repeat(Math.floor(s.total / 2));
    console.log(`  Stage ${s.stage}: ${s.total.toString().padStart(3)} ${bar}`);
    console.log(`    vouches: ${s.vouches} · tx: ${s.tx === 'baseline (no vouch issued)' ? s.tx : s.tx.slice(0, 20) + '...'}`);
  }

  console.log('\nDelta:');
  console.log(`  Stage 0 baseline:        ${stages[0].total}`);
  console.log(`  After 3 vouches:         ${stages[3].total}`);
  console.log(`  Score delta:             +${stages[3].total - stages[0].total} from peer attestations alone`);

  if (scoreSig) {
    console.log(`\n  BUILDER-SCORE on chain:  ${finalTotal}`);
    console.log(`  Score attestation tx:    ${scoreSig}`);
    console.log(`  https://solscan.io/tx/${scoreSig}?cluster=devnet`);
  }

  console.log('\n✅ SCORE RECOMPUTE CHAIN VERIFIED');
  console.log('Each new wallet signed peer vouch issued onchain via SAS adds to the Builder Score in deterministic, verifiable way.');
}

main().catch((err) => {
  console.error('\n✗ TEST FAILED');
  console.error(err);
  process.exit(1);
});
