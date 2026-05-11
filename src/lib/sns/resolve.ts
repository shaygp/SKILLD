import { Connection, PublicKey } from '@solana/web3.js';
import { resolve, getDomainKeySync, NameRegistryState, reverseLookup } from '@bonfida/spl-name-service';

export type SnsRecord =
  | 'twitter'
  | 'github'
  | 'discord'
  | 'telegram'
  | 'email'
  | 'pic'
  | 'url'
  | 'ipfs'
  | 'arwv'
  | 'btc'
  | 'eth'
  | 'sol';

export function normalizeDomain(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.endsWith('.sol')) return trimmed.slice(0, -4);
  return trimmed;
}

export async function resolveDomainOwner(connection: Connection, domain: string): Promise<PublicKey | null> {
  try {
    const owner = await resolve(connection, normalizeDomain(domain));
    return owner;
  } catch {
    return null;
  }
}

export function getDomainKey(domain: string): PublicKey {
  const { pubkey } = getDomainKeySync(normalizeDomain(domain));
  return pubkey;
}

export async function getDomainState(connection: Connection, domain: string) {
  try {
    const key = getDomainKey(domain);
    const state = await NameRegistryState.retrieve(connection, key);
    return state;
  } catch {
    return null;
  }
}

export async function reverseDomainOf(connection: Connection, owner: PublicKey): Promise<string | null> {
  try {
    const name = await reverseLookup(connection, owner);
    return name;
  } catch {
    return null;
  }
}
