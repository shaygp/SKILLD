export type SkillSource = 'colosseum' | 'superteam' | 'github' | 'onchain' | 'attestation';

export type Skill = {
  name: string;
  score: number;
  sources: SkillSource[];
};

export type Hackathon = {
  name: string;
  edition: string;
  placement: 'grand' | 'top10' | 'top20' | 'finalist' | 'university' | 'public-good' | 'submission';
  project?: string;
  category?: string;
  year: number;
};

export type Bounty = {
  sponsor: string;
  title: string;
  amountUsd: number;
  category: string;
  wonAt: string;
  url?: string;
};

export type Attestation = {
  fromDomain: string;
  fromScore: number;
  skill?: string;
  context: string;
  signedAt: string;
  private?: boolean;
};

export type BuilderProfile = {
  domain: string;
  owner: string;
  pic?: string;
  bio?: string;
  twitter?: string;
  github?: string;
  email?: string;
  url?: string;
  superteamUsername?: string;
  builderScore: number;
  scoreBreakdown: {
    colosseum: number;
    superteam: number;
    onchain: number;
    github: number;
    attestations: number;
    credentials: number;
  };
  skills: Skill[];
  hackathons: Hackathon[];
  bounties: Bounty[];
  attestations: Attestation[];
  programsDeployed: string[];
  status: 'open-to-work' | 'building' | 'hiring' | 'quiet';
};
