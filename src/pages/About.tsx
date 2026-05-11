export function AboutPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      <div className="card p-8">
        <h1 className="text-[32px] font-bold text-text leading-tight">About skilld</h1>
        <p className="mt-5 text-[16px] text-text-2 leading-relaxed">
          Solana has 3,200 active developers per month and zero way to know who they are. Today the best Solana hacker in Lagos is invisible. Tomorrow her .sol is her career.
        </p>
        <p className="mt-3 text-[16px] text-text-2 leading-relaxed">
          Skilld is the on chain career layer. Builder Score is composed of real verifiable events. Colosseum hackathon placements, Superteam Earn bounties, programs deployed on mainnet, GitHub contributions to Solana repos, and peer attestations signed by other .sol holders.
        </p>
        <p className="mt-3 text-[16px] text-text-2 leading-relaxed">
          Recruiters search by skill, score, and status. Builders own their reputation. SNS Records V2 stores the score on chain. Solana Attestation Service stores the attestations.
        </p>

        <h2 className="mt-8 text-[22px] font-bold text-text">How the score works</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Colosseum', weight: 25 },
            { label: 'Superteam Earn', weight: 20 },
            { label: 'Onchain activity', weight: 20 },
            { label: 'GitHub', weight: 15 },
            { label: 'Peer attestations', weight: 15 },
            { label: 'Credentials', weight: 5 },
          ].map((s) => (
            <div key={s.label} className="bg-surface-3 border border-border rounded p-4 flex justify-between items-center">
              <span className="text-text-2 text-[15px] font-medium">{s.label}</span>
              <span className="text-text font-bold text-[18px] tabular-nums">{s.weight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
