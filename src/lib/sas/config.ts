export const SKILLD_CREDENTIAL_NAME = 'SKILLD' as const;
export const BUILDER_SCORE_SCHEMA_NAME = 'BUILDER-SCORE' as const;
export const PEER_VOUCH_SCHEMA_NAME = 'PEER-VOUCH' as const;
export const SCHEMA_VERSION = 1;

export const BUILDER_SCORE_FIELDS = ['score', 'hackathon_wins', 'bounties_won', 'github_commits', 'onchain_actions'] as const;
export const BUILDER_SCORE_LAYOUT = new Uint8Array([4, 4, 4, 4, 4]);

export const PEER_VOUCH_FIELDS = ['skill', 'context', 'signer'] as const;
export const PEER_VOUCH_LAYOUT = new Uint8Array([12, 12, 12]);

export const ISSUER_AUTHORITY_ENV = 'VITE_SKILLD_ISSUER_AUTHORITY';
