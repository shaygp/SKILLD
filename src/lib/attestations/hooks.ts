import { useEffect, useState } from 'react';
import { listAll, listForDomain, listGivenBy, type StoredAttestation } from './store';

function useStoreSignal(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener('skilld:attestations:changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('skilld:attestations:changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  return tick;
}

export function useAttestationsFor(domain: string | undefined): StoredAttestation[] {
  const tick = useStoreSignal();
  const [data, setData] = useState<StoredAttestation[]>([]);
  useEffect(() => {
    if (!domain) { setData([]); return; }
    setData(listForDomain(domain));
  }, [domain, tick]);
  return data;
}

export function useAttestationsGivenBy(domain: string | undefined): StoredAttestation[] {
  const tick = useStoreSignal();
  const [data, setData] = useState<StoredAttestation[]>([]);
  useEffect(() => {
    if (!domain) { setData([]); return; }
    setData(listGivenBy(domain));
  }, [domain, tick]);
  return data;
}

export function useAllAttestations(): StoredAttestation[] {
  const tick = useStoreSignal();
  const [data, setData] = useState<StoredAttestation[]>([]);
  useEffect(() => { setData(listAll()); }, [tick]);
  return data;
}
