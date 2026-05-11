import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSealedFor } from '../lib/magicblock/hooks';
import { MagicBlockLogo } from './BrandLogos';
import {
  TEE_RPC_URL,
  PER_DOCS_URL,
  flagsHumanLabel,
  probeTeeIntegrity,
  fetchTeeSlot,
  requestBearerToken,
} from '../lib/magicblock/api';

type Props = {
  display: string;
  ownerBase58: string | null;
  isOwner: boolean;
};

export function MagicBlockPanel({ display, ownerBase58, isOwner }: Props) {
  const sealed = useSealedFor(display);
  const { publicKey, signMessage, connected } = useWallet();
  const [teeOk, setTeeOk] = useState<boolean | null>(null);
  const [teeError, setTeeError] = useState<string | null>(null);
  const [teeSlot, setTeeSlot] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    probeTeeIntegrity().then((r) => {
      if (cancelled) return;
      setTeeOk(r.ok);
      if (r.error) setTeeError(r.error);
    });
    fetchTeeSlot().then((slot) => {
      if (!cancelled) setTeeSlot(slot);
    });
    return () => { cancelled = true; };
  }, []);

  async function onAuth() {
    if (!connected || !publicKey || !signMessage) return;
    setAuthBusy(true);
    setTokenError(null);
    setToken(null);
    try {
      const r = await requestBearerToken(publicKey, signMessage);
      if (r.ok && r.token) {
        setToken(r.token);
      } else {
        setTokenError(r.error ?? 'Auth failed');
      }
    } catch (e) {
      setTokenError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start gap-2 flex-wrap">
        <MagicBlockLogo size={28} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[20px] font-semibold text-text">MagicBlock private attestations</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-warning-soft text-warning font-bold uppercase tracking-wider">Pattern A · roadmap</span>
          </div>
          <p className="text-text-2 text-[13px] mt-1.5 font-medium leading-snug">
            Sealed payload Pattern A architecture shipped: split account with public AttestationCounter on Solana mainnet plus AttestationDetail PDA delegated to MagicBlock Ephemeral Rollup with member flags scoped to the recipient. Anchor program migration scheduled post Frontier.
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-surface-3/50 px-5 py-3 grid grid-cols-3 gap-4">
        <div>
          <div className="text-[20px] font-bold text-text tabular-nums leading-none">{sealed.length}</div>
          <div className="text-[12px] text-text-2 font-medium mt-1">Sealed vouches</div>
        </div>
        <div>
          <div className="text-[20px] font-bold text-text tabular-nums leading-none">+{Math.min(15, sealed.length * 3)}</div>
          <div className="text-[12px] text-text-2 font-medium mt-1">Score contribution</div>
        </div>
        <div>
          <div className="text-[20px] font-bold text-text tabular-nums leading-none">{ownerBase58 ? 'TEE' : '—'}</div>
          <div className="text-[12px] text-text-2 font-medium mt-1">Privacy backend</div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] text-text-3 font-semibold uppercase tracking-wider">TEE RPC endpoint · Intel TDX</div>
          {teeOk === true && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider">Attestation verified</span>
          )}
          {teeOk === false && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning font-bold uppercase tracking-wider">Attestation failed</span>
          )}
          {teeOk === null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-3 font-bold uppercase tracking-wider">Probing...</span>
          )}
        </div>
        <div className="font-mono text-[12px] text-text break-all">{TEE_RPC_URL}</div>
        {teeSlot !== null && (
          <div className="mt-2 text-[12px] text-text-2 mono">
            Current slot: <span className="font-semibold tabular-nums">{teeSlot.toLocaleString()}</span>
          </div>
        )}
        {teeError && (
          <div className="mt-2 text-[11px] text-warning font-medium">{teeError}</div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] text-text-3 font-semibold uppercase tracking-wider">Bearer token (recipient access)</div>
          {token && <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider">Token live</span>}
        </div>
        {!connected ? (
          <p className="text-text-2 text-[13px] font-medium">Connect a wallet to request a TEE bearer token via nacl signed challenge.</p>
        ) : token ? (
          <div className="font-mono text-[11px] text-text break-all bg-surface-3 border border-border p-2 rounded">
            {token.slice(0, 80)}{token.length > 80 ? '...' : ''}
          </div>
        ) : (
          <button
            onClick={onAuth}
            disabled={authBusy}
            className="bg-text text-surface px-4 py-1.5 rounded-full text-[13px] font-semibold hover:bg-text-2 transition disabled:opacity-50"
          >
            {authBusy ? 'Signing nacl challenge...' : 'Get TEE bearer token'}
          </button>
        )}
        {tokenError && (
          <div className="mt-2 text-[11px] text-warning font-medium">{tokenError}</div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3 space-y-2">
        {sealed.length === 0 ? (
          <p className="text-text-2 text-[14px] font-medium">No sealed vouches yet for {display}. Open the Vouch flow and toggle the MagicBlock private attestation option.</p>
        ) : (
          <ul className="space-y-2">
            {sealed.slice(0, 5).map((s) => (
              <li key={s.id} className="bg-surface-3 border border-border rounded p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-text font-semibold text-[14px]">{s.fromDomain}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning font-bold">SEALED</span>
                      {s.memoSignature && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold">Onchain memo</span>
                      )}
                      <span className="text-[11px] text-text-3 font-mono">{flagsHumanLabel(s.recipientFlags)}</span>
                    </div>
                    <p className="text-text-3 text-[13px] mt-1 italic">
                      {isOwner ? 'TEE decrypts this for you' : 'Sealed via PER. Only the recipient can decrypt.'}
                    </p>
                    <div className="text-text-3 text-[11px] mt-1.5 font-mono">
                      hash {s.sealedPayloadHash} permission {s.permissionPda.slice(0, 6)}...{s.permissionPda.slice(-4)}
                    </div>
                    {s.memoSignature && (
                      <a href={`https://solscan.io/tx/${s.memoSignature}?cluster=devnet`} target="_blank" rel="noreferrer" className="inline-block mt-1 text-[11px] text-accent font-mono hover:underline">
                        tx {s.memoSignature.slice(0, 10)}...{s.memoSignature.slice(-6)}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-5 py-2.5 flex justify-between items-center">
        <span className="text-[12px] text-text-3 font-medium">Pattern A: split account, public counter + private detail</span>
        <a href={PER_DOCS_URL} target="_blank" rel="noreferrer" className="text-[12px] text-accent font-semibold hover:underline">
          MagicBlock docs →
        </a>
      </div>
    </div>
  );
}

export function _UnusedLockBoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-3.1 0H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2zM12 12l-3 5h2v3l3-5h-2z" />
    </svg>
  );
}
