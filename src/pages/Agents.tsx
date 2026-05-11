import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AgentsPage() {
  const [tab, setTab] = useState<'overview' | 'curl' | 'mcp' | 'phantom'>('overview');

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
      <main className="lg:col-span-8 space-y-2">
        <div className="card px-5 py-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded bg-text text-surface flex items-center justify-center font-bold">
              <BotIcon />
            </span>
            <h1 className="text-[26px] font-bold text-text">Skilld for AI agents</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-success-soft text-success font-bold uppercase tracking-wider">MCP ready</span>
          </div>
          <p className="text-text-2 text-[15px] mt-2 leading-relaxed">
            Skilld exposes Builder Scores, attestations, and intro requests as a Model Context Protocol server. Any AI recruiter agent (Claude, Cursor, Phantom) can query a Solana builder's onchain reputation and pay for a verified intro via x402, settled in 400ms on Solana mainnet.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
            <a href="/.well-known/skilld-mcp.json" className="border border-accent text-accent px-4 py-1.5 rounded-full font-semibold hover:bg-accent-soft transition" target="_blank" rel="noreferrer">
              View MCP descriptor
            </a>
            <a href="https://docs.phantom.com/resources/mcp-server" target="_blank" rel="noreferrer" className="border border-border-strong text-text px-4 py-1.5 rounded-full font-semibold hover:bg-surface-2 transition">
              Phantom MCP docs
            </a>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-border px-5 flex gap-6">
            <Tab active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</Tab>
            <Tab active={tab === 'mcp'} onClick={() => setTab('mcp')}>MCP tools</Tab>
            <Tab active={tab === 'curl'} onClick={() => setTab('curl')}>HTTP API</Tab>
            <Tab active={tab === 'phantom'} onClick={() => setTab('phantom')}>Phantom integration</Tab>
          </div>

          {tab === 'overview' && (
            <div className="px-5 py-5 space-y-4">
              <Step n={1} title="Discover" body="Agent fetches /.well-known/skilld-mcp.json to learn the available tools." />
              <Step n={2} title="Query Builder Score" body="Agent calls get_builder_score with a .sol domain. Skilld returns score, breakdown, hackathons, bounties, GitHub activity." />
              <Step n={3} title="Filter top talent" body="Agent calls list_top_builders with skill or min score filter. Returns ranked list." />
              <Step n={4} title="Pay for intro" body="Agent calls send_intro_request with a paid 1 USDC payload via x402. Recipient gets the message, agent gets the receipt onchain." />
            </div>
          )}

          {tab === 'mcp' && (
            <div className="px-5 py-5 space-y-3">
              <ToolDoc
                name="get_builder_score"
                summary="Returns Builder Score and full breakdown for a .sol domain."
                input={`{ "domain": "framew0rk.sol" }`}
                output={`{
  "domain": "framew0rk.sol",
  "score": 76,
  "breakdown": {
    "colosseum": 18,
    "superteam_earn": 12,
    "onchain": 14,
    "github": 11,
    "attestations": 15,
    "credentials": 6
  },
  "humanity_proof": { "level": "orb", "weight": 1.0 }
}`}
              />
              <ToolDoc
                name="list_top_builders"
                summary="Returns top N Solana builders by Builder Score."
                input={`{ "limit": 10, "skill": "Rust", "min_score": 60 }`}
                output={`{ "builders": [{ "domain": "...", "score": 92 }, ...] }`}
              />
              <ToolDoc
                name="send_intro_request"
                summary="Pays 1 USDC via x402 to send a verified intro to a builder. Returns Solana tx signature."
                input={`{ "to_domain": "framew0rk.sol", "message": "Hiring Rust eng", "from_domain": "acme.sol" }`}
                output={`{ "signature": "5h...", "status": "paid", "expires_at": "2026-05-12T..." }`}
              />
              <ToolDoc
                name="list_attestations"
                summary="List wallet signed peer attestations for a builder."
                input={`{ "domain": "framew0rk.sol" }`}
                output={`{ "attestations": [{ "from": "akshay.sol", "skill": "Product", "context": "..." }, ...] }`}
              />
            </div>
          )}

          {tab === 'curl' && (
            <div className="px-5 py-5 space-y-4">
              <CurlBlock
                label="Get Builder Score"
                cmd={`curl https://skilld.app/api/builder-score?domain=framew0rk.sol`}
              />
              <CurlBlock
                label="List top Rust builders score >= 60"
                cmd={`curl 'https://skilld.app/api/top-builders?skill=Rust&min_score=60&limit=10'`}
              />
              <CurlBlock
                label="Send paid intro via x402"
                cmd={`curl -X POST https://skilld.app/api/intro \\
  -H "Content-Type: application/json" \\
  -d '{ "to_domain": "framew0rk.sol", "message": "Hiring Rust eng" }'`}
              />
              <CurlBlock
                label="Read SAS attestation"
                cmd={`curl https://skilld.app/api/sas/attestation?subject=<wallet>`}
              />
            </div>
          )}

          {tab === 'phantom' && (
            <div className="px-5 py-5 space-y-4 text-text-2 text-[14px] leading-relaxed">
              <p>
                Phantom MCP server is a router from any AI agent to Solana native tools. Skilld registers as a Phantom MCP partner so that asking Claude or Cursor "what is the Builder Score for toly.sol" routes through Phantom directly to Skilld.
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Phantom MCP discovers Skilld via <code className="bg-surface-3 px-1.5 py-0.5 rounded font-mono text-[13px]">.well-known/skilld-mcp.json</code></li>
                <li>Agent calls Skilld tools through Phantom MCP transport</li>
                <li>If a tool requires payment (intro request) Phantom Wallet handles the 1 USDC sign and broadcast</li>
                <li>Skilld returns SAS attestation PDAs that Phantom Wallet can verify directly</li>
              </ol>
              <p className="text-text-3 text-[13px] font-medium">
                Phantom Connect SDK is the recommended login adapter. We support it as the primary wallet path with @solana/wallet-adapter-react fallback for Solflare and Backpack.
              </p>
            </div>
          )}
        </div>

        <div className="card px-5 py-5">
          <h2 className="text-[18px] font-semibold text-text mb-3">Live onchain proofs an agent can fetch right now</h2>
          <ul className="grid grid-cols-2 gap-3">
            <li>
              <a
                href="https://solscan.io/account/4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6?cluster=devnet"
                target="_blank"
                rel="noreferrer"
                className="block border border-border rounded p-3 hover:bg-surface-2 transition"
              >
                <div className="text-[11px] text-text-3 font-bold uppercase tracking-wider">Anchor program</div>
                <div className="text-text font-semibold text-[14px] mt-0.5 font-mono">4prD…Z5Cn6</div>
                <div className="text-text-2 text-[12px] mt-0.5">skilld_attest live on devnet</div>
              </a>
            </li>
            <li>
              <a
                href="https://solscan.io/account/DYSu7em1rxVZuYbjVhSNafwgDH3Mc1NbZTrUu4xFFKM6?cluster=devnet"
                target="_blank"
                rel="noreferrer"
                className="block border border-border rounded p-3 hover:bg-surface-2 transition"
              >
                <div className="text-[11px] text-text-3 font-bold uppercase tracking-wider">SAS credential</div>
                <div className="text-text font-semibold text-[14px] mt-0.5 font-mono">DYSu…FFKM6</div>
                <div className="text-text-2 text-[12px] mt-0.5">Skilld issuer root of trust</div>
              </a>
            </li>
            <li>
              <Link to="/attestations" className="block border border-border rounded p-3 hover:bg-surface-2 transition">
                <div className="text-[11px] text-text-3 font-bold uppercase tracking-wider">Onchain confirmations</div>
                <div className="text-text font-semibold text-[18px] mt-0.5 tabular-nums">16</div>
                <div className="text-text-2 text-[12px] mt-0.5">Verifiable Solscan replay</div>
              </Link>
            </li>
            <li>
              <a
                href="https://skilld-app.vercel.app/.well-known/skilld-mcp.json"
                target="_blank"
                rel="noreferrer"
                className="block border border-border rounded p-3 hover:bg-surface-2 transition"
              >
                <div className="text-[11px] text-text-3 font-bold uppercase tracking-wider">MCP descriptor</div>
                <div className="text-text font-semibold text-[14px] mt-0.5">4 tools 1 resource</div>
                <div className="text-text-2 text-[12px] mt-0.5">Discoverable by any agent</div>
              </a>
            </li>
          </ul>
        </div>
      </main>

      <aside className="lg:col-span-4 space-y-2">
        <div className="card p-5">
          <h3 className="text-[18px] font-semibold text-text">Agent stack</h3>
          <ul className="mt-3 space-y-3 text-[14px]">
            <StackItem label="Discovery" value=".well-known/skilld-mcp.json" />
            <StackItem label="Transport" value="HTTP JSON-RPC" />
            <StackItem label="Identity" value="SNS Records V2" />
            <StackItem label="Reputation" value="Solana Attestation Service" />
            <StackItem label="Payments" value="x402 USDC on Solana" />
            <StackItem label="Privacy" value="MagicBlock PER" />
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="text-[16px] font-semibold text-text">Why agents care</h3>
          <p className="text-text-2 text-[13px] mt-2 font-medium leading-snug">
            Hiring is the most expensive workflow on the internet. AI recruiters need machine readable trust signals. Skilld is the first builder reputation MCP on Solana.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="text-[16px] font-semibold text-text">Developer support</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] text-accent font-semibold">
            <li><a href="https://docs.phantom.com/resources/mcp-server" target="_blank" rel="noreferrer" className="hover:underline">Phantom MCP docs</a></li>
            <li><a href="https://modelcontextprotocol.io/" target="_blank" rel="noreferrer" className="hover:underline">Model Context Protocol</a></li>
            <li><a href="https://solana.com/x402" target="_blank" rel="noreferrer" className="hover:underline">Solana x402</a></li>
            <li><a href="https://attest.solana.com/" target="_blank" rel="noreferrer" className="hover:underline">Solana Attestation Service</a></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Tab({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 text-[14px] font-semibold border-b-2 -mb-px ${
        active ? 'border-accent text-accent' : 'border-transparent text-text-2 hover:text-text'
      } transition`}
    >
      {children}
    </button>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[13px] shrink-0">{n}</span>
      <div className="flex-1">
        <div className="text-text font-semibold text-[15px] leading-tight">{title}</div>
        <div className="text-text-2 text-[14px] mt-0.5 font-medium leading-snug">{body}</div>
      </div>
    </div>
  );
}

function ToolDoc({ name, summary, input, output }: { name: string; summary: string; input: string; output: string }) {
  return (
    <div className="border border-border rounded p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-white font-bold uppercase tracking-wider">tool</span>
        <code className="text-[14px] font-mono font-semibold text-text">{name}</code>
      </div>
      <p className="text-text-2 text-[13px] mt-1 font-medium">{summary}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        <div>
          <div className="text-[11px] text-text-3 font-semibold uppercase tracking-wider mb-1">input</div>
          <pre className="bg-surface-3 border border-border rounded p-2 text-[12px] font-mono text-text whitespace-pre-wrap overflow-x-auto">{input}</pre>
        </div>
        <div>
          <div className="text-[11px] text-text-3 font-semibold uppercase tracking-wider mb-1">output</div>
          <pre className="bg-surface-3 border border-border rounded p-2 text-[12px] font-mono text-text whitespace-pre-wrap overflow-x-auto">{output}</pre>
        </div>
      </div>
    </div>
  );
}

function CurlBlock({ label, cmd }: { label: string; cmd: string }) {
  return (
    <div>
      <div className="text-text font-semibold text-[14px] mb-1">{label}</div>
      <pre className="bg-text text-surface rounded p-3 text-[12px] font-mono whitespace-pre overflow-x-auto">{cmd}</pre>
    </div>
  );
}

function StackItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-2">
      <span className="text-text-3 font-medium">{label}</span>
      <span className="text-text font-semibold text-right">{value}</span>
    </li>
  );
}

function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 9V7c0-1.1-.9-2-2-2h-3V3h-2v2h-2V3H9v2H6c-1.1 0-2 .9-2 2v2H2v2h2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6h2V9h-2zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zm8.5 5.5H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z" />
    </svg>
  );
}
