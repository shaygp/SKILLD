export type ColosseumPlacement =
  | 'grand'
  | 'top10'
  | 'top20'
  | 'finalist'
  | 'university'
  | 'public-good'
  | 'submission';

export type ColosseumWinner = {
  hackathon: string;
  edition: string;
  year: number;
  category: string;
  project: string;
  placement: ColosseumPlacement;
  twitter?: string;
  url?: string;
};

export const COLOSSEUM_WINNERS: ColosseumWinner[] = [
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'Grand Champion',
    project: 'Unruggable',
    placement: 'grand',
    twitter: 'unruggablexyz',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'Consumer',
    project: 'Capitola',
    placement: 'top10',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'DeFi',
    project: 'Yumi Finance',
    placement: 'top10',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'Infrastructure',
    project: 'Seer',
    placement: 'top10',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'RWA',
    project: 'Autonom',
    placement: 'top10',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'Stablecoin',
    project: 'MCPay',
    placement: 'top10',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'Open',
    project: 'attn.markets',
    placement: 'top10',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'University',
    project: 'Pythia',
    placement: 'university',
  },
  {
    hackathon: 'Cypherpunk',
    edition: '2025',
    year: 2025,
    category: 'Public Good',
    project: 'Samui Wallet',
    placement: 'public-good',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'Grand Champion',
    project: 'TapeDrive',
    placement: 'grand',
    twitter: 'tapedrive',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'Consumer',
    project: 'Trepa',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'DeFi',
    project: 'Vanish',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'AI',
    project: 'Latinum',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'Infrastructure',
    project: 'FluxRPC',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'Gaming',
    project: 'Crypto Fantasy League',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'Stablecoin',
    project: 'CargoBill',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'DePIN',
    project: 'Decen Space',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'Mobile',
    project: 'LootGo',
    placement: 'top10',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'University',
    project: 'OpenSOL',
    placement: 'university',
  },
  {
    hackathon: 'Breakout',
    edition: '2025',
    year: 2025,
    category: 'Public Good',
    project: 'IDL Space',
    placement: 'public-good',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'Grand Champion',
    project: 'Reflect',
    placement: 'grand',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'Consumer',
    project: 'Pregame',
    placement: 'top10',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'Infrastructure',
    project: 'Txtx',
    placement: 'top10',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'Gaming',
    project: 'Supersize',
    placement: 'top10',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'DeFi',
    project: 'Squeeze',
    placement: 'top10',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'DePIN',
    project: 'SvachSakthi',
    placement: 'top10',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'Payments',
    project: 'FXSwap',
    placement: 'top10',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'DAOs',
    project: 'AlphaFC',
    placement: 'top10',
  },
  {
    hackathon: 'Radar',
    edition: '2024',
    year: 2024,
    category: 'Climate',
    project: 'Endcoin',
    placement: 'top10',
  },
  {
    hackathon: 'AI Agent',
    edition: '2026',
    year: 2026,
    category: 'Grand Champion',
    project: 'The Hive',
    placement: 'grand',
  },
  {
    hackathon: 'AI Agent',
    edition: '2026',
    year: 2026,
    category: 'Top 3',
    project: 'FXN',
    placement: 'top10',
  },
  {
    hackathon: 'AI Agent',
    edition: '2026',
    year: 2026,
    category: 'Top 3',
    project: 'JailbreakMe',
    placement: 'top10',
  },
];

export function findByProject(project: string): ColosseumWinner[] {
  const p = project.toLowerCase().trim();
  return COLOSSEUM_WINNERS.filter((w) => w.project.toLowerCase().includes(p));
}

export function findByTwitter(handle: string): ColosseumWinner[] {
  const h = handle.toLowerCase().replace(/^@/, '');
  return COLOSSEUM_WINNERS.filter((w) => w.twitter?.toLowerCase() === h);
}

export function totalCount() {
  return COLOSSEUM_WINNERS.length;
}

export function grandChampions() {
  return COLOSSEUM_WINNERS.filter((w) => w.placement === 'grand');
}
