import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  createSignerFromWalletAccount,
  type IUmbraClient,
} from '@umbra-privacy/sdk';
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from '@umbra-privacy/web-zk-prover';
import type { WalletAdapter } from '@solana/wallet-adapter-base';

const RPC_HTTP = 'https://api.devnet.solana.com';
const RPC_WS = 'wss://api.devnet.solana.com';
const INDEXER = 'https://utxo-indexer.api.umbraprivacy.com';

export const UMBRA_PROGRAM_DEVNET = 'DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ';

export type UmbraSession = {
  client: IUmbraClient;
};

export async function createUmbraSession(adapter: WalletAdapter): Promise<UmbraSession> {
  const account = (adapter as unknown as { wallet?: { accounts?: unknown[] } }).wallet?.accounts?.[0];
  if (!account) throw new Error('Wallet account not exposed via Wallet Standard');
  const signer = await createSignerFromWalletAccount(account as never);

  const client = await getUmbraClient({
    signer,
    network: 'devnet',
    rpcUrl: RPC_HTTP,
    rpcSubscriptionsUrl: RPC_WS,
    indexerApiEndpoint: INDEXER,
  });

  return { client };
}

export async function ensureRegistered(session: UmbraSession): Promise<void> {
  const register = getUserRegistrationFunction({ client: session.client });
  await register({ confidential: true, anonymous: true });
}

export async function sendConfidentialIntro(
  session: UmbraSession,
  recipientBase58: string,
  usdcMint: string,
  amountAtomic: bigint,
): Promise<string> {
  const prover = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client: session.client },
    { zkProver: prover },
  );
  const result = await createUtxo({
    destinationAddress: recipientBase58 as never,
    mint: usdcMint as never,
    amount: amountAtomic,
  });
  const sig =
    (result as { signature?: string }).signature ??
    (result as { txSignature?: string }).txSignature ??
    'umbra-utxo-created';
  return sig;
}
