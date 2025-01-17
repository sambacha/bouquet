import { utils } from 'ethers'
import { batch, ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js'
import { Button } from './Button.js'
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js'
import { ProviderStore } from '../library/provider.js'
import { SettingsModal } from './Settings.js'
import { useAsyncState, AsyncProperty } from '../library/asyncState.js'
import { simulateBundle, sendBundle, checkBundleInclusion, RelayResponseError, SimulationResponseSuccess } from '../library/flashbots.js'

type PendingBundle = {
	bundles: {
		[bundleHash: string]: {
			targetBlock: bigint,
			gas: { priorityFee: bigint, baseFee: bigint }
			transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
			included: boolean
		}
	}
	error?: Error
}

const SimulationResult = ({
	state
}: {
	state: Signal<AsyncProperty<SimulationResponseSuccess>>
}) => {
	if (state.value.state === 'pending') return <div>Simulating...</div>
	if (state.value.state === 'resolved') {
		return state.value.value.firstRevert ?
			<div>
				<h3 class='font-semibold text-error mb-2'>A Transaction Reverted During Simulation</h3>
				<div class='flex w-full min-h-[96px] border-2 border-white rounded-xl'>
					<div class='flex w-24 flex-col items-center justify-center text-white border-r-2'>
						<span class='text-lg font-bold'>#{state.value.value.results.findIndex((x) => 'error' in x)}</span>
					</div>
					<div class='bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold'>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>From</span>
							<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.fromAddress}</span>
						</div>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>To</span>
							<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.toAddress}</span>
						</div>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>Gas Used</span>
							<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.gasUsed} gas</span>
						</div>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>Error</span>
							<span class='rounded bg-background px-2 py-1 font-mono font-medium'>
								{'error' in state.value.value.firstRevert ? String(state.value.value.firstRevert.error) : 'Unknown'}
							</span>
						</div>
					</div>
				</div>
			</div>
			: <div>
				<h3 class='font-semibold text-success'>Simulation Succeeded</h3>
			</div>
	}
	if (state.value.state === 'rejected') {
		return (
			<div>
				<h3 class='font-semibold text-error mb-2'>Simulation Failed</h3>
				<p class='rounded bg-background font-mono font-medium w-full break-all'>{state.value.error.message}</p>
			</div>
		)
	}
	return <></>
}

export const Bundles = ({
	outstandingBundles,
}: {
	outstandingBundles: Signal<PendingBundle>
}) => {
	if (outstandingBundles.value.error) return (<div>
		<h3 class='font-semibold text-error mb-2'>Error Sending Bundle</h3>
		<p class='rounded bg-background font-mono font-medium w-full break-all'>{outstandingBundles.value.error.message}</p>
	</div>)
	return (
		<div class='flex flex-col-reverse gap-4'>
			{Object.values(outstandingBundles.value.bundles).map((bundle) => (
				bundle.included ?
					<div class='flex items-center flex-col font-semibold gap-2'>
						<h2 class='font-bold text-lg text-success'>Bundle Included!</h2>
					</div>
					:
					<div class='flex items-center gap-2 text-white'>
						<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<p>Attempting to get bundle included in block {bundle.targetBlock.toString(10)} with max fee of {Number(utils.formatUnits(bundle.gas.baseFee + bundle.gas.priorityFee, 'gwei')).toPrecision(3)} gwei per gas</p>
					</div>
			))}
		</div>
	)
}

export const Submit = ({
	provider,
	bundle,
	fundingAmountMin,
	signers,
	appSettings,
	blockInfo,
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	appSettings: Signal<AppSettings>
	blockInfo: Signal<BlockInfo>
}) => {
	const showSettings = useSignal<boolean>(false)

	const submissionStatus = useSignal<{ active: boolean, lastBlock: bigint }>({ active: false, lastBlock: 0n })
	const { value: simulationPromise, waitFor: waitForSimulation } = useAsyncState<SimulationResponseSuccess>()

	useSignalEffect(() => {
		if (blockInfo.value.blockNumber > submissionStatus.value.lastBlock) {
			bundleSubmission(blockInfo.value.blockNumber)
		}
	})

	const missingRequirements = useComputed(() => {
		if (!bundle.value) return 'No transactions imported yet.'
		const missingSigners = bundle.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length
		const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value
		if (missingSigners && insufficientBalance) return 'Missing private keys for signing accounts and funding wallet has insufficent balance.'
		if (missingSigners) return 'Missing private keys for signing accounts.'
		if (insufficientBalance) return 'Funding wallet has insufficent balance.'
		return false
	})

	async function simulateCallback() {
		if (!provider.value) throw 'User not connected'
		if (!bundle.value) throw 'No imported bundle found'
		const simulationResult = await simulateBundle(
			bundle.value,
			fundingAmountMin.peek(),
			provider.value,
			signers.peek(),
			blockInfo.peek(),
			appSettings.peek()
		)
		if ('error' in simulationResult) throw new Error((simulationResult as RelayResponseError).error.message)
		else return simulationResult
	}

	const outstandingBundles = useSignal<PendingBundle>({ bundles: {} })

	async function bundleSubmission(blockNumber: bigint) {
		submissionStatus.value = { ...submissionStatus.peek(), lastBlock: blockNumber }

		if (!provider.value) throw new Error('User not connected')
		if (!bundle.value) throw new Error('No imported bundle found')
		const providerStore = provider.value

		// Check status of current bundles
		const checkedPending = await Promise.all(Object.keys(outstandingBundles.peek().bundles).map(bundleHash => checkBundleInclusion(outstandingBundles.peek().bundles[bundleHash].transactions, providerStore)))
		const included = checkedPending.filter(checkedPending => checkedPending.included)
		if (included.length > 0) {
			// We done!
			batch(() => {
				outstandingBundles.value = {
					error: outstandingBundles.peek().error,
					bundles: Object.keys(outstandingBundles.peek().bundles).reduce((checked: {
						[bundleHash: string]: {
							targetBlock: bigint,
							gas: { priorityFee: bigint, baseFee: bigint }
							transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
							included: boolean
						}
					}, current, index) => {
						if (checkedPending[index].included) {
							checked[current] = outstandingBundles.peek().bundles[current]
							checked[current].included = checkedPending[index].included
						}
						return checked
					}, {})
				}
				submissionStatus.value = { active: false, lastBlock: blockNumber }
			})
		} else {
			// Remove old submissions
			outstandingBundles.value = {
				error: outstandingBundles.peek().error,
				bundles: Object.keys(outstandingBundles.peek().bundles)
					.filter(tx => outstandingBundles.peek().bundles[tx].targetBlock > blockNumber)
					.reduce((obj: {
						[bundleHash: string]: {
							targetBlock: bigint,
							gas: { priorityFee: bigint, baseFee: bigint }
							transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
							included: boolean

						}
					}, bundleHash) => {
						obj[bundleHash] = outstandingBundles.peek().bundles[bundleHash]
						return obj
					}, {})
			}

			// Try Submit
			if (submissionStatus.value.active) {
				try {
					const targetBlock = blockNumber + appSettings.peek().blocksInFuture
					const gas = blockInfo.peek()

					const bundleRequest = await sendBundle(
						bundle.value,
						targetBlock,
						fundingAmountMin.peek(),
						provider.value,
						signers.peek(),
						blockInfo.peek(),
						appSettings.peek()
					)

					if (!(bundleRequest.bundleHash in outstandingBundles.peek())) {
						outstandingBundles.value = { ...outstandingBundles.peek(), [bundleRequest.bundleHash]: { targetBlock, gas, transactions: bundleRequest.bundleTransactions, included: false } }
					}
				} catch (err) {
					console.error("SendBundle error", err)
					const error = err && typeof err === 'object' && 'name' in err && 'message' in err && typeof err.name === 'string' && typeof err.message === 'string' ? new Error(err.message) : new Error("Unknown Error")
					batch(() => {
						submissionStatus.value = { active: false, lastBlock: blockNumber }
						outstandingBundles.value = { ...outstandingBundles.peek(), error }
					})
				}
			}
		}
	}

	async function toggleSubmission() {
		batch(() => {
			submissionStatus.value = { ...submissionStatus.peek(), active: !submissionStatus.peek().active }
			outstandingBundles.value = { ...outstandingBundles.peek(), error: undefined }
		})
		bundleSubmission(blockInfo.peek().blockNumber)
	}

	return (
		<>
			<h2 className='font-bold text-2xl'>3. Submit</h2>
			<SettingsModal display={showSettings} appSettings={appSettings} />
			{missingRequirements.value ? (
				<p>{missingRequirements.peek()}</p>
			) : (
				<div className='flex flex-col w-full gap-4'>
					<div>
						<p><span className='font-bold'>Gas:</span> {utils.formatUnits(getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, appSettings.value.blocksInFuture), 'gwei')} gwei + {utils.formatUnits(appSettings.value.priorityFee.toString(), 'gwei')} gwei priority</p>
						<p><span className='font-bold'>Network:</span> {appSettings.value.relayEndpoint}</p>
						<p>Transactions will be attempt to be included in the block {appSettings.value.blocksInFuture.toString()} blocks from now.</p>
						<p>You can edit these settings <button className='font-bold underline' onClick={() => showSettings.value = true}>here</button>.</p>
					</div>
					<div className='flex flex-row gap-6'>
						<Button onClick={() => waitForSimulation(simulateCallback)} disabled={simulationPromise.value.state === 'pending'} variant='secondary'>Simulate</Button>
						<Button onClick={toggleSubmission}>{submissionStatus.value.active ? 'Stop' : 'Submit'}</Button>
					</div>
					<SimulationResult state={simulationPromise} />
					<Bundles outstandingBundles={outstandingBundles} />
				</div>
			)}
		</>
	)
}
