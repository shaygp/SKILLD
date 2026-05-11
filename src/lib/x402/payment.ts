import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';

const FALLBACK_USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const FALLBACK_RECIPIENT = 'GZsQbu6cKqLHZdtcsupp7E1G81fVH9bnTLnHQVgjF1HK';

export const INTRO_PRICE_USDC = 1;
export const USDC_DECIMALS = 6;
export const INTRO_PRICE_RAW = INTRO_PRICE_USDC * 10 ** USDC_DECIMALS;

export type X402Receipt = {
  signature: string;
  recipient: string;
  amountUsdc: number;
  paidAt: string;
};

export function getRecipient(): PublicKey {
  const env = (import.meta.env as Record<string, string | undefined>).VITE_X402_RECIPIENT;
  return new PublicKey(env || FALLBACK_RECIPIENT);
}

export function getUsdcMint(): PublicKey {
  const env = (import.meta.env as Record<string, string | undefined>).VITE_USDC_MINT;
  return new PublicKey(env || FALLBACK_USDC_MINT_DEVNET);
}

export async function buildIntroPaymentTx(connection: Connection, payer: PublicKey): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash();
  const recipient = getRecipient();
  const mint = getUsdcMint();

  const senderAta = getAssociatedTokenAddressSync(mint, payer);
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient);

  const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash });

  const senderInfo = await connection.getAccountInfo(senderAta);
  if (!senderInfo) {
    tx.add(createAssociatedTokenAccountInstruction(payer, senderAta, payer, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
  }

  const recipientInfo = await connection.getAccountInfo(recipientAta);
  if (!recipientInfo) {
    tx.add(createAssociatedTokenAccountInstruction(payer, recipientAta, recipient, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
  }

  tx.add(
    createTransferCheckedInstruction(
      senderAta,
      mint,
      recipientAta,
      payer,
      BigInt(INTRO_PRICE_RAW),
      USDC_DECIMALS,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  return tx;
}

export async function buildIntroPaymentNativeFallback(connection: Connection, payer: PublicKey): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash();
  const recipient = getRecipient();
  const ix = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: recipient,
    lamports: 5_000_000,
  });
  return new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(ix);
}
