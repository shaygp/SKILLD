//! On chain constants shared across instructions.
//!
//! All length limits below correspond directly to the `space` field of the
//! Anchor account definitions in `state.rs`. Changing any constant here without
//! adjusting the matching `SIZE` constant invites runtime allocation errors
//! during `init`, so the two modules must stay in lockstep.

/// Seed prefix for the per builder [`AttestationCounter`] PDA.
///
/// The full seed list is `[COUNTER_SEED, target_pubkey]` which yields one
/// counter account per target builder regardless of how many distinct
/// attesters write attestations for that builder.
pub const COUNTER_SEED: &[u8] = b"skilld_counter";

/// Seed prefix for the per (target, signer) [`AttestationDetail`] PDA.
///
/// The full seed list is `[DETAIL_SEED, target_pubkey, signer_pubkey]` which
/// limits each signer to one outstanding detail account per builder. This
/// prevents an attester from spamming a target with multiple public vouches
/// for the same skill and from running griefing rent attacks against the
/// detail PDA space.
pub const DETAIL_SEED: &[u8] = b"skilld_detail";

/// Maximum length of the skill string in bytes.
///
/// Chosen to fit typical skill labels like `Rust`, `Anchor`, `Tokenomics` and
/// `Product` while keeping the rent footprint small. Strings are stored using
/// the Borsh length prefix encoding so the on chain layout reserves four
/// length bytes plus the maximum payload bytes.
pub const MAX_SKILL_LEN: usize = 32;

/// Maximum length of the context string in bytes for a public attestation.
///
/// Matches the historical 280 character soft limit for a single statement of
/// recommendation. The clamp gives recruiters and AI agents a predictable
/// payload size when scanning attestations through the read path.
pub const MAX_CONTEXT_LEN: usize = 280;

/// Maximum length of the sealed payload string for a private attestation.
///
/// Sized to hold a 32 byte SHA 256 commitment encoded as a 64 character hex
/// string plus a small Bech32 prefix. Anything larger should live inside a
/// MagicBlock Private Ephemeral Rollup detail account and only commit its
/// digest on Solana.
pub const MAX_SEALED_HASH_LEN: usize = 64;

/// Version tag emitted in every successful attestation event.
///
/// Bumping this number signals to indexers that the event schema or the
/// account layout has changed. Skilld off chain code keys downstream decoders
/// off this field so older clients fail closed instead of decoding new
/// payloads with the wrong field order.
pub const PROGRAM_VERSION: u8 = 1;

/// Public counter index used to disambiguate between the public and the
/// sealed counter inside emitted events.
pub const COUNTER_KIND_PUBLIC: u8 = 0;

/// Sealed counter index used to disambiguate between the public and the
/// sealed counter inside emitted events.
pub const COUNTER_KIND_SEALED: u8 = 1;
