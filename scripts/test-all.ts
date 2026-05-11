import { readFileSync } from 'node:fs';
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
import {
  createSolanaClient,
  createTransaction as gillCreateTransaction,
  createKeyPairSignerFromBytes,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  address as toAddress,
} from 'gill';
import {
  deriveCredentialPda,
  deriveSchemaPda,
  fetchMaybeCredential,
  fetchMaybeSchema,
} from 'sas-lib';
import { verifyTeeRpcIntegrity, getAuthToken } from '@magicblock-labs/ephemeral-rollups-sdk';
import nacl from 'tweetnacl';

const PROD = 'https://skilld-app.vercel.app';
const RPC = 'https://api.devnet.solana.com';
const TEE_RPC = 'https://devnet-tee.magicblock.app';
const ISSUER_PATH = '/Users/mac/skilld/.keys/skilld-issuer.json';
const USER_PATH = '/Users/mac/skilld/.keys/skilld-test-user.json';
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

let pass = 0;
let fail = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<unknown>): Promise<void> {
  process.stdout.write(`  ${name}... `);
  try {
    const result = await fn();
    console.log(`✓ ${result === undefined ? '' : String(result)}`);
    pass++;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`✗ ${msg}`);
    failures.push(`${name}: ${msg}`);
    fail++;
  }
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(' ' + title);
  console.log('='.repeat(60));
}

async function fetchStatus(url: string, opts?: RequestInit): Promise<{ status: number; body?: unknown }> {
  const res = await fetch(url, opts);
  let body: unknown;
  try { body = await res.json(); } catch { try { body = await res.text(); } catch { /* ignore */ } }
  return { status: res.status, body };
}

async function main() {
  section('1. PROD ROUTES');
  for (const r of ['/', '/framew0rk.sol', '/search', '/activity', '/attestations', '/agents', '/about', '/deck.html', '/.well-known/skilld-mcp.json']) {
    await test(r, async () => {
      const { status } = await fetchStatus(PROD + r);
      if (status !== 200) throw new Error(`status ${status}`);
      return `${status}`;
    });
  }

  section('2. SUPERTEAM EARN API VIA VERCEL REWRITE');
  await test('listings open', async () => {
    const r = await fetchStatus(PROD + '/superteam-api/listings?status=open&take=5');
    if (r.status !== 200) throw new Error(`${r.status}`);
    if (!Array.isArray(r.body)) throw new Error('not array');
    return `${(r.body as unknown[]).length} bounties`;
  });
  await test('feed get', async () => {
    const r = await fetchStatus(PROD + '/superteam-api/feed/get?take=5');
    if (r.status !== 200) throw new Error(`${r.status}`);
    if (!Array.isArray(r.body)) throw new Error('not array');
    return `${(r.body as unknown[]).length} feed items`;
  });
  await test('listings completed', async () => {
    const r = await fetchStatus(PROD + '/superteam-api/listings?status=completed&take=10');
    if (r.status !== 200) throw new Error(`${r.status}`);
    return `${(r.body as unknown[]).length} completed`;
  });

  section('3. MCP SERVER ENDPOINT');
  await test('GET /api/mcp', async () => {
    const r = await fetchStatus(PROD + '/api/mcp');
    if (r.status !== 200) throw new Error(`${r.status}`);
    const b = r.body as { name?: string; tools?: unknown[] };
    if (b.name !== 'skilld-mcp') throw new Error('wrong name');
    return `${b.tools?.length} tools listed`;
  });
  await test('tools/list', async () => {
    const r = await fetchStatus(PROD + '/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    if (r.status !== 200) throw new Error(`${r.status}`);
    const b = r.body as { result?: { tools?: unknown[] } };
    return `${b.result?.tools?.length} tools`;
  });
  for (const tool of ['get_builder_score', 'list_top_builders', 'send_intro_request', 'list_attestations']) {
    const args = tool === 'send_intro_request'
      ? { to_domain: 'framew0rk.sol', message: 'Hiring Rust eng for Frontier project' }
      : tool === 'list_top_builders'
        ? { limit: 3 }
        : { domain: 'framew0rk.sol' };
    await test(`tools/call ${tool}`, async () => {
      const r = await fetchStatus(PROD + '/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: args } }),
      });
      if (r.status !== 200) throw new Error(`${r.status}`);
      const b = r.body as { result?: { content?: Array<{ text: string }> }; error?: unknown };
      if (b.error) throw new Error(JSON.stringify(b.error));
      const text = b.result?.content?.[0]?.text;
      if (!text) throw new Error('no content');
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (tool === 'get_builder_score') return `score=${parsed.score}`;
      if (tool === 'list_top_builders') return `${(parsed.builders as unknown[])?.length} builders`;
      if (tool === 'send_intro_request') return `price=${parsed.price_usdc} USDC`;
      return 'ok';
    });
  }

  section('4. STATIC ASSETS');
  for (const a of ['/assets/nfts/smb-1.png', '/assets/nfts/smb-2.png', '/assets/nfts/smb-3.png', '/assets/nfts/smb-4.png', '/assets/logos/solana.png', '/assets/logos/x402.png', '/assets/logos/smb.png', '/logo.png', '/favicon.svg']) {
    await test(a, async () => {
      const res = await fetch(PROD + a);
      if (res.status !== 200) throw new Error(`${res.status}`);
      const len = res.headers.get('content-length');
      return len ? `${len} bytes` : '200';
    });
  }

  section('5. SAS ONCHAIN (DEVNET)');
  const issuerRaw = JSON.parse(readFileSync(ISSUER_PATH, 'utf8')) as number[];
  const issuer = await createKeyPairSignerFromBytes(new Uint8Array(issuerRaw));
  const client = createSolanaClient({ urlOrMoniker: RPC });
  await test('Skilld credential PDA exists', async () => {
    const [pda] = await deriveCredentialPda({ authority: issuer.address, name: 'SKILLD' });
    const acc = await fetchMaybeCredential(client.rpc, pda);
    if (!acc.exists) throw new Error('missing');
    return String(pda).slice(0, 12) + '...';
  });
  await test('BUILDER-SCORE schema exists', async () => {
    const [credPda] = await deriveCredentialPda({ authority: issuer.address, name: 'SKILLD' });
    const [pda] = await deriveSchemaPda({ credential: credPda, name: 'BUILDER-SCORE', version: 1 });
    const acc = await fetchMaybeSchema(client.rpc, pda);
    if (!acc.exists) throw new Error('missing');
    return `${acc.data.fieldNames.length} bytes fields`;
  });
  await test('PEER-VOUCH schema exists', async () => {
    const [credPda] = await deriveCredentialPda({ authority: issuer.address, name: 'SKILLD' });
    const [pda] = await deriveSchemaPda({ credential: credPda, name: 'PEER-VOUCH', version: 1 });
    const acc = await fetchMaybeSchema(client.rpc, pda);
    if (!acc.exists) throw new Error('missing');
    return 'ok';
  });

  section('6. MAGICBLOCK TEE');
  await test('TEE attestation integrity', async () => {
    await verifyTeeRpcIntegrity(TEE_RPC);
    return 'verified';
  });
  await test('TEE bearer token (issuer signs nacl challenge)', async () => {
    const issuerKp = Keypair.fromSecretKey(new Uint8Array(issuerRaw));
    const token = await getAuthToken(TEE_RPC, issuerKp.publicKey, async (m: Uint8Array) => nacl.sign.detached(m, issuerKp.secretKey));
    if (!token) throw new Error('no token');
    return 'ok';
  });
  await test('TEE current slot', async () => {
    const res = await fetch(TEE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' }),
    });
    const data = await res.json() as { result?: number };
    if (typeof data.result !== 'number') throw new Error('no slot');
    return `slot ${data.result.toLocaleString()}`;
  });

  section('7. WALLET BALANCES (DEVNET)');
  const conn = new Connection(RPC, 'confirmed');
  const issuerKp = Keypair.fromSecretKey(new Uint8Array(issuerRaw));
  const userRaw = JSON.parse(readFileSync(USER_PATH, 'utf8')) as number[];
  const user = Keypair.fromSecretKey(new Uint8Array(userRaw));
  await test('Issuer SOL balance', async () => {
    const lamports = await conn.getBalance(issuerKp.publicKey);
    if (lamports < 100_000_000) throw new Error(`low: ${lamports / 1e9} SOL`);
    return `${(lamports / 1e9).toFixed(2)} SOL`;
  });
  await test('Test user SOL balance', async () => {
    const lamports = await conn.getBalance(user.publicKey);
    if (lamports < 100_000_000) throw new Error(`low: ${lamports / 1e9} SOL`);
    return `${(lamports / 1e9).toFixed(2)} SOL`;
  });
  await test('Test user USDC balance', async () => {
    const ata = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), user.publicKey);
    const acc = await getAccount(conn, ata);
    return `${Number(acc.amount) / 1e6} USDC`;
  });

  section('8. LIVE x402 USDC TRANSFER');
  await test('Build and send 1 USDC tx user → fresh recipient', async () => {
    const recipient = Keypair.generate();
    const mint = new PublicKey(USDC_MINT);
    const senderAta = getAssociatedTokenAddressSync(mint, user.publicKey);
    const recipientAta = getAssociatedTokenAddressSync(mint, recipient.publicKey);
    const { blockhash } = await conn.getLatestBlockhash();
    const tx = new Transaction({ feePayer: user.publicKey, recentBlockhash: blockhash });
    tx.add(createAssociatedTokenAccountInstruction(user.publicKey, recipientAta, recipient.publicKey, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
    tx.add(createTransferCheckedInstruction(senderAta, mint, recipientAta, user.publicKey, BigInt(1_000_000), 6, [], TOKEN_PROGRAM_ID));
    const sig = await sendAndConfirmTransaction(conn, tx, [user], { commitment: 'confirmed' });
    return sig.slice(0, 16) + '...';
  });

  section('9. LIVE SEALED MEMO BROADCAST (MagicBlock Pattern A counter rail)');
  await test('Send dual sealed_vouch + sealed_blob memos', async () => {
    const target = 'framew0rk.sol';
    const recipient = Keypair.generate().publicKey;
    const hash = '0x' + Math.random().toString(16).slice(2, 10);
    const counterPayload = JSON.stringify({ skilld: 'sealed_vouch', v: 1, target, recipient: recipient.toBase58(), hash, ts: Date.now() });
    const sealedB64 = Buffer.from(JSON.stringify({ skill: 'Rust', context: 'E2E test sealed payload', signer: user.publicKey.toBase58() })).toString('base64');
    const sealedPayload = JSON.stringify({ skilld: 'sealed_blob', v: 1, target, hash, data: sealedB64 });
    const { blockhash } = await conn.getLatestBlockhash();
    const tx = new Transaction({ feePayer: user.publicKey, recentBlockhash: blockhash });
    tx.add(new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: user.publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from(counterPayload, 'utf8'),
    }));
    tx.add(new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: user.publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from(sealedPayload, 'utf8'),
    }));
    const sig = await sendAndConfirmTransaction(conn, tx, [user], { commitment: 'confirmed' });
    return sig.slice(0, 16) + '...';
  });

  section('10. WORLD ID IDKIT REAL ENDPOINT');
  await test('Worldcoin bridge createSession reachable', async () => {
    const res = await fetch('https://bridge.worldcoin.org/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request: 'verify',
        app_id: 'app_staging_skilld_local',
        action: 'skilld_humanity',
        signal: 'framew0rk.sol',
      }),
    });
    if (!res.ok && res.status !== 400) throw new Error(`${res.status}`);
    return `bridge reachable (${res.status})`;
  });

  section('11. GITHUB PUBLIC API (used by Profile)');
  await test('api.github.com user lookup', async () => {
    const res = await fetch('https://api.github.com/users/anza-xyz');
    if (!res.ok) throw new Error(`${res.status}`);
    const d = await res.json() as { public_repos?: number };
    return `${d.public_repos} public repos`;
  });

  section('12. SOLSCAN TX REPLAY (sample of 16 onchain confirmations)');
  for (const [label, txSig] of [
    ['x402 USDC user→framew0rk', '5DJ8RGuRQMoKxFwW1Q9D4jWrw4SxcxaVWstQ5FLtdUricAeXFUsuegh21gkS6MoUxEHBiyL4mSk7UYDPj4twzAbp'],
    ['SAS BUILDER-SCORE issued', '3U6CTyjUQWjVf3Qf3ChPbgnWY4HdZqKA4mHhbfHkmbb94wQjnsgz9ReB3cuqeWkCLS6FnKXJPrVsMsp155LrvLzs'],
    ['SAS PEER-VOUCH issued', '3sX4Kj1sRbp2vPC4bZGipYL3VKYygs8oxqa4JKhih4yP9LGvybKGL8AFn44GUqXrs8ZUPWEv6GbdDVX1Cfg2cyZ5'],
    ['Sealed vouch memo', 'LkMV3rMZ6xX28DmgYcuZdyU4oAPxNb9d7yWk2dHUg2oGNSHyBkHMQhjYK7ssrRqwq35fxiMBPPie5cG1aBqtewf'],
  ] as const) {
    await test(label, async () => {
      const res = await fetch(RPC, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [txSig, 'json'] }),
      });
      const d = await res.json() as { result: unknown };
      if (!d.result) throw new Error('not found (RPC retention)');
      return 'confirmed';
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(` RESULTS: ${pass} passed, ${fail} failed`);
  console.log('='.repeat(60));
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log('  ✗ ' + f);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
