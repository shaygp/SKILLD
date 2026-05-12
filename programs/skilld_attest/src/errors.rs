//! Program error enum.
//!
//! Anchor generates the discriminator and the formatted `msg` automatically
//! from the `#[msg(...)]` attribute. The numeric codes are derived from the
//! variant order so adding new variants at the end is safe, while reordering
//! variants will break clients that already pinned a numeric code in their
//! tooling. Treat the enum as append only.

use anchor_lang::prelude::*;

#[error_code]
pub enum SkilldError {
    /// Returned when the supplied skill label exceeds `MAX_SKILL_LEN` bytes.
    /// Keep skill labels short so the on chain layout stays predictable.
    #[msg("Skill string exceeds the maximum length budget")]
    SkillTooLong,

    /// Returned when the supplied context exceeds `MAX_CONTEXT_LEN` bytes
    /// for a public attestation. Sealed attestations have a tighter budget
    /// because they only hold a commitment hash.
    #[msg("Context string exceeds the maximum length budget")]
    ContextTooLong,

    /// Returned when the supplied sealed hash exceeds `MAX_SEALED_HASH_LEN`
    /// bytes. Sealed attestations should commit at most a 32 byte digest
    /// encoded as hex.
    #[msg("Sealed hash exceeds the maximum length budget")]
    SealedHashTooLong,

    /// Returned when the counter would wrap past `u64::MAX`. With the current
    /// fee model this would require 2^64 attestations against a single
    /// builder which is operationally impossible, but the explicit check
    /// keeps the program safe from a future fee waiver attack.
    #[msg("Counter overflow, cannot increment past u64 max")]
    Overflow,

    /// Returned when a caller tries to revoke an attestation it did not
    /// author. Revocation must be signed by the original signer so each
    /// attestation remains under the control of its issuer.
    #[msg("Revocation must be signed by the original attestation signer")]
    Unauthorized,

    /// Returned when the supplied counter PDA does not match the detail
    /// PDA's stored target. Defends against attempts to thread a detail from
    /// one builder through the counter of another builder.
    #[msg("Counter target mismatch with detail target")]
    TargetMismatch,

    /// Returned when an instruction is asked to act on a sealed account
    /// using the public path or the inverse. The `sealed` flag and the
    /// instruction selector must agree.
    #[msg("Attestation kind mismatch between instruction and account flag")]
    KindMismatch,

    /// Returned when an unsupported program version is encountered. Reserved
    /// for the upgrade flow when a future version of the schema is rolled
    /// out and older clients submit transactions formatted for the older
    /// schema.
    #[msg("Program version not supported by this build")]
    UnsupportedVersion,
}
