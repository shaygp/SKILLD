type Props = {
  score: number;
  size?: number;
  stroke?: number;
};

export function ScoreRing({ score, size = 168, stroke = 14 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(10,102,194,0.10) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      <svg width={size} height={size} className="rotate-[-90deg] relative">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a66c2" />
            <stop offset="50%" stopColor="#14a3ff" />
            <stop offset="100%" stopColor="#14f195" />
          </linearGradient>
          <filter id="scoreGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#e0dfdc"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          filter="url(#scoreGlow)"
          style={{ transition: 'stroke-dashoffset 1000ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="serif-italic text-[14px] text-text-3 -mb-1">— score</div>
        <div className="text-[60px] font-bold text-text leading-none tabular-nums tracking-tight count-up">{clamped}</div>
        <div className="mt-2 flex items-center gap-1.5 mono">
          <span className="w-1.5 h-1.5 rounded-full bg-success-bright pulse-dot" />
          <span className="text-[10px] text-text font-semibold uppercase tracking-[0.18em]">live mainnet</span>
        </div>
      </div>
    </div>
  );
}
