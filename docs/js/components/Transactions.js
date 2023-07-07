import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { utils } from 'ethers';
import { createBundleTransactions } from '../library/bundleUtils.js';
import { MEV_RELAY_GOERLI } from '../constants.js';
import { Button } from './Button.js';
import { useAsyncState } from '../library/asyncState.js';
import { TransactionList } from '../types/bouquetTypes.js';
function formatTransactionDescription(tx) {
    if (tx.functionFragment.inputs.length === 0)
        return _jsx(_Fragment, { children: `${tx.name}()` });
    const params = tx.functionFragment.inputs.map((y, index) => _jsx("p", { class: 'pl-4', children: `${y.name}: ${tx.args[index].toString()}` }));
    return (_jsxs(_Fragment, { children: [_jsx("p", { children: `${tx.name}(` }), params, _jsx("p", { children: ")" })] }));
}
export const Transactions = ({ provider, bundle, signers, blockInfo, appSettings, fundingAmountMin, }) => {
    const fundingTx = useComputed(() => bundle.value ? bundle.value.containsFundingTx : false);
    const interfaces = useSignal({});
    const transactions = useSignal([]);
    const updateTx = async () => {
        if (!provider.value || !bundle.value)
            return transactions.value = [];
        const result = await createBundleTransactions(bundle.value, signers.value, blockInfo.value, appSettings.value.blocksInFuture, fundingAmountMin.value);
        if (Object.keys(interfaces.value).length === 0) {
            return transactions.value = result;
        }
        else {
            const parsed = transactions.value.map((tx) => {
                if (tx.transaction.to && tx.transaction.data && tx.transaction.data !== '0x' && tx.transaction.data.length > 0) {
                    const decoded = formatTransactionDescription(interfaces.value[tx.transaction.to].parseTransaction({ ...tx.transaction, data: tx.transaction.data.toString() }));
                    return { ...tx, decoded };
                }
                return tx;
            });
            return transactions.value = parsed;
        }
    };
    useSignalEffect(() => {
        if (provider.value && bundle.value) {
            updateTx();
        }
    });
    const fetchingAbis = useAsyncState();
    async function parseTransactions() {
        try {
            const uniqueAddresses = [...new Set(transactions.value.filter(tx => typeof tx.transaction.to === 'string').map((x) => x.transaction.to))];
            const requests = await Promise.all(uniqueAddresses.map((address) => fetch(`https://api${appSettings.peek().relayEndpoint === MEV_RELAY_GOERLI ? '-goerli' : ''}.etherscan.io/api?module=contract&action=getabi&address=${utils.getAddress(address.toLowerCase())}&apiKey=PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8`)));
            const abis = await Promise.all(requests.map((request) => request.json()));
            interfaces.value = abis.reduce((acc, curr, index) => {
                if (curr.status === '1')
                    return { ...acc, [`${uniqueAddresses[index]}`]: new utils.Interface(curr.result) };
                else
                    return acc;
            }, {});
            updateTx();
        }
        catch (error) {
            console.log('parseTransactionsCb Error:', error);
            interfaces.value = {};
        }
    }
    function copyTransactions() {
        if (!bundle.value)
            return;
        const parsedList = TransactionList.safeSerialize(bundle.value.transactions);
        if ('success' in parsedList && parsedList.success)
            navigator.clipboard.writeText(JSON.stringify(parsedList.value, null, 2));
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { className: 'font-bold text-2xl', children: "Your Transactions" }), _jsxs("div", { className: 'flex flex-row gap-4', children: [_jsx(Button, { variant: 'secondary', disabled: fetchingAbis.value.value.state === 'pending', onClick: () => fetchingAbis.waitFor(parseTransactions), children: "Decode Transactions From Etherscan" }), _jsx(Button, { variant: 'secondary', onClick: copyTransactions, children: _jsxs(_Fragment, { children: ["Copy Transaction List", _jsx("svg", { className: 'h-8 inline-block', "aria-hidden": 'true', fill: 'none', stroke: 'currentColor', "stroke-width": '1.5', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', children: _jsx("path", { d: 'M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6', "stroke-linecap": 'round', "stroke-linejoin": 'round' }) })] }) })] }), _jsx("div", { class: 'flex w-full flex-col gap-2', children: transactions.value.map((tx, index) => (_jsxs("div", { class: 'flex w-full min-h-[96px] border-2 border-white rounded-xl', children: [_jsx("div", { class: 'flex w-24 flex-col items-center justify-center text-white border-r-2', children: _jsxs("span", { class: 'text-lg font-bold', children: ["#", index] }) }), _jsxs("div", { class: 'bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold', children: [_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "From" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: fundingTx.value && tx.transaction.from === transactions.peek()[0].transaction.from ? 'FUNDING WALLET' : tx.transaction.from })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "To" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: tx.transaction.to })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Value" }), _jsxs("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: [utils.formatEther(tx.transaction.value ?? 0n), " ETH"] })] }), tx.decoded ? (_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Data" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium w-full break-all', children: tx.decoded })] })) : tx.transaction.data && tx.transaction.data !== '0x' ? (_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Data" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium w-full break-all', children: tx.transaction.data.toString() })] })) : null] })] }))) })] }));
};
//# sourceMappingURL=Transactions.js.map