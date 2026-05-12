//! Sealed attestation handler.
//!
//! Writes a fresh detail account holding only a commitment hash in the
//! context field. The original payload stays off chain, typically inside a
//! MagicBlock Private Ephemeral Rollup, and only its digest is committed to
//! Solana. Increments the sealed counter on the parent counter PDA.

use anchor_lang::prelude::*;

use crate::constants::{COUNTER_SEED, DETAIL_SEED, MAX_SEALED_HASH_LEN};
use crate::errors::SkilldError;
use crate::events::SealedAttestation;
use crate::state::{AttestationCounter, AttestationDetail};

/// Account context for the [`attest_private`] handler.
///
/// The account layout mirrors [`super::attest_public::AttestPublic`] so a
/// caller can use the same client side helpers for both paths. The only
/// difference is in what the handler writes to the detail account.
#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct AttestPrivate<'info> {
    /// Wallet paying the rent for the new detail PDA.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Wallet authoring the sealed attestation. The signature ties the
    /// commitment to a Solana identity so any verifier with access to the
    /// off chain payload can prove who committed it.
    pub signer: Signer<'info>,

    /// Counter PDA being mutated, derived from `target`.
    #[account(
        mut,
        seeds = [COUNTER_SEED, target.as_ref()],
        bump = counter.bump
    )]
    pub counter: Account<'info, AttestationCounter>,

    /// Detail PDA being created. Same seed layout as the public path so the
    /// PDA derivation logic stays identical on the client.
    #[account(
        init,
        payer = payer,
        space = AttestationDetail::SIZE,
        seeds = [DETAIL_SEED, target.as_ref(), signer.key().as_ref()],
        bump
    )]
    pub detail: Account<'info, AttestationDetail>,

    /// System program for the rent allocation.
    pub system_program: Program<'info, System>,
}

/// Handler for `attest_private`.
///
/// Validates the sealed hash length, writes the detail account with the
/// `sealed` flag set, increments the sealed counter with overflow
/// protection, emits a [`SealedAttestation`] event.
pub fn handler(
    ctx: Context<AttestPrivate>,
    _target: Pubkey,
    sealed_hash: String,
) -> Result<()> {
    require!(sealed_hash.len() <= MAX_SEALED_HASH_LEN, SkilldError::SealedHashTooLong);

    let target = ctx.accounts.counter.target;
    let signer = ctx.accounts.signer.key();
    let clock = Clock::get()?;

    let detail = &mut ctx.accounts.detail;
    detail.target = target;
    detail.signer = signer;
    detail.skill = String::new();
    detail.context = sealed_hash.clone();
    detail.created_at = clock.unix_timestamp;
    detail.sealed = true;

    let counter = &mut ctx.accounts.counter;
    counter.sealed_count = counter
        .sealed_count
        .checked_add(1)
        .ok_or(SkilldError::Overflow)?;

    emit!(SealedAttestation::new(
        target,
        signer,
        sealed_hash,
        counter.sealed_count,
        &clock,
    ));

    msg!("attest_private sealed_count={}", counter.sealed_count);
    Ok(())
}
