//! Initialize a per builder attestation counter.
//!
//! The first attestation pointed at a given target builder needs an
//! [`AttestationCounter`] account allocated and rent paid. Subsequent
//! attestations reuse the same counter so this instruction runs at most
//! once per builder under normal operation.

use anchor_lang::prelude::*;

use crate::constants::COUNTER_SEED;
use crate::events::CounterInitialized;
use crate::state::AttestationCounter;

/// Account context for the [`init_counter`] handler.
///
/// Anchor derives the counter PDA from `[COUNTER_SEED, target.as_ref()]`.
/// Because the PDA is deterministic in `target`, a caller cannot accidentally
/// create a counter pointing at a builder they do not control without that
/// builder's pubkey already being known. The pubkey itself is not a secret,
/// so this is an availability protection rather than a confidentiality one.
#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct InitCounter<'info> {
    /// Wallet paying the rent for the new counter PDA. Does not need to be
    /// the same wallet as the target builder, although in the most common
    /// flow the builder bootstraps their own counter at first sign in.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Counter PDA being initialized. Anchor refuses to initialize a counter
    /// that already exists, which gives a built in idempotency guard.
    #[account(
        init,
        payer = payer,
        space = AttestationCounter::SIZE,
        seeds = [COUNTER_SEED, target.as_ref()],
        bump
    )]
    pub counter: Account<'info, AttestationCounter>,

    /// Standard Solana system program, required for the `init` allocation.
    pub system_program: Program<'info, System>,
}

/// Handler for `init_counter`.
///
/// Stores the target pubkey, zeroes both counts, caches the PDA bump and
/// emits a [`CounterInitialized`] event so indexers know a new builder has
/// entered the attestation graph.
pub fn handler(ctx: Context<InitCounter>, target: Pubkey) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.target = target;
    counter.public_count = 0;
    counter.sealed_count = 0;
    counter.bump = ctx.bumps.counter;

    let clock = Clock::get()?;
    emit!(CounterInitialized::new(target, ctx.accounts.payer.key(), &clock));

    msg!("init_counter target={}", target);
    Ok(())
}
