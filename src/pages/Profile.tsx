import { useParams, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { findSeedByDomain } from '../lib/seed/builders';
import { resolveProfileAcrossClusters } from '../lib/sns/resolveMulti';
import { type ProfileRecords } from '../lib/sns/records';
import { ScoreRing } from '../components/ScoreRing';
import { ScoreBreakdown } from '../components/ScoreBreakdown';
import { Avatar } from '../components/Avatar';
import { SasLogo, SnsLogo, ColosseumLogo } from '../components/BrandLogos';
import { useUserActivity } from '../lib/superteam/hooks';
import { rewardForFeedItem, type SuperteamFeedItem } from '../lib/superteam/api';
import { findByTwitter } from '../lib/colosseum/winners';
import { useGithubStats } from '../lib/github/hooks';
import type { GithubRepo } from '../lib/github/api';
import type { BuilderProfile } from '../types/profile';
import { VouchModal } from '../components/VouchModal';
import { PublishScorePanel } from '../components/PublishScorePanel';
import { SasPanel } from '../components/SasPanel';
import { IssuerPanel } from '../components/IssuerPanel';
import { IntroModal } from '../components/IntroModal';
import { X402Inbox } from '../components/X402Inbox';
import { WorldIdPanel } from '../components/WorldIdPanel';
import { MagicBlockPanel } from '../components/MagicBlockPanel';
import { AttestProgramPanel } from '../components/AttestProgramPanel';
import { useIntrosFor } from '../lib/x402/hooks';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAttestationsFor } from '../lib/attestations/hooks';
import type { StoredAttestation } from '../lib/attestations/store';

export function ProfilePage() {
  const { domain = '' } = useParams();
  const { connection } = useConnection();
  const { publicKey: connectedKey } = useWallet();
  const [profile, setProfile] = useState<BuilderProfile | null>(null);
  const [records, setRecords] = useState<ProfileRecords | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [cluster, setCluster] = useState<'devnet' | 'mainnet' | null>(null);
  const [loading, setLoading] = useState(true);
  const [vouchOpen, setVouchOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const seed = findSeedByDomain(domain);
      if (seed) {
        if (!cancelled) setProfile(seed);
      }

      try {
        const resolved = await resolveProfileAcrossClusters(connection, domain);
        if (cancelled) return;
        setOwner(resolved.owner?.toBase58() ?? null);
        setCluster(resolved.cluster);
        if (resolved.records) setRecords(resolved.records);
      } catch {
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [domain, connection]);

  const finalDomain = domain.toLowerCase();
  const display = finalDomain.endsWith('.sol') ? finalDomain : `${finalDomain}.sol`;
  const githubHandle = profile?.github ?? records?.github;
  const { data: githubStats, loading: githubLoading } = useGithubStats(githubHandle);
  const { data: superteamActivity, loading: superteamLoading } = useUserActivity(profile?.superteamUsername);
  const liveAttestations = useAttestationsFor(display);
  const introsReceived = useIntrosFor(display);

  const dynamicScore = useMemo(() => {
    if (!profile) return null;
    const seed = profile.scoreBreakdown;
    const liveBoost = Math.min(15, liveAttestations.length * 5);
    const newAttestations = Math.min(15, seed.attestations + liveBoost);
    const newTotal = Math.min(100, seed.colosseum + seed.superteam + seed.onchain + seed.github + newAttestations + seed.credentials);
    return { breakdown: { ...seed, attestations: newAttestations }, total: newTotal };
  }, [profile, liveAttestations.length]);

  const colosseumMatches = useMemo(() => {
    if (!profile?.twitter) return [];
    return findByTwitter(profile.twitter);
  }, [profile?.twitter]);

  if (loading && !profile) {
    return (
      <div className="max-w-[1128px] mx-auto px-4 py-8 text-center">
        <div className="card p-12">
          <div className="text-text-2 text-[15px]">Resolving {display}</div>
        </div>
      </div>
    );
  }

  if (!profile && !owner) {
    return (
      <div className="max-w-[1128px] mx-auto px-4 py-8">
        <div className="card p-10">
          <div className="flex items-start gap-4 mb-6">
            <Avatar domain={display} size={72} />
            <div className="flex-1 min-w-0">
              <h1 className="text-[24px] font-bold text-text leading-tight">{display}</h1>
              <p className="text-text-2 mt-1 text-[14px] font-medium">Not registered on Solana devnet or mainnet.</p>
            </div>
          </div>
          <div className="border-t border-border pt-5 space-y-3">
            <p className="text-text text-[14px] leading-relaxed">
              This .sol has not been claimed yet. If you own it, register it on{' '}
              <a href={`https://www.sns.id/search?search=${display.replace('.sol', '')}`} target="_blank" rel="noreferrer" className="text-accent font-semibold hover:underline">sns.id</a>{' '}
              and Skilld will pick it up automatically.
            </p>
            <p className="text-text-2 text-[13px] leading-relaxed">
              Skilld resolves any .sol against devnet first, then mainnet. Builder Scores work the same on both clusters once you publish the score record.
            </p>
          </div>
          <div className="border-t border-border mt-5 pt-5 flex flex-wrap gap-3">
            <Link to="/" className="text-accent font-semibold hover:underline text-[14px]">Back home</Link>
            <Link to="/framew0rk.sol" className="text-text-2 hover:text-accent text-[14px]">See an example profile</Link>
            <Link to="/search" className="text-text-2 hover:text-accent text-[14px]">Search live builders</Link>
          </div>
        </div>
      </div>
    );
  }

  const twitter = profile?.twitter ?? records?.twitter;
  const bio = profile?.bio;
  const score = dynamicScore?.total ?? profile?.builderScore ?? 0;
  const breakdown = dynamicScore?.breakdown ?? profile?.scoreBreakdown ?? {
    colosseum: 0, superteam: 0, onchain: 0, github: 0, attestations: 0, credentials: 0,
  };

  const headline = profile?.skills?.slice(0, 3).map((s) => s.name).join(' · ') || 'Builder on Solana';
  const statusLabel = profile?.status === 'open-to-work' ? 'Open to work'
    : profile?.status === 'building' ? 'Building'
    : profile?.status === 'hiring' ? 'Hiring' : '';

  const liveBounties = superteamActivity.filter((x) => rewardForFeedItem(x) > 0);
  const allHackathons = [
    ...(profile?.hackathons ?? []),
    ...colosseumMatches.map((w) => ({
      name: w.hackathon, edition: w.edition, year: w.year, project: w.project,
      placement: w.placement, category: w.category, verified: true,
    })),
  ];

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
      <VouchModal open={vouchOpen} toDomain={display} onClose={() => setVouchOpen(false)} />
      <IntroModal open={introOpen} toDomain={display} onClose={() => setIntroOpen(false)} />
      <main className="lg:col-span-8 space-y-2">
        <ProfileHeader display={display} owner={owner} cluster={cluster} headline={headline} bio={bio} statusLabel={statusLabel} twitter={twitter} github={githubHandle} skills={profile?.skills} score={score} attestationCount={liveAttestations.length} onVouch={() => setVouchOpen(true)} onIntro={() => setIntroOpen(true)} />
        <ProfileCompletion score={score} hasGithub={!!githubHandle} hasSuperteam={!!profile?.superteamUsername} hasHackathons={allHackathons.length > 0} hasAttestations={liveAttestations.length > 0 || (profile?.attestations?.length ?? 0) > 0} />
        <PublishScorePanel display={display} ownerBase58={owner} score={score} breakdown={breakdown} attestationCount={liveAttestations.length} />
        <SasPanel display={display} ownerBase58={owner} />
        <IssuerPanel display={display} ownerBase58={owner} score={score} breakdown={breakdown} />
        <X402Inbox display={display} intros={introsReceived} isOwner={!!(connectedKey && owner && connectedKey.toBase58() === owner)} />
        <AttestProgramPanel display={display} ownerBase58={owner} />
        <MagicBlockPanel display={display} ownerBase58={owner} isOwner={!!(connectedKey && owner && connectedKey.toBase58() === owner)} />
        <WorldIdPanel display={display} isOwner={!!(connectedKey && owner && connectedKey.toBase58() === owner)} />
        <Analytics score={score} breakdown={breakdown} githubStats={githubStats} colosseumCount={allHackathons.length} bountiesCount={liveBounties.length} />
        <ScoreCard breakdown={breakdown} />
        <AboutSection display={display} bio={bio} headline={headline} />
        <FeaturedSection profile={profile} githubRepos={githubStats?.solanaRepos ?? githubStats?.repos} />

        {allHackathons.length > 0 && (
          <SectionCard title="Experience">
            <ul className="space-y-0">
              {allHackathons.map((h, i) => (
                <ExperienceItem key={i} h={h as ExperienceHackathon} isLast={i === allHackathons.length - 1} skills={profile?.skills?.slice(0, 4).map((s) => s.name)} />
              ))}
            </ul>
            <button className="mt-2 w-full text-center text-text-2 text-[14px] font-semibold py-2 hover:bg-surface-2 transition rounded">
              Show all {allHackathons.length} experiences →
            </button>
          </SectionCard>
        )}

        {profile?.programsDeployed?.length ? (
          <SectionCard title="Programs deployed">
            <ul className="space-y-2">
              {profile.programsDeployed.map((p) => (
                <li key={p} className="bg-surface-3 rounded px-3 py-2.5 border border-border font-mono text-[13px] text-text-2 truncate">
                  {p}
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {githubHandle && (
          <SectionCard title="GitHub" subtitle={`Pulled live from api.github.com/${githubHandle}`}>
            {githubLoading ? (
              <div className="text-text-2 text-[14px] py-2">Loading commits and repos...</div>
            ) : !githubStats ? (
              <div className="text-text-2 text-[14px] py-2">Could not load GitHub stats. The user may not exist or GitHub rate limit was hit.</div>
            ) : (
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <Avatar domain={`gh:${githubStats.user.login}`} size={56} className="rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a href={githubStats.user.html_url} target="_blank" rel="noreferrer" className="text-text font-semibold text-[16px] hover:text-accent hover:underline truncate block">
                      {githubStats.user.name ?? githubStats.user.login}
                    </a>
                    <div className="text-text-2 text-[14px]">@{githubStats.user.login}</div>
                    {githubStats.user.bio && <div className="text-text-2 text-[13px] mt-0.5 line-clamp-1">{githubStats.user.bio}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 py-4 border-b border-border">
                  <Stat label="Public repos" value={githubStats.user.public_repos} />
                  <Stat label="Followers" value={githubStats.user.followers} />
                  <Stat label="Solana repos" value={githubStats.solanaRepos.length} />
                  <Stat label="Total stars" value={githubStats.totalStars} />
                </div>
                {githubStats.topLanguages.length > 0 && (
                  <div className="pt-4 pb-2">
                    <div className="text-[13px] text-text-2 font-semibold mb-2">Top languages</div>
                    <div className="flex flex-wrap gap-2">
                      {githubStats.topLanguages.map((l) => (
                        <span key={l.language} className="text-[12px] px-2.5 py-1 bg-accent-soft text-accent rounded font-semibold">
                          {l.language} <span className="text-text-3 font-medium">· {l.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {githubStats.repos.length > 0 && (
                  <ul className="divide-y divide-border mt-2">
                    {githubStats.repos.slice(0, 5).map((r) => <RepoRow key={r.id} repo={r} />)}
                  </ul>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {profile?.superteamUsername ? (
          <SectionCard title="Superteam Earn activity" subtitle="Real time from superteam.fun/api">
            {superteamLoading ? (
              <div className="text-text-2 text-[14px] py-2">Loading from Superteam Earn...</div>
            ) : liveBounties.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-text-2 text-[15px]">
                  No recent activity for <span className="font-semibold">@{profile.superteamUsername}</span>.
                </p>
                <p className="text-text-3 text-[13px] mt-1 font-medium">
                  Showing the last 200 events. Older history is not exposed by the public API.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {liveBounties.map((b) => (
                  <SuperteamRow key={`${b.listingId}-${b.userId}-${b.createdAt}`} item={b} />
                ))}
              </ul>
            )}
          </SectionCard>
        ) : null}

        <SkillsSection skills={profile?.skills} />
        <RecommendationsSection profile={profile} liveAttestations={liveAttestations} onVouch={() => setVouchOpen(true)} />
        <CertificationsSection />
      </main>

      <aside className="lg:col-span-4 space-y-2">
        <div className="lg:sticky lg:top-[60px] space-y-2">
          <div className="card p-5 flex flex-col items-center">
            <ScoreRing score={score} />
            <button className="mt-5 text-[14px] text-accent border border-accent rounded-full w-full py-1.5 font-semibold hover:bg-accent-soft transition">
              How is the score computed?
            </button>
          </div>

          <ProfileLanguage display={display} />
        </div>
      </aside>
    </div>
  );
}

function ProfileHeader({
  display, owner, cluster, headline, bio, statusLabel, twitter, github, score, attestationCount, onVouch, onIntro,
}: {
  display: string; owner: string | null; cluster: 'devnet' | 'mainnet' | null; headline: string; bio?: string; statusLabel: string;
  twitter?: string; github?: string; skills?: BuilderProfile['skills']; score: number;
  attestationCount: number; onVouch: () => void; onIntro: () => void;
}) {
  const isOpenToWork = statusLabel === 'Open to work';
  return (
    <div className="card overflow-hidden">
      <div className="h-[260px] relative bg-text text-bg overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="serif-italic text-[16px] text-bg/65">— resolves to</div>
            <div className="mt-1 text-[28px] lg:text-[40px] font-bold mono leading-none tracking-tight truncate">{display}</div>
            {cluster && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] mono tracking-[0.18em] uppercase text-bg/70 border border-bg/25 px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-success-bright" />
                resolved on {cluster}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] mono tracking-[0.22em] uppercase text-bg/65">Score</div>
            {score > 0 ? (
              <div className="text-[40px] lg:text-[56px] font-bold tabular-nums leading-none tracking-tight text-success-bright">{score}</div>
            ) : (
              <div className="text-[14px] font-semibold leading-tight text-bg/85 max-w-[180px] text-right mt-1">Not published yet</div>
            )}
          </div>
        </div>
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full border border-bg/30 flex items-center justify-center text-bg/85 hover:bg-bg/10 transition" aria-label="Edit cover">
          <CameraIcon />
        </button>
      </div>
      <div className="px-6 pb-5 -mt-[80px] relative">
        <div className="flex items-end justify-between gap-4">
          <div className={`relative rounded-full ${isOpenToWork ? 'p-1 bg-gradient-to-br from-success-bright via-accent to-success' : ''}`}>
            <div className="rounded-full border-[4px] border-surface overflow-hidden shadow-xl" style={{ width: 152, height: 152 }}>
              <Avatar domain={display} size={144} />
            </div>
            {score >= 50 && (
              <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-success border-[3px] border-surface flex items-center justify-center text-white shadow glow-success">
                <CheckIcon />
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[26px] font-bold text-text leading-tight">{display}</h1>
            <VerifiedBadge />
            {statusLabel && (
              <span className="text-[12px] px-2 py-0.5 bg-success-soft text-success rounded font-semibold">
                {statusLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-text text-[16px] font-medium leading-snug">{headline}</p>
          {bio && <p className="mt-1.5 text-text-2 text-[14px] leading-relaxed">{bio}</p>}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-text-2">
            <LocationIcon />
            <span>Solana ·</span>
            <a className="text-accent font-semibold hover:underline cursor-pointer">Contact info</a>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap text-[14px]">
            <span className="text-accent font-semibold">{attestationCount.toLocaleString()} attestation{attestationCount === 1 ? '' : 's'}</span>
          </div>

          {(owner || twitter || github) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
              {owner && (
                <span className="font-mono text-text-3">
                  {owner.slice(0, 4)}...{owner.slice(-4)}
                </span>
              )}
              {twitter && (
                <a href={`https://x.com/${twitter}`} target="_blank" rel="noreferrer" className="text-accent font-semibold hover:underline">
                  @{twitter}
                </a>
              )}
              {github && (
                <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" className="text-accent font-semibold hover:underline">
                  github/{github}
                </a>
              )}
            </div>
          )}


          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onVouch} className="bg-accent text-white px-5 py-2 rounded-full text-[15px] font-semibold hover:bg-accent-hover transition shadow">
              + Vouch
            </button>
            <button onClick={onIntro} className="border border-accent text-accent px-5 py-2 rounded-full text-[15px] font-semibold hover:bg-accent-soft transition bg-surface flex items-center gap-1.5">
              Message
              <span className="text-[10px] px-1.5 py-0.5 bg-accent-soft text-accent rounded font-bold">$1 · x402</span>
            </button>
            <button className="border border-border-strong text-text px-5 py-2 rounded-full text-[15px] font-semibold hover:bg-surface-2 transition bg-surface flex items-center gap-1">
              More
              <ChevronDown />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

type ExperienceHackathon = {
  name: string; edition: string; year: number; project?: string;
  placement: string; category?: string; verified?: boolean;
};

function ExperienceItem({ h, isLast, skills }: { h: ExperienceHackathon; isLast: boolean; skills?: string[] }) {
  const dateRange = `${h.year} · ${monthsAgo(h.year)} mos`;
  const description = h.placement === 'grand'
    ? `Took home the Grand Champion award at Colosseum ${h.name} ${h.edition}. Built ${h.project ?? 'the project'} solo and shipped to mainnet. Recognized in Solana Foundation's hackathon spotlight.`
    : `Submitted ${h.project ?? 'a project'} to Colosseum ${h.name} ${h.edition}. ${h.category ? `Competed in the ${h.category} track.` : ''} Iterated on user feedback during the 5 week sprint.`;

  return (
    <li className={`flex gap-4 py-4 ${isLast ? 'pb-0' : 'border-b border-border'}`}>
      <ColosseumLogo size={56} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-text font-semibold text-[16px] leading-tight">
              {h.project ?? `${h.name} ${h.edition} Submitter`}
            </div>
            <div className="text-text-2 text-[14px] mt-0.5">
              <span className="font-medium">Colosseum</span>, {h.placement === 'grand' ? 'Grand Champion' : h.category ?? 'Competitor'}
            </div>
            <div className="text-text-3 text-[13px] mt-0.5 font-medium">{dateRange}</div>
            <div className="text-text-3 text-[13px] mt-0.5 font-medium flex items-center gap-1">
              <LocationIcon />
              <span>{h.name} {h.edition}, Online, Hackathon</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <PlacementBadge placement={h.placement} />
            {h.verified && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-success-soft text-success font-semibold">Verified</span>
            )}
          </div>
        </div>
        <p className="mt-2 text-text text-[14px] leading-relaxed">
          {description}
        </p>
        {skills && skills.length > 0 && (
          <div className="mt-3 flex items-center flex-wrap gap-1.5">
            <ToolIcon />
            <span className="text-text-2 text-[13px] font-semibold">Skills:</span>
            {skills.map((s, i) => (
              <span key={s} className="text-[13px] text-text font-semibold">
                {s}{i < skills.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function monthsAgo(year: number): number {
  return Math.max(1, (2026 - year) * 12);
}

function ToolIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-2">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
    </svg>
  );
}

function ProfileCompletion({
  score, hasGithub, hasSuperteam, hasHackathons, hasAttestations,
}: { score: number; hasGithub: boolean; hasSuperteam: boolean; hasHackathons: boolean; hasAttestations: boolean }) {
  const checks = [
    { label: 'Linked GitHub', done: hasGithub, points: 15 },
    { label: 'Linked Superteam Earn', done: hasSuperteam, points: 20 },
    { label: 'Verified Colosseum hackathon', done: hasHackathons, points: 25 },
    { label: 'Received first attestation', done: hasAttestations, points: 15 },
    { label: 'Builder Score above 50', done: score >= 50, points: 10 },
  ];
  const completed = checks.filter((c) => c.done).length;
  const pct = (completed / checks.length) * 100;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          <svg width="56" height="56" className="rotate-[-90deg]">
            <circle cx="28" cy="28" r="24" stroke="#e0dfdc" strokeWidth="4" fill="none" />
            <circle cx="28" cy="28" r="24" stroke="#057642" strokeWidth="4" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 - (pct / 100) * 2 * Math.PI * 24} strokeLinecap="round" fill="none" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] font-bold text-text tabular-nums">{Math.round(pct)}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-semibold text-text">Strengthen your profile</div>
          <div className="text-[13px] text-text-2 mt-0.5 font-medium">
            {completed} of {checks.length} steps complete
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        {checks.map((c) => (
          <div key={c.label} className="px-5 py-2.5 flex items-center gap-3 hover:bg-surface-2 cursor-pointer transition">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.done ? 'bg-success text-white' : 'border-2 border-border-strong'}`}>
              {c.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              )}
            </div>
            <span className={`flex-1 text-[14px] ${c.done ? 'text-text-2 line-through' : 'text-text font-medium'}`}>{c.label}</span>
            <span className="text-[12px] text-text-3 font-semibold">+{c.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function _UnusedActivityCard({ display, feedItems }: { display: string; feedItems: SuperteamFeedItem[] }) {
  const [tab, setTab] = useState<'posts' | 'comments' | 'reactions' | 'images'>('posts');
  const handle = display.replace('.sol', '');

  return (
    <div className="card">
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-text">Activity</h2>
          </div>
          <div className="flex gap-2">
            <button className="border border-accent text-accent px-3.5 py-1.5 rounded-full text-[13px] font-semibold hover:bg-accent-soft transition">Create a post</button>
            <button className="text-text-2 hover:bg-surface-2 p-1 rounded transition" aria-label="Edit"><PencilIcon /></button>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <ChipTab active={tab === 'posts'} onClick={() => setTab('posts')}>Posts</ChipTab>
          <ChipTab active={tab === 'comments'} onClick={() => setTab('comments')}>Comments</ChipTab>
          <ChipTab active={tab === 'reactions'} onClick={() => setTab('reactions')}>Reactions</ChipTab>
          <ChipTab active={tab === 'images'} onClick={() => setTab('images')}>Images</ChipTab>
        </div>
      </div>
      <div className="border-t border-border">
        {feedItems.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-text-2 text-[14px]">No {tab} yet from @{handle}.</p>
          </div>
        ) : (
          feedItems.slice(0, 2).map((item) => (
            <ActivityRow key={`${item.listingId}-${item.userId}`} item={item} display={display} />
          ))
        )}
      </div>
      <button className="w-full text-center text-text-2 text-[14px] font-semibold py-3 border-t border-border hover:bg-surface-2 transition">
        Show all activity →
      </button>
    </div>
  );
}

function ChipTab({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[13px] font-semibold transition ${
        active ? 'bg-text text-surface' : 'border border-border-strong text-text-2 hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  );
}

function ActivityRow({ item, display }: { item: SuperteamFeedItem; display: string }) {
  const reward = rewardForFeedItem(item);
  const isWinner = item.isWinner === true;
  return (
    <div className="px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface-2 transition">
      <div className="text-[12px] text-text-3 font-medium mb-2">
        <span className="font-semibold text-text">{display}</span> {isWinner ? 'won' : 'submitted'} this · {timeAgoShort(item.createdAt)}
      </div>
      <div className="flex items-center gap-3">
        {item.sponsorLogo ? (
          <img src={item.sponsorLogo} alt={item.sponsorName} className="w-12 h-12 rounded object-cover bg-surface-3 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded bg-surface-3 border border-border shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-text font-semibold text-[15px] leading-snug truncate">{item.listingTitle}</div>
          <div className="text-text-2 text-[13px] mt-0.5 font-medium">{item.sponsorName} · {item.listingType}</div>
        </div>
        {reward > 0 && (
          <div className="text-success font-mono text-[14px] tabular-nums font-bold shrink-0">
            +{reward.toLocaleString()} {item.token}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 mt-3 text-text-2 text-[13px] font-medium">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 bg-accent rounded-full inline-flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z" /></svg>
          </span>
          0 reactions
        </span>
        <span className="ml-auto">0 comments</span>
      </div>
    </div>
  );
}

function timeAgoShort(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0-6.4 0" />
      <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
    </svg>
  );
}

function Analytics({
  score, githubStats, colosseumCount, bountiesCount,
}: {
  score: number; breakdown: BuilderProfile['scoreBreakdown'];
  githubStats: ReturnType<typeof useGithubStats>['data']; colosseumCount: number; bountiesCount: number;
}) {
  return (
    <div className="card p-0">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[20px] font-semibold text-text leading-tight">Onchain signals</h2>
        <div className="text-text-3 text-[13px] mt-1 font-medium flex items-center gap-1">
          <ChartBarSmall />
          <span>Verifiable, indexed live from Solana mainnet</span>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-border">
        <AnalyticsItem
          icon={<BarChartIcon />}
          value={score}
          label="builder score"
          sub="Composed from 6 weighted sources"
        />
        <AnalyticsItem
          icon={<HackathonIcon />}
          value={colosseumCount}
          label="Colosseum entries"
          sub="From the Hall of Fame index"
          divider
        />
        <AnalyticsItem
          icon={<BountyMini />}
          value={bountiesCount}
          label="Superteam wins"
          sub="Pulled live from superteam.fun"
          divider
        />
      </div>
      {githubStats && (
        <div className="grid grid-cols-3 border-t border-border">
          <AnalyticsItem
            icon={<GitMini />}
            value={githubStats.user.public_repos}
            label="GitHub repos"
            sub={`@${githubStats.user.login}`}
          />
          <AnalyticsItem
            icon={<StarMini />}
            value={githubStats.solanaRepos.length}
            label="Solana repos"
            sub="Detected by org and topic"
            divider
          />
          <AnalyticsItem
            icon={<StarFilledMini />}
            value={githubStats.totalStars}
            label="total stars"
            sub="Across all public repos"
            divider
          />
        </div>
      )}
    </div>
  );
}

function HackathonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function BountyMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.42 0 2.13.54 2.39 1.4.12.4.45.7.87.7h.3c.66 0 1.13-.65.9-1.27-.42-1.18-1.4-2.16-2.96-2.54V4.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.66c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-1.65 0-2.5-.59-2.83-1.43-.15-.39-.49-.67-.9-.67h-.28c-.67 0-1.14.68-.89 1.3.57 1.39 1.9 2.21 3.4 2.53v.67c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-.65c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  );
}

function GitMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.69-.22.69-.48 0-.24-.01-.86-.01-1.69-2.78.6-3.37-1.34-3.37-1.34-.45-1.14-1.11-1.45-1.11-1.45-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.34.85.01 1.7.12 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
    </svg>
  );
}

function StarMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15 8.5 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 9 8.5 12 2" />
    </svg>
  );
}

function StarFilledMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function AnalyticsItem({
  icon, value, label, sub, divider,
}: { icon: React.ReactNode; value: number; label: string; sub: string; divider?: boolean }) {
  return (
    <div className={`px-5 py-4 hover:bg-surface-2 transition cursor-pointer ${divider ? 'border-l border-border' : ''}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-text-2 mt-0.5 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-text font-semibold text-[14px] leading-tight">
            <span className="tabular-nums">{value.toLocaleString()}</span> {label}
          </div>
          <div className="text-text-2 text-[12px] mt-1 font-medium leading-snug">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ breakdown }: { breakdown: BuilderProfile['scoreBreakdown'] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[20px] font-semibold text-text">Builder Score</h2>
        <button className="text-text-2 hover:bg-surface-2 p-1 rounded transition" aria-label="Edit"><PencilIcon /></button>
      </div>
      <div className="text-text-3 text-[13px] font-medium mb-4">Composed from verifiable on chain and off chain events</div>
      <ScoreBreakdown breakdown={breakdown} />
      <button className="mt-4 text-[14px] text-accent font-semibold hover:underline">
        How is the score computed?
      </button>
    </div>
  );
}

export function _UnusedLockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}

function ChartBarSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
    </svg>
  );
}

export function _UnusedEyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
    </svg>
  );
}

export function _UnusedSearchSmallIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function AboutSection({ display, bio, headline }: { display: string; bio?: string; headline: string }) {
  const fallback = `${display} is a Solana builder. ${headline}. Builder Score is computed from verifiable on chain and off chain events. Attested by peers, indexed from Colosseum hackathons, Superteam Earn bounties, mainnet program deploys, and GitHub contributions to Solana repositories.`;
  return (
    <SectionCard title="About">
      <p className="text-text text-[15px] leading-relaxed whitespace-pre-line">
        {bio ?? fallback}
      </p>
      <a className="mt-2 inline-block text-accent text-[14px] font-semibold hover:underline cursor-pointer">
        ...see more
      </a>
    </SectionCard>
  );
}

function FeaturedSection({ profile, githubRepos }: { profile: BuilderProfile | null; githubRepos?: GithubRepo[] }) {
  const repos = githubRepos?.slice(0, 2) ?? [];
  const showHack = profile?.hackathons?.[0];
  if (repos.length === 0 && !showHack) return null;

  return (
    <SectionCard title="Featured">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {showHack && (
          <FeatureCard
            tag="Hackathon"
            title={showHack.project ?? `${showHack.name} ${showHack.edition}`}
            description={`Submission to Colosseum ${showHack.name} ${showHack.edition}. ${showHack.category ?? ''}`}
            footer={`Skilld · @${profile?.domain.replace('.sol', '')}`}
          />
        )}
        {repos.map((r) => (
          <FeatureCard
            key={r.id}
            tag={r.language ?? 'Repo'}
            title={r.name}
            description={r.description ?? ''}
            footer={`★ ${r.stargazers_count} · github.com/${r.full_name}`}
            url={r.html_url}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function FeatureCard({ tag, title, description, footer, url }: { tag: string; title: string; description: string; footer: string; url?: string }) {
  const Wrapper: React.ElementType = url ? 'a' : 'div';
  const props = url ? { href: url, target: '_blank', rel: 'noreferrer' } : {};
  return (
    <Wrapper
      {...props}
      className="border border-border rounded-lg p-4 hover:bg-surface-2 transition cursor-pointer flex flex-col"
    >
      <div className="text-[12px] text-text-3 font-medium uppercase tracking-wider mb-2">{tag}</div>
      <div className="text-text font-semibold text-[16px] leading-snug">{title}</div>
      {description && <div className="text-text-2 text-[14px] mt-1 line-clamp-3">{description}</div>}
      <div className="text-text-3 text-[12px] mt-auto pt-3 font-medium border-t border-border">{footer}</div>
    </Wrapper>
  );
}

function SkillsSection({ skills }: { skills?: BuilderProfile['skills'] }) {
  if (!skills?.length) return null;
  return (
    <SectionCard title="Skills">
      <ul className="divide-y divide-border">
        {skills.map((s, i) => {
          const isPro = s.score >= 80;
          return (
            <li key={s.name} className={`py-4 ${i === 0 ? 'pt-0' : ''} ${i === skills.length - 1 ? 'pb-0' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text font-semibold text-[16px]">{s.name}</span>
                    {isPro && (
                      <span className="text-[10px] bg-warning-soft text-warning rounded font-semibold px-1.5 py-0.5">PRO</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-text-2 text-[13px] font-medium">
                      Inferred from {s.sources.join(' and ')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-[12px]">
                    {s.sources.map((src) => (
                      <span key={src} className="flex items-center gap-1 text-text-2 font-medium">
                        <span className="w-3.5 h-3.5 rounded-sm bg-text-3 inline-flex" />
                        Verified through {src}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0 pt-0.5">
                  <div className="text-[18px] font-bold text-text tabular-nums leading-none">{s.score}</div>
                  <div className="text-[10px] text-text-2 font-semibold mt-0.5">/100</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 pt-3 border-t border-border text-center">
        <button className="text-text-2 text-[14px] font-semibold hover:bg-surface-2 px-3 py-2 rounded transition flex items-center gap-1 mx-auto">
          Show all {skills.length} skills
          <ChevronRight />
        </button>
      </div>
    </SectionCard>
  );
}

function RecommendationsSection({
  profile, liveAttestations, onVouch,
}: { profile: BuilderProfile | null; liveAttestations: StoredAttestation[]; onVouch: () => void }) {
  const seedItems = profile?.attestations ?? [];
  const [tab, setTab] = useState<'received' | 'given'>('received');

  const merged: Array<{ fromDomain: string; fromScore: number; context: string; signedAt?: string; signature?: string; skill?: string; verified: boolean; isPrivate?: boolean }> = [
    ...liveAttestations.map((a) => ({
      fromDomain: a.fromDomain,
      fromScore: a.fromScore,
      context: a.private ? 'Sealed via MagicBlock Private Ephemeral Rollup. Content is encrypted, only the count contributes to the score.' : a.context,
      signedAt: a.signedAt,
      signature: a.signature,
      skill: a.skill,
      verified: true,
      isPrivate: a.private,
    })),
    ...seedItems.map((a) => ({
      fromDomain: a.fromDomain,
      fromScore: a.fromScore,
      context: a.context,
      signedAt: a.signedAt,
      verified: false,
    })),
  ];

  return (
    <SectionCard title="Recommendations">
      <div className="border-b border-border -mx-5 px-5 mb-4">
        <div className="flex gap-6">
          <TabButton active={tab === 'received'} onClick={() => setTab('received')}>
            Received {tab === 'received' && merged.length > 0 ? `· ${merged.length}` : ''}
          </TabButton>
          <TabButton active={tab === 'given'} onClick={() => setTab('given')}>Given</TabButton>
        </div>
      </div>
      {tab === 'received' && merged.length > 0 ? (
        <ul className="divide-y divide-border">
          {merged.map((a, i) => (
            <li key={i} className="py-4 first:pt-0 last:pb-0">
              <div className="flex gap-3">
                <Avatar domain={a.fromDomain} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text font-semibold text-[15px]">{a.fromDomain}</span>
                    {a.verified && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-success-soft text-success font-semibold">Wallet signed</span>
                    )}
                    {a.isPrivate && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-warning-soft text-warning font-semibold flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                        Private · MagicBlock
                      </span>
                    )}
                    {a.skill && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-accent-soft text-accent font-semibold">{a.skill}</span>
                    )}
                  </div>
                  <div className="text-text-2 text-[13px] mt-0.5 font-medium">
                    Score {a.fromScore} · 1st degree attestation
                    {a.signedAt && <> · {new Date(a.signedAt).toLocaleDateString()}</>}
                  </div>
                  <p className="text-text text-[14px] mt-2 leading-relaxed italic">"{a.context}"</p>
                  {a.signature && (
                    <div className="text-text-3 text-[11px] mt-2 font-mono break-all">
                      sig: {a.signature.slice(0, 16)}...{a.signature.slice(-8)}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <p className="text-text-2 text-[15px]">
            {tab === 'received' ? 'No attestations received yet.' : 'No attestations given yet.'}
          </p>
          {tab === 'received' && (
            <button onClick={onVouch} className="mt-3 bg-accent text-white px-4 py-1.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition">
              + Add the first vouch
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function CertificationsSection() {
  return (
    <SectionCard title="Licenses & certifications">
      <ul className="divide-y divide-border">
        <li className="py-3 first:pt-0 last:pb-0 flex gap-3">
          <SasLogo size={48} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-text font-semibold text-[15px]">Solana Attestation Service issuer</div>
            <div className="text-text-2 text-[13px] mt-0.5 font-medium">Solana Foundation, Issued May 2025</div>
            <div className="text-text-3 text-[12px] mt-0.5 font-medium">Credential ID: sas-skilld-issuer-001</div>
          </div>
        </li>
        <li className="py-3 first:pt-0 last:pb-0 flex gap-3">
          <SnsLogo size={48} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-text font-semibold text-[15px]">SNS Records V2 verified writer</div>
            <div className="text-text-2 text-[13px] mt-0.5 font-medium">Bonfida, Issued April 2026</div>
          </div>
        </li>
      </ul>
    </SectionCard>
  );
}

export function _UnusedLanguagesSection() {
  return (
    <SectionCard title="Languages">
      <ul className="divide-y divide-border">
        <li className="py-3 first:pt-0 last:pb-0">
          <div className="text-text font-semibold text-[15px]">English</div>
          <div className="text-text-2 text-[13px] mt-0.5 font-medium">Native or bilingual</div>
        </li>
        <li className="py-3 first:pt-0 last:pb-0">
          <div className="text-text font-semibold text-[15px]">French</div>
          <div className="text-text-2 text-[13px] mt-0.5 font-medium">Native or bilingual</div>
        </li>
      </ul>
    </SectionCard>
  );
}

export function _UnusedInterestsSection() {
  return (
    <SectionCard title="Interests">
      <div className="border-b border-border -mx-5 px-5 mb-4">
        <div className="flex gap-6">
          <TabButton active>Top voices</TabButton>
          <TabButton>Companies</TabButton>
          <TabButton>Groups</TabButton>
          <TabButton>Newsletters</TabButton>
          <TabButton>Schools</TabButton>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InterestCard name="Anatoly Yakovenko" sub="Cofounder Solana Labs" followers="284,310 followers" />
        <InterestCard name="Akshay BD" sub="Founder Superteam" followers="92,400 followers" />
        <InterestCard name="Matty Tay" sub="Cofounder Colosseum" followers="48,210 followers" />
        <InterestCard name="Lily Liu" sub="President Solana Foundation" followers="61,840 followers" />
      </div>
    </SectionCard>
  );
}

function InterestCard({ name, sub, followers }: { name: string; sub: string; followers: string }) {
  return (
    <div className="flex gap-3 p-3 hover:bg-surface-2 rounded transition cursor-pointer">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold shrink-0">{name.slice(0, 1)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-text font-semibold text-[14px]">{name}</div>
        <div className="text-text-2 text-[13px] mt-0.5 font-medium">{sub}</div>
        <div className="text-text-3 text-[12px] mt-1 font-medium">{followers}</div>
        <button className="mt-2 text-accent border border-accent rounded-full px-3 py-0.5 text-[12px] font-semibold hover:bg-accent-soft transition">+ Follow</button>
      </div>
    </div>
  );
}

export function _UnusedAdSlot() {
  return (
    <div className="card p-4">
      <div className="text-[12px] text-text-3 font-medium">Promoted</div>
      <div className="mt-2 text-[14px] text-text font-semibold leading-snug">
        Get featured in this week's Skilld leaderboard with one verified attestation.
      </div>
      <div className="mt-3 h-32 bg-gradient-to-br from-accent to-success rounded" />
      <button className="mt-3 w-full bg-accent text-white px-4 py-1.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition">
        Try Skilld Pro
      </button>
    </div>
  );
}

function ProfileLanguage({ display }: { display: string }) {
  const slug = display.replace('.sol', '');
  return (
    <div className="card p-4">
      <h3 className="text-[14px] font-semibold text-text">Profile language</h3>
      <p className="text-text-2 text-[13px] mt-0.5 font-medium">English</p>
      <h3 className="text-[14px] font-semibold text-text mt-3">Public profile & URL</h3>
      <p className="text-text-2 text-[13px] mt-0.5 font-medium break-all">skilld.app/{slug}.sol</p>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-[20px] font-semibold text-text">{title}</h2>
        <button className="text-text-2 hover:bg-surface-2 p-1 rounded transition" aria-label="Edit">
          <PencilIcon />
        </button>
      </div>
      {subtitle && <div className="text-text-3 text-[13px] font-medium mb-3">{subtitle}</div>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[24px] font-bold text-text tabular-nums leading-none">{value.toLocaleString()}</div>
      <div className="text-[12px] text-text-2 mt-1 font-medium">{label}</div>
    </div>
  );
}

function RepoRow({ repo }: { repo: GithubRepo }) {
  return (
    <li className="py-3 first:pt-0 last:pb-0 flex gap-3 items-start">
      <div className="w-10 h-10 rounded bg-surface-3 border border-border flex items-center justify-center font-bold text-text-2 text-[18px] shrink-0">
        {repo.fork ? '🍴' : '★'}
      </div>
      <div className="flex-1 min-w-0">
        <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-accent font-semibold text-[14px] hover:underline truncate block">
          {repo.full_name}
        </a>
        {repo.description && <div className="text-text-2 text-[13px] mt-0.5 line-clamp-2">{repo.description}</div>}
        <div className="text-text-3 text-[12px] mt-1 font-medium flex items-center gap-3">
          {repo.language && <span>{repo.language}</span>}
          <span>★ {repo.stargazers_count}</span>
          <span>↳ {repo.forks_count}</span>
        </div>
      </div>
    </li>
  );
}

function SuperteamRow({ item }: { item: SuperteamFeedItem }) {
  const reward = rewardForFeedItem(item);
  const isWinner = item.isWinner === true;
  const tag = item.type === 'grant-application'
    ? 'Grant'
    : isWinner
      ? `Won · #${item.winnerPosition}`
      : 'Submission';
  return (
    <li className="py-4 first:pt-0 last:pb-0 flex items-center gap-3">
      {item.sponsorLogo ? (
        <img src={item.sponsorLogo} alt={item.sponsorName} className="w-12 h-12 rounded object-cover shrink-0 bg-surface-3" />
      ) : (
        <div className="w-12 h-12 rounded bg-surface-3 border border-border" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-text font-semibold text-[15px] truncate">{item.listingTitle}</div>
        <div className="text-text-2 text-[13px] mt-0.5 font-medium">
          {item.sponsorName} · <span className={isWinner ? 'text-success font-semibold' : ''}>{tag}</span>
        </div>
      </div>
      {reward > 0 ? (
        <div className="text-success font-mono text-[15px] tabular-nums font-bold shrink-0">
          +{reward.toLocaleString()} {item.token}
        </div>
      ) : null}
    </li>
  );
}

function PlacementBadge({ placement }: { placement: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    grand: { label: 'Grand Champion', cls: 'bg-warning-soft text-warning border border-warning/30' },
    top10: { label: 'Top 10', cls: 'bg-success-soft text-success border border-success/30' },
    top20: { label: 'Top 20', cls: 'bg-success-soft text-success border border-success/30' },
    finalist: { label: 'Finalist', cls: 'bg-surface-3 text-text-2 border border-border' },
    university: { label: 'University Award', cls: 'bg-accent-soft text-accent border border-accent/30' },
    'public-good': { label: 'Public Good', cls: 'bg-accent-soft text-accent border border-accent/30' },
    submission: { label: 'Submitted', cls: 'bg-surface-3 text-text-2 border border-border' },
  };
  const m = map[placement] ?? map.submission;
  return <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${m.cls}`}>{m.label}</span>;
}

function TabButton({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 text-[14px] font-semibold border-b-2 -mb-px ${
        active ? 'border-accent text-accent' : 'border-transparent text-text-2 hover:text-text'
      } transition`}
    >
      {children}
    </button>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center text-accent" title="Verified">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1l3.5 3.5L20 4l-.5 4.5L23 12l-3.5 3.5L20 20l-4.5-.5L12 23l-3.5-3.5L4 20l.5-4.5L1 12l3.5-3.5L4 4l4.5.5z" />
        <path d="M9.5 16L5.5 12l1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4z" fill="white" />
      </svg>
    </span>
  );
}

export function _UnusedMutualStack() {
  return (
    <div className="flex -space-x-2">
      <div className="w-6 h-6 rounded-full bg-accent border-2 border-surface flex items-center justify-center text-white font-bold text-[10px]">A</div>
      <div className="w-6 h-6 rounded-full bg-success border-2 border-surface flex items-center justify-center text-white font-bold text-[10px]">S</div>
      <div className="w-6 h-6 rounded-full bg-warning border-2 border-surface flex items-center justify-center text-white font-bold text-[10px]">M</div>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-3">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

export function _UnusedBriefcaseSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
    </svg>
  );
}

export function _UnusedGraduationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-success">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}
