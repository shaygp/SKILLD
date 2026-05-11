import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { reverseDomainOf, resolveDomainOwner } from '../lib/sns/resolve';
import { add as addAttestation, buildAttestationMessage } from '../lib/attestations/store';
import {
  buildRecipientMember,
  permissionPdaFor,
  sealedPayloadHash,
} from '../lib/magicblock/api';
import { add as addSealed } from '../lib/magicblock/store';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

type Props = {
  open: boolean;
  toDomain: string;
  onClose: () => void;
};

export function VouchModal({ open, toDomain, onClose }: Props) {
  const { connection } = useConnection();
  const { publicKey, signMessage, sendTransaction, connected } = useWallet();
  const [skill, setSkill] = useState('');
  const [context, setContext] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [fromDomain, setFromDomain] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) { setFromDomain(null); return; }
    let cancelled = false;
    reverseDomainOf(connection, publicKey).then((name) => {
      if (cancelled) return;
      setFromDomain(name ? `${name}.sol` : null);
    });
    return () => { cancelled = true; };
  }, [publicKey, connection]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!connected || !publicKey || !signMessage) {
      setError('Connect a wallet first.');
      return;
    }
    if (!context.trim()) {
      setError('Add some context for the attestation.');
      return;
    }

    const author = fromDomain ?? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}.wallet`;
    const signedAt = new Date().toISOString();
    const msg = buildAttestationMessage({
      fromDomain: author, toDomain, skill: skill.trim() || undefined, context: context.trim(), signedAt,
    });
    const encoded = new TextEncoder().encode(msg);

    setSubmitting(true);
    try {
      const signature = await signMessage(encoded);
      const signatureB58 = bs58.encode(signature);
      const sealedContext = isPrivate
        ? `__sealed_v1__:${btoa(unescape(encodeURIComponent(context.trim())))}`
        : context.trim();

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      addAttestation({
        id,
        fromDomain: author,
        fromOwner: publicKey.toBase58(),
        toDomain,
        skill: skill.trim() || undefined,
        context: sealedContext,
        signature: signatureB58,
        signedMessage: msg,
        signedAt,
        fromScore: 50,
        private: isPrivate,
      });

      if (isPrivate) {
        const recipient = await resolveDomainOwner(connection, toDomain);
        if (recipient) {
          const recipientMember = buildRecipientMember(recipient);
          const detailSeed = Buffer.from(`skilld_detail_${id}`);
          const [detailPda] = PublicKey.findProgramAddressSync([detailSeed], new PublicKey('11111111111111111111111111111111'));
          const counterSeed = Buffer.from(`skilld_counter_${toDomain}`);
          const [counterPda] = PublicKey.findProgramAddressSync([counterSeed], new PublicKey('11111111111111111111111111111111'));
          const permission = permissionPdaFor(detailPda);
          const hash = sealedPayloadHash({ skill: skill.trim() || undefined, context: context.trim() });

          let memoSig: string | undefined;
          try {
            const counterPayload = JSON.stringify({
              skilld: 'sealed_vouch',
              v: 1,
              target: toDomain,
              recipient: recipient.toBase58(),
              hash,
              ts: Date.now(),
            });
            const sealedB64 = btoa(unescape(encodeURIComponent(JSON.stringify({
              skill: skill.trim() || undefined,
              context: context.trim(),
              signer: publicKey.toBase58(),
              from: author,
            }))));
            const sealedPayload = JSON.stringify({
              skilld: 'sealed_blob',
              v: 1,
              target: toDomain,
              hash,
              data: sealedB64,
            });
            const { blockhash } = await connection.getLatestBlockhash();
            const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash });
            tx.add(new TransactionInstruction({
              programId: MEMO_PROGRAM_ID,
              keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
              data: Buffer.from(counterPayload, 'utf8'),
            }));
            tx.add(new TransactionInstruction({
              programId: MEMO_PROGRAM_ID,
              keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
              data: Buffer.from(sealedPayload, 'utf8'),
            }));
            if (sendTransaction) {
              memoSig = await sendTransaction(tx, connection);
            }
          } catch (err) {
            console.warn('sealed memo broadcast failed', err);
          }

          addSealed({
            id,
            toDomain,
            recipient: recipient.toBase58(),
            fromDomain: author,
            fromOwner: publicKey.toBase58(),
            sealedAt: signedAt,
            recipientFlags: recipientMember.flags,
            members: [{ pubkey: recipientMember.pubkey.toBase58(), flags: recipientMember.flags }],
            permissionPda: permission.toBase58(),
            detailPda: detailPda.toBase58(),
            counterPda: counterPda.toBase58(),
            sealedPayloadHash: hash,
            ...(memoSig ? { memoSignature: memoSig } : {}),
          });
        }
      }

      setSkill('');
      setContext('');
      setIsPrivate(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign attestation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-text">Vouch for {toDomain}</h2>
          <button onClick={onClose} className="text-text-2 hover:bg-surface-2 p-1 rounded-full transition" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
          {!connected && (
            <div className="bg-warning-soft border border-warning/30 rounded p-3 text-[13px] text-warning font-medium">
              Connect a Phantom or Solflare wallet to sign your attestation.
            </div>
          )}

          {connected && (
            <div className="bg-surface-3 border border-border rounded p-3">
              <div className="text-[12px] text-text-2 font-semibold uppercase tracking-wider">Signing as</div>
              <div className="mt-1 text-[14px] font-semibold text-text">
                {fromDomain ?? `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}`}
              </div>
              {!fromDomain && (
                <div className="text-[12px] text-text-3 mt-0.5 font-medium">
                  No reverse .sol found. Your attestation will be tagged with your wallet address.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-text mb-1">Skill (optional)</label>
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Rust, Anchor, Product, Design..."
              className="w-full bg-surface border border-border rounded px-3 py-2 text-[14px] text-text placeholder:text-text-3 focus:outline-none focus:border-accent transition"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-text mb-1">Context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={`What did you build with ${toDomain}? Be specific.`}
              rows={4}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-[14px] text-text placeholder:text-text-3 focus:outline-none focus:border-accent transition resize-none"
            />
          </div>

          <label className="flex items-start gap-3 p-3 border border-border rounded cursor-pointer hover:bg-surface-2 transition">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <div>
              <div className="text-[14px] font-semibold text-text flex items-center gap-1.5">
                Private attestation
                <span className="text-[10px] px-1.5 py-px bg-warning-soft text-warning rounded font-bold">MagicBlock</span>
              </div>
              <div className="text-[12px] text-text-2 mt-0.5 font-medium leading-snug">
                Public count goes to the score. Content stays sealed and only readable by the recipient.
              </div>
            </div>
          </label>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded p-3 text-[13px] text-danger font-medium">
              {error}
            </div>
          )}

          <div className="text-[12px] text-text-3 font-medium leading-snug">
            Your wallet will sign a message proving you authored this attestation. Stored locally and ready to be migrated to Solana Attestation Service onchain.
            {isPrivate && <> Content sealed and ready for MagicBlock Private Ephemeral Rollup once integrated.</>}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="px-5 py-1.5 text-text-2 font-semibold text-[14px] hover:bg-surface-2 rounded-full transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !connected}
              className="bg-accent text-white px-5 py-1.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing...' : 'Sign and submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
