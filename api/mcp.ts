type ToolCall = {
  jsonrpc?: string;
  id?: string | number;
  method: string;
  params?: { name?: string; arguments?: Record<string, unknown> };
};

type Builder = {
  domain: string;
  bio: string;
  twitter?: string;
  github?: string;
  superteamUsername?: string;
  builderScore: number;
  skills: Array<{ name: string; score: number }>;
  hackathons: Array<{ name: string; edition: string; placement: string; project?: string; year: number }>;
  programsDeployed: string[];
  status: string;
};

const SEED: Builder[] = [
  {
    domain: 'framew0rk.sol',
    bio: 'Building Skilld. Shipper.',
    twitter: 'framew0rk',
    github: 'shaygp',
    superteamUsername: 'framew0rk',
    builderScore: 76,
    skills: [
      { name: 'Rust', score: 78 },
      { name: 'Anchor', score: 72 },
      { name: 'React', score: 90 },
      { name: 'Product', score: 85 },
    ],
    hackathons: [{ name: 'Frontier', edition: '2026', placement: 'submission', project: 'Skilld', year: 2026 }],
    programsDeployed: [],
    status: 'building',
  },
  {
    domain: 'unruggable.sol',
    bio: 'Hardware wallet built natively for Solana. Cypherpunk Grand Champion.',
    twitter: 'unruggablexyz',
    builderScore: 92,
    skills: [
      { name: 'Hardware', score: 95 },
      { name: 'Rust', score: 92 },
    ],
    hackathons: [{ name: 'Cypherpunk', edition: '2025', placement: 'grand', project: 'Unruggable', year: 2025 }],
    programsDeployed: ['UnRug11111111111111111111111111111111'],
    status: 'building',
  },
  {
    domain: 'tapedrive.sol',
    bio: 'Decentralized storage with incentivized data persistence. Breakout Grand Champion.',
    twitter: 'tapedrive',
    builderScore: 89,
    skills: [
      { name: 'Rust', score: 95 },
      { name: 'Storage', score: 88 },
    ],
    hackathons: [{ name: 'Breakout', edition: '2025', placement: 'grand', project: 'TapeDrive', year: 2025 }],
    programsDeployed: ['Tape1111111111111111111111111111111111111'],
    status: 'building',
  },
];

function findBuilder(domain: string): Builder | undefined {
  const norm = domain.toLowerCase().endsWith('.sol') ? domain.toLowerCase() : `${domain.toLowerCase()}.sol`;
  return SEED.find((b) => b.domain === norm);
}

function getBuilderScore(args: Record<string, unknown>) {
  const domain = String(args.domain ?? '');
  const b = findBuilder(domain);
  if (!b) {
    return {
      domain,
      score: null,
      error: 'builder not indexed',
    };
  }
  return {
    domain: b.domain,
    score: b.builderScore,
    breakdown: {
      colosseum: Math.round(b.builderScore * 0.25),
      superteam_earn: Math.round(b.builderScore * 0.20),
      onchain: Math.round(b.builderScore * 0.20),
      github: Math.round(b.builderScore * 0.15),
      attestations: Math.round(b.builderScore * 0.15),
      credentials: Math.round(b.builderScore * 0.05),
    },
    skills: b.skills,
    twitter: b.twitter,
    github: b.github,
    superteam_username: b.superteamUsername,
    sas_credential_pda: 'DYSu7em1rxVZnAVsuLWxF4hS95ctrZHsuaaVVZcCFgqD',
    sas_schema_pda: 'HUyZHkxjKn522DHujBWaV8fYSggLFnD91naCx3X2JDC6',
    cluster: 'devnet',
  };
}

function listTopBuilders(args: Record<string, unknown>) {
  const limit = typeof args.limit === 'number' ? args.limit : 25;
  const skill = typeof args.skill === 'string' ? args.skill.toLowerCase() : undefined;
  const minScore = typeof args.min_score === 'number' ? args.min_score : 0;
  const filtered = SEED
    .filter((b) => b.builderScore >= minScore)
    .filter((b) => (skill ? b.skills.some((s) => s.name.toLowerCase().includes(skill)) : true))
    .sort((a, b) => b.builderScore - a.builderScore)
    .slice(0, limit)
    .map((b) => ({
      domain: b.domain,
      score: b.builderScore,
      headline: b.bio,
      skills: b.skills.slice(0, 4).map((s) => s.name),
    }));
  return { builders: filtered, count: filtered.length, total_indexed: SEED.length };
}

function listAttestations(args: Record<string, unknown>) {
  const domain = String(args.domain ?? '');
  const b = findBuilder(domain);
  if (!b) return { attestations: [], error: 'builder not indexed' };
  return {
    domain: b.domain,
    attestations: [],
    note: 'Attestations are stored client side. Use the live UI at https://skilld-app.vercel.app/' + b.domain + ' to read.',
    sas_schema: 'AJD9ZP6K6jAjhH4YsmvCCiXJuckGPaoE2yf89Y2tqebY',
    cluster: 'devnet',
  };
}

function sendIntroRequest(args: Record<string, unknown>) {
  const toDomain = String(args.to_domain ?? '');
  const message = String(args.message ?? '');
  const fromDomain = typeof args.from_domain === 'string' ? args.from_domain : null;
  const b = findBuilder(toDomain);
  if (!b) return { error: 'recipient not indexed' };
  if (message.length < 10) return { error: 'message too short' };
  return {
    to_domain: b.domain,
    from_domain: fromDomain,
    message_preview: message.slice(0, 80),
    price_usdc: 1,
    usdc_mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    recipient_ata_required: true,
    next_step: 'Sign and broadcast a createTransferCheckedInstruction to the recipient ATA from the agent wallet, then POST the signature back to this endpoint.',
    cluster: 'devnet',
  };
}

const TOOLS = [
  {
    name: 'get_builder_score',
    description: 'Resolve a Solana .sol domain to a Builder Score with breakdown by source.',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      required: ['domain'],
    },
  },
  {
    name: 'list_top_builders',
    description: 'Return top N Solana builders ranked by Builder Score.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 25 },
        skill: { type: 'string' },
        min_score: { type: 'integer' },
      },
    },
  },
  {
    name: 'send_intro_request',
    description: 'Build a 1 USDC paid intro request via x402.',
    inputSchema: {
      type: 'object',
      properties: {
        to_domain: { type: 'string' },
        message: { type: 'string' },
        from_domain: { type: 'string' },
      },
      required: ['to_domain', 'message'],
    },
  },
  {
    name: 'list_attestations',
    description: 'List wallet signed peer attestations for a builder.',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      required: ['domain'],
    },
  },
];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method === 'GET') {
    const body = {
      name: 'skilld-mcp',
      version: '1.0.0',
      transport: 'http',
      tools: TOOLS.map((t) => t.name),
      docs: 'https://skilld-app.vercel.app/agents',
    };
    return new Response(JSON.stringify(body, null, 2), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  let body: ToolCall;
  try {
    body = (await req.json()) as ToolCall;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const id = body.id ?? null;
  const method = body.method;

  if (method === 'tools/list') {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id, result: { tools: TOOLS } }, null, 2),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  if (method === 'tools/call') {
    const name = body.params?.name;
    const args = body.params?.arguments ?? {};
    let result: unknown;
    if (name === 'get_builder_score') result = getBuilderScore(args);
    else if (name === 'list_top_builders') result = listTopBuilders(args);
    else if (name === 'send_intro_request') result = sendIntroRequest(args);
    else if (name === 'list_attestations') result = listAttestations(args);
    else {
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: `unknown tool ${name}` } }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } }, null, 2),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: `unknown method ${method}` } }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
  );
}

export const config = { runtime: 'edge' };
