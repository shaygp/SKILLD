use anchor_lang::prelude::*;

declare_id!("4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6");

const COUNTER_SEED: &[u8] = b"skilld_counter";
const DETAIL_SEED: &[u8] = b"skilld_detail";

#[program]
pub mod skilld_attest {
    use super::*;

    pub fn init_counter(ctx: Context<InitCounter>, target: Pubkey) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.target = target;
        counter.public_count = 0;
        counter.sealed_count = 0;
        counter.bump = ctx.bumps.counter;
        msg!("init_counter target={}", target);
        Ok(())
    }

    pub fn attest_public(
        ctx: Context<Attest>,
        _target: Pubkey,
        skill: String,
        context: String,
    ) -> Result<()> {
        require!(skill.len() <= 32, SkilldError::SkillTooLong);
        require!(context.len() <= 280, SkilldError::ContextTooLong);

        let detail = &mut ctx.accounts.detail;
        detail.target = ctx.accounts.counter.target;
        detail.signer = ctx.accounts.signer.key();
        detail.skill = skill;
        detail.context = context;
        detail.created_at = Clock::get()?.unix_timestamp;
        detail.sealed = false;

        let counter = &mut ctx.accounts.counter;
        counter.public_count = counter
            .public_count
            .checked_add(1)
            .ok_or(SkilldError::Overflow)?;
        msg!("attest_public count={}", counter.public_count);
        Ok(())
    }

    pub fn attest_private(
        ctx: Context<Attest>,
        _target: Pubkey,
        sealed_hash: String,
    ) -> Result<()> {
        require!(sealed_hash.len() <= 64, SkilldError::ContextTooLong);

        let detail = &mut ctx.accounts.detail;
        detail.target = ctx.accounts.counter.target;
        detail.signer = ctx.accounts.signer.key();
        detail.skill = String::new();
        detail.context = sealed_hash;
        detail.created_at = Clock::get()?.unix_timestamp;
        detail.sealed = true;

        let counter = &mut ctx.accounts.counter;
        counter.sealed_count = counter
            .sealed_count
            .checked_add(1)
            .ok_or(SkilldError::Overflow)?;
        msg!("attest_private sealed_count={}", counter.sealed_count);
        Ok(())
    }
}

#[account]
pub struct AttestationCounter {
    pub target: Pubkey,
    pub public_count: u64,
    pub sealed_count: u64,
    pub bump: u8,
}

impl AttestationCounter {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 1;
}

#[account]
pub struct AttestationDetail {
    pub target: Pubkey,
    pub signer: Pubkey,
    pub skill: String,
    pub context: String,
    pub created_at: i64,
    pub sealed: bool,
}

impl AttestationDetail {
    pub const SIZE: usize = 8 + 32 + 32 + 4 + 32 + 4 + 280 + 8 + 1;
}

#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct InitCounter<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = AttestationCounter::SIZE,
        seeds = [COUNTER_SEED, target.as_ref()],
        bump
    )]
    pub counter: Account<'info, AttestationCounter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct Attest<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [COUNTER_SEED, target.as_ref()],
        bump = counter.bump
    )]
    pub counter: Account<'info, AttestationCounter>,
    #[account(
        init,
        payer = payer,
        space = AttestationDetail::SIZE,
        seeds = [DETAIL_SEED, target.as_ref(), signer.key().as_ref()],
        bump
    )]
    pub detail: Account<'info, AttestationDetail>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum SkilldError {
    #[msg("Skill string exceeds 32 bytes")]
    SkillTooLong,
    #[msg("Context string exceeds 280 bytes")]
    ContextTooLong,
    #[msg("Counter overflow")]
    Overflow,
}
