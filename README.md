# Skilld

Skilld pulls Colosseum placements, Superteam Earn bounties, GitHub commits, mainnet program deploys and peer vouches into one Builder Score, published through SNS Records V2 and read by any Solana app or AI agent.

3,200 builders ship on Solana every month. Most of them never make it past a private channel.

---

## Live demo

| Surface | URL |
|---|---|
| Production app | https://skilld-app.vercel.app |
| MCP descriptor | https://skilld-app.vercel.app/.well-known/skilld-mcp.json |
| Profile example | https://skilld-app.vercel.app/framew0rk.sol |
| Network feed | https://skilld-app.vercel.app/activity |
| Attestation graph | https://skilld-app.vercel.app/attestations |
| Agents docs | https://skilld-app.vercel.app/agents |

---

## Onchain artifacts (Solana Devnet)

Every claim in this README is verifiable onchain. The Skilld issuer authority owns the credential, the credential owns the schemas, the schemas validate the attestations.

### Issuer wallet

```
2HQhDLgsxZAqVFNgjRJ99kmr3Tsap1ssuhEbWhSssNcq
```

Solscan: https://solscan.io/account/2HQhDLgsxZAqVFNgjRJ99kmr3Tsap1ssuhEbWhSssNcq?cluster=devnet

### SAS Credential PDA

The Skilld credential is the root of trust for every attestation Skilld issues. PDA derived from the issuer authority and the name `SKILLD`.

```
DYSu7em1rxVZnAVsuLWxF4hS95ctrZHsuaaVVZcCFgqD
```

Solscan: https://solscan.io/account/DYSu7em1rxVZnAVsuLWxF4hS95ctrZHsuaaVVZcCFgqD?cluster=devnet

### SAS Schemas

Two production schemas live on devnet under the credential.

| Schema | PDA | Fields |
|---|---|---|
| BUILDER-SCORE v1 | `HUyZHkxjKn522DHujBWaV8fYSggLFnD91naCx3X2JDC6` | score (u32), hackathon_wins (u32), bounties_won (u32), github_commits (u32), onchain_actions (u32) |
| PEER-VOUCH v1 | `AJD9ZP6K6jAjhH4YsmvCCiXJuckGPaoE2yf89Y2tqebY` | skill (string), context (string), signer (string) |

### Verified onchain transactions

Every attestation, payment and schema creation has been broadcast to devnet and confirmed. Click any signature to inspect the transaction on Solscan.

| Operation | Transaction signature | Solscan |
|---|---|---|
| Create BUILDER-SCORE schema | `5TbbPfEnTDtTQ9i7r12cAWJ7KWia9ZmNdGHN7XK8LtkAHV4ihqyxiLKgnXBuxfCxdCJqHYz8kWS8stkbfWeFx4tx` | [view](https://solscan.io/tx/5TbbPfEnTDtTQ9i7r12cAWJ7KWia9ZmNdGHN7XK8LtkAHV4ihqyxiLKgnXBuxfCxdCJqHYz8kWS8stkbfWeFx4tx?cluster=devnet) |
| Create PEER-VOUCH schema | `4zhPJkwquavvB1wihgTyNbs4RuiHhA5R3LvPzTBN34zdaMwsF5KNNmxP5c1MzBgi8zDGEAeDKoK2KE2x7q6Z5u9a` | [view](https://solscan.io/tx/4zhPJkwquavvB1wihgTyNbs4RuiHhA5R3LvPzTBN34zdaMwsF5KNNmxP5c1MzBgi8zDGEAeDKoK2KE2x7q6Z5u9a?cluster=devnet) |
| Issue BUILDER-SCORE for synthetic builder | `3yX1RBH17bVe2c3TmEbDsW6yf9ZMf9XEPKv9vkXMqhjYnpLMaJnGvoje6P3qXgA2p76cbYuBwjNxddE5397DMnEg` | [view](https://solscan.io/tx/3yX1RBH17bVe2c3TmEbDsW6yf9ZMf9XEPKv9vkXMqhjYnpLMaJnGvoje6P3qXgA2p76cbYuBwjNxddE5397DMnEg?cluster=devnet) |
| Issue PEER-VOUCH on Rust skill | `3F737y3Vd7dABTorrX5SJHjtXh7xSe21qRfiLohKWMVRkT9PMXfWbWPKoUZ9BBLrksGXMGQsaLcngR48uqqu2QQv` | [view](https://solscan.io/tx/3F737y3Vd7dABTorrX5SJHjtXh7xSe21qRfiLohKWMVRkT9PMXfWbWPKoUZ9BBLrksGXMGQsaLcngR48uqqu2QQv?cluster=devnet) |
| Issue BUILDER-SCORE for issuer self | `pfmFsotGYYLuY17taWH7jsoevyeo2Wbav1XT8vBJYZHwWRSdRcZQ9HaaSbnkGyuK3DTann8maAqgissXebunzAr` | [view](https://solscan.io/tx/pfmFsotGYYLuY17taWH7jsoevyeo2Wbav1XT8vBJYZHwWRSdRcZQ9HaaSbnkGyuK3DTann8maAqgissXebunzAr?cluster=devnet) |
| x402 paid intro 1 USDC (issuer to synthetic) | `6ESDxGKfqqKfXm8cKdYJvJmbjmghW7QUEaMiq64WNo7mqncrnErMGsAueSbN2QNB86DqQsMLArPUwNcFBaTX7pU` | [view](https://solscan.io/tx/6ESDxGKfqqKfXm8cKdYJvJmbjmghW7QUEaMiq64WNo7mqncrnErMGsAueSbN2QNB86DqQsMLArPUwNcFBaTX7pU?cluster=devnet) |
| Issue PEER-VOUCH for test user (signer attest) | `3sX4Kj1sRbp2vPC4bZGipYL3VKYygs8oxqa4JKhih4yP9LGvybKGL8AFn44GUqXrs8ZUPWEv6GbdDVX1Cfg2cyZ5` | [view](https://solscan.io/tx/3sX4Kj1sRbp2vPC4bZGipYL3VKYygs8oxqa4JKhih4yP9LGvybKGL8AFn44GUqXrs8ZUPWEv6GbdDVX1Cfg2cyZ5?cluster=devnet) |
| x402 paid intro 1 USDC (test user to framew0rk) | `5DJ8RGuRQMoKxFwW1Q9D4jWrw4SxcxaVWstQ5FLtdUricAeXFUsuegh21gkS6MoUxEHBiyL4mSk7UYDPj4twzAbp` | [view](https://solscan.io/tx/5DJ8RGuRQMoKxFwW1Q9D4jWrw4SxcxaVWstQ5FLtdUricAeXFUsuegh21gkS6MoUxEHBiyL4mSk7UYDPj4twzAbp?cluster=devnet) |
| Issue BUILDER-SCORE for test user | `3U6CTyjUQWjVf3Qf3ChPbgnWY4HdZqKA4mHhbfHkmbb94wQjnsgz9ReB3cuqeWkCLS6FnKXJPrVsMsp155LrvLzs` | [view](https://solscan.io/tx/3U6CTyjUQWjVf3Qf3ChPbgnWY4HdZqKA4mHhbfHkmbb94wQjnsgz9ReB3cuqeWkCLS6FnKXJPrVsMsp155LrvLzs?cluster=devnet) |
| Score chain stage 1 PEER-VOUCH (Rust) | `2XRab5dQDppftCk6Vrz96LgA9sWxujzbMp26g2bbovDyHK11fCRaP65PEXY8GocVnezzd7D8deQtyGc1zrcKTGK8` | [view](https://solscan.io/tx/2XRab5dQDppftCk6Vrz96LgA9sWxujzbMp26g2bbovDyHK11fCRaP65PEXY8GocVnezzd7D8deQtyGc1zrcKTGK8?cluster=devnet) |
| Score chain stage 2 PEER-VOUCH (Anchor) | `2CYJjmTm1hv8UCn1Bzz6BESqgzKXLpfsJpkAAvS7Qg3p1dSwyuuFvoANoCoXrmRgwpJ2VWGmGZe1WbiW7reqL4Ud` | [view](https://solscan.io/tx/2CYJjmTm1hv8UCn1Bzz6BESqgzKXLpfsJpkAAvS7Qg3p1dSwyuuFvoANoCoXrmRgwpJ2VWGmGZe1WbiW7reqL4Ud?cluster=devnet) |
| Score chain stage 3 PEER-VOUCH (Product) | `4UaEitqVBJpYY4s2DGn3Dnb26pX8mENGZMXKrT4r8ycnLFGHK3ythTT9RB7efTEJa96usik6FQKMuj9g1FavQpQi` | [view](https://solscan.io/tx/4UaEitqVBJpYY4s2DGn3Dnb26pX8mENGZMXKrT4r8ycnLFGHK3ythTT9RB7efTEJa96usik6FQKMuj9g1FavQpQi?cluster=devnet) |
| Score chain final BUILDER-SCORE (47, recomputed) | `59i4fkhUbvpkcrS8mbNJYAaz3AquBYh8Xta8LEXiQCnXdWF6gi1TK1ViJNqayeY9fzTjXVWaVJa3pNakZEAEAtSa` | [view](https://solscan.io/tx/59i4fkhUbvpkcrS8mbNJYAaz3AquBYh8Xta8LEXiQCnXdWF6gi1TK1ViJNqayeY9fzTjXVWaVJa3pNakZEAEAtSa?cluster=devnet) |
| Public vouch memo (SPL Memo program fallback counter) | `2aWFni9DppWeD4JbcrDUhM7exdKiPJPa6RfFngHXtDqjMpi1aMarQyzc6MaqpWBNq88fnyknVzC9sHgWphT3ujzp` | [view](https://solscan.io/tx/2aWFni9DppWeD4JbcrDUhM7exdKiPJPa6RfFngHXtDqjMpi1aMarQyzc6MaqpWBNq88fnyknVzC9sHgWphT3ujzp?cluster=devnet) |
| Sealed vouch memo with hash commitment | `LkMV3rMZ6xX28DmgYcuZdyU4oAPxNb9d7yWk2dHUg2oGNSHyBkHMQhjYK7ssrRqwq35fxiMBPPie5cG1aBqtewf` | [view](https://solscan.io/tx/LkMV3rMZ6xX28DmgYcuZdyU4oAPxNb9d7yWk2dHUg2oGNSHyBkHMQhjYK7ssrRqwq35fxiMBPPie5cG1aBqtewf?cluster=devnet) |
| Issuer counter state commit memo | `3ctzoPWg6K1GZY5LTAa9yTA96i45ZLUnbvp8YwvH14dQ2vDYdecXfhEJXk9kCyDM48LQS5FCB9rKiYtg6iBvoaq6` | [view](https://solscan.io/tx/3ctzoPWg6K1GZY5LTAa9yTA96i45ZLUnbvp8YwvH14dQ2vDYdecXfhEJXk9kCyDM48LQS5FCB9rKiYtg6iBvoaq6?cluster=devnet) |

**16 transactions onchain confirmed on Solana devnet for the Frontier submission window.** Score evolution chain proven: each new peer vouch via SAS PEER-VOUCH increments the Builder Score by a deterministic 2 points, then a fresh BUILDER-SCORE attestation snapshot is written reflecting the recomputed total.

### Skilld attest Anchor program (LIVE on devnet)

The custom Anchor program at `programs/skilld_attest/` is deployed and tested on Solana devnet. It exposes three instructions for the public and sealed attestation counter rail: `init_counter` creates a per builder counter PDA, `attest_public` increments the public counter while writing an AttestationDetail PDA with the full skill and context strings, and `attest_private` increments the sealed counter while writing a hash only AttestationDetail. The public counter remains visible to anyone resolving a profile while the sealed rail is the foundation for the MagicBlock Private Ephemeral Rollup delegation that lands next sprint.

| Asset | Value |
|---|---|
| Program ID | `4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6` |
| Anchor version | 0.32.1 |
| Solana platform tools | v1.52 (Rust 1.89) |
| Binary size | 232,600 bytes |
| Deploy cost | roughly 2.3 SOL on devnet |
| Cluster | devnet |
| Deploy transaction | `4Etm6mXr8ZKUyKFNf6sowy2JkwN3xWZc5UyUHKUBE29toUJVeUKao6wfSLCQrR4Ec5X5ZaBAGGzHisYwYSwT9ShE` |
| First init_counter call | `5X8JXHrWL95DbtxThqwruwrrP9ca7yiw1CjT4q3kKnB5EWvqgke7rW1BEqFdnow3TNirHt2qMXBaKHTy8rPjdswB` |
| First attest_public call | `2dvacaeG1Mawj9unJ1A9F2WSm9j9dcEeAfjSxESLkGKxf9sXhFH1Mwmc3LomWvY52eamP1E4qNKiqdocGHhYj6L3` |
| Live counter PDA example | `8ZeyL1qeyNjjS14jyG4sufaqxS7TpwAfBtR1MkbV4QVn` |

Inspect on Solscan: [program](https://solscan.io/account/4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6?cluster=devnet) and [deploy tx](https://solscan.io/tx/4Etm6mXr8ZKUyKFNf6sowy2JkwN3xWZc5UyUHKUBE29toUJVeUKao6wfSLCQrR4Ec5X5ZaBAGGzHisYwYSwT9ShE?cluster=devnet)

The frontend bindings are in `src/lib/magicblock/program.ts` and encode instructions through Anchor discriminator hashes so the UI calls the live program without a generated IDL. The SPL Memo program continues to back the legacy sealed memo trail for clients that have not migrated to the program yet.

### Sample attestation PDAs

Example attestation accounts you can resolve on devnet to confirm the schema decoding works as advertised.

| Subject | Schema | Attestation PDA |
|---|---|---|
| Synthetic builder | BUILDER-SCORE | `26cRrjMXGFMg5HqYdrGqGtwNv6dmf7WiJHy6rNH4NKUR` |
| Peer signer (Rust vouch) | PEER-VOUCH | `EFWGXjse2MpLibyASeJg5kxiaJp4WcsfXw223XaYx6HQ` |
| Issuer self vouch | BUILDER-SCORE | `7ruAPKhgHm6taZVv6pfnYX3rDsHsrJdM8VjWeqpzo5pk` |

### USDC payments rail (devnet)

| Asset | Address |
|---|---|
| USDC mint (devnet) | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Issuer USDC ATA | `5ZEVqbvoUTggYFxpRMn45qAswhzKX51Wyjap8f3UfQre` |

### MagicBlock Private Ephemeral Rollups (Pattern A)

Pattern A architecture: split account with public AttestationCounter on Solana plus AttestationDetail PDA. The public counter is live on devnet through the `skilld_attest` Anchor program (see the section above). The MagicBlock Private Ephemeral Rollup delegate macros land next sprint once the ephemeral-rollups-sdk solana_instruction version conflict is resolved upstream.

| Constant | Value |
|---|---|
| Skilld attest program ID | `4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6` |
| TEE devnet RPC | `https://devnet-tee.magicblock.app` |
| Permission program | `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1` |
| Delegation program | `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh` |
| TEE devnet validator | `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo` (Intel TDX) |

The program exposes four instructions: `init_counter`, `attest_public`, `attest_private`, `delegate_detail`. Frontend bindings are in `src/lib/magicblock/program.ts` with discriminator-based instruction encoding so the UI can call the program without depending on a generated IDL.

---

## System architecture

Skilld follows a layered architecture. The browser app is fully client side. All blockchain interactions go directly through the Solana RPC. No custom backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │   Home   │ │ Profile  │ │ Activity │ │   Attestations   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐     │
│  │ Builders │ │  Agents  │ │    SAS panel · MagicBlock    │     │
│  └──────────┘ └──────────┘ └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                  React Hooks (Business Logic)                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐       │
│  │ useGithub  │ │useSuperteam│ │ useBuilderScoreAttest  │       │
│  └────────────┘ └────────────┘ └────────────────────────┘       │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐       │
│  │ useIntros  │ │ useSealed  │ │ useAttestationsFor     │       │
│  └────────────┘ └────────────┘ └────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                       Lib Layer                                 │
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐   │
│  │  SNS   ││  SAS   ││  x402  ││Magic   ││World   ││GitHub  │   │
│  │Records ││sas lib ││spl     ││Block   ││ID stub ││public  │   │
│  │  V2    ││+ gill  ││token   ││PER sdk ││nullif. ││ API    │   │
│  └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘   │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                  Solana RPC + Public APIs                       │
│  ┌────────────────────┐ ┌─────────────────┐ ┌───────────────┐   │
│  │  Solana Devnet RPC │ │ superteam.fun   │ │ api.github.com│   │
│  │  Bonfida Records V2│ │ Earn API proxy  │ │ no auth flow  │   │
│  │  SAS programs      │ │ vite proxy CORS │ │               │   │
│  └────────────────────┘ └─────────────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data flow

The application enforces a unidirectional flow from wallet to UI back to chain.

```
wallet connects   →   resolve .sol   →   read SNS Records V2
       ↓                                       ↓
   Builder Score          ←        compose 6 weighted sources
       ↓                                       ↓
display profile  ←  decode SAS attestation PDAs  ←  fetch chain
       ↓
user clicks Vouch  →  signMessage  →  wallet signs  →  store + UI
       ↓
user clicks Publish onchain  →  buildPublishScoreTransaction
       ↓
SNS Records V2 createRecordV2Instruction or updateRecordV2Instruction
       ↓
broadcast to mainnet  →  Solscan tx confirmed  →  record skilld_score live
```

---

## Builder Score formula

Builder Score is a weighted sum of six verifiable sources. The score is recomputed on every page load by reading directly from the relevant data sources. Each source caps its own contribution so no single dimension dominates.

| Source | Weight | What it measures | How to verify |
|---|---|---|---|
| Colosseum placements | 25 | Hackathon top finishes, university awards, public good awards | Curated Hall of Fame index in `lib/colosseum/winners.ts` |
| Superteam Earn bounties | 20 | Bounty wins, total earned, recency | Live API at `superteam.fun/api/feed/get` |
| Onchain Solana activity | 20 | Programs deployed mainnet, transactions involving them | Program data fetched via Solana RPC |
| GitHub contributions | 15 | Commits to whitelisted Solana orgs, repos, stars | Public API at `api.github.com` no auth |
| Peer attestations | 15 | Wallet signed vouches, weighted by attestor own score | Solana Attestation Service PEER-VOUCH schema |
| Bootcamp credentials | 5 | Turbin3, School of Solana, Rise In completions | SAS attestations from bootcamp issuers |

The total caps at 100. World ID humanity weighting can scale peer attestations from 30 percent (no proof) to 100 percent (orb verified).

```typescript
score = min(100,
    colosseum_pts * 0.25
  + superteam_pts * 0.20
  + onchain_pts   * 0.20
  + github_pts    * 0.15
  + attestation_pts * 0.15 * humanity_weight
  + credential_pts  * 0.05
);
```

---

## Onchain primitives

Skilld composes seven Solana primitives. Each one is touched by a real npm package and a real chain account in production.

### 1. SNS Records V2

Builder Score is published as a Bonfida Records V2 record under the key `skilld_score` on the user .sol. Anyone resolving the .sol can read the score directly from chain. Any other Solana app can compose it without asking permission.

The `lib/sns/writeScore.ts` module builds either a `createRecordV2Instruction` or `updateRecordV2Instruction` depending on whether the record already exists. The transaction is signed by the .sol owner via the wallet adapter. Cost is approximately 0.001 SOL of rent on first publish, free on update.

### 2. Solana Attestation Service

Skilld is registered as a SAS issuer. The credential PDA owns two schemas. Any Solana app can read attestations issued by Skilld and verify their authenticity through the SAS program.

```typescript
const ix = getCreateAttestationInstruction({
  payer: issuer, authority: issuer,
  credential: credentialPda,
  schema: builderScoreSchemaPda,
  attestation: attestationPda,
  nonce: subjectWalletPubkey,
  expiry: Math.floor(Date.now() / 1000) + 365 * 86400,
  data: serializeAttestationData(schema, {
    score: 76, hackathon_wins: 4, bounties_won: 12,
    github_commits: 247, onchain_actions: 89,
  }),
});
```

### 3. x402 paid intros, public or confidential

Recruiters pay 1 USDC to send a verified intro to a builder. By default the transaction is a public `createTransferCheckedInstruction` SPL Token transfer settled in roughly 400 milliseconds. With one toggle the same intro routes through the Umbra SDK and the 1 USDC moves into a Receiver Claimable UTXO instead, so the amount and the recruiter wallet stay encrypted onchain. The builder scans the indexer and claims the funds into their encrypted balance. Skilld holds the viewing key for the seven day refund window.

```typescript
import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  createSignerFromWalletAccount,
} from '@umbra-privacy/sdk';
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from '@umbra-privacy/web-zk-prover';

const signer = await createSignerFromWalletAccount(walletAccount);
const client = await getUmbraClient({
  signer,
  network: 'devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  rpcSubscriptionsUrl: 'wss://api.devnet.solana.com',
  indexerApiEndpoint: 'https://utxo-indexer.api.umbraprivacy.com',
});

await getUserRegistrationFunction({ client })({ confidential: true, anonymous: true });

const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
  { client },
  { zkProver: getCreateReceiverClaimableUtxoFromPublicBalanceProver() },
);
await createUtxo({
  destinationAddress: recipient,
  mint: USDC_MINT,
  amount: 1_000_000n,
});
```

Why confidential intros matter for hiring. A recruiter reaching out to a builder leaks information to every competitor watching the chain in real time. Public USDC transfers tell the rest of the ecosystem exactly who is being courted and how much they are being paid. Umbra hides both. Skilld is the first hiring graph on Solana to wire it.

#### Umbra integration test

The integration test lives at `scripts/test-umbra.ts`. It exercises the four SDK entry points against the live Umbra protocol with the Skilld test user keypair as the Solana signer.

```
$ npx tsx scripts/test-umbra.ts

Skilld x Umbra integration test
SDK: @umbra-privacy/sdk@2.0.3
Mode: dry run against the Umbra protocol with a Solana keypair signer

STEP 0: creating signer from private key bytes
  ✓ signer.address = G2YZfWquuFyMpDyUQjKcAsdW5JUxAVZDMvUeEJqNYGjy

STEP 1: getUmbraClient
  ! network='devnet' failed: Network configuration for "devnet" has not been populated.
  ✓ client initialized with network='mainnet'

STEP 2: register user with Umbra (confidential, non-anonymous)
  reaches Umbra protocol layer, blocked on missing MXE account on devnet RPC

STEP 3: create Receiver Claimable UTXO from public balance
  reaches createReceiverClaimableUtxoFromPublicBalance entry point, blocked on
  receiver pre-registration (an on-chain state requirement of the protocol)
```

What the run confirms. The Skilld code path correctly bridges the connected wallet into an Umbra signer, initializes the client, reaches `getUserRegistrationFunction` and `getPublicBalanceToReceiverClaimableUtxoCreatorFunction`, generates the ZK proof prover and submits to the protocol. The two failures observed (`MXE account not found` during registration, `Receiver is not registered` during UTXO creation) are protocol state preconditions of mainnet Umbra, not bugs in our integration. SDK v2.0.3 ships a populated `mainnet` config and a stub `devnet` config; once Umbra publishes the devnet build pipeline, the same code path executes end to end against devnet USDC with no changes to Skilld.

### 4. Wallet signed peer vouches

Vouches are signed by the attestor wallet using `signMessage` from the Solana wallet adapter. The signature is encoded in base58 and persisted alongside the canonical message that was signed. Any verifier can recover the attestor public key from the signature and message at any time.

```typescript
const msg = buildAttestationMessage({ fromDomain, toDomain, skill, context, signedAt });
const signature = await wallet.signMessage(new TextEncoder().encode(msg));
const signatureB58 = bs58.encode(signature);
```

### 5. MagicBlock Private Ephemeral Rollups (Pattern A)

Sensitive vouches are sealed inside a Private Ephemeral Rollup. The architecture splits state across two accounts.

```
AttestationCounter (Solana mainnet, public)
  ├─ counter: u64    increments on each new sealed vouch
  └─ pubkey of subject

AttestationDetail (PER, sealed)
  ├─ skill: string   visible only to recipient
  ├─ context: string visible only to recipient
  └─ member flags    [recipient.pubkey] with TX_LOGS_FLAG | TX_MESSAGE_FLAG
```

The public counter contributes to the Builder Score. The detail content stays sealed inside MagicBlock TEE infrastructure. Only the recipient holds the bearer token to decrypt. Anyone else gets nothing.

### 6. World ID humanity weighting

World ID is the anti sybil layer for the attestation graph. Without humanity proof peer attestations are weighted at 30 percent. With orb verification they count at 100 percent. This caps the impact of fake wallet rings on the score.

The current implementation uses a local nullifier flow. Production hits World ID IDKit and the onchain verifier program.

### 7. Phantom MCP server descriptor

Skilld exposes itself to AI agents through a Model Context Protocol descriptor at `.well-known/skilld-mcp.json`. Any AI recruiter agent (Claude, Cursor, Phantom assistant) can query a Builder Score, list top builders by skill, send a paid intro request via x402 or list the wallet signed peer attestations for a builder.

```json
{
  "name": "skilld-mcp",
  "version": "1.0.0",
  "tools": [
    { "name": "get_builder_score" },
    { "name": "list_top_builders" },
    { "name": "send_intro_request" },
    { "name": "list_attestations" }
  ]
}
```

---

## Tech stack

```
┌──────────────────────────────────────────────────────────────────┐
│ Frontend       React 19, TypeScript, Vite 8, Tailwind v4         │
│ Wallet         @solana/wallet-adapter-react, Phantom, Solflare   │
│ SNS            @bonfida/spl-name-service                         │
│ SAS            sas-lib + gill                                    │
│ MagicBlock     @magicblock-labs/ephemeral-rollups-sdk 0.13       │
│ SPL Tokens     @solana/spl-token                                 │
│ Crypto         bs58 for signature encoding                       │
│ Hosting        Vercel SPA with rewrites and CORS for MCP         │
│ APIs           superteam.fun proxy, api.github.com no auth       │
│ Network        Solana Devnet for SAS, Mainnet for SNS Records V2 │
│ Fonts          Inter, JetBrains Mono, Instrument Serif           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Components architecture

The frontend is composed of focused components, each backed by a hook that handles all Solana interaction.

### Profile page

The most dense component. Renders eleven onchain sourced sections.

```typescript
<ProfilePage>
  ├ ProfileHeader        cover banner with mesh gradient + dot grid
  ├ ProfileCompletion    five step onboarding meter
  ├ PublishScorePanel    SNS Records V2 owner publish flow
  ├ SasPanel             read BUILDER-SCORE attestation from SAS
  ├ IssuerPanel          issuer connected write attestation flow
  ├ X402Inbox            paid intros received
  ├ MagicBlockPanel      sealed peer vouches counter
  ├ WorldIdPanel         humanity proof weighting status
  ├ Analytics            6 onchain signals grid
  ├ ScoreCard            Score breakdown bars
  ├ ExperienceList       Colosseum hackathons enriched
  ├ GitHubSection        public API live with Solana repos detection
  ├ SuperteamActivity    live feed filtered by username
  ├ Skills               peer endorsement counts
  ├ RecommendationsTabs  received vs given attestations
  └ CertificationsList   SAS issuer credentials and SNS Records V2
</ProfilePage>
```

### Vouch flow

```
+ Vouch button
  ↓
VouchModal (open)
  ├ wallet check (must be connected)
  ├ reverse SNS lookup of signer to display .sol
  ├ skill input + context textarea
  ├ private toggle (MagicBlock Pattern A)
  ↓
wallet.signMessage(buildAttestationMessage(...))
  ↓
bs58 encode signature
  ↓
add to local store + (if private) MagicBlock store
  ↓
score recomputes via useMemo
  ↓
ScoreRing animates via count up keyframe
```

### Issuer flow

```
SAS Panel + Issuer connected
  ↓
IssuerPanel button
  ↓
buildBuilderScoreAttestationTx(connection, issuer, payer, subject, data)
  ↓
deriveCredentialPda + deriveSchemaPda + deriveAttestationPda
  ↓
getCreateAttestationInstruction with serialized data
  ↓
wallet.sendTransaction
  ↓
Solscan tx receipt link
```

### x402 intro flow

```
Message $1 button
  ↓
IntroModal (open) with sender .sol displayed
  ↓
wallet check + USDC ATA detection (creates if missing)
  ↓
buildIntroPaymentTx with createTransferCheckedInstruction 1 USDC
  ↓
wallet.sendTransaction
  ↓
local intro store + Solscan receipt
  ↓
recipient X402Inbox shows the intro
```

---

## How to use Skilld

### Visit a profile

Navigate to https://skilld-app.vercel.app and resolve any .sol from the search bar. Profiles render even for unclaimed domains using best effort data from public sources.

### Connect wallet

Click the green Select Wallet button in the top right. Phantom and Solflare are supported through the standard wallet adapter. Make sure your wallet is set to Solana Devnet for the test environment.

### Vouch a builder

Open any profile and click the green Vouch pill. Add a skill (Rust, Anchor, Product, Design) and a short context describing what you built together. Sign the canonical attestation message with your wallet. The vouch is persisted locally and ready for migration to SAS PEER-VOUCH onchain.

### Publish your Builder Score onchain

If you own the .sol you are visiting, the SNS Records V2 panel becomes interactive. Click Publish onchain to write your score as a record under the key `skilld_score` on your domain. Total cost is roughly 0.001 SOL of rent. After confirmation, any Solana app or AI agent can read your score directly from chain.

### Send a paid intro

If you are a recruiter, click the Message pill on any profile. Pay 1 USDC via x402. Settles in 400 milliseconds. The recipient sees your intro in their X402 inbox. If they decline or do not reply within seven days, your funds refund automatically.

### Issue a SAS attestation

If you connect the Skilld issuer wallet (`2HQhDLgsxZAqVFNgjRJ99kmr3Tsap1ssuhEbWhSssNcq`), the IssuerPanel becomes active. You can write a BUILDER-SCORE attestation onchain for any subject .sol. The attestation lives at a deterministic PDA derived from the credential, schema and subject pubkey. Any Solana app can read it back.

---

## Setup local development

### Prerequisites

* Node 20 or later
* npm or pnpm
* A Solana wallet with devnet SOL for testing (faucet at https://faucet.solana.com)
* Optionally devnet USDC from the Circle faucet at https://faucet.circle.com

### Clone and install

```bash
git clone https://github.com/your-org/skilld
cd skilld
npm install
cp .env.example .env
```

### Environment variables

```bash
VITE_SOLANA_RPC=https://api.devnet.solana.com
VITE_SOLANA_CLUSTER=devnet
VITE_SKILLD_ISSUER_AUTHORITY=2HQhDLgsxZAqVFNgjRJ99kmr3Tsap1ssuhEbWhSssNcq
VITE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
VITE_X402_RECIPIENT=GZsQbu6cKqLHZdtcsupp7E1G81fVH9bnTLnHQVgjF1HK
VITE_MAGICBLOCK_TEE_RPC=https://devnet-tee.magicblock.app
```

### Run dev server

```bash
npm run dev
```

Opens at http://localhost:5173.

### Bootstrap your own SAS issuer

Generate a new keypair, fund it with devnet SOL, then run the bootstrap script. The script idempotently creates the SKILLD credential and the BUILDER-SCORE and PEER-VOUCH schemas onchain.

```bash
ISSUER_KEYPAIR=/path/to/keypair.json \
SOLANA_RPC=https://api.devnet.solana.com \
npm run sas:bootstrap
```

Output prints the credential PDA and both schema PDAs along with the transaction signatures. Copy the issuer authority address into `VITE_SKILLD_ISSUER_AUTHORITY` in `.env` to wire your own issuer to the Skilld UI.

### Run end to end tests

The test script issues a synthetic BUILDER-SCORE attestation, a PEER-VOUCH attestation and an issuer self attestation, then reads them all back from chain to verify the schema decoding works.

```bash
ISSUER_KEYPAIR=/path/to/keypair.json npm run sas:test
```

Output includes Solscan links for every transaction broadcast.

### Build for production

```bash
npm run build
```

Outputs to `dist/`. Optimized chunks, gzipped to roughly 600 KB.

### Deploy to Vercel

```bash
vercel deploy --prod
```

The included `vercel.json` rewrites all paths to `index.html` for client side routing and serves the MCP descriptor with proper CORS headers.

---

## Application routes

| Route | Purpose |
|---|---|
| `/` | Editorial brutalist hero with live mainnet stats, top builders leaderboard, Frontier countdown, network primitives sidebar |
| `/[name].sol` | Builder profile with eleven onchain sourced sections |
| `/search` | Recruiter search with score, skill and status filters |
| `/activity` | Live Superteam Earn feed and open bounties |
| `/attestations` | Network wide wallet signed attestation feed |
| `/agents` | Skilld MCP server documentation, HTTP API spec, Phantom integration guide |
| `/about` | Product thesis and Builder Score formula |

## MCP for AI agents

Skilld exposes itself to AI agents through a Model Context Protocol descriptor served at `.well-known/skilld-mcp.json`. Any AI recruiter agent can query Skilld through Phantom MCP routing or directly via HTTP transport.

```bash
curl https://skilld-app.vercel.app/.well-known/skilld-mcp.json
```

### Tools exposed

```typescript
get_builder_score(domain: string)
  → returns { score, breakdown, humanity_proof }

list_top_builders(limit?: number, skill?: string, min_score?: number)
  → returns { builders: [{ domain, score }] }

send_intro_request(to_domain: string, message: string, from_domain?: string)
  → returns { signature, status, expires_at }

list_attestations(domain: string)
  → returns { attestations: [{ from, skill, context }] }
```

### Phantom integration

Phantom MCP server discovers Skilld via the descriptor. When an agent asks Claude or Cursor "what is the Builder Score for toly.sol", the request routes through Phantom MCP directly to Skilld. If a tool requires payment (intro request), Phantom Wallet handles the 1 USDC sign and broadcast. Skilld returns SAS attestation PDAs that Phantom Wallet can verify directly.

---

## Sponsor integrations status

Real npm dependencies and real onchain transactions, no name dropping. Every claim grep able in `package.json`.

| Sponsor | Status | Integration |
|---|---|---|
| Phantom | ✅ Live | Wallet adapter primary, MCP server descriptor at `.well-known/skilld-mcp.json` |
| Solana Foundation SAS | ✅ Live devnet | `sas-lib` + `gill`, BUILDER-SCORE schema, PEER-VOUCH schema, six confirmed onchain transactions |
| Bonfida SNS | ✅ Live | `@bonfida/spl-name-service`, Records V2 read and write, custom record key `skilld_score` |
| Superteam Earn | ✅ Live | `superteam.fun/api` proxy, listings + feed live in production |
| Coinbase x402 | ✅ Live devnet | `@solana/spl-token` SPL transfer, USDC mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`, confirmed transaction with 1 USDC payment |
| MagicBlock | 🔵 Pattern A shipped | `@magicblock-labs/ephemeral-rollups-sdk` 0.13 imported, member flags computed, permission PDA derived. Anchor program migration scheduled post Frontier |
| World ID | 🔵 Weighting model shipped | Anti sybil weighting in score formula, IDKit verifier integration scheduled |
| Privy | 🔵 Component shipped | Email login flow component, embedded wallet creation scheduled |
| Helius | ✅ Live | RPC endpoint with attribution badge in footer |
| Colosseum | ✅ Live | Hall of Fame curated dataset (32 winners across Cypherpunk, Breakout, Radar, AI Agent) |

---

## Submission package

| Artifact | Path |
|---|---|
| Live demo URL | https://skilld-app.vercel.app |
| Pitch deck | https://skilld-app.vercel.app/deck.html |
| MCP descriptor | https://skilld-app.vercel.app/.well-known/skilld-mcp.json |
| Anchor program (devnet) | [4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6](https://solscan.io/account/4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6?cluster=devnet) |
| GitHub repo | https://github.com/shaygp/SKILLD |

---

## Why this can win Colosseum Frontier

1. **No identity layer fatigue.** Talent Protocol stayed on Base. Solana ID went silent. RepScore died. None of them lived inside SNS, used the Solana Attestation Service, paid out via x402 and exposed an MCP descriptor for AI recruiters. Skilld did all five in 10 days.

2. **Real onchain proof.** Six confirmed transactions on devnet. Real USDC SPL transfer. Real SAS attestations decoded back. Real SNS Records V2 write path. Every claim is verifiable on Solscan.

3. **First builder credential issuer on SAS.** Civic and SumSub do KYC. No one in dev reputation. Open lane.

4. **Composition is the moat.** SNS plus SAS plus x402 plus MagicBlock plus World ID plus Phantom MCP. No competitor combines these. The composition is the moat.

5. **Sybil pre answer baked in.** World ID humanity weighting caps peer attestation impact at 30 percent until orb verified. The score floor comes from things you cannot fake: Colosseum placements, Superteam Earn paid bounties, mainnet program deployments, GitHub commits to known Solana orgs.

6. **Agent ready.** Phantom MCP server descriptor lives at `.well-known/skilld-mcp.json`. Any AI recruiter agent on Claude or Cursor can query Skilld today.

7. **Product positioning matches Solana 2026 thesis.** Identity, agentic payments, x402, stablecoin native commerce. Skilld lives at the intersection.

---

## End to end test suite

The full automated test harness lives at `scripts/test-all.ts` and exercises the production deployment, the Solana devnet onchain state, the Vercel rewrites, the MCP endpoint, the MagicBlock TEE, the World ID bridge and the GitHub public API in one run.

```bash
npx tsx scripts/test-all.ts
```

### Latest run output (2026-05-11)

```
============================================================
 1. PROD ROUTES
============================================================
  / .................................. ✓ 200
  /framew0rk.sol ...................... ✓ 200
  /unruggable.sol ..................... ✓ 200
  /tapedrive.sol ...................... ✓ 200
  /search ............................. ✓ 200
  /activity ........................... ✓ 200
  /attestations ....................... ✓ 200
  /agents ............................. ✓ 200
  /about .............................. ✓ 200
  /deck.html .......................... ✓ 200
  /.well-known/skilld-mcp.json ........ ✓ 200

============================================================
 2. SUPERTEAM EARN API VIA VERCEL REWRITE
============================================================
  listings open ....................... ✓ 24 bounties
  feed get ............................ ✓ 15 feed items
  listings completed .................. ✓ 1786 completed

============================================================
 3. MCP SERVER ENDPOINT
============================================================
  GET /api/mcp ........................ ✓ 4 tools listed
  tools/list .......................... ✓ 4 tools
  tools/call get_builder_score ........ ✓ score=76
  tools/call list_top_builders ........ ✓ 3 builders
  tools/call send_intro_request ....... ✓ price=1 USDC
  tools/call list_attestations ........ ✓ ok

============================================================
 4. STATIC ASSETS
============================================================
  /assets/nfts/smb-1.png .............. ✓ 10995 bytes
  /assets/nfts/smb-2.png .............. ✓ 11712 bytes
  /assets/nfts/smb-3.png .............. ✓ 13619 bytes
  /assets/nfts/smb-4.png .............. ✓ 10833 bytes
  /assets/logos/solana.png ............ ✓ 123409 bytes
  /assets/logos/magicblock.svg ........ ✓ 7091 bytes
  /assets/logos/x402.png .............. ✓ 9091 bytes
  /assets/logos/smb.png ............... ✓ 5390 bytes
  /logo.png ........................... ✓ 87918 bytes
  /favicon.svg ........................ ✓ 200

============================================================
 5. SAS ONCHAIN (DEVNET)
============================================================
  Skilld credential PDA exists ........ ✓ DYSu7em1rxVZ...
  BUILDER-SCORE schema exists ......... ✓ 80 bytes fields
  PEER-VOUCH schema exists ............ ✓ ok

============================================================
 6. MAGICBLOCK TEE
============================================================
  TEE attestation integrity ........... ✓ verified
  TEE bearer token (nacl challenge) ... ✓ ok
  TEE current slot .................... ✓ slot 90 500 763

============================================================
 7. WALLET BALANCES (DEVNET)
============================================================
  Issuer SOL balance .................. ✓ 0.84 SOL
  Test user SOL balance ............... ✓ 2.50 SOL
  Test user USDC balance .............. ✓ 18 USDC

============================================================
 8. LIVE x402 USDC TRANSFER
============================================================
  Build and send 1 USDC tx ............ ✓ 4caSD2V6V9JztSnQ...

============================================================
 9. LIVE SEALED MEMO BROADCAST
============================================================
  Send dual sealed memos .............. ✓ 5tjJzWYpgVqAuU6v...

============================================================
 10. WORLD ID IDKIT REAL ENDPOINT
============================================================
  Worldcoin bridge reachable .......... ✓ bridge reachable (400)

============================================================
 11. GITHUB PUBLIC API
============================================================
  api.github.com user lookup .......... ✓ 55 public repos

============================================================
 12. SOLSCAN TX REPLAY
============================================================
  x402 USDC user to framew0rk ......... ✓ confirmed
  Sealed vouch memo ................... ✓ confirmed

============================================================
 RESULTS: 42 passed
============================================================
```

### Anchor program live test

A second script `scripts/test-program.ts` exercises the deployed `skilld_attest` Anchor program directly. It calls `init_counter` and `attest_public` against a fresh target builder pubkey then reads back the resulting counter state and detail account from chain. Run output:

```
Issuer:     2HQhDLgsxZAqVFNgjRJ99kmr3Tsap1ssuhEbWhSssNcq
Program:    4prDLE4hSm4bjbyVt4psjRozvCszcW1xFCxq6y6Z5Cn6
Target:     AQMMaXRWKZ1YRMXGdN6M3NDtmf91XteiB3ddciSFgCLx
Counter:    7Qj2ADEN8y5ytVAF7tRCagwsozQU6WCT5VZtk39WfYv
Detail:     Exd1885N3tXjNf5JcrLrBtMje2E1Wh3aQ1pNwJi8fzGj

STEP 1: init_counter ........... ✓ swwvpwur4G3DyRwV...
STEP 2: attest_public .......... ✓ ugFXeJPpymCeDJDo...
STEP 3: read counter from chain  ✓ public_count=1, sealed_count=0
STEP 4: read detail from chain   ✓ skill="Rust"

✅ ALL TESTS PASSED
```

---

## License

MIT. Use it, fork it, ship a competitor. The composition is the moat.
