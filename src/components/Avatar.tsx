type Props = {
  domain: string;
  size?: number;
  className?: string;
};

const NFT_POOL = [
  '/assets/nfts/smb-1.png',
  '/assets/nfts/smb-2.png',
  '/assets/nfts/smb-3.png',
  '/assets/nfts/smb-4.png',
];

function hashSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ domain, size = 48, className }: Props) {
  const safe = domain || 'unknown';
  const h = hashSeed(safe);
  const src = NFT_POOL[h % NFT_POOL.length] ?? NFT_POOL[0];
  return (
    <img
      src={src}
      alt={domain}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 rounded-full object-cover bg-bg-2 ${className ?? ''}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
