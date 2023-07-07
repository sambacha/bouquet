import { ReadonlySignal, Signal } from '@preact/signals';
import { JSXInternal } from 'preact/src/jsx.js';
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js';
import { ProviderStore } from '../library/provider.js';
export declare const Transactions: ({ provider, bundle, signers, blockInfo, appSettings, fundingAmountMin, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    blockInfo: Signal<BlockInfo>;
    signers: Signal<Signers>;
    appSettings: Signal<AppSettings>;
    fundingAmountMin: ReadonlySignal<bigint>;
}) => JSXInternal.Element;
//# sourceMappingURL=Transactions.d.ts.map