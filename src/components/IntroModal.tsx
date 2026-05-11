import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { reverseDomainOf } from '../lib/sns/resolve';
import { buildIntroPaymentTx, INTRO_PRICE_USDC, getRecipient } from '../lib/x402/payment';
import { add as addIntro } from '../lib/x402/store';
import { createUmbraSession, ensureRegistered, sendConfidentialIntro } from '../lib/umbra/client';

const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

type Props = {
  open: boolean;
  toDomain: string;
  onClose: () => void;
};

export function IntroModal({ open, toDomain, onClose }: Props) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, wallet } = useWallet();
  const [message, setMessage] = useState('');
  const [fromDomain, setFromDomain] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [privateMode, setPrivateMode] = useState(false);
  const [umbraStage, setUmbraStage] = useState<string>('');

  useEffect(() => {
    if (!publicKey) { setFromDomain(null); return; }
    let cancelled = false;
    reverseDomainOf(connection, publicKey).then((name) => {
      if (cancelled) return;
      setFromDomain(name ? `${name}.sol` : null);
    });
    return () => { cancelled = true; };
  }, [publicKey, connection]);

  if (!open) return null;

  async function onPay() {
    setError(null); setSuccess(null);
    if (!connected || !publicKey || !sendTransaction) {
      setError('Connect a wallet first.');
      return;
    }
    if (!message.trim()) {
      setError('Write a message before paying.');
      return;
    }
    setSubmitting(true);
    try {
      let sig: string;
      if (privateMode) {
        if (!wallet?.adapter) throw new Error('Wallet adapter not available for Umbra');
        setUmbraStage('Connecting to Umbra');
        const session = await createUmbraSession(wallet.adapter);
        setUmbraStage('Registering Umbra account');
        await ensureRegistered(session);
        setUmbraStage('Creating confidential UTXO');
        sig = await sendConfidentialIntro(
          session,
          toDomain,
          USDC_DEVNET_MINT,
          BigInt(INTRO_PRICE_USDC * 1_000_000),
        );
        setUmbraStage('');
      } else {
        const tx = await buildIntroPaymentTx(connection, publicKey);
        sig = await sendTransaction(tx, connection);
      }

      addIntro({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fromOwner: publicKey.toBase58(),
        fromDomain: fromDomain ?? undefined,
        toDomain,
        message: message.trim(),
        amountUsdc: INTRO_PRICE_USDC,
        paymentSignature: sig,
        paidAt: new Date().toISOString(),
        status: 'paid',
      });
      setSuccess(sig);
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setSubmitting(false);
      setUmbraStage('');
    }
  }

  const recipient = getRecipient().toBase58();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-[560px] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-text">Send a verified intro</h2>
            <p className="text-[13px] text-text-2 mt-0.5 font-medium">Paid via x402, settled in 400ms on Solana mainnet.</p>
          </div>
          <button onClick={onClose} className="text-text-2 hover:bg-surface-2 p-1 rounded-full transition" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="px-5 py-6">
            <div className="bg-success-soft border border-success/30 rounded p-4">
              <div className="text-[16px] font-semibold text-success">Intro request paid</div>
              <p className="text-text-2 text-[13px] mt-1 font-medium">
                Your message has been delivered to {toDomain}. They have 7 days to reply or the fee refunds.
              </p>
              <a
                href={`https://solscan.io/tx/${success}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-[13px] text-accent font-semibold hover:underline"
              >
                View payment on Solscan →
              </a>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={onClose} className="px-5 py-1.5 bg-accent text-white rounded-full text-[14px] font-semibold hover:bg-accent-hover transition">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div className="bg-surface-3 border border-border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-text-3 font-semibold uppercase tracking-wider">Verified intro to</div>
                  <div className="text-[15px] font-semibold text-text mt-0.5">{toDomain}</div>
                </div>
                <div className="text-right">
                  <div className="text-[20px] font-bold text-text tabular-nums">${INTRO_PRICE_USDC}</div>
                  <div className="text-[11px] text-text-3 font-medium">USDC via x402</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border text-[11px] text-text-3 font-medium font-mono break-all">
                pays to {recipient.slice(0, 8)}...{recipient.slice(-6)} (Skilld escrow)
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text mb-1">Your message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${toDomain}, I'm hiring a Solana engineer for...`}
                rows={5}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-[14px] text-text placeholder:text-text-3 focus:outline-none focus:border-accent transition resize-none"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={privateMode}
                onChange={(e) => setPrivateMode(e.target.checked)}
                className="mt-0.5 accent-accent"
              />
              <div>
                <div className="text-[13px] text-text font-semibold">Confidential via Umbra</div>
                <div className="text-[12px] text-text-3 font-medium leading-snug mt-0.5">
                  Amount and recipient stay encrypted onchain. Builder claims into their shielded balance with a viewing key. Competitors cannot see who you are reaching out to.
                </div>
              </div>
            </label>

            {umbraStage && (
              <div className="bg-accent-soft border border-accent/30 rounded p-3 text-[13px] text-accent font-semibold">
                {umbraStage}...
              </div>
            )}

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded p-3 text-[13px] text-danger font-medium">
                {error}
              </div>
            )}

            <div className="text-[12px] text-text-3 font-medium leading-snug">
              {privateMode
                ? 'Confidential transfer. 1 USDC moves into a Receiver Claimable UTXO. The builder scans the indexer and claims into their encrypted balance. Skilld holds the viewing key for the seven day refund window.'
                : 'Pay 1 USDC to ' + toDomain + ' via x402. The recipient gets 0.85 USDC, Skilld keeps 0.15 USDC. If they decline or do not reply in 7 days, you get a full refund onchain.'}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" onClick={onClose} className="px-5 py-1.5 text-text-2 font-semibold text-[14px] hover:bg-surface-2 rounded-full transition">
                Cancel
              </button>
              <button
                onClick={onPay}
                disabled={submitting || !connected}
                className="bg-accent text-white px-5 py-1.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? (privateMode ? 'Sending via Umbra...' : 'Paying via x402...')
                  : `Pay $${INTRO_PRICE_USDC} ${privateMode ? 'confidentially' : 'and send'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
