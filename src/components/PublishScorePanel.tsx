import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { buildPublishScoreTransaction, readScoreRecord, type SkilldScoreRecord } from '../lib/sns/writeScore';
import type { BuilderProfile } from '../types/profile';
import { SnsLogo } from './BrandLogos';

type Props = {
  display: string;
  ownerBase58: string | null;
  score: number;
  breakdown: BuilderProfile['scoreBreakdown'];
  attestationCount: number;
};

export function PublishScorePanel({ display, ownerBase58, score, breakdown, attestationCount }: Props) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [existing, setExisting] = useState<SkilldScoreRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = !!(connected && publicKey && ownerBase58 && publicKey.toBase58() === ownerBase58);

  useEffect(() => {
    let cancelled = false;
    readScoreRecord(connection, display).then((r) => { if (!cancelled) setExisting(r); });
    return () => { cancelled = true; };
  }, [connection, display]);

  if (!ownerBase58) return null;

  async function onPublish() {
    if (!publicKey || !sendTransaction) return;
    setLoading(true);
    setError(null);
    setTxSig(null);
    try {
      const payload: SkilldScoreRecord = {
        v: 1,
        score,
        breakdown,
        updatedAt: new Date().toISOString(),
        attestationCount,
      };
      const tx = await buildPublishScoreTransaction({
        connection, domain: display, owner: new PublicKey(ownerBase58!), payer: publicKey, payload,
      });
      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
      const next = await readScoreRecord(connection, display);
      setExisting(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <SnsLogo size={28} />
            <h2 className="text-[20px] font-semibold text-text">SNS Records V2 onchain</h2>
          </div>
          <p className="text-text-2 text-[13px] mt-1.5 font-medium">
            Publish the Builder Score as a verifiable record on the .sol itself. Anyone resolving {display} reads the score directly from chain.
          </p>
        </div>
        {existing && (
          <span className="text-[11px] px-2 py-0.5 bg-success-soft text-success rounded font-semibold shrink-0">
            Onchain
          </span>
        )}
      </div>

      <div className="border-t border-border bg-surface-3/50 px-5 py-3">
        <div className="grid grid-cols-2 gap-4">
          <Cell label="Local Builder Score" value={`${score}`} />
          <Cell label="Onchain Builder Score" value={existing ? `${existing.score}` : 'Not published'} />
        </div>
        {existing && (
          <div className="mt-3 text-[12px] text-text-3 font-medium">
            Last updated {new Date(existing.updatedAt).toLocaleString()} · record key <code className="bg-surface-2 px-1 py-0.5 rounded font-mono">skilld_score</code>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        {!connected ? (
          <p className="text-text-2 text-[13px] font-medium">Connect a wallet to check ownership.</p>
        ) : !isOwner ? (
          <div className="flex items-start gap-2 text-text-2 text-[13px] font-medium">
            <LockSmall />
            <span>
              Only the owner of {display} can publish. Connect with the wallet that holds this domain.
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="text-text-2 text-[13px] font-medium leading-snug">
              You own {display}. {existing ? 'Update' : 'Publish'} the score onchain. Costs ~0.001 SOL of rent {existing ? '' : 'on first publish'}.
            </div>
            <button
              onClick={onPublish}
              disabled={loading}
              className="bg-accent text-white px-5 py-2 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (existing ? 'Updating...' : 'Publishing...') : existing ? 'Update onchain score' : 'Publish onchain'}
            </button>
          </div>
        )}

        {txSig && (
          <a
            href={`https://solscan.io/tx/${txSig}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[13px] text-accent font-semibold hover:underline"
          >
            View transaction on Solscan
            <ExternalIcon />
          </a>
        )}

        {error && (
          <div className="mt-3 bg-danger/10 border border-danger/30 rounded p-2.5 text-[12px] text-danger font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-[20px] font-bold text-text tabular-nums leading-none mt-1">{value}</div>
    </div>
  );
}

export function _UnusedSnsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 12l2-2 5 5 9-9 2 2-11 11z" />
    </svg>
  );
}

function LockSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0 text-text-3">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
    </svg>
  );
}
