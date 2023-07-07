import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { batch, useSignal } from '@preact/signals';
import { utils } from 'ethers';
import { useState } from 'preact/hooks';
import { connectBrowserProvider } from '../library/provider.js';
import { GetSimulationStackReply } from '../types/interceptorTypes.js';
import { Button } from './Button.js';
import { serialize } from '../types/types.js';
import { EthereumAddress } from '../types/ethereumTypes.js';
import { TransactionList } from '../types/bouquetTypes.js';
import { ImportModal } from './ImportModal.js';
export async function importFromInterceptor(bundle, provider, blockInfo, appSettings, signers) {
    if (!window.ethereum || !window.ethereum.request)
        throw Error('Import Error: No Ethereum wallet detected');
    connectBrowserProvider(provider, appSettings, blockInfo, signers);
    const { payload } = await window.ethereum
        .request({
        method: 'interceptor_getSimulationStack',
        params: ['1.0.0'],
    })
        .catch((err) => {
        if (err?.code === -32601) {
            throw new Error('Import Error: Wallet does not support returning simulations');
        }
        else {
            throw new Error(`Unknown Error: ${JSON.stringify(err)}`);
        }
    });
    const tryParse = GetSimulationStackReply.safeParse(payload);
    if (!tryParse.success)
        throw new Error('Import Error: Wallet does not support returning simulations');
    const parsed = tryParse.value;
    if (parsed.length === 0)
        throw new Error('Import Error: You have no transactions on your simulation');
    const converted = TransactionList.safeParse(serialize(GetSimulationStackReply, parsed).map(({ from, to, value, input, gasLimit, chainId }) => ({ from, to, value, input, gasLimit, chainId })));
    if (!converted.success)
        throw new Error('Import Error: Malformed simulation stack');
    localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(converted.value)));
    const containsFundingTx = parsed.length > 1 && parsed[0].to === parsed[1].from;
    const uniqueSigners = [...new Set(parsed.map((x) => utils.getAddress(serialize(EthereumAddress, x.from))))].filter((_, index) => !(index === 0 && containsFundingTx));
    const totalGas = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n);
    // @TODO: Change this to track minimum amount of ETH needed to deposit
    const inputValue = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 0n : BigInt(tx.value.toString()) + sum), 0n);
    bundle.value = { transactions: converted.value, containsFundingTx, uniqueSigners, totalGas, inputValue };
}
export const Import = ({ bundle, provider, blockInfo, signers, appSettings, }) => {
    const showImportModal = useSignal(false);
    const [error, setError] = useState(undefined);
    const clearPayload = () => {
        batch(() => {
            bundle.value = undefined;
            localStorage.removeItem('payload');
            signers.value.bundleSigners = {};
            // Keep burner wallet as long as it has funds, should clear is later if there is left over dust but not needed.
            // if (fundingAccountBalance.value === 0n) signers.value.burner = undefined
        });
    };
    return (_jsxs(_Fragment, { children: [showImportModal.value ? _jsx(ImportModal, { bundle: bundle, display: showImportModal }) : null, _jsx("h2", { className: 'font-bold text-2xl', children: "1. Import" }), _jsxs("div", { className: 'flex flex-col w-full gap-6', children: [_jsxs("div", { className: 'flex flex-col sm:flex-row gap-4', children: [_jsx(Button, { onClick: () => importFromInterceptor(bundle, provider, blockInfo, appSettings, signers).then(() => setError(undefined)).catch((err) => setError(err.message)), children: "Import Payload from The Interceptor" }), _jsx(Button, { onClick: () => showImportModal.value = true, children: "Import From JSON" }), bundle.value ? (_jsx(Button, { variant: 'secondary', onClick: clearPayload, children: "Reset" })) : null] }), error ? _jsx("span", { className: 'text-lg text-error', children: error }) : '', error && error === 'Import Error: Wallet does not support returning simulations' ? (_jsxs("h3", { className: 'text-lg', children: ["Don't have The Interceptor Installed? Install it here", ' ', _jsx("a", { className: 'font-bold text-accent underline', href: 'https://dark.florist', children: "here" }), "."] })) : ('')] })] }));
};
//# sourceMappingURL=Import.js.map