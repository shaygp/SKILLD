const GH = 'https://api.github.com';

export type GithubUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  topics: string[];
};

export type GithubEvent = {
  id: string;
  type: string;
  actor: { login: string };
  repo: { name: string; url: string };
  payload: { commits?: Array<{ sha: string; message: string }>; ref?: string; ref_type?: string; action?: string };
  created_at: string;
};

const cache = new Map<string, { data: unknown; at: number }>();
const TTL = 5 * 60_000;

async function gh<T>(path: string): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  const res = await fetch(`${GH}${path}`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub ${path} ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(path, { data, at: Date.now() });
  return data;
}

export function fetchGithubUser(username: string) {
  return gh<GithubUser>(`/users/${username}`);
}

export function fetchGithubRepos(username: string) {
  return gh<GithubRepo[]>(`/users/${username}/repos?per_page=10&sort=updated`);
}

export function fetchGithubEvents(username: string) {
  return gh<GithubEvent[]>(`/users/${username}/events/public?per_page=30`);
}

const SOLANA_KEYWORDS = ['solana', 'anchor', 'spl', 'sol-', 'pyth', 'metaplex', 'magicblock', 'bonfida'];

export function isSolanaRepo(repo: GithubRepo): boolean {
  const haystack = `${repo.name} ${repo.full_name} ${repo.description ?? ''} ${repo.topics?.join(' ') ?? ''}`.toLowerCase();
  return SOLANA_KEYWORDS.some((k) => haystack.includes(k));
}

export type GithubStats = {
  user: GithubUser;
  repos: GithubRepo[];
  events: GithubEvent[];
  solanaRepos: GithubRepo[];
  totalStars: number;
  recentCommitCount: number;
  topLanguages: Array<{ language: string; count: number }>;
};

export async function fetchGithubStats(username: string): Promise<GithubStats> {
  const [user, repos, events] = await Promise.all([
    fetchGithubUser(username),
    fetchGithubRepos(username),
    fetchGithubEvents(username).catch(() => [] as GithubEvent[]),
  ]);

  const solanaRepos = repos.filter(isSolanaRepo);
  const totalStars = repos.reduce((acc, r) => acc + (r.stargazers_count ?? 0), 0);

  const recentCommitCount = events.reduce((acc, e) => {
    if (e.type === 'PushEvent') return acc + (e.payload.commits?.length ?? 0);
    return acc;
  }, 0);

  const langCounts = new Map<string, number>();
  for (const r of repos) {
    if (!r.language) continue;
    langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }
  const topLanguages = Array.from(langCounts.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { user, repos, events, solanaRepos, totalStars, recentCommitCount, topLanguages };
}
