import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  createSignerFromWalletAccount,
} from '@umbra-privacy/sdk';
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from '@umbra-privacy/web-zk-prover';
import type { WalletAdapter } from '@solana/wallet-adapter-base';

const RPC_HTTP = 'https://api.devnet.solana.com';
const RPC_WS = 'wss://api.devnet.solana.com';
const INDEXER = 'https://utxo-indexer.api.umbraprivacy.com';

export const UMBRA_PROGRAM_DEVNET = 'DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ';

type UmbraClientType = Awaited<ReturnType<typeof getUmbraClient>>;

export type UmbraSession = {
  client: UmbraClientType;
};

export async function createUmbraSession(adapter: WalletAdapter): Promise<UmbraSession> {
  const standard = (adapter as unknown as { wallet?: unknown }).wallet;
  const account = ((adapter as unknown as { wallet?: { accounts?: unknown[] } }).wallet?.accounts ?? [])[0];
  if (!standard || !account) throw new Error('Wallet not exposed via Wallet Standard');
  const signer = createSignerFromWalletAccount(standard as never, account as never);

  const client = await getUmbraClient({
    signer,
    network: 'devnet',
    rpcUrl: RPC_HTTP,
    rpcSubscriptionsUrl: RPC_WS,
    indexerApiEndpoint: INDEXER,
  });

  return { client };
}

export async function ensureRegistered(session: UmbraSession): Promise<readonly string[]> {
  const register = getUserRegistrationFunction({ client: session.client });
  const sigs = await register({ confidential: true, anonymous: false });
  return sigs as unknown as readonly string[];
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
    amount: amountAtomic as never,
  });
  const sig =
    (result as { signature?: string }).signature ??
    (result as { txSignature?: string }).txSignature ??
    (Array.isArray(result) ? (result[0] as string) : 'umbra-utxo-created');
  return sig;
}
