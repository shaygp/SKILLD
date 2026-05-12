//! Integration tests for the Skilld attestation client helpers.
//!
//! These tests exercise the public surface of `skilld_attest_client` without
//! touching a live Solana cluster. The goal is to lock the wire format the
//! crate emits against the format the deployed Anchor program expects, so a
//! future refactor of either side cannot silently break the integration.
//!
//! The tests are intentionally pedantic. Each one names the exact byte
//! layout it expects and would fail loudly if the discriminator hashing or
//! the Borsh string encoding changes incompatibly.

use skilld_attest_client::{
    anchor_discriminator,
    build_attest_private_data,
    build_attest_public_data,
    build_init_counter_data,
    build_revoke_attestation_data,
    derive_counter_pda,
    derive_detail_pda,
    PROGRAM_ID,
    COUNTER_SEED,
    DETAIL_SEED,
};
use solana_program::pubkey::Pubkey;

/// The deployed program ID on Solana devnet. Hard coded here so the test
/// fails immediately if the const in the crate diverges from the value that
/// was deployed.
const DEPLOYED_PROGRAM_ID: &str = "4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6";

#[test]
fn program_id_matches_deployed_address() {
    assert_eq!(
        PROGRAM_ID.to_string(),
        DEPLOYED_PROGRAM_ID,
        "crate PROGRAM_ID must match the deployed devnet program ID"
    );
}

#[test]
fn counter_pda_uses_canonical_seed() {
    let target = Pubkey::new_unique();
    let (pda, bump) = derive_counter_pda(&target);

    // Recompute the PDA from scratch using the documented seed list and
    // confirm the helper returns the same address.
    let (expected, expected_bump) =
        Pubkey::find_program_address(&[COUNTER_SEED, target.as_ref()], &PROGRAM_ID);

    assert_eq!(pda, expected, "counter PDA must match the documented seed list");
    assert_eq!(bump, expected_bump, "bump must match the documented seed list");
}

#[test]
fn detail_pda_uses_canonical_seed_pair() {
    let target = Pubkey::new_unique();
    let signer = Pubkey::new_unique();
    let (pda, bump) = derive_detail_pda(&target, &signer);

    let (expected, expected_bump) = Pubkey::find_program_address(
        &[DETAIL_SEED, target.as_ref(), signer.as_ref()],
        &PROGRAM_ID,
    );

    assert_eq!(pda, expected);
    assert_eq!(bump, expected_bump);
}

#[test]
fn detail_pdas_differ_per_signer() {
    let target = Pubkey::new_unique();
    let signer_a = Pubkey::new_unique();
    let signer_b = Pubkey::new_unique();

    let (a, _) = derive_detail_pda(&target, &signer_a);
    let (b, _) = derive_detail_pda(&target, &signer_b);
    assert_ne!(a, b, "different signers must derive different detail PDAs");
}

#[test]
fn detail_pdas_differ_per_target() {
    let target_a = Pubkey::new_unique();
    let target_b = Pubkey::new_unique();
    let signer = Pubkey::new_unique();

    let (a, _) = derive_detail_pda(&target_a, &signer);
    let (b, _) = derive_detail_pda(&target_b, &signer);
    assert_ne!(a, b, "different targets must derive different detail PDAs");
}

#[test]
fn init_counter_discriminator_is_stable() {
    let disc = anchor_discriminator("init_counter");
    let data = build_init_counter_data(&Pubkey::new_unique());
    assert_eq!(&data[..8], &disc, "first eight bytes must be the discriminator");
}

#[test]
fn attest_public_discriminator_is_stable() {
    let disc = anchor_discriminator("attest_public");
    let data = build_attest_public_data(&Pubkey::new_unique(), "Rust", "shipped");
    assert_eq!(&data[..8], &disc);
}

#[test]
fn attest_private_discriminator_is_stable() {
    let disc = anchor_discriminator("attest_private");
    let data = build_attest_private_data(&Pubkey::new_unique(), "abcd1234");
    assert_eq!(&data[..8], &disc);
}

#[test]
fn revoke_attestation_discriminator_is_stable() {
    let disc = anchor_discriminator("revoke_attestation");
    let data = build_revoke_attestation_data(&Pubkey::new_unique());
    assert_eq!(&data[..8], &disc);
}

#[test]
fn init_counter_data_has_fixed_size() {
    let target = Pubkey::new_unique();
    let data = build_init_counter_data(&target);
    assert_eq!(
        data.len(),
        40,
        "init_counter is exactly 8 bytes discriminator plus 32 bytes target"
    );
}

#[test]
fn revoke_attestation_data_has_fixed_size() {
    let target = Pubkey::new_unique();
    let data = build_revoke_attestation_data(&target);
    assert_eq!(
        data.len(),
        40,
        "revoke_attestation is exactly 8 bytes discriminator plus 32 bytes target"
    );
}

#[test]
fn attest_public_data_borsh_string_layout() {
    let target = Pubkey::new_unique();
    let data = build_attest_public_data(&target, "Rust", "shipped at Cypherpunk");

    // Layout: 8 discriminator, 32 target, 4 skill length, 4 skill bytes,
    // 4 context length, 21 context bytes. Total 73 bytes.
    let expected = 8 + 32 + 4 + 4 + 4 + 21;
    assert_eq!(data.len(), expected);
}

#[test]
fn attest_public_handles_empty_skill() {
    let target = Pubkey::new_unique();
    let data = build_attest_public_data(&target, "", "some context");

    // Empty skill is encoded as four zero length bytes followed by no
    // payload. The helper must still produce a buffer including the four
    // length bytes.
    let skill_len_offset = 8 + 32;
    assert_eq!(
        &data[skill_len_offset..skill_len_offset + 4],
        &0u32.to_le_bytes()
    );
}

#[test]
fn attest_public_handles_max_length_skill() {
    let target = Pubkey::new_unique();
    let skill = "A".repeat(32); // matches MAX_SKILL_LEN
    let data = build_attest_public_data(&target, &skill, "ctx");

    let skill_len_offset = 8 + 32;
    let skill_payload_offset = skill_len_offset + 4;
    assert_eq!(
        &data[skill_len_offset..skill_payload_offset],
        &32u32.to_le_bytes()
    );
    assert_eq!(
        &data[skill_payload_offset..skill_payload_offset + 32],
        skill.as_bytes()
    );
}

#[test]
fn attest_private_handles_64_char_hex_hash() {
    let target = Pubkey::new_unique();
    let hash = "a".repeat(64);
    let data = build_attest_private_data(&target, &hash);

    let hash_len_offset = 8 + 32;
    assert_eq!(
        &data[hash_len_offset..hash_len_offset + 4],
        &64u32.to_le_bytes()
    );
}

#[test]
fn discriminators_are_distinct_across_instructions() {
    let init = anchor_discriminator("init_counter");
    let pub_ = anchor_discriminator("attest_public");
    let priv_ = anchor_discriminator("attest_private");
    let revoke = anchor_discriminator("revoke_attestation");

    // All four must be distinct, otherwise the program would dispatch to
    // the wrong handler for some instruction.
    let mut seen = std::collections::HashSet::new();
    assert!(seen.insert(init));
    assert!(seen.insert(pub_));
    assert!(seen.insert(priv_));
    assert!(seen.insert(revoke));
}

#[test]
fn counter_seed_matches_program_constant() {
    assert_eq!(COUNTER_SEED, b"skilld_counter");
}

#[test]
fn detail_seed_matches_program_constant() {
    assert_eq!(DETAIL_SEED, b"skilld_detail");
}
