import { readFileSync } from 'node:fs';
import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  getPublicBalanceToSelfClaimableUtxoCreatorFunction,
  createSignerFromPrivateKeyBytes,
} from '@umbra-privacy/sdk';
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from '@umbra-privacy/web-zk-prover';

const USER_PATH = '/Users/mac/skilld/.keys/skilld-test-user.json';
const ISSUER_PATH = '/Users/mac/skilld/.keys/skilld-issuer.json';
const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const AMOUNT_USDC_ATOMIC = 1_000_000n;

async function openClient(keypairPath: string, label: string) {
  const raw = JSON.parse(readFileSync(keypairPath, 'utf8')) as number[];
  const signer = await createSignerFromPrivateKeyBytes(new Uint8Array(raw));
  console.log(`  ok ${label} signer.address = ${signer.address}`);
  const client = await getUmbraClient({
    signer,
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    rpcSubscriptionsUrl: 'wss://api.devnet.solana.com',
    indexerApiEndpoint: 'https://utxo-indexer.api.umbraprivacy.com',
  });
  return { signer, client };
}

async function tryRegister(client: Awaited<ReturnType<typeof getUmbraClient>>, label: string) {
  const register = getUserRegistrationFunction({ client });
  try {
    const sigs = await register({ confidential: true, anonymous: false });
    console.log(`  ok ${label} registered, signatures:`, sigs);
    return sigs;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('already')) {
      console.log(`  ok ${label} already registered`);
      return [];
    }
    throw e;
  }
}

async function main() {
  console.log('Skilld x Umbra integration test');
  console.log('SDK: @umbra-privacy/sdk@4.0.0');
  console.log('Network: Solana devnet');
  console.log('');

  console.log('STEP 1: open Umbra client for recipient (issuer wallet) and register');
  const recipientSession = await openClient(ISSUER_PATH, 'recipient');
  await tryRegister(recipientSession.client, 'recipient');

  console.log('\nSTEP 2: open Umbra client for sender (test user) and register');
  const senderSession = await openClient(USER_PATH, 'sender');
  await tryRegister(senderSession.client, 'sender');

  console.log('\nSTEP 3a: sender creates Self Claimable UTXO (deposit into own encrypted balance)');
  console.log('  mint:  ', USDC_DEVNET_MINT, '(devnet USDC)');
  console.log('  amount:', AMOUNT_USDC_ATOMIC.toString(), '(1 USDC atomic)');

  const prover = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
  const createSelfUtxo = getPublicBalanceToSelfClaimableUtxoCreatorFunction(
    { client: senderSession.client },
    { zkProver: prover },
  );

  let selfResult: unknown = null;
  try {
    selfResult = await createSelfUtxo({
      mint: USDC_DEVNET_MINT as never,
      amount: AMOUNT_USDC_ATOMIC as never,
    });
    console.log('  ok Self UTXO result:');
    console.log(JSON.stringify(selfResult, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log('  fail self UTXO failed:', msg.slice(0, 200));
  }

  console.log('\nSTEP 3b: sender creates Receiver Claimable UTXO for recipient');
  console.log('  destination:', recipientSession.signer.address);

  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client: senderSession.client },
    { zkProver: prover },
  );

  try {
    const result = await createUtxo({
      destinationAddress: recipientSession.signer.address as never,
      mint: USDC_DEVNET_MINT as never,
      amount: AMOUNT_USDC_ATOMIC as never,
    });
    console.log('  ok Receiver UTXO result:');
    console.log(JSON.stringify(result, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log('  fail receiver UTXO failed:', msg.slice(0, 200));
  }

  console.log('\ntest completed');
}

main().catch((e) => {
  console.error('\nfailed:', e instanceof Error ? e.message : e);
  let cause: unknown = e instanceof Error ? (e as { cause?: unknown }).cause : null;
  let depth = 0;
  while (cause && depth < 6) {
    const m = cause instanceof Error ? cause.message : JSON.stringify(cause);
    console.error(`  cause[${depth}]:`, m);
    if (cause instanceof Error && 'cause' in cause) {
      cause = (cause as { cause?: unknown }).cause;
    } else if (cause && typeof cause === 'object' && 'context' in (cause as object)) {
      console.error('  context:', JSON.stringify((cause as { context: unknown }).context).slice(0, 500));
      break;
    } else {
      break;
    }
    depth++;
  }
  process.exit(1);
});
