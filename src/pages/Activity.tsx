import { useOpenListings, useActivityFeed } from '../lib/superteam/hooks';
import { rewardForFeedItem, type SuperteamFeedItem, type SuperteamListing } from '../lib/superteam/api';
import { Avatar } from '../components/Avatar';

export function ActivityPage() {
  const { data: listings, loading: listingsLoading } = useOpenListings(20);
  const { data: feed, loading: feedLoading } = useActivityFeed(40);

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <main className="lg:col-span-8 space-y-3">
        <div className="card px-5 py-4">
          <h1 className="text-[22px] font-bold text-text">Live activity</h1>
          <p className="text-text-2 text-[14px] mt-1">
            Submissions and grants happening across Superteam Earn right now. Pulled directly from the public API.
          </p>
        </div>

        <div className="card">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-[18px] font-semibold text-text">Latest submissions</h2>
          </div>
          {feedLoading ? (
            <div className="px-5 py-6 text-text-2 text-[14px]">Loading from Superteam Earn...</div>
          ) : feed.length === 0 ? (
            <div className="px-5 py-6 text-text-2 text-[14px]">No activity right now.</div>
          ) : (
            <ul>
              {feed.slice(0, 30).map((item, i) => (
                <li key={`${item.userId}-${item.listingId}-${i}`} className="px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface-2 transition">
                  <FeedRow item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <aside className="lg:col-span-4 space-y-3">
        <div className="card">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-[18px] font-semibold text-text">Open bounties</h2>
            <p className="text-[12px] text-text-3 mt-0.5 font-medium">
              {listingsLoading ? 'Loading...' : `${listings.length} live`}
            </p>
          </div>
          {listings.slice(0, 10).map((l) => <ListingRow key={l.id} listing={l} />)}
        </div>
      </aside>
    </div>
  );
}

function FeedRow({ item }: { item: SuperteamFeedItem }) {
  const reward = rewardForFeedItem(item);
  const isWinner = item.isWinner === true;
  const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.username;

  return (
    <div className="flex items-center gap-3">
      <a href={`https://earn.superteam.fun/t/${item.username}`} target="_blank" rel="noreferrer" className="shrink-0">
        <Avatar domain={item.username} size={44} />
      </a>
      <div className="flex-1 min-w-0">
        <div className="text-[14px]">
          <span className="font-semibold text-text">{fullName}</span>
          <span className="text-text-2"> {isWinner ? 'won' : 'submitted to'} </span>
          <span className="font-semibold text-text">{item.listingTitle}</span>
        </div>
        <div className="text-text-3 text-[12px] mt-0.5 font-medium flex items-center gap-1">
          {item.sponsorLogo && (
            <img src={item.sponsorLogo} alt="" className="w-4 h-4 rounded object-cover" />
          )}
          {item.sponsorName} · {timeAgo(item.createdAt)}
        </div>
      </div>
      {reward > 0 ? (
        <div className="text-right shrink-0">
          <div className={`font-mono text-[14px] tabular-nums font-bold ${isWinner ? 'text-success' : 'text-text-3'}`}>
            +{reward.toLocaleString()} {item.token}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ListingRow({ listing }: { listing: SuperteamListing }) {
  const url = `https://superteam.fun/earn/listing/${listing.slug}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-surface-2 transition"
    >
      {listing.sponsor.logo ? (
        <img src={listing.sponsor.logo} alt={listing.sponsor.name} className="w-10 h-10 rounded object-cover shrink-0 bg-surface-3" />
      ) : (
        <div className="w-10 h-10 rounded bg-surface-3 border border-border shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-text font-semibold text-[14px] truncate leading-snug">{listing.title}</div>
        <div className="text-text-3 text-[12px] mt-0.5 font-medium">{listing.sponsor.name}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-text font-mono font-bold text-[13px] tabular-nums">
          {listing.rewardAmount.toLocaleString()} {listing.token}
        </div>
        <div className="text-[11px] text-text-3 font-medium uppercase tracking-wider mt-0.5">{listing.type}</div>
      </div>
    </a>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
