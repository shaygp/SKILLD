//! Skilld attestation Anchor program.
//!
//! The program implements a public and sealed attestation counter rail for
//! the Skilld Builder Score. Public attestations expose skill and context in
//! the clear. Sealed attestations commit only a digest on chain while the
//! payload lives off chain inside a MagicBlock Private Ephemeral Rollup.
//!
//! Module layout:
//! - `constants` shared seed prefixes and length limits
//! - `state` Anchor account structs ([`AttestationCounter`] and
//!   [`AttestationDetail`])
//! - `errors` typed [`errors::SkilldError`] enum surfaced by the handlers
//! - `events` Anchor `#[event]` structs emitted on every state transition
//! - `instructions` one file per instruction with its accounts struct and
//!   the handler. The `#[program]` block below stitches them back together
//!
//! Splitting per concern keeps the program auditable. Each instruction lives
//! next to the account context it consumes and emits exactly the events its
//! handler is documented to emit.

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6");

#[program]
pub mod skilld_attest {
    use super::*;

    /// Initialize a per builder counter PDA. See
    /// [`instructions::init_counter::handler`].
    pub fn init_counter(ctx: Context<InitCounter>, target: Pubkey) -> Result<()> {
        instructions::init_counter::handler(ctx, target)
    }

    /// Write a public attestation. See
    /// [`instructions::attest_public::handler`].
    pub fn attest_public(
        ctx: Context<AttestPublic>,
        target: Pubkey,
        skill: String,
        context: String,
    ) -> Result<()> {
        instructions::attest_public::handler(ctx, target, skill, context)
    }

    /// Write a sealed attestation. See
    /// [`instructions::attest_private::handler`].
    pub fn attest_private(
        ctx: Context<AttestPrivate>,
        target: Pubkey,
        sealed_hash: String,
    ) -> Result<()> {
        instructions::attest_private::handler(ctx, target, sealed_hash)
    }

    /// Revoke an attestation previously written by the signer. See
    /// [`instructions::revoke_attestation::handler`].
    pub fn revoke_attestation(ctx: Context<RevokeAttestation>, target: Pubkey) -> Result<()> {
        instructions::revoke_attestation::handler(ctx, target)
    }
}
