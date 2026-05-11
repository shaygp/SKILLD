import { useEffect, useState } from 'react';
import { listAll, listForDomain, type IntroRequest } from './store';

function useStoreSignal(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener('skilld:intros:changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('skilld:intros:changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  return tick;
}

export function useIntrosFor(domain: string | undefined): IntroRequest[] {
  const tick = useStoreSignal();
  const [data, setData] = useState<IntroRequest[]>([]);
  useEffect(() => {
    if (!domain) { setData([]); return; }
    setData(listForDomain(domain));
  }, [domain, tick]);
  return data;
}

export function useAllIntros(): IntroRequest[] {
  const tick = useStoreSignal();
  const [data, setData] = useState<IntroRequest[]>([]);
  useEffect(() => { setData(listAll()); }, [tick]);
  return data;
}
