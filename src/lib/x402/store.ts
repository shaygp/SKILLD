export type IntroRequest = {
  id: string;
  fromOwner: string;
  fromDomain?: string;
  toDomain: string;
  message: string;
  amountUsdc: number;
  paymentSignature: string;
  paidAt: string;
  status: 'paid' | 'replied' | 'declined';
  replyAt?: string;
  replyText?: string;
};

const KEY = 'skilld:intros:v1';

function load(): IntroRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as IntroRequest[]) : [];
  } catch {
    return [];
  }
}

function save(items: IntroRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('skilld:intros:changed'));
}

export function listAll(): IntroRequest[] {
  return load();
}

export function listForDomain(domain: string): IntroRequest[] {
  const norm = domain.toLowerCase().endsWith('.sol') ? domain.toLowerCase() : `${domain.toLowerCase()}.sol`;
  return load().filter((i) => i.toDomain === norm);
}

export function add(item: IntroRequest): IntroRequest[] {
  const all = load();
  all.unshift(item);
  save(all);
  return all;
}

export function setStatus(id: string, status: IntroRequest['status'], replyText?: string): IntroRequest[] {
  const all = load().map((i) => i.id === id ? { ...i, status, replyText, replyAt: new Date().toISOString() } : i);
  save(all);
  return all;
}
