import type { BuilderProfile } from '../types/profile';

const labels: Array<{ key: keyof BuilderProfile['scoreBreakdown']; label: string; max: number }> = [
  { key: 'colosseum', label: 'Colosseum', max: 25 },
  { key: 'superteam', label: 'Superteam Earn', max: 20 },
  { key: 'onchain', label: 'Onchain activity', max: 20 },
  { key: 'github', label: 'GitHub', max: 15 },
  { key: 'attestations', label: 'Peer attestations', max: 15 },
  { key: 'credentials', label: 'Credentials', max: 5 },
];

export function ScoreBreakdown({ breakdown }: { breakdown: BuilderProfile['scoreBreakdown'] }) {
  return (
    <div className="space-y-3.5">
      {labels.map(({ key, label, max }) => {
        const v = breakdown[key];
        const pct = (v / max) * 100;
        return (
          <div key={key}>
            <div className="flex justify-between text-[13px] text-text-2 mb-1.5">
              <span className="font-medium">{label}</span>
              <span className="text-text-3 tabular-nums font-semibold">
                {v} / {max}
              </span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
