//! Anchor events emitted by the program.
//!
//! Events are the canonical way for indexers and AI agents to subscribe to
//! attestation activity without having to poll every account. Skilld emits
//! one event per state transition so a downstream listener can rebuild the
//! full attestation graph from the event stream alone.

use anchor_lang::prelude::*;

use crate::constants::PROGRAM_VERSION;

/// Emitted when a fresh counter PDA is initialized for a new builder.
///
/// This event is useful for indexers that want to track the set of builders
/// that have ever received at least one attestation, without having to
/// enumerate program accounts.
#[event]
pub struct CounterInitialized {
    /// Target builder this counter belongs to.
    pub target: Pubkey,
    /// Wallet that paid the rent for the new counter PDA.
    pub payer: Pubkey,
    /// Program schema version active when this event was emitted.
    pub version: u8,
    /// Unix timestamp captured from the cluster clock.
    pub timestamp: i64,
}

impl CounterInitialized {
    /// Constructor that fills the schema version and the timestamp from the
    /// runtime, leaving target and payer to the caller.
    pub fn new(target: Pubkey, payer: Pubkey, clock: &Clock) -> Self {
        Self {
            target,
            payer,
            version: PROGRAM_VERSION,
            timestamp: clock.unix_timestamp,
        }
    }
}

/// Emitted on every successful public attestation.
///
/// Subscribers can use the `skill` and `context` fields directly for ranking
/// or display, no follow up account fetch required. The counter PDA value
/// after the increment is included so a fast indexer can update aggregate
/// state without an extra read.
#[event]
pub struct PublicAttestation {
    /// Target builder receiving the attestation.
    pub target: Pubkey,
    /// Signer that authored the attestation.
    pub signer: Pubkey,
    /// Skill label, length capped to [`crate::constants::MAX_SKILL_LEN`].
    pub skill: String,
    /// Context payload, length capped to [`crate::constants::MAX_CONTEXT_LEN`].
    pub context: String,
    /// Public counter value after the increment.
    pub new_public_count: u64,
    /// Unix timestamp captured from the cluster clock.
    pub timestamp: i64,
}

impl PublicAttestation {
    /// Convenience constructor mirroring [`CounterInitialized::new`].
    pub fn new(
        target: Pubkey,
        signer: Pubkey,
        skill: String,
        context: String,
        new_public_count: u64,
        clock: &Clock,
    ) -> Self {
        Self {
            target,
            signer,
            skill,
            context,
            new_public_count,
            timestamp: clock.unix_timestamp,
        }
    }
}

/// Emitted on every successful sealed attestation.
///
/// The payload itself stays encrypted off chain. Only the commitment hash is
/// exposed in the event so verifiers can later prove an attestation existed
/// without revealing its contents.
#[event]
pub struct SealedAttestation {
    /// Target builder receiving the sealed attestation.
    pub target: Pubkey,
    /// Signer that authored the sealed attestation.
    pub signer: Pubkey,
    /// Commitment hash committed to Solana, typically a SHA 256 digest hex
    /// string.
    pub sealed_hash: String,
    /// Sealed counter value after the increment.
    pub new_sealed_count: u64,
    /// Unix timestamp captured from the cluster clock.
    pub timestamp: i64,
}

impl SealedAttestation {
    /// Convenience constructor.
    pub fn new(
        target: Pubkey,
        signer: Pubkey,
        sealed_hash: String,
        new_sealed_count: u64,
        clock: &Clock,
    ) -> Self {
        Self {
            target,
            signer,
            sealed_hash,
            new_sealed_count,
            timestamp: clock.unix_timestamp,
        }
    }
}

/// Emitted when an attestation is revoked by its original signer.
///
/// Lets indexers expunge revoked entries from their aggregations without
/// running their own diff pass against historical account data.
#[event]
pub struct AttestationRevoked {
    /// Target builder whose attestation has been revoked.
    pub target: Pubkey,
    /// Signer that revoked their own attestation.
    pub signer: Pubkey,
    /// `true` when the revoked attestation was sealed, `false` for public.
    pub was_sealed: bool,
    /// Counter value after the decrement, on the matching public or sealed
    /// counter depending on `was_sealed`.
    pub new_count: u64,
    /// Unix timestamp captured from the cluster clock.
    pub timestamp: i64,
}

impl AttestationRevoked {
    /// Convenience constructor.
    pub fn new(
        target: Pubkey,
        signer: Pubkey,
        was_sealed: bool,
        new_count: u64,
        clock: &Clock,
    ) -> Self {
        Self {
            target,
            signer,
            was_sealed,
            new_count,
            timestamp: clock.unix_timestamp,
        }
    }
}
