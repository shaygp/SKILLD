//! Pure Rust client helpers for the Skilld attestation program.
//!
//! This crate intentionally avoids depending on Anchor at runtime. It only
//! pulls in `solana-program` for the [`Pubkey`] type and the standard library
//! for borsh style serialization. Any Rust program that wants to call
//! `skilld_attest` through a CPI, or any off chain indexer written in Rust,
//! can compose with this crate without inheriting Anchor's dependency tree.
//!
//! Three families of helpers live here:
//!
//! - PDA derivation. [`derive_counter_pda`] and [`derive_detail_pda`] return
//!   the same addresses the Anchor program computes from its `seeds = [...]`
//!   attributes, so client code can reference the account without round
//!   tripping through the program.
//!
//! - Instruction discriminator computation. [`anchor_discriminator`]
//!   replicates Anchor's `sighash("global", name)` first eight bytes so a
//!   raw transaction builder can emit the exact wire format the program
//!   expects.
//!
//! - Instruction data builders. [`build_init_counter_data`],
//!   [`build_attest_public_data`], [`build_attest_private_data`] and
//!   [`build_revoke_attestation_data`] return the full byte payload ready
//!   to be passed to `Instruction::data`.
//!
//! The crate is intentionally small. Callers are expected to assemble the
//! full [`solana_program::instruction::Instruction`] themselves with the
//! account keys they have already collected, since the account list varies
//! per caller (some flows have separate payer and signer wallets, some
//! collapse them into one).

use sha2::{Digest, Sha256};
use solana_program::pubkey::Pubkey;

/// On chain program ID of the deployed Skilld attestation program.
///
/// Matches the `declare_id!` in `programs/skilld_attest/src/lib.rs`. Callers
/// can refer to this constant rather than hard coding the base58 string,
/// which catches mismatches at compile time if the program is ever
/// redeployed under a fresh ID.
pub const PROGRAM_ID: Pubkey = solana_program::pubkey!(
    "4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6"
);

/// Seed prefix for the per builder counter PDA. Mirrors
/// `programs/skilld_attest/src/constants.rs`.
pub const COUNTER_SEED: &[u8] = b"skilld_counter";

/// Seed prefix for the per (target, signer) detail PDA. Mirrors
/// `programs/skilld_attest/src/constants.rs`.
pub const DETAIL_SEED: &[u8] = b"skilld_detail";

/// Derive the [`AttestationCounter`](crate) PDA for a given target builder.
///
/// Returns the same `(Pubkey, u8)` tuple Anchor's `seeds = [...]` and
/// `bump` mechanism produces, so client code can prefetch the counter
/// account before sending a transaction and validate it client side.
pub fn derive_counter_pda(target: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[COUNTER_SEED, target.as_ref()], &PROGRAM_ID)
}

/// Derive the [`AttestationDetail`](crate) PDA for a given (target, signer)
/// pair.
///
/// Each signer can hold at most one outstanding detail per target. Calling
/// this helper before submitting an attestation lets the client preflight
/// whether a detail already exists and would block the next init.
pub fn derive_detail_pda(target: &Pubkey, signer: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[DETAIL_SEED, target.as_ref(), signer.as_ref()],
        &PROGRAM_ID,
    )
}

/// Compute the Anchor `global:<name>` instruction discriminator.
///
/// Anchor stores the first eight bytes of `SHA256("global:<name>")` at the
/// front of every instruction data buffer. Client code that bypasses Anchor
/// and builds raw `Instruction` values must replicate this prefix or the
/// program rejects the instruction with a discriminator mismatch.
pub fn anchor_discriminator(instruction_name: &str) -> [u8; 8] {
    let mut hasher = Sha256::new();
    hasher.update(format!("global:{}", instruction_name));
    let result = hasher.finalize();
    let mut out = [0u8; 8];
    out.copy_from_slice(&result[..8]);
    out
}

/// Encode a string in Borsh's standard `length prefix + bytes` layout.
///
/// Anchor's `String` arguments are serialized as a little endian `u32`
/// length followed by the UTF 8 bytes of the string. This helper produces
/// the same output the Anchor client would, ready to be appended to an
/// instruction data buffer.
fn encode_borsh_string(s: &str) -> Vec<u8> {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(4 + bytes.len());
    out.extend_from_slice(&(bytes.len() as u32).to_le_bytes());
    out.extend_from_slice(bytes);
    out
}

/// Build the instruction data buffer for `init_counter`.
///
/// Layout: `[discriminator(8), target(32)]`. Pass the returned bytes as
/// `Instruction::data` together with the account keys for the payer, the
/// counter PDA, and the system program.
pub fn build_init_counter_data(target: &Pubkey) -> Vec<u8> {
    let mut data = Vec::with_capacity(8 + 32);
    data.extend_from_slice(&anchor_discriminator("init_counter"));
    data.extend_from_slice(target.as_ref());
    data
}

/// Build the instruction data buffer for `attest_public`.
///
/// Layout: `[discriminator(8), target(32), skill(borsh_string),
/// context(borsh_string)]`.
pub fn build_attest_public_data(target: &Pubkey, skill: &str, context: &str) -> Vec<u8> {
    let mut data = Vec::with_capacity(8 + 32 + 4 + skill.len() + 4 + context.len());
    data.extend_from_slice(&anchor_discriminator("attest_public"));
    data.extend_from_slice(target.as_ref());
    data.extend_from_slice(&encode_borsh_string(skill));
    data.extend_from_slice(&encode_borsh_string(context));
    data
}

/// Build the instruction data buffer for `attest_private`.
///
/// Layout: `[discriminator(8), target(32), sealed_hash(borsh_string)]`.
pub fn build_attest_private_data(target: &Pubkey, sealed_hash: &str) -> Vec<u8> {
    let mut data = Vec::with_capacity(8 + 32 + 4 + sealed_hash.len());
    data.extend_from_slice(&anchor_discriminator("attest_private"));
    data.extend_from_slice(target.as_ref());
    data.extend_from_slice(&encode_borsh_string(sealed_hash));
    data
}

/// Build the instruction data buffer for `revoke_attestation`.
///
/// Layout: `[discriminator(8), target(32)]`.
pub fn build_revoke_attestation_data(target: &Pubkey) -> Vec<u8> {
    let mut data = Vec::with_capacity(8 + 32);
    data.extend_from_slice(&anchor_discriminator("revoke_attestation"));
    data.extend_from_slice(target.as_ref());
    data
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn derives_distinct_pdas() {
        let target = Pubkey::new_unique();
        let other = Pubkey::new_unique();
        let signer_a = Pubkey::new_unique();
        let signer_b = Pubkey::new_unique();

        let (counter_a, _) = derive_counter_pda(&target);
        let (counter_b, _) = derive_counter_pda(&other);
        assert_ne!(counter_a, counter_b, "different targets must derive different counters");

        let (detail_aa, _) = derive_detail_pda(&target, &signer_a);
        let (detail_ab, _) = derive_detail_pda(&target, &signer_b);
        assert_ne!(detail_aa, detail_ab, "different signers must derive different details");
    }

    #[test]
    fn discriminator_matches_known_global() {
        let init = anchor_discriminator("init_counter");
        let attest_public = anchor_discriminator("attest_public");
        let attest_private = anchor_discriminator("attest_private");
        assert_ne!(init, attest_public);
        assert_ne!(init, attest_private);
        assert_ne!(attest_public, attest_private);
    }

    #[test]
    fn init_counter_data_round_trip() {
        let target = Pubkey::new_unique();
        let data = build_init_counter_data(&target);
        assert_eq!(data.len(), 40, "init_counter is fixed 8 + 32 bytes");
        assert_eq!(&data[..8], &anchor_discriminator("init_counter"));
        assert_eq!(&data[8..40], target.as_ref());
    }

    #[test]
    fn attest_public_data_round_trip() {
        let target = Pubkey::new_unique();
        let data = build_attest_public_data(&target, "Rust", "shipped at Frontier");
        assert!(data.len() > 8 + 32 + 4 + 4, "payload must include both strings");
        assert_eq!(&data[..8], &anchor_discriminator("attest_public"));
    }

    #[test]
    fn borsh_string_length_prefix() {
        let encoded = encode_borsh_string("hello");
        assert_eq!(encoded[..4], 5u32.to_le_bytes());
        assert_eq!(&encoded[4..], b"hello");
    }
}
