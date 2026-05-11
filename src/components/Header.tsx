import { Link, NavLink, useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim().toLowerCase();
    if (!v) return;
    const target = v.endsWith('.sol') ? v : `${v}.sol`;
    navigate(`/${target}`);
  }

  return (
    <header className="bg-text text-bg sticky top-0 z-30 border-b border-text">
      <div className="max-w-[1280px] mx-auto px-5 h-[56px] flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/assets/logos/skilld.png" alt="Skilld" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-[18px] font-bold tracking-tight">Skilld</span>
        </Link>

        <form onSubmit={onSubmit} className="hidden md:block w-[240px] lg:w-[280px] ml-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bg/55">
              <SearchIcon />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="resolve any .sol"
              className="w-full bg-white/8 border border-white/15 rounded-full pl-9 pr-3 py-[6px] text-[13px] text-bg placeholder:text-bg/45 focus:outline-none focus:bg-white/12 focus:border-success-bright transition mono"
            />
          </div>
        </form>

        <nav className="hidden lg:flex items-center ml-auto gap-1">
          <NavItem to="/" label="Feed" end />
          <NavItem to="/search" label="Builders" />
          <NavItem to="/activity" label="Bounties" />
          <NavItem to="/attestations" label="Attestations" />
          <NavItem to="/agents" label="Agents" />
        </nav>

        <div className="ml-auto lg:ml-2 shrink-0">
          <WalletMultiButton style={{
            height: 32,
            fontSize: 13,
            padding: '0 16px',
            background: '#14f195',
            color: '#0a0a0a',
            borderRadius: 999,
            fontWeight: 700,
          }} />
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative px-3 py-1 text-[13px] font-semibold whitespace-nowrap transition rounded-full ${
          isActive ? 'bg-success-bright text-text' : 'text-bg/85 hover:text-bg hover:bg-white/8'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
