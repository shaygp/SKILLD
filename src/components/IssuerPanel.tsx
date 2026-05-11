import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { buildBuilderScoreAttestationTx } from '../lib/sas/writeAttestation';
import { useSkilldIssuer } from '../lib/sas/hooks';
import type { BuilderProfile } from '../types/profile';

type Props = {
  display: string;
  ownerBase58: string | null;
  score: number;
  breakdown: BuilderProfile['scoreBreakdown'];
};

export function IssuerPanel({ display, ownerBase58, score, breakdown }: Props) {
  const issuer = useSkilldIssuer();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!issuer) return null;
  if (!ownerBase58) return null;

  const isIssuer = !!(connected && publicKey && publicKey.toBase58() === issuer);

  if (!isIssuer) {
    return (
      <div className="card px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[20px] font-semibold text-text">Issue SAS attestation</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-3 font-bold uppercase tracking-wider">Issuer only</span>
        </div>
        <p className="text-[13px] text-text-2 font-medium">
          Connect with the Skilld issuer wallet to write a BUILDER-SCORE attestation for {display} onchain.
        </p>
        <p className="text-[12px] text-text-3 mt-2 font-medium font-mono break-all">
          issuer: {issuer.slice(0, 8)}...{issuer.slice(-6)}
        </p>
      </div>
    );
  }

  async function onIssue() {
    if (!publicKey || !sendTransaction || !ownerBase58) return;
    setLoading(true); setError(null); setTxSig(null);
    try {
      const tx = await buildBuilderScoreAttestationTx({
        connection,
        authority: publicKey,
        payer: publicKey,
        subject: new PublicKey(ownerBase58),
        data: {
          score,
          hackathon_wins: Math.round(breakdown.colosseum / 5),
          bounties_won: Math.round(breakdown.superteam / 4),
          github_commits: breakdown.github * 10,
          onchain_actions: breakdown.onchain * 8,
        },
      });
      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Issue failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card px-5 py-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[20px] font-semibold text-text">Issue SAS attestation</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider">Issuer connected</span>
      </div>
      <p className="text-[13px] text-text-2 font-medium leading-snug">
        Sign and broadcast a BUILDER-SCORE attestation for {display} via Solana Attestation Service.
      </p>
      <button
        onClick={onIssue}
        disabled={loading}
        className="mt-3 bg-success text-white px-5 py-2 rounded-full text-[14px] font-semibold hover:bg-success/90 transition disabled:opacity-60"
      >
        {loading ? 'Issuing...' : `Issue BUILDER-SCORE for ${display}`}
      </button>
      {txSig && (
        <a
          href={`https://solscan.io/tx/${txSig}`}
          target="_blank"
          rel="noreferrer"
          className="ml-3 text-[13px] text-accent font-semibold hover:underline"
        >
          View on Solscan
        </a>
      )}
      {error && (
        <div className="mt-3 bg-danger/10 border border-danger/30 rounded p-2.5 text-[12px] text-danger font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
