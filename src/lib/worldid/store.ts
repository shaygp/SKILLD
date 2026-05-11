export type HumanityProof = {
  domain: string;
  nullifier: string;
  level: 'orb' | 'device' | 'phone';
  verifiedAt: string;
};

const KEY = 'skilld:worldid:v1';

function load(): HumanityProof[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HumanityProof[]) : [];
  } catch {
    return [];
  }
}

function save(items: HumanityProof[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('skilld:worldid:changed'));
}

export function getProof(domain: string): HumanityProof | null {
  const norm = domain.toLowerCase().endsWith('.sol') ? domain.toLowerCase() : `${domain.toLowerCase()}.sol`;
  return load().find((p) => p.domain === norm) ?? null;
}

export function addProof(proof: HumanityProof) {
  const all = load().filter((p) => p.domain !== proof.domain);
  all.push(proof);
  save(all);
}

export function levelMultiplier(level: HumanityProof['level']): number {
  switch (level) {
    case 'orb': return 1.0;
    case 'device': return 0.7;
    case 'phone': return 0.5;
  }
}
