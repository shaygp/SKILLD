import type { BuilderProfile, Hackathon, Bounty, Attestation } from '../../types/profile';

const WEIGHTS = {
  colosseum: 25,
  superteam: 20,
  onchain: 20,
  github: 15,
  attestations: 15,
  credentials: 5,
} as const;

export function colosseumPoints(items: Hackathon[]): number {
  if (!items.length) return 0;
  let raw = 0;
  for (const h of items) {
    if (h.placement === 'grand') raw += 30;
    else if (h.placement === 'top10') raw += 18;
    else if (h.placement === 'top20') raw += 12;
    else if (h.placement === 'finalist') raw += 6;
    else if (h.placement === 'university' || h.placement === 'public-good') raw += 14;
    else raw += 2;
  }
  return Math.min(raw, 100);
}

export function superteamPoints(items: Bounty[]): number {
  if (!items.length) return 0;
  const totalUsd = items.reduce((acc, b) => acc + b.amountUsd, 0);
  const countScore = Math.min(items.length * 6, 50);
  const earnedScore = Math.min((totalUsd / 50000) * 50, 50);
  return Math.min(countScore + earnedScore, 100);
}

export function onchainPoints(programs: string[], txCount: number): number {
  const programScore = Math.min(programs.length * 25, 60);
  const txScore = Math.min((txCount / 10000) * 40, 40);
  return Math.min(programScore + txScore, 100);
}

export function githubPoints(commitCount: number, repoCount: number): number {
  const repoScore = Math.min(repoCount * 8, 40);
  const commitScore = Math.min((commitCount / 500) * 60, 60);
  return Math.min(repoScore + commitScore, 100);
}

export function attestationPoints(items: Attestation[]): number {
  if (!items.length) return 0;
  const total = items.reduce((acc, a) => acc + Math.max(20, a.fromScore) / 100, 0);
  return Math.min(total * 25, 100);
}

export function credentialPoints(certs: string[]): number {
  return Math.min(certs.length * 25, 100);
}

export type ScoreInputs = {
  hackathons: Hackathon[];
  bounties: Bounty[];
  programs: string[];
  txCount: number;
  commits: number;
  repos: number;
  attestations: Attestation[];
  credentials: string[];
};

export function computeBuilderScore(inputs: ScoreInputs): BuilderProfile['scoreBreakdown'] & { total: number } {
  const colosseum = (colosseumPoints(inputs.hackathons) * WEIGHTS.colosseum) / 100;
  const superteam = (superteamPoints(inputs.bounties) * WEIGHTS.superteam) / 100;
  const onchain = (onchainPoints(inputs.programs, inputs.txCount) * WEIGHTS.onchain) / 100;
  const github = (githubPoints(inputs.commits, inputs.repos) * WEIGHTS.github) / 100;
  const attestations = (attestationPoints(inputs.attestations) * WEIGHTS.attestations) / 100;
  const credentials = (credentialPoints(inputs.credentials) * WEIGHTS.credentials) / 100;
  const total = Math.round(colosseum + superteam + onchain + github + attestations + credentials);
  return {
    colosseum: Math.round(colosseum),
    superteam: Math.round(superteam),
    onchain: Math.round(onchain),
    github: Math.round(github),
    attestations: Math.round(attestations),
    credentials: Math.round(credentials),
    total,
  };
}
