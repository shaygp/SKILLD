type LogoProps = { size?: number; className?: string };

export function SolanaLogo({ size = 24, className }: LogoProps) {
  return (
    <img
      src="/assets/logos/solana.png"
      alt="Solana"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className ?? ''}`}
    />
  );
}

export function SolanaMonoLogo({ size = 22, className }: LogoProps) {
  return (
    <svg viewBox="0 0 397 311" width={size} height={size} className={className} aria-label="Solana">
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z" fill="currentColor" />
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="currentColor" />
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.6z" fill="currentColor" />
    </svg>
  );
}

export function SnsLogo({ size = 24, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-label="SNS">
      <rect width="32" height="32" rx="8" fill="#057642" />
      <text x="16" y="21" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill="white" textAnchor="middle">.sol</text>
    </svg>
  );
}

export function MagicBlockLogo({ size = 24, className }: LogoProps) {
  return (
    <img
      src="/assets/logos/magicblock.png"
      alt="MagicBlock"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className ?? ''}`}
    />
  );
}

export function WorldIdLogo({ size = 24, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-label="World ID">
      <circle cx="16" cy="16" r="14" fill="#0a0a0a" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill="white" />
      <circle cx="16" cy="16" r="1.5" fill="#0a0a0a" />
    </svg>
  );
}

export function PhantomLogo({ size = 24, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-label="Phantom">
      <rect width="32" height="32" rx="8" fill="#0a0a0a" />
      <path d="M22 14 C22 10.7 19.3 8 16 8 C12.7 8 10 10.7 10 14 V21 C10 21.6 10.4 22 11 22 H12 V19.5 C12 19 12.4 18.7 12.8 18.8 C13.4 19.4 14 20 14.7 20 C15.4 20 16 19.4 16 18.7 V18 C16 17.4 16.6 17 17 17 C17.4 17 17.6 17 18 17.5 C18.4 18 19 18.5 19.7 18.5 C20.4 18.5 21 18 21 17.3 C21 16.6 21.4 16 22 16 V14 Z" fill="#14f195" />
    </svg>
  );
}

export function X402Logo({ size = 24, className }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded ${className ?? ''}`}
      style={{ width: size, height: size, background: '#0a0a0a' }}
      aria-label="x402"
    >
      <img src="/assets/logos/x402.png" alt="x402" style={{ width: size * 0.72, height: 'auto', filter: 'invert(1)' }} />
    </span>
  );
}

export function SmbLogo({ size = 24, className }: LogoProps) {
  return (
    <img
      src="/assets/logos/smb.png"
      alt="SMB"
      width={size}
      height={size}
      className={`shrink-0 rounded object-contain ${className ?? ''}`}
      style={{ background: '#0a0a0a' }}
    />
  );
}

export function SasLogo({ size = 24, className }: LogoProps) {
  return (
    <img
      src="/assets/logos/sas.png"
      alt="Solana Attestation Service"
      width={size}
      height={size}
      className={`shrink-0 rounded object-contain ${className ?? ''}`}
    />
  );
}

export function ColosseumLogo({ size = 24, className }: LogoProps) {
  return (
    <img
      src="/assets/logos/colosseum.png"
      alt="Colosseum"
      width={size}
      height={size}
      className={`shrink-0 rounded object-contain ${className ?? ''}`}
    />
  );
}

export function SuperteamLogo({ size = 24, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-label="Superteam">
      <rect width="32" height="32" rx="6" fill="#cc1016" />
      <text x="16" y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fontWeight="700" fill="white" textAnchor="middle">S</text>
    </svg>
  );
}

export function GitHubLogo({ size = 24, className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-label="GitHub">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
