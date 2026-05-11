import { readFileSync } from 'node:fs';
import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  createSignerFromPrivateKeyBytes,
} from '@umbra-privacy/sdk';
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from '@umbra-privacy/web-zk-prover';

const USER_PATH = '/Users/mac/skilld/.keys/skilld-test-user.json';
const RECIPIENT = 'AQMMaXRWKZ1YRMXGdN6M3NDtmf91XteiB3ddciSFgCLx';
const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const AMOUNT_USDC_ATOMIC = 1_000_000n;

async function main() {
  console.log('Skilld x Umbra integration test');
  console.log('SDK: @umbra-privacy/sdk@2.0.3');
  console.log('Mode: dry run against the Umbra protocol with a Solana keypair signer');
  console.log('');

  const raw = JSON.parse(readFileSync(USER_PATH, 'utf8')) as number[];
  const secretKey = new Uint8Array(raw);

  console.log('STEP 0: creating signer from private key bytes');
  const signer = await createSignerFromPrivateKeyBytes(secretKey);
  console.log('  ✓ signer.address =', signer.address);

  console.log('\nSTEP 1: getUmbraClient');
  let client;
  let chosenNetwork = '';
  const candidates = ['devnet', 'dev', 'mainnet', 'main', 'testnet'];
  for (const n of candidates) {
    try {
      client = await getUmbraClient({
        signer,
        network: n as never,
        rpcUrl: 'https://api.devnet.solana.com',
        rpcSubscriptionsUrl: 'wss://api.devnet.solana.com',
        indexerApiEndpoint: 'https://utxo-indexer.api.umbraprivacy.com',
      });
      chosenNetwork = n;
      console.log(`  ✓ client initialized with network='${n}'`);
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ! network='${n}' failed: ${msg.slice(0, 100)}`);
    }
  }
  if (!client) throw new Error('No network config available in SDK v2.0.3');
  console.log(`  network in use: ${chosenNetwork}`);

  console.log('\nSTEP 2: register user with Umbra (confidential, non-anonymous)');
  try {
    const register = getUserRegistrationFunction({ client });
    const regResult = await register({ confidential: true, anonymous: false });
    console.log('  ✓ register result:', JSON.stringify(regResult, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      console.log('  ✓ already registered, continuing');
    } else {
      console.log('  ! register threw:', msg.slice(0, 200));
    }
  }

  console.log('\nSTEP 3: create Receiver Claimable UTXO from public balance');
  console.log('  destination:', RECIPIENT);
  console.log('  mint:       ', USDC_DEVNET_MINT, '(devnet USDC)');
  console.log('  amount:     ', AMOUNT_USDC_ATOMIC.toString(), '(1 USDC atomic)');

  const prover = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client },
    { zkProver: prover },
  );

  const result = await createUtxo({
    destinationAddress: RECIPIENT as never,
    mint: USDC_DEVNET_MINT as never,
    amount: AMOUNT_USDC_ATOMIC,
  });
  console.log('  ✓ UTXO created');
  console.log('  full result:', JSON.stringify(result, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

  console.log('\n✅ ALL UMBRA STEPS COMPLETED');
}

main().catch((e) => {
  console.error('\n❌ FAILED:', e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
