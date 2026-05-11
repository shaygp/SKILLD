import { readFileSync } from 'node:fs';
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction,
} from '@solana/web3.js';

const RPC = 'https://api.devnet.solana.com';
const ISSUER_PATH = '/Users/mac/skilld/.keys/skilld-issuer.json';
const USER_PATH = '/Users/mac/skilld/.keys/skilld-test-user.json';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

function logSection(title: string) {
  console.log('\n' + '='.repeat(64));
  console.log(' ' + title);
  console.log('='.repeat(64));
}

function memoIx(payload: string, signers: PublicKey[]): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: signers.map((pubkey) => ({ pubkey, isSigner: true, isWritable: false })),
    data: Buffer.from(payload, 'utf8'),
  });
}

async function main() {
  logSection('SETUP');
  const issuerRaw = JSON.parse(readFileSync(ISSUER_PATH, 'utf8')) as number[];
  const userRaw = JSON.parse(readFileSync(USER_PATH, 'utf8')) as number[];
  const issuer = Keypair.fromSecretKey(new Uint8Array(issuerRaw));
  const user = Keypair.fromSecretKey(new Uint8Array(userRaw));
  console.log('Issuer:', issuer.publicKey.toBase58());
  console.log('User:', user.publicKey.toBase58());
  const conn = new Connection(RPC, 'confirmed');

  const target = 'framew0rk.sol';
  console.log('Target builder:', target);

  logSection('STAGE 1: USER POSTS PUBLIC VOUCH MEMO');
  const publicPayload = JSON.stringify({
    skilld: 'vouch',
    v: 1,
    target,
    skill: 'Rust',
    visibility: 'public',
    ts: Date.now(),
  });
  const { blockhash } = await conn.getLatestBlockhash();
  const tx1 = new Transaction({ feePayer: user.publicKey, recentBlockhash: blockhash });
  tx1.add(memoIx(publicPayload, [user.publicKey]));
  console.log(' payload:', publicPayload);
  const sig1 = await sendAndConfirmTransaction(conn, tx1, [user]);
  console.log(' ✓ Confirmed');
  console.log(' tx:', sig1);
  console.log(' explorer: https://solscan.io/tx/' + sig1 + '?cluster=devnet');

  logSection('STAGE 2: USER POSTS PRIVATE-COUNTER VOUCH MEMO');
  const privatePayload = JSON.stringify({
    skilld: 'vouch',
    v: 1,
    target,
    visibility: 'sealed',
    sealed_hash: '0x' + Array.from({ length: 16 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
    ts: Date.now(),
  });
  const { blockhash: bh2 } = await conn.getLatestBlockhash();
  const tx2 = new Transaction({ feePayer: user.publicKey, recentBlockhash: bh2 });
  tx2.add(memoIx(privatePayload, [user.publicKey]));
  console.log(' payload:', privatePayload);
  const sig2 = await sendAndConfirmTransaction(conn, tx2, [user]);
  console.log(' ✓ Confirmed');
  console.log(' tx:', sig2);
  console.log(' explorer: https://solscan.io/tx/' + sig2 + '?cluster=devnet');

  logSection('STAGE 3: ISSUER COMMITS COUNTER STATE TO CHAIN');
  const counterPayload = JSON.stringify({
    skilld: 'counter',
    v: 1,
    target,
    public_count: 1,
    sealed_count: 1,
    last_updated: Date.now(),
    issuer: issuer.publicKey.toBase58(),
  });
  const { blockhash: bh3 } = await conn.getLatestBlockhash();
  const tx3 = new Transaction({ feePayer: issuer.publicKey, recentBlockhash: bh3 });
  tx3.add(memoIx(counterPayload, [issuer.publicKey]));
  console.log(' payload:', counterPayload);
  const sig3 = await sendAndConfirmTransaction(conn, tx3, [issuer]);
  console.log(' ✓ Confirmed');
  console.log(' tx:', sig3);
  console.log(' explorer: https://solscan.io/tx/' + sig3 + '?cluster=devnet');

  logSection('SUMMARY');
  console.log('\n✅ Three additional Solana mainnet-style memo broadcasts confirmed on devnet.');
  console.log('Memo program is the fallback counter rail until skilld_attest Anchor program ships.');
  console.log('\nNew txs:');
  console.log('  Public vouch memo:  ', sig1);
  console.log('  Sealed vouch memo:  ', sig2);
  console.log('  Issuer counter post:', sig3);
}

main().catch((err) => {
  console.error('\n✗ TEST FAILED');
  console.error(err);
  process.exit(1);
});
