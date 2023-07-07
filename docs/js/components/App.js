import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { Import } from './Import.js';
import { Configure } from './Configure.js';
import { Submit } from './Submit.js';
import { Button } from './Button.js';
import { Transactions } from './Transactions.js';
import { connectBrowserProvider } from '../library/provider.js';
import { Navbar } from './Navbar.js';
import { createGlobalState } from '../stores.js';
export function App() {
    const state = createGlobalState();
    return (_jsx("main", { class: 'bg-background text-primary w-full min-h-screen sm:px-6 font-serif flex flex-col items-center', children: _jsxs("article", { className: 'p-4 max-w-screen-lg w-full', children: [_jsx(Navbar, { ...state }), _jsx("div", { className: 'p-4 mt-4 flex flex-col gap-8', children: !state.provider.value && state.bundle.value ? (_jsxs("article", { className: 'items-center flex flex-col gap-4 py-8', children: [_jsx("h2", { class: 'text-2xl font-bold', children: "Welcome Back" }), _jsx(Button, { onClick: () => connectBrowserProvider(state.provider, state.appSettings, state.blockInfo, state.bundle.peek()?.containsFundingTx ? state.signers : undefined), children: "Connect Wallet" })] })) : (_jsxs(_Fragment, { children: [_jsx(Import, { ...state }), state.bundle.value ? _jsx(Transactions, { ...state }) : null, _jsx(Configure, { ...state }), _jsx(Submit, { ...state })] })) })] }) }));
}
//# sourceMappingURL=App.js.map