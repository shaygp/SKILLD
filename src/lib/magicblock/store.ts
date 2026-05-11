import type { SealedAttestation } from './api';

const KEY = 'skilld:sealed:v1';

function load(): SealedAttestation[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SealedAttestation[]) : [];
  } catch {
    return [];
  }
}

function save(items: SealedAttestation[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('skilld:sealed:changed'));
}

export function listAll(): SealedAttestation[] {
  return load();
}

export function listForDomain(domain: string): SealedAttestation[] {
  const norm = domain.toLowerCase().endsWith('.sol') ? domain.toLowerCase() : `${domain.toLowerCase()}.sol`;
  return load().filter((s) => s.toDomain === norm);
}

export function add(item: SealedAttestation): SealedAttestation[] {
  const all = load();
  all.unshift(item);
  save(all);
  return all;
}
