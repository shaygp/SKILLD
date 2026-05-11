import type { Connection } from '@solana/web3.js';
import { Record as SnsRecord, getRecordV2, NameRegistryState } from '@bonfida/spl-name-service';
import { normalizeDomain } from './resolve';

const RECORD_KEYS: SnsRecord[] = [
  SnsRecord.Twitter,
  SnsRecord.Github,
  SnsRecord.Discord,
  SnsRecord.Telegram,
  SnsRecord.Email,
  SnsRecord.Pic,
  SnsRecord.Url,
  SnsRecord.IPFS,
  SnsRecord.ARWV,
  SnsRecord.BTC,
  SnsRecord.ETH,
];

export type ProfileRecords = {
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  email?: string;
  pic?: string;
  url?: string;
  ipfs?: string;
  arwv?: string;
  btc?: string;
  eth?: string;
};

export async function fetchAllRecords(connection: Connection, domain: string): Promise<ProfileRecords> {
  const name = normalizeDomain(domain);
  const out: Record<string, string> = {};

  await Promise.all(
    RECORD_KEYS.map(async (recordKey) => {
      try {
        const r = await getRecordV2(connection, name, recordKey, { deserialize: true });
        if (r?.deserializedContent) {
          out[(recordKey as string).toLowerCase()] = r.deserializedContent;
        }
      } catch {
        return;
      }
    }),
  );

  return out as ProfileRecords;
}

export { NameRegistryState };
