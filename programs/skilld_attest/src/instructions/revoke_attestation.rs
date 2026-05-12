//! Revoke a previously written attestation.
//!
//! Only the original signer can revoke their own attestation. Revoking
//! closes the detail PDA, returning rent to the signer, and decrements the
//! matching counter on the parent counter PDA. The public and the sealed
//! paths share a single handler because the detail account stores the
//! `sealed` flag and the handler dispatches on it at runtime.

use anchor_lang::prelude::*;

use crate::constants::{COUNTER_SEED, DETAIL_SEED};
use crate::errors::SkilldError;
use crate::events::AttestationRevoked;
use crate::state::{AttestationCounter, AttestationDetail};

/// Account context for the [`revoke_attestation`] handler.
///
/// The detail account is closed with the rent refund routed to the original
/// signer. Anchor enforces the `close` semantics including zeroing the
/// account data and reassigning the lamports.
#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct RevokeAttestation<'info> {
    /// Original signer of the attestation being revoked. Must match the
    /// signer stored on the detail PDA, enforced through a `has_one` style
    /// check in the handler.
    #[account(mut)]
    pub signer: Signer<'info>,

    /// Counter PDA owning the public and sealed counts for the target.
    #[account(
        mut,
        seeds = [COUNTER_SEED, target.as_ref()],
        bump = counter.bump,
        constraint = counter.target == target @ SkilldError::TargetMismatch,
    )]
    pub counter: Account<'info, AttestationCounter>,

    /// Detail PDA being closed. Anchor refuses to close if the signer
    /// constraint below fails, providing a single layer of authorization on
    /// top of the seed derivation check.
    #[account(
        mut,
        close = signer,
        seeds = [DETAIL_SEED, target.as_ref(), signer.key().as_ref()],
        bump,
        constraint = detail.signer == signer.key() @ SkilldError::Unauthorized,
        constraint = detail.target == target @ SkilldError::TargetMismatch,
    )]
    pub detail: Account<'info, AttestationDetail>,
}

/// Handler for `revoke_attestation`.
///
/// Reads the `sealed` flag off the detail account, decrements the matching
/// counter with underflow protection, emits a [`AttestationRevoked`] event,
/// and lets Anchor handle the actual account close on return.
pub fn handler(ctx: Context<RevokeAttestation>, _target: Pubkey) -> Result<()> {
    let sealed = ctx.accounts.detail.sealed;
    let target = ctx.accounts.detail.target;
    let signer = ctx.accounts.signer.key();
    let clock = Clock::get()?;

    let counter = &mut ctx.accounts.counter;
    let new_count = if sealed {
        counter.sealed_count = counter
            .sealed_count
            .checked_sub(1)
            .ok_or(SkilldError::Overflow)?;
        counter.sealed_count
    } else {
        counter.public_count = counter
            .public_count
            .checked_sub(1)
            .ok_or(SkilldError::Overflow)?;
        counter.public_count
    };

    emit!(AttestationRevoked::new(target, signer, sealed, new_count, &clock));

    msg!(
        "revoke_attestation sealed={} new_count={}",
        sealed,
        new_count
    );
    Ok(())
}
