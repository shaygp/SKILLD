import type { BuilderProfile } from '../../types/profile';
import { computeBuilderScore } from '../score/computeScore';

type SeedRaw = Omit<BuilderProfile, 'builderScore' | 'scoreBreakdown'> & {
  txCount: number;
  commits: number;
  repos: number;
  credentials: string[];
};

const seedRaw: SeedRaw[] = [
  {
    domain: 'framew0rk.sol',
    owner: '11111111111111111111111111111111',
    bio: 'Building Skilld. Frontier 2026 submission.',
    twitter: 'framew0rk',
    github: 'shaygp',
    superteamUsername: 'framew0rk',
    skills: [
      { name: 'Rust', score: 0, sources: ['github'] },
      { name: 'Anchor', score: 0, sources: ['github'] },
      { name: 'React', score: 0, sources: ['github'] },
    ],
    hackathons: [
      { name: 'Frontier', edition: '2026', placement: 'submission', project: 'Skilld', year: 2026 },
    ],
    bounties: [],
    attestations: [],
    programsDeployed: ['4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6'],
    status: 'building',
    txCount: 0,
    commits: 0,
    repos: 0,
    credentials: [],
  },
];

export function getSeedProfiles(): BuilderProfile[] {
  return seedRaw.map((b) => {
    const score = computeBuilderScore({
      hackathons: b.hackathons,
      bounties: b.bounties,
      programs: b.programsDeployed,
      txCount: b.txCount,
      commits: b.commits,
      repos: b.repos,
      attestations: b.attestations,
      credentials: b.credentials,
    });
    const { total, ...breakdown } = score;
    return {
      domain: b.domain,
      owner: b.owner,
      bio: b.bio,
      pic: b.pic,
      twitter: b.twitter,
      github: b.github,
      email: b.email,
      url: b.url,
      superteamUsername: b.superteamUsername,
      skills: b.skills,
      hackathons: b.hackathons,
      bounties: b.bounties,
      attestations: b.attestations,
      programsDeployed: b.programsDeployed,
      status: b.status,
      builderScore: total,
      scoreBreakdown: breakdown,
    };
  });
}

export function findSeedByDomain(domain: string): BuilderProfile | null {
  const norm = domain.toLowerCase().endsWith('.sol') ? domain.toLowerCase() : `${domain.toLowerCase()}.sol`;
  return getSeedProfiles().find((b) => b.domain === norm) ?? null;
}
