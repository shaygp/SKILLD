import type { IntroRequest } from '../lib/x402/store';
import { X402Logo } from './BrandLogos';

type Props = {
  display: string;
  intros: IntroRequest[];
  isOwner: boolean;
};

export function X402Inbox({ display, intros, isOwner }: Props) {
  if (intros.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <X402Logo size={28} />
          <h2 className="text-[20px] font-semibold text-text">x402 inbox</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-accent font-bold uppercase tracking-wider ml-auto">{intros.length} paid intros</span>
        </div>
        <div className="px-5 pb-5">
          <p className="text-text-2 text-[14px] font-medium leading-snug">
            Verified intros to {display} cost <span className="font-semibold text-text">1 USDC</span> via x402. Recruiters pay on chain, settled in 400ms. Refund if no reply in 7 days.
          </p>
          <p className="text-[12px] text-text-3 mt-2 font-medium">No intros yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-2 flex items-center gap-2">
        <X402Logo size={28} />
        <h2 className="text-[20px] font-semibold text-text">x402 inbox</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider ml-auto">{intros.length} paid · ${intros.reduce((a, i) => a + i.amountUsdc, 0)} earned</span>
      </div>
      <ul className="divide-y divide-border">
        {intros.map((intro) => (
          <li key={intro.id} className="px-5 py-4 hover:bg-surface-2 transition">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold shrink-0">
                {(intro.fromDomain ?? intro.fromOwner).slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text font-semibold text-[14px]">{intro.fromDomain ?? `${intro.fromOwner.slice(0, 4)}...${intro.fromOwner.slice(-4)}.wallet`}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold">PAID ${intro.amountUsdc}</span>
                </div>
                <p className={`text-[14px] mt-1 leading-snug ${isOwner ? 'text-text' : 'text-text-3 italic'}`}>
                  {isOwner ? intro.message : 'Connect with the owner wallet to read this intro.'}
                </p>
                <div className="text-text-3 text-[12px] mt-1.5 font-medium flex items-center gap-2 flex-wrap">
                  <span>{new Date(intro.paidAt).toLocaleString()}</span>
                  <a
                    href={`https://solscan.io/tx/${intro.paymentSignature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent font-semibold hover:underline"
                  >
                    View tx
                  </a>
                </div>
              </div>
              {isOwner && intro.status === 'paid' && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button className="bg-accent text-white px-3 py-1 rounded-full text-[12px] font-semibold hover:bg-accent-hover transition">Reply</button>
                  <button className="border border-border-strong text-text-2 px-3 py-1 rounded-full text-[12px] font-semibold hover:bg-surface-2 transition">Decline</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function _UnusedX402Icon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2v1zm9-13H4c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V6c0-1.11-.89-2-2-2z" />
    </svg>
  );
}
