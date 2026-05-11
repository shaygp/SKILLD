import { useBuilderScoreAttestation, usePeerVouches } from '../lib/sas/hooks';
import { SasLogo } from './BrandLogos';

type Props = {
  ownerBase58: string | null;
  display: string;
  vouchSignerNonces?: string[];
};

export function SasPanel({ ownerBase58, display, vouchSignerNonces = [] }: Props) {
  const { data: scoreAtt, loading: scoreLoading, issuer } = useBuilderScoreAttestation(ownerBase58);
  const { data: vouches, loading: vouchesLoading } = usePeerVouches(vouchSignerNonces);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SasLogo size={28} />
            <h2 className="text-[20px] font-semibold text-text">Solana Attestation Service</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider">First builder credential issuer</span>
          </div>
          <p className="text-text-2 text-[13px] mt-1.5 font-medium">
            Builder Score and peer vouches for {display} are issued onchain by Skilld via SAS. Any Solana app can read them.
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-surface-3/50 px-5 py-3">
        {!issuer ? (
          <div className="text-text-2 text-[13px] font-medium">
            <span className="font-semibold text-text">Issuer not configured.</span> Set VITE_SKILLD_ISSUER_AUTHORITY in .env to enable SAS reads.
          </div>
        ) : !ownerBase58 ? (
          <div className="text-text-2 text-[13px] font-medium">No resolved owner for {display} yet.</div>
        ) : scoreLoading ? (
          <div className="text-text-2 text-[13px] font-medium">Reading from Solana mainnet...</div>
        ) : scoreAtt ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Metric label="Score" value={scoreAtt.data.score} />
              <Metric label="Hackathons" value={scoreAtt.data.hackathon_wins} />
              <Metric label="Bounties" value={scoreAtt.data.bounties_won} />
              <Metric label="Commits" value={scoreAtt.data.github_commits} />
              <Metric label="Onchain" value={scoreAtt.data.onchain_actions} />
            </div>
            <div className="text-text-3 text-[12px] mt-3 font-medium font-mono break-all">
              attestation pda: {String(scoreAtt.pda).slice(0, 12)}...{String(scoreAtt.pda).slice(-6)} · expires {new Date(scoreAtt.expiry * 1000).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="text-text-2 text-[13px] font-medium">
            No SAS attestation issued yet for {display}. Issuer key: <span className="font-mono">{String(issuer).slice(0, 8)}...{String(issuer).slice(-4)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-semibold text-text">Peer vouches onchain</h3>
          <span className="text-[12px] text-text-3 font-semibold">{vouches.length} signed</span>
        </div>
        {vouchesLoading ? (
          <div className="text-text-2 text-[13px] font-medium">Loading peer vouches...</div>
        ) : vouches.length === 0 ? (
          <p className="text-text-3 text-[13px] font-medium">No PEER-VOUCH attestations issued yet for this builder.</p>
        ) : (
          <ul className="space-y-2">
            {vouches.slice(0, 4).map((v) => (
              <li key={String(v.pda)} className="bg-surface-3 border border-border rounded p-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-accent-soft text-accent rounded font-semibold shrink-0">
                    {v.data.skill || 'general'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-[13px] leading-snug italic">"{v.data.context}"</p>
                    <div className="text-text-3 text-[11px] mt-1 font-mono break-all">
                      from {String(v.data.signer).slice(0, 8)}...{String(v.data.signer).slice(-4)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[18px] font-bold text-text tabular-nums leading-none">{value.toLocaleString()}</div>
      <div className="text-[11px] text-text-2 mt-1 font-medium">{label}</div>
    </div>
  );
}

export function _UnusedSasIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}
