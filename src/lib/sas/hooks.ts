import { useEffect, useMemo, useState } from 'react';
import { fetchBuilderScoreAttestation, fetchPeerVouchesByNonces, makeRpc, type StoredBuilderAttestation, type StoredPeerVouch, type Address } from './api';

const issuerAuthority = (import.meta.env.VITE_SKILLD_ISSUER_AUTHORITY ?? '') as string;

export function useSkilldIssuer(): Address | null {
  return useMemo(() => {
    if (!issuerAuthority) return null;
    return issuerAuthority as Address;
  }, []);
}

export function useBuilderScoreAttestation(subjectBase58: string | null) {
  const issuer = useSkilldIssuer();
  const [data, setData] = useState<StoredBuilderAttestation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!issuer || !subjectBase58) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    const rpc = makeRpc();
    fetchBuilderScoreAttestation(rpc, issuer, subjectBase58 as Address)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [issuer, subjectBase58]);

  return { data, loading, issuer };
}

export function usePeerVouches(signerNonces: string[]) {
  const issuer = useSkilldIssuer();
  const noncesKey = signerNonces.join(',');
  const [data, setData] = useState<StoredPeerVouch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!issuer || !signerNonces.length) { setData([]); return; }
    let cancelled = false;
    setLoading(true);
    const rpc = makeRpc();
    fetchPeerVouchesByNonces(rpc, issuer, signerNonces as Address[])
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [issuer, noncesKey]);

  return { data, loading, issuer };
}
