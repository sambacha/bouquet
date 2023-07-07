import { ReadonlySignal, Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { ProviderStore } from '../library/provider.js';
import { BlockInfo, Bundle, Signers } from '../types/types.js';
export declare const Configure: ({ provider, bundle, fundingAmountMin, signers, blockInfo, }: {
    provider: Signal<ProviderStore | undefined>;
    bundle: Signal<Bundle | undefined>;
    signers: Signal<Signers>;
    fundingAmountMin: ReadonlySignal<bigint>;
    blockInfo: Signal<BlockInfo>;
}) => JSX.Element;
//# sourceMappingURL=Configure.d.ts.map