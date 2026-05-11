import {
  deriveCredentialPda,
  deriveSchemaPda,
  deriveAttestationPda,
  fetchMaybeCredential,
  fetchMaybeSchema,
  fetchMaybeAttestation,
  serializeAttestationData,
  deserializeAttestationData,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  getCreateAttestationInstruction,
} from 'sas-lib';
import { createSolanaRpc, address, type Address } from 'gill';
import {
  SKILLD_CREDENTIAL_NAME,
  BUILDER_SCORE_SCHEMA_NAME,
  PEER_VOUCH_SCHEMA_NAME,
  SCHEMA_VERSION,
  BUILDER_SCORE_FIELDS,
  BUILDER_SCORE_LAYOUT,
  PEER_VOUCH_FIELDS,
  PEER_VOUCH_LAYOUT,
} from './config';

export type RpcClient = ReturnType<typeof createSolanaRpc>;

export function makeRpc(endpoint?: string): RpcClient {
  return createSolanaRpc(endpoint ?? import.meta.env.VITE_SOLANA_RPC ?? 'https://api.devnet.solana.com');
}

export async function getSkilldCredentialPda(authority: Address): Promise<Address> {
  const [pda] = await deriveCredentialPda({ authority, name: SKILLD_CREDENTIAL_NAME });
  return pda;
}

export async function getBuilderScoreSchemaPda(credential: Address): Promise<Address> {
  const [pda] = await deriveSchemaPda({ credential, name: BUILDER_SCORE_SCHEMA_NAME, version: SCHEMA_VERSION });
  return pda;
}

export async function getPeerVouchSchemaPda(credential: Address): Promise<Address> {
  const [pda] = await deriveSchemaPda({ credential, name: PEER_VOUCH_SCHEMA_NAME, version: SCHEMA_VERSION });
  return pda;
}

export async function getAttestationPda(credential: Address, schema: Address, nonce: Address): Promise<Address> {
  const [pda] = await deriveAttestationPda({ credential, schema, nonce });
  return pda;
}

export async function credentialExists(rpc: RpcClient, authority: Address): Promise<boolean> {
  const pda = await getSkilldCredentialPda(authority);
  const account = await fetchMaybeCredential(rpc, pda);
  return account.exists;
}

export type BuilderScorePayload = {
  score: number;
  hackathon_wins: number;
  bounties_won: number;
  github_commits: number;
  onchain_actions: number;
};

export type PeerVouchPayload = {
  skill: string;
  context: string;
  signer: string;
};

export type StoredBuilderAttestation = {
  pda: Address;
  subject: Address;
  expiry: number;
  data: BuilderScorePayload;
};

export type StoredPeerVouch = {
  pda: Address;
  subject: Address;
  expiry: number;
  data: PeerVouchPayload;
};

export async function fetchBuilderScoreAttestation(
  rpc: RpcClient,
  authority: Address,
  subject: Address,
): Promise<StoredBuilderAttestation | null> {
  const credential = await getSkilldCredentialPda(authority);
  const schema = await getBuilderScoreSchemaPda(credential);
  const pda = await getAttestationPda(credential, schema, subject);
  const account = await fetchMaybeAttestation(rpc, pda);
  if (!account.exists) return null;
  const schemaAccount = await fetchMaybeSchema(rpc, schema);
  if (!schemaAccount.exists) return null;
  const decoded = deserializeAttestationData(schemaAccount.data, account.data.data as Uint8Array);
  return {
    pda,
    subject: account.data.nonce,
    expiry: Number(account.data.expiry),
    data: decoded as unknown as BuilderScorePayload,
  };
}

export async function fetchPeerVouchesByNonces(
  rpc: RpcClient,
  authority: Address,
  nonces: Address[],
): Promise<StoredPeerVouch[]> {
  if (!nonces.length) return [];
  const credential = await getSkilldCredentialPda(authority);
  const schema = await getPeerVouchSchemaPda(credential);
  const schemaAccount = await fetchMaybeSchema(rpc, schema);
  if (!schemaAccount.exists) return [];

  const out: StoredPeerVouch[] = [];
  await Promise.all(nonces.map(async (nonce) => {
    const pda = await getAttestationPda(credential, schema, nonce);
    const account = await fetchMaybeAttestation(rpc, pda);
    if (!account.exists) return;
    const decoded = deserializeAttestationData(schemaAccount.data, account.data.data as Uint8Array);
    out.push({
      pda,
      subject: account.data.nonce,
      expiry: Number(account.data.expiry),
      data: decoded as unknown as PeerVouchPayload,
    });
  }));
  return out;
}

export {
  serializeAttestationData,
  deserializeAttestationData,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  getCreateAttestationInstruction,
  fetchMaybeCredential,
  fetchMaybeSchema,
  fetchMaybeAttestation,
  BUILDER_SCORE_FIELDS,
  BUILDER_SCORE_LAYOUT,
  PEER_VOUCH_FIELDS,
  PEER_VOUCH_LAYOUT,
  address,
};
export type { Address };
