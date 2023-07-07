import * as t from 'funtypes';
import { EthereumAddress, EthereumInput, EthereumQuantity } from './ethereumTypes.js';
export const TransactionList = t.ReadonlyArray(t.Object({
    from: EthereumAddress,
    to: t.Union(EthereumAddress, t.Null),
    value: EthereumQuantity,
    input: EthereumInput,
    chainId: EthereumQuantity,
    gasLimit: EthereumQuantity
}).asReadonly());
export const PopulatedTransactionList = t.ReadonlyArray(t.Object({
    from: EthereumAddress,
    to: t.Union(EthereumAddress, t.Null),
    value: EthereumQuantity,
    input: EthereumInput,
    chainId: EthereumQuantity,
    gasLimit: EthereumQuantity,
    nonce: EthereumQuantity,
    maxFeePerGas: EthereumQuantity,
    maxPriorityFeePerGas: EthereumQuantity
}).asReadonly());
//# sourceMappingURL=bouquetTypes.js.map