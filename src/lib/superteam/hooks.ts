import { useEffect, useState } from 'react';
import {
  fetchOpenListings,
  fetchActivityFeed,
  fetchActivityForUsername,
  fetchWinnerFeed,
  type SuperteamListing,
  type SuperteamFeedItem,
} from './api';

export function useOpenListings(take = 30) {
  const [data, setData] = useState<SuperteamListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOpenListings(take)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [take]);

  return { data, loading, error };
}

export function useActivityFeed(take = 50) {
  const [data, setData] = useState<SuperteamFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchActivityFeed(take)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [take]);

  return { data, loading };
}

export function useWinnerFeed(take = 50) {
  const [data, setData] = useState<SuperteamFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWinnerFeed(take)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [take]);

  return { data, loading };
}

export function useUserActivity(username: string | undefined, take = 200) {
  const [data, setData] = useState<SuperteamFeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) { setData([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchActivityForUsername(username, take)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username, take]);

  return { data, loading };
}
