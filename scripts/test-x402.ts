import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';

const RPC = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
const KEYPAIR_PATH = process.env.ISSUER_KEYPAIR ?? resolve(process.env.HOME ?? '~', '.config/solana/id.json');
const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_DECIMALS = 6;
const INTRO_PRICE = 1;

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(' ' + title);
  console.log('='.repeat(60));
}

async function main() {
  logSection('SETUP');
  const raw = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8')) as number[];
  const payer = Keypair.fromSecretKey(new Uint8Array(raw));
  console.log('Payer (recruiter simulating):', payer.publicKey.toBase58());

  const recipient = Keypair.generate();
  console.log('Recipient (builder receiving intro):', recipient.publicKey.toBase58());

  const conn = new Connection(RPC, 'confirmed');
  const mint = new PublicKey(USDC_MINT_DEVNET);

  logSection('PRE BALANCES');
  const payerAta = getAssociatedTokenAddressSync(mint, payer.publicKey);
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient.publicKey);
  console.log('Payer USDC ATA:', payerAta.toBase58());
  console.log('Recipient USDC ATA:', recipientAta.toBase58());

  const payerAcc = await getAccount(conn, payerAta);
  const payerBalanceBefore = Number(payerAcc.amount) / 10 ** USDC_DECIMALS;
  console.log('Payer USDC balance before:', payerBalanceBefore);

  let recipientBalanceBefore = 0;
  try {
    const acc = await getAccount(conn, recipientAta);
    recipientBalanceBefore = Number(acc.amount) / 10 ** USDC_DECIMALS;
  } catch {
    console.log('Recipient ATA does not exist yet, will create');
  }
  console.log('Recipient USDC balance before:', recipientBalanceBefore);

  logSection('BUILD x402 INTRO PAYMENT');
  const { blockhash } = await conn.getLatestBlockhash();
  const tx = new Transaction({ feePayer: payer.publicKey, recentBlockhash: blockhash });

  const recipientInfo = await conn.getAccountInfo(recipientAta);
  if (!recipientInfo) {
    console.log(' Adding createAssociatedTokenAccount instruction');
    tx.add(createAssociatedTokenAccountInstruction(
      payer.publicKey, recipientAta, recipient.publicKey, mint,
      TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    ));
  }

  console.log(' Adding transferChecked instruction: 1 USDC');
  tx.add(createTransferCheckedInstruction(
    payerAta, mint, recipientAta, payer.publicKey,
    BigInt(INTRO_PRICE * 10 ** USDC_DECIMALS),
    USDC_DECIMALS, [], TOKEN_PROGRAM_ID,
  ));

  logSection('SIGN AND BROADCAST');
  const sig = await sendAndConfirmTransaction(conn, tx, [payer], { commitment: 'confirmed' });
  console.log(' ✓ Confirmed');
  console.log(' tx:', sig);
  console.log(' explorer: https://solscan.io/tx/' + sig + '?cluster=devnet');

  logSection('POST BALANCES');
  const payerAccAfter = await getAccount(conn, payerAta);
  const recipientAccAfter = await getAccount(conn, recipientAta);
  const payerBalanceAfter = Number(payerAccAfter.amount) / 10 ** USDC_DECIMALS;
  const recipientBalanceAfter = Number(recipientAccAfter.amount) / 10 ** USDC_DECIMALS;
  console.log('Payer USDC balance after:', payerBalanceAfter, '(diff:', (payerBalanceAfter - payerBalanceBefore).toFixed(6), ')');
  console.log('Recipient USDC balance after:', recipientBalanceAfter, '(diff:', (recipientBalanceAfter - recipientBalanceBefore).toFixed(6), ')');

  if (recipientBalanceAfter - recipientBalanceBefore === INTRO_PRICE) {
    console.log('\n ✓✓✓ x402 USDC FLOW WORKS END TO END');
  } else {
    console.log('\n ✗ Balance mismatch');
  }
}

main().catch((err) => {
  console.error('\n✗ TEST FAILED');
  console.error(err);
  process.exit(1);
});
