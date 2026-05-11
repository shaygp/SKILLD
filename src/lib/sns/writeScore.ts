import { Connection, PublicKey, Transaction, type TransactionInstruction } from '@solana/web3.js';
import { createRecordV2Instruction, updateRecordV2Instruction, getRecordV2 } from '@bonfida/spl-name-service';
import { normalizeDomain } from './resolve';

export const SKILLD_RECORD_KEY = 'skilld_score' as const;

export type SkilldScoreRecord = {
  v: 1;
  score: number;
  breakdown: {
    colosseum: number;
    superteam: number;
    onchain: number;
    github: number;
    attestations: number;
    credentials: number;
  };
  updatedAt: string;
  attestationCount: number;
};

export function encodeScoreRecord(payload: SkilldScoreRecord): string {
  return JSON.stringify(payload);
}

export async function readScoreRecord(connection: Connection, domain: string): Promise<SkilldScoreRecord | null> {
  try {
    const r = await getRecordV2(connection, normalizeDomain(domain), SKILLD_RECORD_KEY as never, { deserialize: true });
    if (!r?.deserializedContent) return null;
    return JSON.parse(r.deserializedContent) as SkilldScoreRecord;
  } catch {
    return null;
  }
}

export type PublishScoreParams = {
  connection: Connection;
  domain: string;
  owner: PublicKey;
  payer: PublicKey;
  payload: SkilldScoreRecord;
};

export async function buildPublishScoreTransaction({ connection, domain, owner, payer, payload }: PublishScoreParams): Promise<Transaction> {
  const name = normalizeDomain(domain);
  const content = encodeScoreRecord(payload);
  const existing = await readScoreRecord(connection, domain);

  let ix: TransactionInstruction;
  if (existing) {
    ix = updateRecordV2Instruction(name, SKILLD_RECORD_KEY as never, content, owner, payer);
  } else {
    ix = createRecordV2Instruction(name, SKILLD_RECORD_KEY as never, content, owner, payer);
  }

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(ix);
  return tx;
}
