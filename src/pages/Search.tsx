import { useMemo, useState } from 'react';
import { useWinnerFeed } from '../lib/superteam/hooks';
import { Avatar } from '../components/Avatar';
import type { SuperteamFeedItem } from '../lib/superteam/api';

type Aggregated = {
  username: string;
  fullName: string;
  wins: number;
  submissions: number;
  totalUsdc: number;
  tokens: Set<string>;
  lastActiveAt: string;
  sponsors: Set<string>;
  recentTitles: string[];
};

function aggregate(items: SuperteamFeedItem[]): Aggregated[] {
  const map = new Map<string, Aggregated>();
  for (const it of items) {
    const key = it.username || it.userId;
    if (!key) continue;
    const reward = it.rewards ? Object.values(it.rewards).reduce((s, v) => s + Number(v ?? 0), 0) : 0;
    const usdc = it.token === 'USDC' ? reward : 0;
    const entry =
      map.get(key) ??
      ({
        username: key,
        fullName: `${it.firstName ?? ''} ${it.lastName ?? ''}`.trim() || key,
        wins: 0,
        submissions: 0,
        totalUsdc: 0,
        tokens: new Set<string>(),
        lastActiveAt: it.createdAt,
        sponsors: new Set<string>(),
        recentTitles: [],
      } as Aggregated);
    entry.submissions += 1;
    if (it.isWinner) entry.wins += 1;
    entry.totalUsdc += usdc;
    if (it.token) entry.tokens.add(it.token);
    if (it.sponsorName) entry.sponsors.add(it.sponsorName);
    if (entry.recentTitles.length < 3) entry.recentTitles.push(it.listingTitle);
    if (new Date(it.createdAt) > new Date(entry.lastActiveAt)) entry.lastActiveAt = it.createdAt;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.wins - a.wins || b.totalUsdc - a.totalUsdc);
}

export function SearchPage() {
  const { data, loading } = useWinnerFeed(100);
  const [minWins, setMinWins] = useState(1);
  const [q, setQ] = useState('');

  const builders = useMemo(() => aggregate(data), [data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return builders.filter((b) => {
      if (b.wins < minWins) return false;
      if (!needle) return true;
      return (
        b.username.toLowerCase().includes(needle) ||
        b.fullName.toLowerCase().includes(needle) ||
        b.recentTitles.join(' ').toLowerCase().includes(needle) ||
        [...b.sponsors].some((s) => s.toLowerCase().includes(needle))
      );
    });
  }, [builders, minWins, q]);

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3">
        <div className="card p-5 sticky top-[64px]">
          <h2 className="text-[18px] font-semibold text-text">Filters</h2>

          <div className="mt-5">
            <label className="text-[14px] text-text-2 font-semibold">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="name, sponsor or title"
              className="w-full mt-2 bg-surface border border-border rounded px-3 py-2 text-[14px] text-text placeholder:text-text-3 focus:outline-none focus:border-accent transition"
            />
          </div>

          <div className="mt-5">
            <label className="text-[14px] text-text-2 font-semibold">Min wins</label>
            <input
              type="range"
              min={1}
              max={5}
              value={minWins}
              onChange={(e) => setMinWins(parseInt(e.target.value, 10))}
              className="w-full mt-3 accent-accent"
            />
            <div className="text-text-2 text-[15px] mt-1.5 tabular-nums font-semibold">{minWins}+ wins</div>
          </div>

          <p className="mt-6 text-[12px] text-text-3 leading-snug font-medium">
            Data pulled from Superteam Earn winner feed in real time. Avatars resolved from the SMB pool by deterministic hash.
          </p>
        </div>
      </aside>

      <main className="lg:col-span-9">
        <div className="card mb-3 px-5 py-4">
          <h1 className="text-[22px] font-bold text-text">Builder search</h1>
          <p className="text-text-2 text-[14px] mt-1">
            {loading
              ? 'Loading from Superteam Earn'
              : `${filtered.length} ${filtered.length === 1 ? 'builder' : 'builders'} with at least ${minWins} ${minWins === 1 ? 'win' : 'wins'}.`}
          </p>
        </div>

        <div className="space-y-3">
          {!loading && filtered.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-text-2 text-[15px]">No builders match these filters.</p>
            </div>
          )}
          {filtered.map((b) => (
            <a
              key={b.username}
              href={`https://earn.superteam.fun/t/${b.username}`}
              target="_blank"
              rel="noreferrer"
              className="card p-4 flex items-center gap-4 hover:border-accent transition"
            >
              <Avatar domain={b.username} size={64} />
              <div className="flex-1 min-w-0">
                <div className="text-text font-semibold text-[18px]">{b.fullName}</div>
                <div className="text-text-2 text-[13px] mt-0.5 font-mono">{b.username}</div>
                {b.recentTitles.length > 0 && (
                  <div className="text-text-3 text-[12px] mt-1 line-clamp-1 font-medium">
                    {b.recentTitles.join(' · ')}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[...b.tokens].slice(0, 4).map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 bg-accent-soft text-accent rounded font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[28px] font-bold text-text tabular-nums leading-none">{b.wins}</div>
                <div className="text-[11px] text-text-2 mt-1 font-semibold">wins on Earn</div>
                {b.totalUsdc > 0 && (
                  <div className="text-[12px] text-success font-bold mt-1.5 tabular-nums">
                    +{b.totalUsdc.toLocaleString()} USDC
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
