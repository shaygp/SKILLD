import { useEffect, useState } from 'react';
import { IDKit } from '@worldcoin/idkit';
import { getProof, type HumanityProof } from '../lib/worldid/store';
import { WorldIdLogo } from './BrandLogos';

const APP_ID = (import.meta.env.VITE_WORLDID_APP_ID ?? 'app_staging_skilld_local') as `app_${string}`;
const ACTION = 'skilld_humanity';

type Props = {
  display: string;
  isOwner: boolean;
};

export function WorldIdPanel({ display, isOwner }: Props) {
  const [proof, setProof] = useState<HumanityProof | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sessionUri, setSessionUri] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    setProof(getProof(display));
    const onChange = () => setProof(getProof(display));
    window.addEventListener('skilld:worldid:changed', onChange);
    return () => window.removeEventListener('skilld:worldid:changed', onChange);
  }, [display]);

  async function onCreateSession() {
    setVerifying(true);
    setSessionError(null);
    try {
      const config = {
        app_id: APP_ID,
        action: ACTION,
        signal: display,
        rp_context: 'Skilld humanity proof for Builder Score weighting',
      };
      const sessionResult = await (IDKit.createSession as unknown as (c: Record<string, unknown>) => Promise<Record<string, unknown>>)(config);
      const uri = (sessionResult as { connect_url?: string; uri?: string }).connect_url ?? (sessionResult as { uri?: string }).uri ?? null;
      if (uri) {
        setSessionUri(uri);
      } else {
        setSessionError('No session URI returned');
        setVerifying(false);
      }
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : String(e));
      setVerifying(false);
    }
  }


  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <WorldIdLogo size={28} />
            <h2 className="text-[20px] font-semibold text-text">World ID humanity weighting</h2>
            {proof ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider">Demo nullifier · {proof.level}</span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning font-bold uppercase tracking-wider">IDKit integration scheduled</span>
            )}
          </div>
          <p className="text-text-2 text-[13px] mt-1.5 font-medium">
            Anti sybil weighting layer. Without humanity proof peer attestations are weighted at 30%. With orb verification they count at 100%. Demo flow uses a local nullifier. Production hits World ID IDKit + onchain verifier.
          </p>
        </div>
      </div>

      {proof ? (
        <div className="border-t border-border bg-success-soft/40 px-5 py-3">
          <div className="text-[12px] text-text-2 font-semibold uppercase tracking-wider">Nullifier hash</div>
          <div className="mt-1 font-mono text-[12px] text-text break-all">{proof.nullifier.slice(0, 22)}...{proof.nullifier.slice(-10)}</div>
          <div className="text-[12px] text-text-3 mt-1 font-medium">
            Verified at {new Date(proof.verifiedAt).toLocaleString()} · level <span className="font-semibold text-text">{proof.level}</span>
          </div>
        </div>
      ) : (
        <div className="border-t border-border px-5 py-3 space-y-2">
          {!isOwner ? (
            <p className="text-text-2 text-[13px] font-medium">Only the owner of {display} can verify humanity for this profile.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={onCreateSession} disabled={verifying} className="bg-text text-surface px-4 py-2 rounded-full text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-bright pulse-dot" />
                  {verifying && sessionUri ? 'Waiting for World App...' : verifying ? 'Creating session...' : 'Open World App session'}
                </button>
              </div>
              {sessionUri && (
                <div className="bg-surface-3 border border-border rounded p-3">
                  <div className="text-[11px] text-text-3 font-semibold uppercase tracking-wider mb-1">Connect URL</div>
                  <a href={sessionUri} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-accent break-all hover:underline">
                    {sessionUri}
                  </a>
                  <div className="text-[11px] text-text-3 mt-2 font-medium">Open in World App on mobile to complete proof.</div>
                </div>
              )}
              {sessionError && (
                <div className="text-[11px] text-warning font-medium">{sessionError}</div>
              )}
              <span className="text-[12px] text-text-3 font-medium">Real World ID IDKit 2.x · staging app id from VITE_WORLDID_APP_ID</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function _UnusedWorldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}
