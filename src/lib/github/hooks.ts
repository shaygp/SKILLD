import { useEffect, useState } from 'react';
import { fetchGithubStats, type GithubStats } from './api';

export function useGithubStats(username: string | undefined) {
  const [data, setData] = useState<GithubStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGithubStats(username)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  return { data, loading, error };
}
