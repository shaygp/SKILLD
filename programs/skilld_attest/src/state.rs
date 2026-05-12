//! Account state for the Skilld attestation program.
//!
//! Two account types live here. [`AttestationCounter`] is the aggregate
//! counter PDA owned by the target builder, holding public and sealed counts.
//! [`AttestationDetail`] is the per (target, signer) PDA holding the actual
//! skill, context and timestamp for one attestation.

use anchor_lang::prelude::*;

use crate::constants::{MAX_CONTEXT_LEN, MAX_SEALED_HASH_LEN, MAX_SKILL_LEN};

/// Aggregate counter account, one per builder.
///
/// Created lazily when the first attestation lands for that target. The
/// counter exists separately from the detail account so any Solana app or AI
/// agent that only needs the totals can fetch a small account and skip the
/// larger detail blob fetch.
#[account]
pub struct AttestationCounter {
    /// The builder this counter belongs to. Anchor verifies the PDA bump
    /// against this field during every attestation, so a counter cannot be
    /// pointed at a different target through a forged signer.
    pub target: Pubkey,

    /// Number of public attestations issued to this target. Public
    /// attestations expose skill and context in the clear and contribute
    /// directly to the Builder Score.
    pub public_count: u64,

    /// Number of sealed attestations issued to this target. Sealed
    /// attestations commit only a hash on Solana. Their content lives off
    /// chain or inside a MagicBlock Private Ephemeral Rollup.
    pub sealed_count: u64,

    /// Cached PDA bump so the counter does not need to recompute the bump
    /// every time it is loaded by a CPI caller.
    pub bump: u8,
}

impl AttestationCounter {
    /// Borsh serialized size of [`AttestationCounter`] including the eight
    /// byte Anchor discriminator. Used as the `space` argument when the
    /// counter is initialized in `init_counter`.
    pub const SIZE: usize = 8     // discriminator
        + 32                       // target pubkey
        + 8                        // public_count u64
        + 8                        // sealed_count u64
        + 1; // bump byte

    /// Returns the sum of public and sealed counts. Provides a single number
    /// for callers that do not care about the public versus sealed split, for
    /// example a leaderboard ordering builders by attestation volume.
    pub fn total_attestations(&self) -> u64 {
        self.public_count.saturating_add(self.sealed_count)
    }
}

/// Detail account, one per (target, signer) pair.
///
/// Holds the actual attestation payload. The `sealed` flag distinguishes a
/// public attestation (skill and context in the clear) from a sealed
/// attestation (only the commitment hash on chain).
#[account]
pub struct AttestationDetail {
    /// The builder being attested to. Mirrors the target field on the parent
    /// [`AttestationCounter`] for self contained CPI reads.
    pub target: Pubkey,

    /// The wallet that signed and authored this attestation. For public
    /// attestations this should match the signer of the attest instruction.
    /// For sealed attestations the signer is included so any verifier can
    /// recover who committed the hash even when the payload itself stays
    /// encrypted off chain.
    pub signer: Pubkey,

    /// Skill label for a public attestation. Empty for sealed attestations
    /// since the skill is part of the sealed payload.
    pub skill: String,

    /// Free form context for a public attestation, or the sealed hash for a
    /// private attestation. The interpretation is decided by the `sealed`
    /// flag below so the same byte field serves both shapes.
    pub context: String,

    /// Unix timestamp at which the attestation was written, captured from
    /// the Solana cluster clock.
    pub created_at: i64,

    /// Discriminator between public and sealed shapes. `false` means the
    /// `skill` and `context` fields are plaintext and contribute to the
    /// Builder Score via the public counter. `true` means `context` is a
    /// commitment hash and `skill` is empty.
    pub sealed: bool,
}

impl AttestationDetail {
    /// Borsh serialized size of [`AttestationDetail`] including the eight
    /// byte Anchor discriminator and the four byte Borsh length prefixes for
    /// the two strings.
    pub const SIZE: usize = 8        // discriminator
        + 32                          // target
        + 32                          // signer
        + 4 + MAX_SKILL_LEN           // skill string with length prefix
        + 4 + MAX_CONTEXT_LEN         // context or sealed hash with length prefix
        + 8                           // created_at i64
        + 1; // sealed flag

    /// Maximum useful length the `context` field can hold. Switches between
    /// the public context limit and the sealed hash limit based on the
    /// `sealed` flag so callers can preflight payload size before paying
    /// transaction fees.
    pub fn max_context_for(sealed: bool) -> usize {
        if sealed {
            MAX_SEALED_HASH_LEN
        } else {
            MAX_CONTEXT_LEN
        }
    }
}
