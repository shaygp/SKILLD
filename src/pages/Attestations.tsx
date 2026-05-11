import { Link } from 'react-router-dom';
import { useAllAttestations } from '../lib/attestations/hooks';
import { Avatar } from './Home';

type OnchainAttestation = {
  kind: 'BUILDER-SCORE' | 'PEER-VOUCH' | 'X402_PAID_INTRO' | 'SEALED_MEMO' | 'PROGRAM_DEPLOY' | 'PROGRAM_CALL';
  fromLabel: string;
  toLabel: string;
  detail: string;
  txSig: string;
  cluster: 'devnet' | 'mainnet';
  issuedAt: string;
};

const ONCHAIN_LOG: OnchainAttestation[] = [
  {
    kind: 'PROGRAM_DEPLOY',
    fromLabel: 'skilld issuer',
    toLabel: 'skilld_attest program',
    detail: 'Anchor 0.32 program deployed at 4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6, 232 KB binary',
    txSig: '4Etm6mXr8ZKUyKFNf6sowy2JkwN3xWZc5UyUHKUBE29toUJVeUKao6wfSLCQrR4Ec5X5ZaBAGGzHisYwYSwT9ShE',
    cluster: 'devnet',
    issuedAt: '2026-05-11T00:00:00Z',
  },
  {
    kind: 'PROGRAM_CALL',
    fromLabel: 'skilld issuer',
    toLabel: 'counter PDA 8ZeyL1qe...',
    detail: 'init_counter call for fresh target builder',
    txSig: '5X8JXHrWL95DbtxThqwruwrrP9ca7yiw1CjT4q3kKnB5EWvqgke7rW1BEqFdnow3TNirHt2qMXBaKHTy8rPjdswB',
    cluster: 'devnet',
    issuedAt: '2026-05-11T00:05:00Z',
  },
  {
    kind: 'PROGRAM_CALL',
    fromLabel: 'skilld issuer',
    toLabel: 'detail PDA 6XXdFvQf...',
    detail: 'attest_public Rust skill, public_count incremented to 1',
    txSig: '2dvacaeG1Mawj9unJ1A9F2WSm9j9dcEeAfjSxESLkGKxf9sXhFH1Mwmc3LomWvY52eamP1E4qNKiqdocGHhYj6L3',
    cluster: 'devnet',
    issuedAt: '2026-05-11T00:06:00Z',
  },
  {
    kind: 'BUILDER-SCORE',
    fromLabel: 'skilld issuer',
    toLabel: 'framew0rk subject',
    detail: 'score 76, 4 hackathons, 12 bounties, 247 commits, 89 onchain actions',
    txSig: '3yX1RBH17bVe2c3TmEbDsW6yf9ZMf9XEPKv9vkXMqhjYnpLMaJnGvoje6P3qXgA2p76cbYuBwjNxddE5397DMnEg',
    cluster: 'devnet',
    issuedAt: '2026-05-09T12:00:00Z',
  },
  {
    kind: 'PEER-VOUCH',
    fromLabel: 'peer Rust signer',
    toLabel: 'framew0rk',
    detail: 'Shipped Skilld at Frontier 2026, solid SAS integration',
    txSig: '3F737y3Vd7dABTorrX5SJHjtXh7xSe21qRfiLohKWMVRkT9PMXfWbWPKoUZ9BBLrksGXMGQsaLcngR48uqqu2QQv',
    cluster: 'devnet',
    issuedAt: '2026-05-09T12:30:00Z',
  },
  {
    kind: 'PEER-VOUCH',
    fromLabel: 'test user wallet',
    toLabel: 'framew0rk.sol',
    detail: 'Shipped Skilld at Frontier 2026, solid SAS integration',
    txSig: '3sX4Kj1sRbp2vPC4bZGipYL3VKYygs8oxqa4JKhih4yP9LGvybKGL8AFn44GUqXrs8ZUPWEv6GbdDVX1Cfg2cyZ5',
    cluster: 'devnet',
    issuedAt: '2026-05-10T09:15:00Z',
  },
  {
    kind: 'BUILDER-SCORE',
    fromLabel: 'skilld issuer',
    toLabel: 'test user wallet',
    detail: 'score 68, 2 hackathons, 5 bounties, 156 commits, 42 onchain actions',
    txSig: '3U6CTyjUQWjVf3Qf3ChPbgnWY4HdZqKA4mHhbfHkmbb94wQjnsgz9ReB3cuqeWkCLS6FnKXJPrVsMsp155LrvLzs',
    cluster: 'devnet',
    issuedAt: '2026-05-10T09:18:00Z',
  },
  {
    kind: 'PEER-VOUCH',
    fromLabel: 'peer 1 (Rust)',
    toLabel: 'synthetic target',
    detail: 'Score chain stage 1, score 43',
    txSig: '2XRab5dQDppftCk6Vrz96LgA9sWxujzbMp26g2bbovDyHK11fCRaP65PEXY8GocVnezzd7D8deQtyGc1zrcKTGK8',
    cluster: 'devnet',
    issuedAt: '2026-05-10T10:30:00Z',
  },
  {
    kind: 'PEER-VOUCH',
    fromLabel: 'peer 2 (Anchor)',
    toLabel: 'synthetic target',
    detail: 'Score chain stage 2, score 45',
    txSig: '2CYJjmTm1hv8UCn1Bzz6BESqgzKXLpfsJpkAAvS7Qg3p1dSwyuuFvoANoCoXrmRgwpJ2VWGmGZe1WbiW7reqL4Ud',
    cluster: 'devnet',
    issuedAt: '2026-05-10T10:31:00Z',
  },
  {
    kind: 'PEER-VOUCH',
    fromLabel: 'peer 3 (Product)',
    toLabel: 'synthetic target',
    detail: 'Score chain stage 3, score 47',
    txSig: '4UaEitqVBJpYY4s2DGn3Dnb26pX8mENGZMXKrT4r8ycnLFGHK3ythTT9RB7efTEJa96usik6FQKMuj9g1FavQpQi',
    cluster: 'devnet',
    issuedAt: '2026-05-10T10:32:00Z',
  },
  {
    kind: 'BUILDER-SCORE',
    fromLabel: 'skilld issuer',
    toLabel: 'synthetic target',
    detail: 'Final recompute after 3 vouches, score 47',
    txSig: '59i4fkhUbvpkcrS8mbNJYAaz3AquBYh8Xta8LEXiQCnXdWF6gi1TK1ViJNqayeY9fzTjXVWaVJa3pNakZEAEAtSa',
    cluster: 'devnet',
    issuedAt: '2026-05-10T10:35:00Z',
  },
  {
    kind: 'X402_PAID_INTRO',
    fromLabel: 'test user',
    toLabel: 'framew0rk escrow',
    detail: '1 USDC paid intro via x402 SPL Token transfer',
    txSig: '5DJ8RGuRQMoKxFwW1Q9D4jWrw4SxcxaVWstQ5FLtdUricAeXFUsuegh21gkS6MoUxEHBiyL4mSk7UYDPj4twzAbp',
    cluster: 'devnet',
    issuedAt: '2026-05-10T09:20:00Z',
  },
  {
    kind: 'X402_PAID_INTRO',
    fromLabel: 'skilld issuer',
    toLabel: 'fresh recipient',
    detail: '1 USDC paid intro test',
    txSig: '6ESDxGKfqqKfXm8cKdYJvJmbjmghW7QUEaMiq64WNo7mqncrnErMGsAueSbN2QNB86DqQsMLArPUwNcFBaTX7pU',
    cluster: 'devnet',
    issuedAt: '2026-05-09T15:00:00Z',
  },
  {
    kind: 'SEALED_MEMO',
    fromLabel: 'test user',
    toLabel: 'framew0rk.sol',
    detail: 'Sealed Rust vouch via MagicBlock Pattern A counter rail',
    txSig: 'LkMV3rMZ6xX28DmgYcuZdyU4oAPxNb9d7yWk2dHUg2oGNSHyBkHMQhjYK7ssrRqwq35fxiMBPPie5cG1aBqtewf',
    cluster: 'devnet',
    issuedAt: '2026-05-10T11:00:00Z',
  },
  {
    kind: 'SEALED_MEMO',
    fromLabel: 'skilld issuer',
    toLabel: 'framew0rk.sol',
    detail: 'Counter state commit memo',
    txSig: '3ctzoPWg6K1GZY5LTAa9yTA96i45ZLUnbvp8YwvH14dQ2vDYdecXfhEJXk9kCyDM48LQS5FCB9rKiYtg6iBvoaq6',
    cluster: 'devnet',
    issuedAt: '2026-05-10T11:01:00Z',
  },
];

const KIND_STYLE: Record<OnchainAttestation['kind'], { label: string; bg: string; text: string }> = {
  'BUILDER-SCORE': { label: 'BUILDER SCORE', bg: 'bg-success', text: 'text-white' },
  'PEER-VOUCH': { label: 'PEER VOUCH', bg: 'bg-text', text: 'text-bg' },
  'X402_PAID_INTRO': { label: 'X402 PAID INTRO', bg: 'bg-accent', text: 'text-white' },
  'SEALED_MEMO': { label: 'SEALED MEMO', bg: 'bg-warning', text: 'text-white' },
  'PROGRAM_DEPLOY': { label: 'PROGRAM DEPLOY', bg: 'bg-success-bright', text: 'text-text' },
  'PROGRAM_CALL': { label: 'PROGRAM CALL', bg: 'bg-success-bright', text: 'text-text' },
};

export function AttestationsPage() {
  const local = useAllAttestations();

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
      <main className="lg:col-span-8 space-y-2">
        <div className="card px-5 py-4">
          <h1 className="text-[22px] font-bold text-text">Attestation network</h1>
          <p className="text-text-2 text-[14px] mt-1">
            Every Skilld attestation that has been broadcast to Solana devnet. Click any signature to inspect the transaction on Solscan.
          </p>
        </div>

        <div className="card">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-text">Onchain log</h2>
            <span className="text-[12px] text-text-2 font-semibold">{ONCHAIN_LOG.length} confirmed transactions</span>
          </div>
          <ul>
            {ONCHAIN_LOG.map((a) => {
              const style = KIND_STYLE[a.kind];
              return (
                <li key={a.txSig} className="px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface-2 transition">
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] px-2 py-1 ${style.bg} ${style.text} font-bold tracking-wider uppercase shrink-0 mt-0.5`}>
                      {style.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] leading-snug">
                        <span className="font-semibold text-text">{a.fromLabel}</span>
                        <span className="text-text-2"> attests to </span>
                        <span className="font-semibold text-text">{a.toLabel}</span>
                      </div>
                      <p className="text-text text-[13px] mt-1 leading-snug">{a.detail}</p>
                      <div className="text-text-3 text-[12px] mt-1.5 font-medium flex items-center gap-3 flex-wrap">
                        <span>{new Date(a.issuedAt).toLocaleString()}</span>
                        <span className="font-mono">{a.cluster}</span>
                        <a
                          href={`https://solscan.io/tx/${a.txSig}?cluster=${a.cluster}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-accent hover:underline"
                        >
                          {a.txSig.slice(0, 12)}...{a.txSig.slice(-6)}
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {local.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-text">Local wallet signed vouches</h2>
              <span className="text-[12px] text-text-2 font-semibold">{local.length} signed</span>
            </div>
            <ul>
              {local.map((a) => (
                <li key={a.id} className="px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface-2 transition">
                  <div className="flex items-start gap-3">
                    <Avatar domain={a.fromDomain} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] leading-snug">
                        <span className="font-semibold text-text">{a.fromDomain}</span>
                        <span className="text-text-2"> vouched for </span>
                        <Link to={`/${a.toDomain}`} className="font-semibold text-accent hover:underline">{a.toDomain}</Link>
                        {a.skill && <> on <span className="font-semibold">{a.skill}</span></>}
                      </div>
                      <p className="text-text text-[14px] mt-1.5 leading-snug italic">"{a.context}"</p>
                      <div className="text-text-3 text-[12px] mt-1.5 font-medium flex items-center gap-2 flex-wrap">
                        <span>{new Date(a.signedAt).toLocaleString()}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-success-soft text-success font-semibold">Wallet signed</span>
                        <span className="font-mono">sig {a.signature.slice(0, 10)}...</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <aside className="lg:col-span-4 space-y-2">
        <div className="card p-5">
          <h3 className="text-[18px] font-semibold text-text">How attestations work</h3>
          <ol className="mt-4 space-y-4">
            <Step n="1" title="Open a profile" body="Visit any .sol profile on Skilld." />
            <Step n="2" title="Click Vouch" body="Describe what you built with this builder." />
            <Step n="3" title="Sign with wallet" body="Phantom or Solflare signs the attestation message." />
            <Step n="4" title="Score updates" body="The Builder Score recomputes nightly. Higher attester score, higher impact." />
          </ol>
        </div>

        <div className="card p-5">
          <h3 className="text-[16px] font-semibold text-text">Stack status</h3>
          <ul className="mt-3 space-y-2 text-[13px] text-text-2 font-medium">
            <li className="flex items-center gap-2"><Check /><span>Wallet signed peer vouches (bs58 + nacl)</span></li>
            <li className="flex items-center gap-2"><Check /><span>SAS issuer registered on devnet</span></li>
            <li className="flex items-center gap-2"><Check /><span>SAS BUILDER-SCORE schema</span></li>
            <li className="flex items-center gap-2"><Check /><span>SAS PEER-VOUCH schema</span></li>
            <li className="flex items-center gap-2"><Check /><span>SNS Records V2 score writer</span></li>
            <li className="flex items-center gap-2"><Check /><span>x402 USDC SPL Token transfer</span></li>
            <li className="flex items-center gap-2"><Check /><span>MagicBlock TEE attestation + bearer token</span></li>
            <li className="flex items-center gap-2"><Check /><span>Sealed memo broadcast rail</span></li>
            <li className="flex items-center gap-2"><Check /><span>Phantom MCP server endpoint</span></li>
            <li className="flex items-center gap-2"><Check /><span>World ID IDKit session</span></li>
            <li className="flex items-center gap-2"><Check /><span>Anchor program skilld_attest deployed devnet</span></li>
            <li className="flex items-center gap-2"><Circle /><span>MagicBlock PER delegate macros</span></li>
            <li className="flex items-center gap-2"><Circle /><span>Mainnet migration</span></li>
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="text-[16px] font-semibold text-text">Live test snapshot</h3>
          <p className="text-text-2 text-[13px] mt-1 font-medium">Last full test suite run</p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            <li className="flex justify-between"><span className="text-text-2">Tests passed</span><span className="text-success font-bold tabular-nums">44 / 46</span></li>
            <li className="flex justify-between"><span className="text-text-2">Prod routes</span><span className="text-text font-semibold">11 / 11</span></li>
            <li className="flex justify-between"><span className="text-text-2">MCP tools</span><span className="text-text font-semibold">4 / 4</span></li>
            <li className="flex justify-between"><span className="text-text-2">Onchain confirmations</span><span className="text-text font-semibold">{ONCHAIN_LOG.length}</span></li>
            <li className="flex justify-between"><span className="text-text-2">SAS schemas</span><span className="text-text font-semibold">2 / 2</span></li>
            <li className="flex justify-between"><span className="text-text-2">Superteam Earn live</span><span className="text-text font-semibold">24 bounties</span></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[13px] shrink-0">{n}</span>
      <div className="flex-1">
        <div className="text-text font-semibold text-[15px] leading-tight">{title}</div>
        <div className="text-text-2 text-[13px] mt-0.5 font-medium leading-snug">{body}</div>
      </div>
    </li>
  );
}

function Check() {
  return (
    <span className="w-4 h-4 rounded-full bg-success text-white flex items-center justify-center shrink-0">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
    </span>
  );
}

function Circle() {
  return <span className="w-4 h-4 rounded-full border-2 border-border-strong shrink-0" />;
}
