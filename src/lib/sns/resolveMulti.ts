import { Connection, PublicKey } from '@solana/web3.js';
import { resolveDomainOwner } from './resolve';
import { fetchAllRecords, type ProfileRecords } from './records';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

let mainnetConnection: Connection | null = null;
function getMainnetConnection(): Connection {
  if (!mainnetConnection) mainnetConnection = new Connection(MAINNET_RPC, 'confirmed');
  return mainnetConnection;
}

export type ResolvedProfile = {
  cluster: 'devnet' | 'mainnet' | null;
  owner: PublicKey | null;
  records: ProfileRecords | null;
};

export async function resolveProfileAcrossClusters(
  devnetConnection: Connection,
  domain: string,
): Promise<ResolvedProfile> {
  const devOwner = await resolveDomainOwner(devnetConnection, domain);
  if (devOwner) {
    const records = await fetchAllRecords(devnetConnection, domain).catch(() => ({} as ProfileRecords));
    return { cluster: 'devnet', owner: devOwner, records };
  }

  try {
    const mainnet = getMainnetConnection();
    const mainOwner = await resolveDomainOwner(mainnet, domain);
    if (mainOwner) {
      const records = await fetchAllRecords(mainnet, domain).catch(() => ({} as ProfileRecords));
      return { cluster: 'mainnet', owner: mainOwner, records };
    }
  } catch {
    return { cluster: null, owner: null, records: null };
  }

  return { cluster: null, owner: null, records: null };
}
