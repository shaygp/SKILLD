//! Instruction handler modules.
//!
//! Each instruction lives in its own file alongside the `#[derive(Accounts)]`
//! context struct it consumes. The `#[program]` entry in `lib.rs` re-exports
//! these handler functions through `use` statements so the public API of the
//! program is identical to a monolithic single file layout.
//!
//! Splitting per instruction keeps cross instruction account confusion
//! minimal and makes Anchor's macro expansion easier to audit because each
//! `#[derive(Accounts)]` struct is bound to exactly one handler.

pub mod attest_private;
pub mod attest_public;
pub mod init_counter;
pub mod revoke_attestation;

pub use attest_private::*;
pub use attest_public::*;
pub use init_counter::*;
pub use revoke_attestation::*;
