import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  deriveCredentialPda,
  deriveSchemaPda,
  deriveAttestationPda,
  fetchMaybeSchema,
  serializeAttestationData,
  getCreateAttestationInstruction,
} from 'sas-lib';
import { address as toAddress, createNoopSigner } from 'gill';
import { makeRpc } from './api';
import {
  SKILLD_CREDENTIAL_NAME,
  BUILDER_SCORE_SCHEMA_NAME,
  PEER_VOUCH_SCHEMA_NAME,
  SCHEMA_VERSION,
} from './config';

export type BuilderScoreData = {
  score: number;
  hackathon_wins: number;
  bounties_won: number;
  github_commits: number;
  onchain_actions: number;
};

export type PeerVouchData = {
  skill: string;
  context: string;
  signer: string;
};

export type WriteAttestationParams = {
  connection: Connection;
  authority: PublicKey;
  payer: PublicKey;
  subject: PublicKey;
  expirySeconds?: number;
};

async function buildSetup(authority: PublicKey, schemaName: string) {
  const rpc = makeRpc();
  const [credentialPda] = await deriveCredentialPda({ authority: toAddress(authority.toBase58()), name: SKILLD_CREDENTIAL_NAME });
  const [schemaPda] = await deriveSchemaPda({ credential: credentialPda, name: schemaName, version: SCHEMA_VERSION });
  const schemaAccount = await fetchMaybeSchema(rpc, schemaPda);
  if (!schemaAccount.exists) {
    throw new Error(`Schema ${schemaName} not found onchain. Run npm run sas:bootstrap first.`);
  }
  return { rpc, credentialPda, schemaPda, schemaData: schemaAccount.data };
}

export async function buildBuilderScoreAttestationTx(params: WriteAttestationParams & { data: BuilderScoreData }): Promise<Transaction> {
  const { connection, authority, payer, subject, data, expirySeconds } = params;
  const { credentialPda, schemaPda, schemaData } = await buildSetup(authority, BUILDER_SCORE_SCHEMA_NAME);
  const [attestationPda] = await deriveAttestationPda({
    credential: credentialPda,
    schema: schemaPda,
    nonce: toAddress(subject.toBase58()),
  });
  const expiry = Math.floor(Date.now() / 1000) + (expirySeconds ?? 365 * 86400);
  const payerSigner = createNoopSigner(toAddress(payer.toBase58()));
  const authoritySigner = createNoopSigner(toAddress(authority.toBase58()));
  const ix = getCreateAttestationInstruction({
    payer: payerSigner,
    authority: authoritySigner,
    credential: credentialPda,
    schema: schemaPda,
    attestation: attestationPda,
    nonce: toAddress(subject.toBase58()),
    expiry,
    data: serializeAttestationData(schemaData, data as never),
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash });
  tx.add(legacyIxFromGill(ix));
  return tx;
}

export async function buildPeerVouchAttestationTx(params: WriteAttestationParams & { data: PeerVouchData }): Promise<Transaction> {
  const { connection, authority, payer, subject, data, expirySeconds } = params;
  const { credentialPda, schemaPda, schemaData } = await buildSetup(authority, PEER_VOUCH_SCHEMA_NAME);
  const [attestationPda] = await deriveAttestationPda({
    credential: credentialPda,
    schema: schemaPda,
    nonce: toAddress(subject.toBase58()),
  });
  const expiry = Math.floor(Date.now() / 1000) + (expirySeconds ?? 365 * 86400);
  const payerSigner = createNoopSigner(toAddress(payer.toBase58()));
  const authoritySigner = createNoopSigner(toAddress(authority.toBase58()));
  const ix = getCreateAttestationInstruction({
    payer: payerSigner,
    authority: authoritySigner,
    credential: credentialPda,
    schema: schemaPda,
    attestation: attestationPda,
    nonce: toAddress(subject.toBase58()),
    expiry,
    data: serializeAttestationData(schemaData, data as never),
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash });
  tx.add(legacyIxFromGill(ix));
  return tx;
}

function legacyIxFromGill(ix: unknown): TransactionInstruction {
  const cast = ix as { programAddress: string; accounts?: Array<{ address: string; role: number }>; data: Uint8Array | ReadonlyArray<number> };
  return new TransactionInstruction({
    programId: new PublicKey(cast.programAddress),
    keys: (cast.accounts ?? []).map((acc) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: (acc.role & 0b10) !== 0,
      isWritable: (acc.role & 0b01) !== 0,
    })),
    data: Buffer.from(cast.data as Uint8Array),
  });
}
