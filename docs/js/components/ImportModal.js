import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { useComputed, useSignal } from "@preact/signals";
import { utils } from "ethers";
import { TransactionList } from "../types/bouquetTypes.js";
import { EthereumAddress } from "../types/ethereumTypes.js";
import { serialize } from "../types/types.js";
import { Button } from "./Button.js";
const placeholder = `[
  {
    "from": "0xb3cd36cfaa07652dbfecca76f438ff8998a4f539",
    "to": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    "value": "0x16345785d8a0000",
    "input": "0xd0e30db0",
    "chainId": "0x1",
    "gasLimit": "0x15f90"
  },
  {
    "from": "0xb3cd36cfaa07652dbfecca76f438ff8998a4f539",
    "to": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    "value": "0x0",
    "input": "0x2e1a7d4d000000000000000000000000000000000000000000000000016345785d8a0000",
    "chainId": "0x1",
    "gasLimit": "0x15f90"
  }
]`;
export const ImportModal = ({ display, bundle }) => {
    const jsonInput = useSignal('');
    const isValid = useComputed(() => {
        if (!jsonInput.value)
            return false;
        try {
            const { success } = TransactionList.safeParse(JSON.parse(jsonInput.value));
            return success;
        }
        catch {
            return false;
        }
    });
    function importJson() {
        if (!isValid.peek())
            return;
        const txList = TransactionList.parse(JSON.parse(jsonInput.value));
        localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(txList)));
        const containsFundingTx = txList.length > 1 && txList[0].to === txList[1].from;
        const uniqueSigners = [...new Set(txList.map((x) => utils.getAddress(serialize(EthereumAddress, x.from))))].filter((_, index) => !(index === 0 && containsFundingTx));
        const totalGas = txList.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n);
        // @TODO: Change this to track minimum amount of ETH needed to deposit
        const inputValue = txList.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 0n : BigInt(tx.value.toString()) + sum), 0n);
        bundle.value = { transactions: txList, containsFundingTx, uniqueSigners, totalGas, inputValue };
        close();
    }
    function close() {
        jsonInput.value = '';
        display.value = false;
    }
    return display.value ? (_jsx("div", { onClick: close, class: 'flex items-center justify-center bg-black/50 h-full fixed inset-0', children: _jsxs("div", { class: 'h-max w-full max-w-screen-sm p-4 flex flex-col gap-4 rounded-2xl bg-background', onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: 'text-xl font-semibold', children: "Import Transactions From JSON" }), _jsxs("div", { children: [_jsx("h3", { className: 'font-semibold', children: "MEV Relay URL" }), _jsx("textarea", { placeholder: placeholder, onInput: (e) => jsonInput.value = e.currentTarget.value, value: jsonInput.value, type: "url", className: `p-2 h-96 rounded-xl ${jsonInput.value !== '' && !isValid.value ? 'border-red-200' : 'border-slate-200/70'} border-2 bg-background w-full` })] }), _jsx("div", { className: 'flex gap-2', children: _jsx(Button, { onClick: importJson, disabled: !isValid.value, variant: 'primary', children: "Import" }) })] }) })) : null;
};
//# sourceMappingURL=ImportModal.js.map