//! Pure Rust implementation of the Skilld Builder Score formula.
//!
//! The TypeScript reference implementation lives at
//! `src/lib/score/computeScore.ts`. This crate mirrors that implementation
//! byte for byte so any Rust off chain indexer or any future Anchor program
//! that wants to verify a Builder Score can compute it locally without
//! depending on the TypeScript code or a remote API.
//!
//! The two implementations are tested against each other in the integration
//! test suite to guarantee they stay in sync. Drifting one without the
//! other constitutes a breaking change to the score and requires a version
//! bump in both crates.
//!
//! Formula overview. Six dimensions contribute to the Builder Score, each
//! weighted as a percentage of the final value:
//!
//! - Colosseum placements, 25 percent
//! - Superteam Earn bounties, 20 percent
//! - Onchain activity, 20 percent
//! - GitHub contributions, 15 percent
//! - Peer attestations, 15 percent
//! - Bootcamp credentials, 5 percent
//!
//! Each dimension produces a sub score capped at 100. The weighted sub
//! scores are summed and rounded to the nearest integer to produce the
//! final Builder Score, which is itself capped at 100.

/// Weight assigned to Colosseum placements in the final Builder Score.
pub const WEIGHT_COLOSSEUM: u32 = 25;
/// Weight assigned to Superteam Earn bounties.
pub const WEIGHT_SUPERTEAM: u32 = 20;
/// Weight assigned to onchain activity (program deploys and tx count).
pub const WEIGHT_ONCHAIN: u32 = 20;
/// Weight assigned to GitHub contributions.
pub const WEIGHT_GITHUB: u32 = 15;
/// Weight assigned to peer attestations issued through the Solana
/// Attestation Service or via the Skilld Anchor program.
pub const WEIGHT_ATTESTATIONS: u32 = 15;
/// Weight assigned to bootcamp credentials issued by Turbin3, School of
/// Solana, Rise In and similar partner schools.
pub const WEIGHT_CREDENTIALS: u32 = 5;

/// Placement categories recognized for Colosseum hackathons.
///
/// The variants follow Colosseum's own taxonomy. Future placements added
/// upstream should be added at the end of this enum to preserve numeric
/// stability when serialized.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Placement {
    /// Grand Champion award. The highest single award per cycle.
    Grand,
    /// Top 10 standout placement.
    Top10,
    /// Top 20 standout placement.
    Top20,
    /// Reached the finalist round.
    Finalist,
    /// University award track.
    University,
    /// Public Good award track.
    PublicGood,
    /// Participation only. No award won.
    Submission,
}

impl Placement {
    /// Convert a placement variant to the raw points it contributes before
    /// the dimension cap is applied.
    pub fn raw_points(&self) -> u32 {
        match self {
            Placement::Grand => 30,
            Placement::Top10 => 18,
            Placement::Top20 => 12,
            Placement::Finalist => 6,
            Placement::University | Placement::PublicGood => 14,
            Placement::Submission => 2,
        }
    }
}

/// Compute the Colosseum sub score from a list of hackathon placements.
///
/// Sums the raw points contributed by each placement and caps the total at
/// 100 before the dimension weight is applied at the top level.
pub fn colosseum_points(placements: &[Placement]) -> u32 {
    if placements.is_empty() {
        return 0;
    }
    let raw: u32 = placements.iter().map(|p| p.raw_points()).sum();
    raw.min(100)
}

/// Compute the Superteam Earn sub score.
///
/// `count` is the number of bounties won and `total_usd` is the sum of
/// every payout. The sub score is the sum of a count component (six points
/// per win capped at 50) and an earnings component (50 points scaled
/// linearly against 50,000 USD), with the total capped at 100.
pub fn superteam_points(count: u32, total_usd: u64) -> u32 {
    if count == 0 {
        return 0;
    }
    let count_score = (count.saturating_mul(6)).min(50);
    let earned_score = ((total_usd as u128).saturating_mul(50) / 50_000).min(50) as u32;
    (count_score + earned_score).min(100)
}

/// Compute the onchain activity sub score.
///
/// `programs_deployed` counts distinct programs the builder has deployed on
/// Solana, contributing 25 points each up to a 60 point cap. `tx_count`
/// counts the total transactions sent from the builder's wallet, scaled to
/// 40 points against a 10,000 transaction benchmark. Capped at 100.
pub fn onchain_points(programs_deployed: u32, tx_count: u32) -> u32 {
    let program_score = (programs_deployed.saturating_mul(25)).min(60);
    let tx_score = ((tx_count as u64).saturating_mul(40) / 10_000).min(40) as u32;
    (program_score + tx_score).min(100)
}

/// Compute the GitHub sub score.
///
/// `commits` counts the builder's total public commits to known Solana
/// organizations, scaled to 60 points against a 500 commit benchmark.
/// `repos` counts the builder's public repos, contributing eight points
/// each up to a 40 point cap. Total capped at 100.
pub fn github_points(commits: u32, repos: u32) -> u32 {
    let repo_score = (repos.saturating_mul(8)).min(40);
    let commit_score = ((commits as u64).saturating_mul(60) / 500).min(60) as u32;
    (repo_score + commit_score).min(100)
}

/// Compute the peer attestation sub score.
///
/// `attestor_scores` holds the Builder Score of each wallet that wrote a
/// peer attestation for the builder. Each attestation contributes between
/// 0.2 and 1.0 weight depending on the attestor's own score, scaled by 25.
/// The minimum weight of 0.2 prevents wallets with no Builder Score from
/// being treated as worthless attesters. Capped at 100.
pub fn attestation_points(attestor_scores: &[u32]) -> u32 {
    if attestor_scores.is_empty() {
        return 0;
    }
    let total: u64 = attestor_scores
        .iter()
        .map(|s| (s.max(&20).clone() as u64))
        .sum();
    // total is a sum of u32 values each in [20, 100]. Apply the
    // (total / 100) * 25 transform with extra precision through u64 math.
    let scaled = (total.saturating_mul(25)) / 100;
    scaled.min(100) as u32
}

/// Compute the bootcamp credential sub score. Each credential contributes
/// 25 points capped at 100, matching the TS reference implementation.
pub fn credential_points(credentials: u32) -> u32 {
    (credentials.saturating_mul(25)).min(100)
}

/// Builder Score inputs grouped into one struct.
///
/// Mirrors `ScoreInputs` from the TypeScript reference. Construct one of
/// these and pass it to [`compute_builder_score`] to get the breakdown and
/// the total.
#[derive(Debug, Clone, Default)]
pub struct ScoreInputs {
    /// Colosseum placements claimed by the builder.
    pub hackathons: Vec<Placement>,
    /// Number of Superteam Earn bounties the builder has won.
    pub bounty_count: u32,
    /// Sum of every Superteam Earn payout in USD.
    pub bounty_total_usd: u64,
    /// Distinct Solana programs the builder has deployed.
    pub programs_deployed: u32,
    /// Total transactions sent by the builder's wallet.
    pub tx_count: u32,
    /// Public GitHub commits to known Solana organizations.
    pub commits: u32,
    /// Public repos owned by the builder.
    pub repos: u32,
    /// Builder Score of each wallet that wrote a peer attestation.
    pub attestor_scores: Vec<u32>,
    /// Number of bootcamp credentials issued to the builder.
    pub credentials: u32,
}

/// Breakdown returned by [`compute_builder_score`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ScoreBreakdown {
    /// Colosseum sub score after the dimension weight is applied.
    pub colosseum: u32,
    /// Superteam Earn sub score after the dimension weight is applied.
    pub superteam: u32,
    /// Onchain sub score after the dimension weight is applied.
    pub onchain: u32,
    /// GitHub sub score after the dimension weight is applied.
    pub github: u32,
    /// Peer attestation sub score after the dimension weight is applied.
    pub attestations: u32,
    /// Bootcamp credentials sub score after the dimension weight is applied.
    pub credentials: u32,
    /// Final Builder Score, rounded to the nearest integer and capped at 100.
    pub total: u32,
}

/// Compute the full Builder Score from a [`ScoreInputs`] bundle.
///
/// Returns a [`ScoreBreakdown`] holding each weighted dimension sub score
/// plus the final total. The total is capped at 100 to keep the score
/// comparable across builders regardless of how saturated their individual
/// dimensions are.
pub fn compute_builder_score(inputs: &ScoreInputs) -> ScoreBreakdown {
    let colosseum_raw = colosseum_points(&inputs.hackathons);
    let superteam_raw = superteam_points(inputs.bounty_count, inputs.bounty_total_usd);
    let onchain_raw = onchain_points(inputs.programs_deployed, inputs.tx_count);
    let github_raw = github_points(inputs.commits, inputs.repos);
    let attestations_raw = attestation_points(&inputs.attestor_scores);
    let credentials_raw = credential_points(inputs.credentials);

    let colosseum = weighted(colosseum_raw, WEIGHT_COLOSSEUM);
    let superteam = weighted(superteam_raw, WEIGHT_SUPERTEAM);
    let onchain = weighted(onchain_raw, WEIGHT_ONCHAIN);
    let github = weighted(github_raw, WEIGHT_GITHUB);
    let attestations = weighted(attestations_raw, WEIGHT_ATTESTATIONS);
    let credentials = weighted(credentials_raw, WEIGHT_CREDENTIALS);

    let total = (colosseum + superteam + onchain + github + attestations + credentials).min(100);
    ScoreBreakdown {
        colosseum,
        superteam,
        onchain,
        github,
        attestations,
        credentials,
        total,
    }
}

/// Apply a percentage weight to a raw sub score, rounding to nearest.
fn weighted(raw: u32, weight: u32) -> u32 {
    ((raw as u64 * weight as u64 + 50) / 100) as u32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_inputs_score_zero() {
        let s = compute_builder_score(&ScoreInputs::default());
        assert_eq!(s.total, 0);
    }

    #[test]
    fn grand_champion_only_caps_at_dimension_weight() {
        let inputs = ScoreInputs {
            hackathons: vec![Placement::Grand],
            ..Default::default()
        };
        let s = compute_builder_score(&inputs);
        // Grand worth 30, dimension cap 100, weight 25 => sub score 8 (rounded).
        assert!(s.colosseum >= 7 && s.colosseum <= 9);
        assert_eq!(s.superteam, 0);
    }

    #[test]
    fn max_score_caps_at_one_hundred() {
        let inputs = ScoreInputs {
            hackathons: vec![
                Placement::Grand,
                Placement::Grand,
                Placement::Grand,
                Placement::Grand,
                Placement::Grand,
            ],
            bounty_count: 50,
            bounty_total_usd: 1_000_000,
            programs_deployed: 10,
            tx_count: 100_000,
            commits: 5_000,
            repos: 50,
            attestor_scores: vec![100; 50],
            credentials: 10,
        };
        let s = compute_builder_score(&inputs);
        assert_eq!(s.total, 100);
    }

    #[test]
    fn placement_raw_points_table() {
        assert_eq!(Placement::Grand.raw_points(), 30);
        assert_eq!(Placement::Top10.raw_points(), 18);
        assert_eq!(Placement::Top20.raw_points(), 12);
        assert_eq!(Placement::Finalist.raw_points(), 6);
        assert_eq!(Placement::University.raw_points(), 14);
        assert_eq!(Placement::PublicGood.raw_points(), 14);
        assert_eq!(Placement::Submission.raw_points(), 2);
    }

    #[test]
    fn weighted_rounds_to_nearest() {
        assert_eq!(weighted(50, 25), 13);
        assert_eq!(weighted(100, 25), 25);
        assert_eq!(weighted(0, 25), 0);
    }

    #[test]
    fn superteam_zero_count_zero_score() {
        assert_eq!(superteam_points(0, 100_000), 0);
    }

    #[test]
    fn attestation_floors_low_score_attesters() {
        // An attester with score 5 should still contribute the floor 20.
        let s = attestation_points(&[5]);
        // (20 * 25) / 100 = 5
        assert_eq!(s, 5);
    }

    #[test]
    fn github_max_caps_at_one_hundred() {
        assert_eq!(github_points(100_000, 100), 100);
    }

    #[test]
    fn credential_caps_at_one_hundred() {
        assert_eq!(credential_points(10), 100);
        assert_eq!(credential_points(0), 0);
        assert_eq!(credential_points(2), 50);
    }
}
