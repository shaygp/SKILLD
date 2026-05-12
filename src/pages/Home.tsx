import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useActivityFeed, useOpenListings } from '../lib/superteam/hooks';
import { Avatar as SkilldAvatar } from '../components/Avatar';
import { rewardForFeedItem, type SuperteamFeedItem, type SuperteamListing } from '../lib/superteam/api';

export function HomePage() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { data: feed } = useActivityFeed(20);
  const { data: bounties } = useOpenListings(8);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim().toLowerCase();
    if (!v) return;
    const target = v.endsWith('.sol') ? v : `${v}.sol`;
    navigate(`/${target}`);
  }

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-6 space-y-4">
      <Hero onSearch={onSubmit} q={q} setQ={setQ} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3 space-y-2">
        <ProfileMiniCard />
        <NetworkRail />
      </aside>

      <main className="lg:col-span-6 space-y-2">
        <PostBox onSearch={onSubmit} q={q} setQ={setQ} />
        <FeedFilter />
        {feed.slice(0, 6).map((item, i) => (
          <FeedCard key={`${item.userId}-${item.listingId}-${i}`} item={item} />
        ))}
      </main>

      <aside className="lg:col-span-3 space-y-2">
        <NewsRail />
        <PromotedAd />
        <LiveBountiesRail bounties={bounties} />
        <FooterNav />
      </aside>
      </div>
    </div>
  );
}

function Hero({ onSearch, q, setQ }: { onSearch: (e: React.FormEvent) => void; q: string; setQ: (v: string) => void }) {
  return (
    <div className="overflow-hidden border border-text relative" style={{ background: '#0a0a0a', color: '#f4f1ea' }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 text-[#f4f1ea]">
        <div className="lg:col-span-7 px-6 lg:px-12 py-12 lg:py-20 border-b lg:border-b-0 lg:border-r border-white/15 relative">
          <div className="serif-italic text-[18px] opacity-65 mb-4">— A residency for onchain reputation</div>
          <h1 className="font-bold tracking-[-0.03em] leading-[0.95] text-[56px] lg:text-[88px]" style={{ color: '#f4f1ea' }}>
            Your<br />
            <span className="serif-italic font-normal" style={{ color: '#14f195' }}>.sol</span>
            <br />is your CV.
          </h1>
          <p className="mt-6 text-[16px] leading-relaxed max-w-md opacity-85">
            Skilld indexes Colosseum, Superteam Earn, GitHub and peer attestations into an onchain Builder Score. Published via SNS Records V2. Read by every Solana app and every AI agent.
          </p>
          <form onSubmit={onSearch} className="mt-7 flex gap-2 max-w-md">
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="framew0rk.sol"
                className="w-full border-b-2 px-0 py-2.5 text-[18px] focus:outline-none transition mono"
                style={{ background: 'transparent', color: '#f4f1ea', borderColor: 'rgba(255,255,255,0.4)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#14f195')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-[14px] font-bold transition uppercase tracking-wider"
              style={{ background: '#14f195', color: '#0a0a0a' }}
            >
              Resolve →
            </button>
          </form>
          <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] mono uppercase tracking-[0.18em] opacity-55">
            <span>SNS,</span>
            <span>SAS,</span>
            <span>x402,</span>
            <span>MagicBlock,</span>
            <span>Umbra,</span>
            <span>World ID,</span>
            <span>Phantom MCP</span>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1">
          <HeroStat label="Onchain confirmations" value="20" sub="Verifiable on Solscan devnet" />
          <HeroStat label="Anchor program" value="LIVE" sub="4prD…Z5Cn6 on devnet" />
          <HeroStat label="MCP tools" value="4" sub="Agent ready Phantom router" />
          <HeroStat label="Stack primitives" value="08" sub="Composable open data" highlight />
        </div>
      </div>
    </div>
  );
}

function HeroStat({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div
      className="px-8 py-7 border-b border-white/15 last:border-b-0"
      style={highlight ? { background: '#14f195', color: '#0a0a0a' } : { color: '#f4f1ea' }}
    >
      <div className="text-[10px] font-bold tracking-[0.22em] uppercase opacity-65 mono">{label}</div>
      <div className="mt-1 text-[44px] lg:text-[60px] font-bold leading-none tabular-nums tracking-tight">{value}</div>
      <div className="mt-1.5 text-[12px] opacity-80 font-medium mono">{sub}</div>
    </div>
  );
}


function ProfileMiniCard() {
  const { connected, publicKey } = useWalletStatus();

  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <div className="h-[54px] bg-accent" />
        <Link
          to="/framew0rk.sol"
          className="absolute left-3 top-3.5 w-[72px] h-[72px] rounded-full border-[3px] border-surface overflow-hidden"
        >
          <SkilldAvatar domain={publicKey?.toBase58() ?? 'framew0rk.sol'} size={66} />
        </Link>
      </div>
      <div className="pt-12 px-3 pb-3 text-center">
        <Link to="/framew0rk.sol" className="block">
          <div className="text-[16px] font-semibold text-text leading-tight hover:underline">
            {connected && publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Connect your .sol'}
          </div>
          <p className="text-[12px] text-text-2 mt-1 leading-snug font-medium">
            {connected ? 'Wallet connected. Publish a Builder Score onchain from your profile.' : 'Sign in with Phantom or Solflare to claim your profile.'}
          </p>
        </Link>
      </div>
      <a
        href="https://solscan.io/account/4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6?cluster=devnet"
        target="_blank"
        rel="noreferrer"
        className="block border-t border-border px-3 py-2 hover:bg-surface-2 transition cursor-pointer"
      >
        <div className="text-[11px] text-text-2 font-medium leading-snug">Anchor program</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-[2px] bg-success" />
          <span className="text-[12px] text-text font-bold font-mono">4prD…Z5Cn6 devnet</span>
        </div>
      </a>
      <Link to="/agents" className="block border-t border-border px-3 py-2 hover:bg-surface-2 transition cursor-pointer">
        <div className="text-[11px] text-text-2 font-medium leading-snug">MCP server</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-[2px] bg-success" />
          <span className="text-[12px] text-text font-bold">4 tools agents can call</span>
        </div>
      </Link>
      <Link to="/attestations" className="block border-t border-border px-3 py-1.5 hover:bg-surface-2 transition cursor-pointer">
        <div className="flex items-center gap-2 text-[12px] text-text-2 font-semibold">
          <SignedIconSmall />
          <span>16 onchain confirmations</span>
        </div>
      </Link>
    </div>
  );
}

function NetworkRail() {
  return (
    <div className="card">
      <div className="px-3 pt-2.5 pb-2 border-b border-border">
        <div className="text-[12px] text-text-2 font-semibold">Network primitives</div>
      </div>
      <ul>
        <PrimitiveRow label="SNS Records V2" sub="Builder Score onchain" url="https://sns.id" />
        <PrimitiveRow label="Solana Attestation Service" sub="Credentials and vouches" url="https://attest.solana.com" />
        <PrimitiveRow label="Superteam Earn" sub="Bounty graph live" url="https://superteam.fun/earn" />
        <PrimitiveRow label="Colosseum Hall of Fame" sub="Hackathon track record" url="https://arena.colosseum.org" />
        <PrimitiveRow label="x402" sub="Paid intros in USDC" url="https://solana.com/x402" />
        <PrimitiveRow label="MagicBlock PER" sub="Sealed private vouches" url="https://docs.magicblock.gg" />
        <PrimitiveRow label="Umbra" sub="Confidential paid intros" url="https://www.umbraprivacy.com/" />
        <PrimitiveRow label="World ID" sub="Anti sybil weighting" url="https://world.org" />
      </ul>
    </div>
  );
}

function PrimitiveRow({ label, sub, url }: { label: string; sub: string; url: string }) {
  return (
    <li>
      <a href={url} target="_blank" rel="noreferrer" className="block px-3 py-1.5 hover:bg-surface-2 cursor-pointer transition">
        <div className="text-[13px] text-text font-semibold leading-tight">{label}</div>
        <div className="text-[11px] text-text-3 mt-0.5 font-medium">{sub}</div>
      </a>
    </li>
  );
}

function SignedIconSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function useWalletStatus() {
  const wallet = useWallet();
  return wallet;
}

function PostBox({ onSearch, q, setQ }: { onSearch: (e: React.FormEvent) => void; q: string; setQ: (v: string) => void }) {
  return (
    <div className="card pt-3 pb-3 px-4">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <SkilldAvatar domain="?.sol" size={48} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a .sol domain"
          className="flex-1 bg-surface border border-border-strong rounded-full px-4 py-2.5 text-[14px] text-text placeholder:text-text-3 hover:bg-surface-2 focus:outline-none focus:border-accent transition font-medium"
        />
      </form>
    </div>
  );
}

function FeedFilter() {
  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <span className="flex-1 h-px bg-border" />
      <span className="text-[12px] text-text-2 font-medium">Sort by:</span>
      <span className="text-[12px] text-text font-bold flex items-center gap-0.5">Top <ChevronDownInline /></span>
    </div>
  );
}

function ChevronDownInline() {
  return <span className="inline-block align-middle"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg></span>;
}

function FeedCard({ item }: { item: SuperteamFeedItem }) {
  const reward = rewardForFeedItem(item);
  const isWinner = item.isWinner === true;
  const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.username;
  const reactions = item.likeCount;
  const comments = item.commentCount;
  const profileUrl = `https://earn.superteam.fun/t/${item.username}`;

  return (
    <div className="card pt-3 pb-3 px-4">
      <div className="flex items-start gap-2">
        <a href={profileUrl} target="_blank" rel="noreferrer" className="shrink-0">
          <SkilldAvatar domain={item.username} size={48} />
        </a>
        <div className="flex-1 min-w-0">
          <a href={profileUrl} target="_blank" rel="noreferrer" className="block">
            <span className="text-text font-semibold text-[14px] hover:text-accent hover:underline">{fullName}</span>
          </a>
          <div className="text-text-2 text-[12px] leading-snug font-medium">{item.username} on Superteam Earn</div>
          <div className="text-text-3 text-[12px] mt-0.5 font-medium flex items-center gap-1">
            {timeAgo(item.createdAt)} <GlobeIcon />
          </div>
        </div>
      </div>
      <div className="mt-2 text-[14px] text-text leading-snug">
        {isWinner ? 'won' : 'submitted to'}{' '}
        <span className="font-semibold">{item.listingTitle}</span>
        {reward > 0 ? <> for <span className="font-semibold text-success">+{reward.toLocaleString()} {item.token}</span></> : null}
      </div>
      {item.sponsorLogo && (
        <a
          href={`https://superteam.fun/earn/listing/${item.listingSlug}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-3 border border-border rounded overflow-hidden hover:bg-surface-2 transition"
        >
          <img src={item.sponsorLogo} alt={item.sponsorName} className="w-[120px] h-[120px] object-cover bg-surface-3 shrink-0" />
          <div className="flex-1 min-w-0 py-2 pr-3">
            <div className="text-[12px] text-text-3 font-medium uppercase tracking-wider">{item.listingType}</div>
            <div className="text-[15px] font-semibold text-text leading-snug mt-0.5 line-clamp-2">{item.listingTitle}</div>
            <div className="text-[13px] text-text-2 mt-1 font-medium">{item.sponsorName}</div>
          </div>
        </a>
      )}
      {(reactions > 0 || comments > 0) && (
        <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border text-text-2 text-[12px] font-medium">
          {reactions > 0 && <span>{reactions.toLocaleString()} reactions</span>}
          {comments > 0 && <span className="ml-auto">{comments} comments</span>}
        </div>
      )}
    </div>
  );
}

function NewsRail() {
  return (
    <div className="card pt-3 pb-2">
      <div className="px-4 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-text">Frontier countdown</h3>
        <FrontierBadge />
      </div>
      <p className="px-4 text-[12px] text-text-3 font-medium mt-0.5">Days left until submission</p>
      <ul className="mt-1.5">
        <FrontierItem title="Submission deadline" meta="May 11 · Colosseum" url="https://colosseum.com/frontier" />
        <FrontierItem title="SNS Identity Track demo day" meta="May 14 · Bonfida + Superteam Malaysia + MagicBlock" url="https://docs.sns.id" />
        <FrontierItem title="$2.75M total prize pool" meta="$30K Grand · 20×$10K Standout" url="https://blog.colosseum.com/announcing-the-solana-frontier-hackathon" />
        <FrontierItem title="Phantom is Grand Prize Sponsor" meta="Adam Gutierrez judging" url="https://x.com/phantom" />
        <FrontierItem title="Solana Attestation Service mainnet" meta="Live since May 23, 2025" url="https://attest.solana.com" />
      </ul>
    </div>
  );
}

function FrontierBadge() {
  const today = new Date();
  const deadline = new Date('2026-05-11T21:00:00-07:00');
  const days = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000));
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning text-white font-bold tabular-nums">D-{days}</span>
  );
}

function FrontierItem({ title, meta, url }: { title: string; meta: string; url: string }) {
  return (
    <li>
      <a href={url} target="_blank" rel="noreferrer" className="block px-4 py-1.5 hover:bg-surface-2 cursor-pointer transition">
        <div className="flex gap-2 items-start">
          <span className="w-1 h-1 rounded-full bg-text-2 mt-[7px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-text leading-snug">{title}</div>
            <div className="text-[11px] text-text-3 mt-0 font-medium">{meta}</div>
          </div>
        </div>
      </a>
    </li>
  );
}

function PromotedAd() {
  return (
    <Link to="/agents" className="card block overflow-hidden hover:bg-surface-2 transition">
      <div className="px-3 py-2.5">
        <div className="text-[11px] text-text-3 font-medium">For AI agents · MCP</div>
        <div className="mt-2 text-[13px] text-text font-semibold leading-snug">
          Query Builder Scores from Claude, Cursor or Phantom
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-10 h-10 rounded bg-text text-surface flex items-center justify-center font-bold text-[16px] shrink-0">
            <BotMini />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-text font-semibold leading-tight">skilld-mcp.json</div>
            <div className="text-[11px] text-text-2 mt-0.5 font-medium">4 tools, 1 resource</div>
          </div>
        </div>
        <div className="mt-2.5 w-full border border-accent text-accent px-3 py-1 rounded-full text-[13px] font-semibold text-center">
          See API
        </div>
      </div>
    </Link>
  );
}

function BotMini() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 9V7c0-1.1-.9-2-2-2h-3V3h-2v2h-2V3H9v2H6c-1.1 0-2 .9-2 2v2H2v2h2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6h2V9h-2zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zm8.5 5.5H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z" />
    </svg>
  );
}

function LiveBountiesRail({ bounties }: { bounties: SuperteamListing[] }) {
  return (
    <div className="card">
      <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-text">Live bounties</h3>
        <Link to="/activity" className="text-[12px] text-accent font-semibold hover:underline">
          See all
        </Link>
      </div>
      <ul>
        {bounties.slice(0, 5).map((b, i) => (
          <li key={b.id}>
            <a
              href={`https://superteam.fun/earn/listing/${b.slug}`}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 px-4 py-2 hover:bg-surface-2 transition ${i > 0 ? 'border-t border-border' : ''}`}
            >
              {b.sponsor.logo ? (
                <img src={b.sponsor.logo} alt={b.sponsor.name} className="w-8 h-8 rounded object-cover bg-surface-3 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded bg-surface-3 border border-border shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-text font-semibold text-[12px] leading-snug line-clamp-2">{b.title}</div>
                <div className="text-text-3 text-[11px] mt-0.5 font-semibold">
                  {b.rewardAmount.toLocaleString()} {b.token}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterNav() {
  return (
    <div className="px-3 pt-2 pb-3 text-[11px] text-text-2 leading-relaxed">
      <div className="flex flex-wrap gap-x-2.5 gap-y-1">
        <Link to="/about" className="hover:text-accent hover:underline cursor-pointer">About</Link>
        <Link to="/attestations" className="hover:text-accent hover:underline cursor-pointer">Attestations</Link>
        <Link to="/agents" className="hover:text-accent hover:underline cursor-pointer">Agents</Link>
        <a href="/deck.html" className="hover:text-accent hover:underline cursor-pointer">Deck</a>
        <a href="https://github.com/shaygp/skilld" target="_blank" rel="noreferrer" className="hover:text-accent hover:underline cursor-pointer">GitHub</a>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <img src="/assets/logos/skilld.png" alt="Skilld" className="w-4 h-4 rounded object-cover shrink-0" />
        <span className="text-text font-bold text-[12px]">Skilld</span>
        <span className="text-text-3 text-[11px]">© 2026</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-text-3 font-medium">
        Using
        <span className="text-text font-semibold">Helius</span>,
        <span className="text-text font-semibold">SAS</span>,
        <span className="text-text font-semibold">SNS</span>,
        <span className="text-text font-semibold">x402</span>,
        <span className="text-text font-semibold">MagicBlock</span>,
        <span className="text-text font-semibold">Umbra</span>
      </div>
    </div>
  );
}

export { Avatar } from '../components/Avatar';

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

