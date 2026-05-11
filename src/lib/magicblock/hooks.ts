import { useEffect, useState } from 'react';
import { listAll, listForDomain } from './store';
import type { SealedAttestation } from './api';

function useStoreSignal(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener('skilld:sealed:changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('skilld:sealed:changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  return tick;
}

export function useSealedFor(domain: string | undefined): SealedAttestation[] {
  const tick = useStoreSignal();
  const [data, setData] = useState<SealedAttestation[]>([]);
  useEffect(() => {
    if (!domain) { setData([]); return; }
    setData(listForDomain(domain));
  }, [domain, tick]);
  return data;
}

export function useAllSealed(): SealedAttestation[] {
  const tick = useStoreSignal();
  const [data, setData] = useState<SealedAttestation[]>([]);
  useEffect(() => { setData(listAll()); }, [tick]);
  return data;
}
