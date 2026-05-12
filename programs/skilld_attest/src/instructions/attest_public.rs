//! Public attestation handler.
//!
//! Writes a fresh detail account holding the skill and the context strings
//! in clear text. Increments the public counter on the parent counter PDA so
//! any reader can fetch a single small account to learn the aggregate
//! attestation volume without enumerating the detail accounts.

use anchor_lang::prelude::*;

use crate::constants::{COUNTER_SEED, DETAIL_SEED, MAX_CONTEXT_LEN, MAX_SKILL_LEN};
use crate::errors::SkilldError;
use crate::events::PublicAttestation;
use crate::state::{AttestationCounter, AttestationDetail};

/// Account context for the [`attest_public`] handler.
///
/// The signer and the payer can be the same wallet or two distinct wallets.
/// Splitting them makes it possible for a sponsor account to subsidize the
/// rent of an attestation while the actual reputation lives with the signer.
#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct AttestPublic<'info> {
    /// Wallet paying the rent for the new detail PDA.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Wallet authoring the attestation. The signature ties the on chain
    /// detail account to a specific Solana identity and is the basis of the
    /// peer attestation weight in the Builder Score.
    pub signer: Signer<'info>,

    /// Counter PDA being mutated. Derived from `target` so it cannot be
    /// silently swapped for a different builder's counter.
    #[account(
        mut,
        seeds = [COUNTER_SEED, target.as_ref()],
        bump = counter.bump
    )]
    pub counter: Account<'info, AttestationCounter>,

    /// Detail PDA being created. Derived from both `target` and `signer.key()`
    /// which gives each signer at most one outstanding detail per target.
    /// Attempting to write a second public attestation from the same signer
    /// for the same target fails because Anchor refuses to reinitialize the
    /// account.
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

/// Handler for `attest_public`.
///
/// Validates the skill and context lengths against the constants, writes the
/// detail account, increments the public counter with overflow protection,
/// emits a [`PublicAttestation`] event.
pub fn handler(
    ctx: Context<AttestPublic>,
    _target: Pubkey,
    skill: String,
    context: String,
) -> Result<()> {
    require!(skill.len() <= MAX_SKILL_LEN, SkilldError::SkillTooLong);
    require!(context.len() <= MAX_CONTEXT_LEN, SkilldError::ContextTooLong);

    let target = ctx.accounts.counter.target;
    let signer = ctx.accounts.signer.key();
    let clock = Clock::get()?;

    let detail = &mut ctx.accounts.detail;
    detail.target = target;
    detail.signer = signer;
    detail.skill = skill.clone();
    detail.context = context.clone();
    detail.created_at = clock.unix_timestamp;
    detail.sealed = false;

    let counter = &mut ctx.accounts.counter;
    counter.public_count = counter
        .public_count
        .checked_add(1)
        .ok_or(SkilldError::Overflow)?;

    emit!(PublicAttestation::new(
        target,
        signer,
        skill,
        context,
        counter.public_count,
        &clock,
    ));

    msg!("attest_public count={}", counter.public_count);
    Ok(())
}
