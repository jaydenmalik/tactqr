<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { consumeQRString } from '@tact/data';
	import { Button } from '@tact/ui';

	interface Props {
		onScan: (data: string) => void;
		onError: (error: Error | string) => void;
		password: string;
	}

	let { onScan, onError, password }: Props = $props();

	let videoElement = $state<HTMLVideoElement>();
	let qrScanner: any = $state();
	let progress = $state('Position the maestro QR code in the camera frame');
	let scannedCount = $state(0);
	let totalQRs = $state(0);
	let isScanning = $state(false);
	let isPaused = $state(false);
	let isComplete = $state(false);
	let lastScannedResult = $state<string | null>(null);
	let scanningStep = $state<'maestro' | 'chunks' | 'complete'>('maestro');

	onMount(async () => {
		if (!browser) return;

		try {
			const QrScanner = (await import('qr-scanner')).default;
			
			qrScanner = new QrScanner(videoElement, async (result) => {
				if (!isScanning || isPaused) return;
				
				// Prevent scanning the same QR multiple times
				if (lastScannedResult === result.data) return;
				lastScannedResult = result.data;
				
				try {
					const completedData = await consumeQRString(result.data, password);
					
					// Pause scanning immediately after successful scan
					isPaused = true;
					qrScanner.pause();
					
					if (scanningStep === 'maestro') {
						// First QR should be maestro
						if (result.data.includes('|M|')) {
							const parts = result.data.split('|');
							totalQRs = parseInt(parts[3], 10);
							scannedCount = 1; // Maestro counts as first scan
							scanningStep = 'chunks';
							progress = `Maestro QR scanned! ${totalQRs} more QR codes to scan.`;
						} else {
							progress = 'Please scan the maestro QR code first (the one marked as "M")';
							isPaused = false;
							qrScanner.start();
							return;
						}
					} else if (scanningStep === 'chunks') {
						scannedCount++;
						
						if (completedData) {
							// Got complete data set
							isComplete = true;
							scanningStep = 'complete';
							progress = `All QR codes scanned successfully! Click "Finish" to import your data.`;
						} else {
							// Still collecting chunks
							progress = `Scanned ${scannedCount}/${totalQRs + 1} QR codes. Click "Next" to scan the next one.`;
						}
					}
					
					// If we have complete data, store it for the finish button
					if (completedData) {
						lastScannedResult = completedData;
					}
					
				} catch (error) {
					console.error('QR processing error:', error);
					isPaused = false;
					qrScanner.start();
					
					if (error instanceof Error && error.message.includes('Decryption failed')) {
						progress = 'Invalid password or corrupted QR code. Try again.';
					} else {
						// Might be a regular single QR, try old method
						onScan(result.data);
						return;
					}
				}
			}, {
				highlightScanRegion: true,
				highlightCodeOutline: true,
			});

			// Don't start automatically
			// await qrScanner.start();

		} catch (err) {
			console.error(err);
			if (err instanceof Error) {
				onError(err);
			} else {
				onError('An unknown error occurred while starting the scanner.');
			}
		}
	});

	function startScanning() {
		if (!qrScanner) return;
		isScanning = true;
		isPaused = false;
		lastScannedResult = null;
		qrScanner.start();
	}

	function nextScan() {
		if (!qrScanner) return;
		isPaused = false;
		lastScannedResult = null;
		qrScanner.start();
		
		if (scanningStep === 'chunks') {
			progress = `Position QR code ${scannedCount + 1}/${totalQRs + 1} in the camera frame`;
		}
	}

	function finishImport() {
		if (lastScannedResult && isComplete) {
			qrScanner.stop();
			onScan(lastScannedResult);
		}
	}

	function cancelScanning() {
		if (qrScanner) {
			qrScanner.stop();
		}
		onError('Scanning cancelled by user');
	}
</script>

<div class="space-y-4">
	<div class="bg-muted rounded-lg overflow-hidden">
		<video bind:this={videoElement} class="w-full h-auto">
			<track kind="captions" />
		</video>
	</div>
	
	<div class="text-center space-y-3">
		<p class="text-sm text-muted-foreground">
			{progress}
		</p>
		
		{#if scannedCount > 0 && !isComplete}
			<p class="text-sm text-primary font-medium">
				Progress: {scannedCount}/{totalQRs + 1} QR codes scanned
			</p>
		{/if}
		
		<div class="flex justify-center space-x-3">
			{#if !isScanning && scanningStep === 'maestro'}
				<Button onclick={startScanning}>
					{#snippet children()}Start Scanning{/snippet}
				</Button>
			{:else if isPaused && scanningStep === 'chunks' && !isComplete}
				<Button onclick={nextScan}>
					{#snippet children()}Next QR Code{/snippet}
				</Button>
			{:else if isComplete}
				<Button onclick={finishImport} variant="default">
					{#snippet children()}✅ Finish Import{/snippet}
				</Button>
			{/if}
			
			<Button onclick={cancelScanning} variant="outline">
				{#snippet children()}Cancel{/snippet}
			</Button>
		</div>
	</div>
</div> 