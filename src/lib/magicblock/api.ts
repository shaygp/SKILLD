import {
  AUTHORITY_FLAG,
  TX_LOGS_FLAG,
  TX_MESSAGE_FLAG,
  serializeMember,
  serializeMembersArgs,
  PERMISSION_SEED,
  PERMISSION_PROGRAM_ID,
  verifyTeeRpcIntegrity,
  getAuthToken,
} from '@magicblock-labs/ephemeral-rollups-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

export const TEE_RPC_URL = (import.meta.env.VITE_MAGICBLOCK_TEE_RPC ?? 'https://devnet-tee.magicblock.app') as string;

export const PER_DOCS_URL = 'https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/onchain-privacy';

export type SealedAttestation = {
  id: string;
  toDomain: string;
  recipient: string;
  fromDomain: string;
  fromOwner: string;
  sealedAt: string;
  recipientFlags: number;
  members: Array<{ pubkey: string; flags: number }>;
  permissionPda: string;
  detailPda: string;
  counterPda: string;
  sealedPayloadHash: string;
  memoSignature?: string;
};

export function buildRecipientMember(recipient: PublicKey) {
  return {
    pubkey: recipient,
    flags: TX_LOGS_FLAG | TX_MESSAGE_FLAG,
  };
}

export function permissionPdaFor(account: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(PERMISSION_SEED), account.toBuffer()],
    PERMISSION_PROGRAM_ID,
  );
  return pda;
}

export function sealedPayloadHash(payload: { skill?: string; context: string }): string {
  const blob = JSON.stringify(payload);
  let hash = 5381;
  for (let i = 0; i < blob.length; i++) {
    hash = ((hash * 33) ^ blob.charCodeAt(i)) >>> 0;
  }
  return `0x${hash.toString(16).padStart(8, '0')}`;
}

export function flagsHumanLabel(flags: number): string {
  const parts: string[] = [];
  if (flags & AUTHORITY_FLAG) parts.push('AUTHORITY');
  if (flags & TX_LOGS_FLAG) parts.push('TX_LOGS');
  if (flags & TX_MESSAGE_FLAG) parts.push('TX_MESSAGE');
  return parts.join(' | ') || 'NONE';
}

export async function counterAccount(_connection: Connection, _domain: string): Promise<{ count: number }> {
  return { count: 0 };
}

export type TeeStatus = {
  reachable: boolean;
  slot?: number;
  attestationOk?: boolean;
  bearerToken?: string;
  error?: string;
};

export async function probeTeeIntegrity(): Promise<{ ok: boolean; error?: string }> {
  try {
    await verifyTeeRpcIntegrity(TEE_RPC_URL);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchTeeSlot(): Promise<number | null> {
  try {
    const res = await fetch(`${TEE_RPC_URL.replace(/\?.*$/, '')}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' }),
    });
    const data = await res.json();
    return typeof data.result === 'number' ? data.result : null;
  } catch {
    return null;
  }
}

export async function requestBearerToken(
  publicKey: PublicKey,
  signFn: (msg: Uint8Array) => Promise<Uint8Array>,
): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const token = await getAuthToken(TEE_RPC_URL, publicKey, signFn);
    const tokenStr = typeof token === 'string' ? token : JSON.stringify(token);
    return { ok: true, token: tokenStr };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export { serializeMember, serializeMembersArgs, AUTHORITY_FLAG, TX_LOGS_FLAG, TX_MESSAGE_FLAG };
