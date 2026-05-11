import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  SKILLD_ATTEST_PROGRAM_ID,
  deriveCounterPda,
  buildInitCounterIx,
  buildAttestPublicIx,
  buildAttestPrivateIx,
  fetchCounter,
  type CounterState,
} from '../lib/magicblock/program';
import { resolveDomainOwner } from '../lib/sns/resolve';

type Props = {
  display: string;
  ownerBase58: string | null;
};

export function AttestProgramPanel({ display, ownerBase58 }: Props) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [counter, setCounter] = useState<CounterState | null>(null);
  const [counterPda, setCounterPda] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<{ kind: string; sig: string } | null>(null);

  const targetPubkey = ownerBase58 ? new PublicKey(ownerBase58) : null;

  const refresh = useCallback(async () => {
    if (!targetPubkey) return;
    setLoading(true);
    setError(null);
    try {
      const [pda] = deriveCounterPda(targetPubkey);
      setCounterPda(pda);
      const state = await fetchCounter(connection, targetPubkey);
      setCounter(state);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [connection, targetPubkey]);

  useEffect(() => { refresh(); }, [refresh]);

  async function onInit() {
    if (!publicKey || !sendTransaction || !targetPubkey) return;
    setBusy(true);
    setError(null);
    try {
      const ix = await buildInitCounterIx(publicKey, targetPubkey);
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const sig = await sendTransaction(tx, connection);
      setLastTx({ kind: 'init_counter', sig });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'init failed');
    } finally {
      setBusy(false);
    }
  }

  async function onAttestPublic() {
    if (!publicKey || !sendTransaction) return;
    let target = targetPubkey;
    if (!target) {
      const owner = await resolveDomainOwner(connection, display);
      if (!owner) {
        setError('Could not resolve target .sol');
        return;
      }
      target = owner;
    }
    setBusy(true);
    setError(null);
    try {
      const ix = await buildAttestPublicIx(publicKey, publicKey, target, 'Rust', `Public vouch onchain for ${display}`);
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const sig = await sendTransaction(tx, connection);
      setLastTx({ kind: 'attest_public', sig });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'attest failed');
    } finally {
      setBusy(false);
    }
  }

  async function onAttestPrivate() {
    if (!publicKey || !sendTransaction || !targetPubkey) return;
    setBusy(true);
    setError(null);
    try {
      const hash = Math.random().toString(16).slice(2, 18);
      const ix = await buildAttestPrivateIx(publicKey, publicKey, targetPubkey, hash);
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const sig = await sendTransaction(tx, connection);
      setLastTx({ kind: 'attest_private', sig });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'attest private failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-7 h-7 rounded bg-success-bright text-text flex items-center justify-center font-bold text-[14px]"></span>
            <h2 className="text-[20px] font-semibold text-text">skilld_attest program</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider">Live devnet</span>
          </div>
          <p className="text-text-2 text-[13px] mt-1.5 font-medium">
            Custom Anchor program at <a href={`https://solscan.io/account/${SKILLD_ATTEST_PROGRAM_ID.toBase58()}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-accent hover:underline font-mono">{SKILLD_ATTEST_PROGRAM_ID.toBase58().slice(0, 8)}...{SKILLD_ATTEST_PROGRAM_ID.toBase58().slice(-6)}</a> handling the public and sealed attestation counter rail.
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-surface-3/50 px-5 py-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">Public count</div>
            <div className="text-[28px] font-bold text-text tabular-nums leading-none mt-1">
              {loading ? '...' : counter ? counter.publicCount : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">Sealed count</div>
            <div className="text-[28px] font-bold text-text tabular-nums leading-none mt-1">
              {loading ? '...' : counter ? counter.sealedCount : '—'}
            </div>
          </div>
        </div>
        {counterPda && (
          <div className="mt-3 text-[12px] text-text-3 font-medium font-mono break-all">
            counter pda{' '}
            <a
              href={`https://solscan.io/account/${counterPda.toBase58()}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {counterPda.toBase58().slice(0, 8)}...{counterPda.toBase58().slice(-6)}
            </a>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        {!connected ? (
          <p className="text-text-2 text-[13px] font-medium">Connect a wallet on devnet to call the program.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!counter && (
              <button
                onClick={onInit}
                disabled={busy}
                className="bg-text text-surface px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-text-2 transition disabled:opacity-50"
              >
                {busy ? 'Sending init...' : 'init_counter'}
              </button>
            )}
            <button
              onClick={onAttestPublic}
              disabled={busy || !counter}
              className="bg-accent text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-accent-hover transition disabled:opacity-50"
            >
              {busy ? 'Sending...' : 'attest_public'}
            </button>
            <button
              onClick={onAttestPrivate}
              disabled={busy || !counter}
              className="bg-warning text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              attest_private (sealed hash)
            </button>
          </div>
        )}
        {lastTx && (
          <div className="mt-3 flex items-center gap-2 text-[12px]">
            <span className="px-2 py-0.5 rounded bg-success-soft text-success font-bold tracking-wider uppercase text-[10px]">{lastTx.kind}</span>
            <a
              href={`https://solscan.io/tx/${lastTx.sig}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="text-accent font-mono hover:underline"
            >
              {lastTx.sig.slice(0, 12)}...{lastTx.sig.slice(-6)}
            </a>
          </div>
        )}
        {error && (
          <div className="mt-3 bg-danger/10 border border-danger/30 rounded p-2.5 text-[12px] text-danger font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
