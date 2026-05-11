import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';

export const SKILLD_ATTEST_PROGRAM_ID = new PublicKey('4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6');

const COUNTER_SEED = Buffer.from('skilld_counter');
const DETAIL_SEED = Buffer.from('skilld_detail');

async function sighashBrowser(name: string): Promise<Uint8Array> {
  const data = `global:${name}`;
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest).slice(0, 8);
}

export function deriveCounterPda(target: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([COUNTER_SEED, target.toBuffer()], SKILLD_ATTEST_PROGRAM_ID);
}

export function deriveDetailPda(target: PublicKey, signer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [DETAIL_SEED, target.toBuffer(), signer.toBuffer()],
    SKILLD_ATTEST_PROGRAM_ID,
  );
}

function encodeString(s: string): Uint8Array {
  const bytes = new TextEncoder().encode(s);
  const out = new Uint8Array(4 + bytes.length);
  new DataView(out.buffer).setUint32(0, bytes.length, true);
  out.set(bytes, 4);
  return out;
}

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrs) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

export async function buildInitCounterIx(payer: PublicKey, target: PublicKey): Promise<TransactionInstruction> {
  const [counter] = deriveCounterPda(target);
  const disc = await sighashBrowser('init_counter');
  const data = concatBytes(disc, target.toBytes());
  return new TransactionInstruction({
    programId: SKILLD_ATTEST_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: counter, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export async function buildAttestPublicIx(
  payer: PublicKey,
  signer: PublicKey,
  target: PublicKey,
  skill: string,
  context: string,
): Promise<TransactionInstruction> {
  const [counter] = deriveCounterPda(target);
  const [detail] = deriveDetailPda(target, signer);
  const disc = await sighashBrowser('attest_public');
  const data = concatBytes(
    disc,
    target.toBytes(),
    encodeString(skill),
    encodeString(context),
  );
  return new TransactionInstruction({
    programId: SKILLD_ATTEST_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: signer, isSigner: true, isWritable: false },
      { pubkey: counter, isSigner: false, isWritable: true },
      { pubkey: detail, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export async function buildAttestPrivateIx(
  payer: PublicKey,
  signer: PublicKey,
  target: PublicKey,
  sealedHash: string,
): Promise<TransactionInstruction> {
  const [counter] = deriveCounterPda(target);
  const [detail] = deriveDetailPda(target, signer);
  const disc = await sighashBrowser('attest_private');
  const data = concatBytes(disc, target.toBytes(), encodeString(sealedHash));
  return new TransactionInstruction({
    programId: SKILLD_ATTEST_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: signer, isSigner: true, isWritable: false },
      { pubkey: counter, isSigner: false, isWritable: true },
      { pubkey: detail, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export async function buildInitCounterTx(connection: Connection, payer: PublicKey, target: PublicKey): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash();
  const ix = await buildInitCounterIx(payer, target);
  return new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(ix);
}

export async function buildAttestPublicTx(
  connection: Connection,
  payer: PublicKey,
  signer: PublicKey,
  target: PublicKey,
  skill: string,
  context: string,
): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash();
  const ix = await buildAttestPublicIx(payer, signer, target, skill, context);
  return new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(ix);
}

export type CounterState = { target: PublicKey; publicCount: number; sealedCount: number; bump: number };

export async function fetchCounter(connection: Connection, target: PublicKey): Promise<CounterState | null> {
  const [counter] = deriveCounterPda(target);
  const acc = await connection.getAccountInfo(counter);
  if (!acc || acc.data.length < 8 + 32 + 8 + 8 + 1) return null;
  const offset = 8;
  const targetBytes = acc.data.slice(offset, offset + 32);
  const dv = new DataView(acc.data.buffer, acc.data.byteOffset + offset + 32);
  const publicCount = Number(dv.getBigUint64(0, true));
  const sealedCount = Number(dv.getBigUint64(8, true));
  const bump = acc.data[offset + 32 + 16];
  return { target: new PublicKey(targetBytes), publicCount, sealedCount, bump };
}
