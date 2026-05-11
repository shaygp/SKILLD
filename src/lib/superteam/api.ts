const BASE = '/superteam-api';

export type SuperteamSponsor = {
  name: string;
  slug: string;
  logo: string | null;
  isVerified: boolean;
};

export type SuperteamListing = {
  id: string;
  rewardAmount: number;
  deadline: string;
  type: 'bounty' | 'project' | 'hackathon' | 'grant';
  title: string;
  token: string;
  slug: string;
  isWinnersAnnounced: boolean;
  winnersAnnouncedAt: string | null;
  status: string;
  isPro: boolean;
  isFeatured: boolean;
  compensationType: string;
  _count: { Comments: number; Submission: number };
  sponsor: SuperteamSponsor;
};

export type SuperteamFeedItem = {
  id: string | null;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  createdAt: string;
  link: string | null;
  isWinner: boolean | null;
  winnerPosition: number | null;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  listingType: 'bounty' | 'project' | 'hackathon' | 'grant';
  rewards: Record<string, number> | null;
  token: string;
  sponsorName: string;
  sponsorSlug: string;
  sponsorLogo: string | null;
  type: 'submission' | 'grant-application' | 'pow';
  grantApplicationAmount?: number;
  likeCount: number;
  commentCount: number;
};

const cache = new Map<string, { data: unknown; at: number }>();
const TTL = 5 * 60_000;

async function getJSON<T>(path: string): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Superteam ${path} ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(path, { data, at: Date.now() });
  return data;
}

export function fetchOpenListings(take = 30) {
  return getJSON<SuperteamListing[]>(`/listings?status=open&take=${take}`);
}

export function fetchCompletedListings(take = 200) {
  return getJSON<SuperteamListing[]>(`/listings?status=completed&take=${take}`);
}

export function fetchActivityFeed(take = 100) {
  return getJSON<SuperteamFeedItem[]>(`/feed/get?take=${take}`);
}

export function fetchWinnerFeed(take = 100) {
  return getJSON<SuperteamFeedItem[]>(`/feed/get?type=submission&isWinner=true&take=${take}`);
}

export async function fetchActivityForUsername(username: string, take = 200): Promise<SuperteamFeedItem[]> {
  const all = await fetchActivityFeed(take);
  const target = username.toLowerCase();
  return all.filter((x) => x.username?.toLowerCase() === target);
}

export function rewardForFeedItem(item: SuperteamFeedItem): number {
  if (item.type === 'grant-application' && item.grantApplicationAmount) {
    return item.grantApplicationAmount;
  }
  if (item.isWinner && item.winnerPosition && item.rewards) {
    return item.rewards[String(item.winnerPosition)] ?? 0;
  }
  return 0;
}

export function pickHandle(item: SuperteamFeedItem): string {
  return `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.username;
}
