import { providers, Signer } from 'ethers';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
export interface FlashbotsBundleTransaction {
    transaction: providers.TransactionRequest;
    signer: Signer;
}
export declare const getMaxBaseFeeInFutureBlock: (baseFee: bigint, blocksInFuture: bigint) => bigint;
export declare const signBundle: (bundle: FlashbotsBundleTransaction[], provider: providers.Web3Provider, blockInfo: BlockInfo, maxBaseFee: bigint) => Promise<string[]>;
export declare const createBundleTransactions: (bundle: Bundle, signers: Signers, blockInfo: BlockInfo, blocksInFuture: bigint, fundingAmountMin: bigint) => Promise<FlashbotsBundleTransaction[]>;
//# sourceMappingURL=bundleUtils.d.ts.map