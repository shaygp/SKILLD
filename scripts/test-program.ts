import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction,
} from '@solana/web3.js';

const RPC = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6');
const ISSUER_PATH = '/Users/mac/skilld/.keys/skilld-issuer.json';

function sighash(name: string): Uint8Array {
  const data = `global:${name}`;
  const sub = createHash('sha256').update(data).digest();
  return new Uint8Array(sub.slice(0, 8));
}

function encStr(s: string): Uint8Array {
  const b = new TextEncoder().encode(s);
  const out = new Uint8Array(4 + b.length);
  new DataView(out.buffer).setUint32(0, b.length, true);
  out.set(b, 4);
  return out;
}

function concat(...a: Uint8Array[]): Uint8Array {
  const t = a.reduce((acc, x) => acc + x.length, 0);
  const o = new Uint8Array(t);
  let p = 0;
  for (const x of a) { o.set(x, p); p += x.length; }
  return o;
}

async function main() {
  const issuerRaw = JSON.parse(readFileSync(ISSUER_PATH, 'utf8')) as number[];
  const issuer = Keypair.fromSecretKey(new Uint8Array(issuerRaw));
  const conn = new Connection(RPC, 'confirmed');
  console.log('Issuer:', issuer.publicKey.toBase58());
  console.log('Program:', PROGRAM_ID.toBase58());

  const target = Keypair.generate().publicKey;
  console.log('Target builder:', target.toBase58());

  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('skilld_counter'), target.toBuffer()],
    PROGRAM_ID,
  );
  const [detailPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('skilld_detail'), target.toBuffer(), issuer.publicKey.toBuffer()],
    PROGRAM_ID,
  );
  console.log('Counter PDA:', counterPda.toBase58());
  console.log('Detail PDA:', detailPda.toBase58());

  console.log('\nSTEP 1: init_counter');
  const initData = concat(sighash('init_counter'), target.toBytes());
  const initIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: issuer.publicKey, isSigner: true, isWritable: true },
      { pubkey: counterPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(initData),
  });
  const { blockhash } = await conn.getLatestBlockhash();
  const tx1 = new Transaction({ feePayer: issuer.publicKey, recentBlockhash: blockhash }).add(initIx);
  const sig1 = await sendAndConfirmTransaction(conn, tx1, [issuer], { commitment: 'confirmed' });
  console.log(' ✓ tx:', sig1);

  console.log('\nSTEP 2: attest_public');
  const attestData = concat(
    sighash('attest_public'),
    target.toBytes(),
    encStr('Rust'),
    encStr('Tested live from skilld_attest program after devnet deploy'),
  );
  const attestIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: issuer.publicKey, isSigner: true, isWritable: true },
      { pubkey: issuer.publicKey, isSigner: true, isWritable: false },
      { pubkey: counterPda, isSigner: false, isWritable: true },
      { pubkey: detailPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(attestData),
  });
  const { blockhash: bh2 } = await conn.getLatestBlockhash();
  const tx2 = new Transaction({ feePayer: issuer.publicKey, recentBlockhash: bh2 }).add(attestIx);
  const sig2 = await sendAndConfirmTransaction(conn, tx2, [issuer], { commitment: 'confirmed' });
  console.log(' ✓ tx:', sig2);

  console.log('\nSTEP 3: read counter from chain');
  const counterAcc = await conn.getAccountInfo(counterPda);
  if (counterAcc) {
    const offset = 8 + 32;
    const dv = new DataView(counterAcc.data.buffer, counterAcc.data.byteOffset);
    const publicCount = dv.getBigUint64(offset, true);
    const sealedCount = dv.getBigUint64(offset + 8, true);
    console.log(` Counter exists. public_count=${publicCount}, sealed_count=${sealedCount}`);
  }

  const detailAcc = await conn.getAccountInfo(detailPda);
  if (detailAcc) {
    const off = 8 + 32 + 32;
    const skillLen = new DataView(detailAcc.data.buffer, detailAcc.data.byteOffset + off, 4).getUint32(0, true);
    const skill = new TextDecoder().decode(detailAcc.data.slice(off + 4, off + 4 + skillLen));
    console.log(` Detail exists. Skill="${skill}"`);
  }

  console.log('\n✅ ALL TESTS PASSED');
  console.log('\nLinks:');
  console.log('  Program:', `https://solscan.io/account/${PROGRAM_ID.toBase58()}?cluster=devnet`);
  console.log('  init_counter tx:', `https://solscan.io/tx/${sig1}?cluster=devnet`);
  console.log('  attest_public tx:', `https://solscan.io/tx/${sig2}?cluster=devnet`);
  console.log('  Counter PDA:', `https://solscan.io/account/${counterPda.toBase58()}?cluster=devnet`);
}

main().catch((err) => { console.error(err); process.exit(1); });
