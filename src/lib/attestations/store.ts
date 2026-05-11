export type StoredAttestation = {
  id: string;
  fromDomain: string;
  fromOwner: string;
  toDomain: string;
  skill?: string;
  context: string;
  signature: string;
  signedMessage: string;
  signedAt: string;
  fromScore: number;
  private?: boolean;
};

const KEY = 'skilld:attestations:v1';

function load(): StoredAttestation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAttestation[];
  } catch {
    return [];
  }
}

function save(items: StoredAttestation[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function listAll(): StoredAttestation[] {
  return load();
}

export function listForDomain(domain: string): StoredAttestation[] {
  const norm = domain.toLowerCase().endsWith('.sol') ? domain.toLowerCase() : `${domain.toLowerCase()}.sol`;
  return load().filter((a) => a.toDomain === norm);
}

export function listGivenBy(domain: string): StoredAttestation[] {
  const norm = domain.toLowerCase().endsWith('.sol') ? domain.toLowerCase() : `${domain.toLowerCase()}.sol`;
  return load().filter((a) => a.fromDomain === norm);
}

export function add(item: StoredAttestation): StoredAttestation[] {
  const all = load();
  all.unshift(item);
  save(all);
  window.dispatchEvent(new CustomEvent('skilld:attestations:changed'));
  return all;
}

export function remove(id: string): StoredAttestation[] {
  const all = load().filter((a) => a.id !== id);
  save(all);
  window.dispatchEvent(new CustomEvent('skilld:attestations:changed'));
  return all;
}

export function buildAttestationMessage({
  fromDomain, toDomain, skill, context, signedAt,
}: { fromDomain: string; toDomain: string; skill?: string; context: string; signedAt: string }): string {
  const lines = [
    'Skilld Attestation v1',
    `From: ${fromDomain}`,
    `To: ${toDomain}`,
    skill ? `Skill: ${skill}` : 'Skill: (none)',
    `Context: ${context}`,
    `Signed: ${signedAt}`,
  ];
  return lines.join('\n');
}
