import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { utils } from 'ethers';
import { batch, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js';
import { Button } from './Button.js';
import { SettingsModal } from './Settings.js';
import { useAsyncState } from '../library/asyncState.js';
import { simulateBundle, sendBundle, checkBundleInclusion } from '../library/flashbots.js';
const SimulationResult = ({ state }) => {
    if (state.value.state === 'pending')
        return _jsx("div", { children: "Simulating..." });
    if (state.value.state === 'resolved') {
        return state.value.value.firstRevert ?
            _jsxs("div", { children: [_jsx("h3", { class: 'font-semibold text-error mb-2', children: "A Transaction Reverted During Simulation" }), _jsxs("div", { class: 'flex w-full min-h-[96px] border-2 border-white rounded-xl', children: [_jsx("div", { class: 'flex w-24 flex-col items-center justify-center text-white border-r-2', children: _jsxs("span", { class: 'text-lg font-bold', children: ["#", state.value.value.results.findIndex((x) => 'error' in x)] }) }), _jsxs("div", { class: 'bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold', children: [_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "From" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: state.value.value.firstRevert.fromAddress })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "To" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: state.value.value.firstRevert.toAddress })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "Gas Used" }), _jsxs("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: [state.value.value.firstRevert.gasUsed, " gas"] })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "Error" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: 'error' in state.value.value.firstRevert ? String(state.value.value.firstRevert.error) : 'Unknown' })] })] })] })] })
            : _jsx("div", { children: _jsx("h3", { class: 'font-semibold text-success', children: "Simulation Succeeded" }) });
    }
    if (state.value.state === 'rejected') {
        return (_jsxs("div", { children: [_jsx("h3", { class: 'font-semibold text-error mb-2', children: "Simulation Failed" }), _jsx("p", { class: 'rounded bg-background font-mono font-medium w-full break-all', children: state.value.error.message })] }));
    }
    return _jsx(_Fragment, {});
};
export const Bundles = ({ outstandingBundles, }) => {
    if (outstandingBundles.value.error)
        return (_jsxs("div", { children: [_jsx("h3", { class: 'font-semibold text-error mb-2', children: "Error Sending Bundle" }), _jsx("p", { class: 'rounded bg-background font-mono font-medium w-full break-all', children: outstandingBundles.value.error.message })] }));
    return (_jsx("div", { class: 'flex flex-col-reverse gap-4', children: Object.values(outstandingBundles.value.bundles).map((bundle) => (bundle.included ?
            _jsx("div", { class: 'flex items-center flex-col font-semibold gap-2', children: _jsx("h2", { class: 'font-bold text-lg text-success', children: "Bundle Included!" }) })
            :
                _jsxs("div", { class: 'flex items-center gap-2 text-white', children: [_jsxs("svg", { class: "animate-spin h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { class: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", "stroke-width": "4" }), _jsx("path", { class: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsxs("p", { children: ["Attempting to get bundle included in block ", bundle.targetBlock.toString(10), " with max fee of ", Number(utils.formatUnits(bundle.gas.baseFee + bundle.gas.priorityFee, 'gwei')).toPrecision(3), " gwei per gas"] })] }))) }));
};
export const Submit = ({ provider, bundle, fundingAmountMin, signers, appSettings, blockInfo, }) => {
    const showSettings = useSignal(false);
    const submissionStatus = useSignal({ active: false, lastBlock: 0n });
    const { value: simulationPromise, waitFor: waitForSimulation } = useAsyncState();
    useSignalEffect(() => {
        if (blockInfo.value.blockNumber > submissionStatus.value.lastBlock) {
            bundleSubmission(blockInfo.value.blockNumber);
        }
    });
    const missingRequirements = useComputed(() => {
        if (!bundle.value)
            return 'No transactions imported yet.';
        const missingSigners = bundle.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length;
        const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value;
        if (missingSigners && insufficientBalance)
            return 'Missing private keys for signing accounts and funding wallet has insufficent balance.';
        if (missingSigners)
            return 'Missing private keys for signing accounts.';
        if (insufficientBalance)
            return 'Funding wallet has insufficent balance.';
        return false;
    });
    async function simulateCallback() {
        if (!provider.value)
            throw 'User not connected';
        if (!bundle.value)
            throw 'No imported bundle found';
        const simulationResult = await simulateBundle(bundle.value, fundingAmountMin.peek(), provider.value, signers.peek(), blockInfo.peek(), appSettings.peek());
        if ('error' in simulationResult)
            throw new Error(simulationResult.error.message);
        else
            return simulationResult;
    }
    const outstandingBundles = useSignal({ bundles: {} });
    async function bundleSubmission(blockNumber) {
        submissionStatus.value = { ...submissionStatus.peek(), lastBlock: blockNumber };
        if (!provider.value)
            throw new Error('User not connected');
        if (!bundle.value)
            throw new Error('No imported bundle found');
        const providerStore = provider.value;
        // Check status of current bundles
        const checkedPending = await Promise.all(Object.keys(outstandingBundles.peek().bundles).map(bundleHash => checkBundleInclusion(outstandingBundles.peek().bundles[bundleHash].transactions, providerStore)));
        const included = checkedPending.filter(checkedPending => checkedPending.included);
        if (included.length > 0) {
            // We done!
            batch(() => {
                outstandingBundles.value = {
                    error: outstandingBundles.peek().error,
                    bundles: Object.keys(outstandingBundles.peek().bundles).reduce((checked, current, index) => {
                        if (checkedPending[index].included) {
                            checked[current] = outstandingBundles.peek().bundles[current];
                            checked[current].included = checkedPending[index].included;
                        }
                        return checked;
                    }, {})
                };
                submissionStatus.value = { active: false, lastBlock: blockNumber };
            });
        }
        else {
            // Remove old submissions
            outstandingBundles.value = {
                error: outstandingBundles.peek().error,
                bundles: Object.keys(outstandingBundles.peek().bundles)
                    .filter(tx => outstandingBundles.peek().bundles[tx].targetBlock > blockNumber)
                    .reduce((obj, bundleHash) => {
                    obj[bundleHash] = outstandingBundles.peek().bundles[bundleHash];
                    return obj;
                }, {})
            };
            // Try Submit
            if (submissionStatus.value.active) {
                try {
                    const targetBlock = blockNumber + appSettings.peek().blocksInFuture;
                    const gas = blockInfo.peek();
                    const bundleRequest = await sendBundle(bundle.value, targetBlock, fundingAmountMin.peek(), provider.value, signers.peek(), blockInfo.peek(), appSettings.peek());
                    if (!(bundleRequest.bundleHash in outstandingBundles.peek())) {
                        outstandingBundles.value = { ...outstandingBundles.peek(), [bundleRequest.bundleHash]: { targetBlock, gas, transactions: bundleRequest.bundleTransactions, included: false } };
                    }
                }
                catch (err) {
                    console.error("SendBundle error", err);
                    const error = err && typeof err === 'object' && 'name' in err && 'message' in err && typeof err.name === 'string' && typeof err.message === 'string' ? new Error(err.message) : new Error("Unknown Error");
                    batch(() => {
                        submissionStatus.value = { active: false, lastBlock: blockNumber };
                        outstandingBundles.value = { ...outstandingBundles.peek(), error };
                    });
                }
            }
        }
    }
    async function toggleSubmission() {
        batch(() => {
            submissionStatus.value = { ...submissionStatus.peek(), active: !submissionStatus.peek().active };
            outstandingBundles.value = { ...outstandingBundles.peek(), error: undefined };
        });
        bundleSubmission(blockInfo.peek().blockNumber);
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { className: 'font-bold text-2xl', children: "3. Submit" }), _jsx(SettingsModal, { display: showSettings, appSettings: appSettings }), missingRequirements.value ? (_jsx("p", { children: missingRequirements.peek() })) : (_jsxs("div", { className: 'flex flex-col w-full gap-4', children: [_jsxs("div", { children: [_jsxs("p", { children: [_jsx("span", { className: 'font-bold', children: "Gas:" }), " ", utils.formatUnits(getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, appSettings.value.blocksInFuture), 'gwei'), " gwei + ", utils.formatUnits(appSettings.value.priorityFee.toString(), 'gwei'), " gwei priority"] }), _jsxs("p", { children: [_jsx("span", { className: 'font-bold', children: "Network:" }), " ", appSettings.value.relayEndpoint] }), _jsxs("p", { children: ["Transactions will be attempt to be included in the block ", appSettings.value.blocksInFuture.toString(), " blocks from now."] }), _jsxs("p", { children: ["You can edit these settings ", _jsx("button", { className: 'font-bold underline', onClick: () => showSettings.value = true, children: "here" }), "."] })] }), _jsxs("div", { className: 'flex flex-row gap-6', children: [_jsx(Button, { onClick: () => waitForSimulation(simulateCallback), disabled: simulationPromise.value.state === 'pending', variant: 'secondary', children: "Simulate" }), _jsx(Button, { onClick: toggleSubmission, children: submissionStatus.value.active ? 'Stop' : 'Submit' })] }), _jsx(SimulationResult, { state: simulationPromise }), _jsx(Bundles, { outstandingBundles: outstandingBundles })] }))] }));
};
//# sourceMappingURL=Submit.js.map