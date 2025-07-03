<script lang="ts">
	import { Button } from '@tact/ui';
	import { onMount } from 'svelte';

	let fileInput = $state<HTMLInputElement>();
	let qrImages = $state<string[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let zipFileName = $state<string>('');

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;

		const file = input.files[0];
		if (!file.name.toLowerCase().endsWith('.zip')) {
			error = 'Please select a ZIP file containing QR codes.';
			return;
		}

		isLoading = true;
		error = null;
		zipFileName = file.name;

		try {
			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();
			const contents = await zip.loadAsync(file);
			
			const imageFiles: string[] = [];
			
			// Extract image files from ZIP
			for (const [filename, zipObject] of Object.entries(contents.files)) {
				if (zipObject.dir) continue;
				
				const extension = filename.toLowerCase().split('.').pop();
				if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
					const blob = await zipObject.async('blob');
					const dataUrl = await new Promise<string>((resolve) => {
						const reader = new FileReader();
						reader.onload = (e) => resolve(e.target?.result as string);
						reader.readAsDataURL(blob);
					});
					imageFiles.push(dataUrl);
				}
			}

			if (imageFiles.length === 0) {
				error = 'No image files found in the ZIP archive.';
				return;
			}

			qrImages = imageFiles.sort(); // Sort for consistent ordering
		} catch (err) {
			error = 'Failed to process ZIP file. Please ensure it contains valid QR code images.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	function handlePrint() {
		window.print();
	}

	async function handleSavePNG() {
		try {
			const maxQRCodesPerPage = 85;
			const timestamp = new Date().toISOString().split('T')[0];
			
			// Calculate how many pages we need
			const totalPages = Math.ceil(qrImages.length / maxQRCodesPerPage);
			
			for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
				// Get QR codes for this page
				const startIndex = pageIndex * maxQRCodesPerPage;
				const endIndex = Math.min(startIndex + maxQRCodesPerPage, qrImages.length);
				const pageQRCodes = qrImages.slice(startIndex, endIndex);
				
				// Create canvas with higher resolution for crisp QR codes
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) continue;

				// Higher resolution: 300 DPI for crisp QR codes
				const width = 2480;  // 210mm at 300 DPI
				const height = 3508; // 297mm at 300 DPI
				canvas.width = width;
				canvas.height = height;

				// Disable image smoothing for crisp pixel-perfect QR codes
				ctx.imageSmoothingEnabled = false;

				// White background
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, width, height);

				// No left/right margins, minimal top/bottom
				const topMargin = 20;
				const bottomMargin = 20;
				const qrSize = 280; // Larger QR codes at 300 DPI (140px equivalent at 150 DPI)
				const gap = 8; // Minimal gap between QR codes
				const numberHeight = 30; // Space for number below QR code

				// Calculate layout - use full width
				const availableWidth = width;
				const availableHeight = height - topMargin - bottomMargin;
				const cellWidth = qrSize + gap;
				const cellHeight = qrSize + numberHeight + gap;
				
				const cols = Math.floor(availableWidth / cellWidth);
				const rows = Math.floor(availableHeight / cellHeight);
				
				// Center the grid horizontally only
				const gridWidth = cols * cellWidth - gap;
				const startX = (width - gridWidth) / 2;
				const startY = topMargin;

				console.log(`Page ${pageIndex + 1}/${totalPages}: ${cols} cols × ${rows} rows, ${pageQRCodes.length} QR codes`);

				// Draw QR codes for this page
				const imagePromises = pageQRCodes.map((imageDataUrl, index) => {
					return new Promise<void>((resolve) => {
						const img = new Image();
						img.onload = () => {
							const col = index % cols;
							const row = Math.floor(index / cols);
							const x = startX + col * cellWidth;
							const y = startY + row * cellHeight;

							// Draw QR code with pixel-perfect rendering
							ctx.drawImage(img, x, y, qrSize, qrSize);

							// Draw number below QR code
							ctx.fillStyle = '#000000';
							ctx.font = 'bold 24px Arial'; // Larger font at 300 DPI
							ctx.textAlign = 'center';
							const qrNumber = startIndex + index + 1;
							ctx.fillText(qrNumber.toString(), x + qrSize / 2, y + qrSize + 24);

							resolve();
						};
						img.src = imageDataUrl;
					});
				});

				await Promise.all(imagePromises);

				// Convert to blob and download
				await new Promise<void>((resolve) => {
					canvas.toBlob((blob) => {
						if (blob) {
							const url = URL.createObjectURL(blob);
							const link = document.createElement('a');
							let filename;
							if (totalPages === 1) {
								filename = `tact-qr-codes-${timestamp}.png`;
							} else {
								filename = `tact-qr-codes-${timestamp}-page-${pageIndex + 1}-of-${totalPages}.png`;
							}
							link.href = url;
							link.download = filename;
							link.style.display = 'none';
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
							URL.revokeObjectURL(url);
						}
						resolve();
					}, 'image/png', 1.0);
				});
				
				// Small delay between downloads to prevent browser issues
				if (pageIndex < totalPages - 1) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}

		} catch (error) {
			console.error('Failed to generate PNG:', error);
			// Fallback to print
			window.print();
		}
	}

	function handleReset() {
		qrImages = [];
		zipFileName = '';
		error = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<svelte:head>
	<title>Print QR Codes - Tact</title>
</svelte:head>

{#if qrImages.length === 0}
	<div class="min-h-screen bg-background p-6">
		<div class="max-w-2xl mx-auto">
			<div class="text-center space-y-6">
				<div class="space-y-2">
					<h1 class="text-3xl font-bold text-foreground">🖨️ Print QR Codes</h1>
					<p class="text-muted-foreground">
						Upload a ZIP file containing QR codes to create a printable A4 layout
					</p>
				</div>

				<div class="bg-card border border-border rounded-lg p-8 space-y-4">
					<div class="text-6xl">📦</div>
					<h2 class="text-xl font-semibold">Upload ZIP File</h2>
					<p class="text-sm text-muted-foreground">
						Select a ZIP file containing your exported QR codes. They will be arranged in a printable A4 format.
					</p>

					<div class="space-y-4">
						<Button 
							onclick={() => fileInput?.click()} 
							disabled={isLoading}
							class="w-full"
						>
							{#snippet children()}
								{isLoading ? 'Processing...' : '📁 Select ZIP File'}
							{/snippet}
						</Button>
						
						<input 
							type="file" 
							bind:this={fileInput} 
							onchange={handleFileSelect} 
							accept=".zip" 
							class="hidden" 
						/>

						{#if error}
							<p class="text-destructive text-sm">{error}</p>
						{/if}
					</div>
				</div>

				<div class="text-left bg-muted/30 p-4 rounded-lg space-y-2">
					<h3 class="font-medium">💡 How to use:</h3>
					<ol class="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
						<li>Export your data to get a ZIP file with QR codes</li>
						<li>Upload the ZIP file using the button above</li>
						<li>Review the print layout and click "Print"</li>
						<li>Use the printed QR codes for backup or transfer</li>
					</ol>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Print Layout -->
	<div class="print-layout">
		<!-- Screen-only controls -->
		<div class="no-print bg-background border-b border-border">
			<div class="max-w-4xl mx-auto px-4 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-xl font-bold">🖨️ Print Preview</h1>
						<p class="text-sm text-muted-foreground">
							{qrImages.length} QR codes from {zipFileName}
						</p>
					</div>
					<div class="flex gap-2">
						<Button onclick={handleReset} variant="outline">
							{#snippet children()}Reset{/snippet}
						</Button>
						<Button onclick={handleSavePNG}>
							{#snippet children()}💾 Save as PNG{/snippet}
						</Button>
					</div>
				</div>
			</div>
		</div>

		<!-- A4 Print Content -->
		<div class="a4-page">
			<!-- QR Codes Grid -->
			<div class="qr-grid">
				{#each qrImages as image, index}
					<div class="qr-item">
						<img src={image} alt="QR Code {index + 1}" class="qr-image" />
						<div class="qr-label">{index + 1}</div>
					</div>
				{/each}
			</div>


		</div>
	</div>
{/if}

<style>
	/* Print-specific styles */
	@media print {
		.no-print {
			display: none !important;
		}
	}

	.print-layout {
		background: white;
		min-height: 100vh;
	}

	.a4-page {
		width: 210mm;
		min-height: 297mm;
		margin: 0 auto;
		padding: 5mm 0; /* Only top/bottom padding, no left/right margins */
		background: white;
		box-shadow: 0 0 10px rgba(0,0,0,0.1);
		display: flex;
		flex-direction: column;
	}

	@media print {
		.a4-page {
			box-shadow: none;
			margin: 0;
			width: 100%;
			min-height: 100vh;
			padding: 3mm 0; /* Only top/bottom padding, no left/right margins */
		}
	}

	.qr-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
		gap: 5px;
		flex: 1;
		align-content: start;
	}

	.qr-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2px;
	}

	.qr-image {
		width: 140px;
		height: 140px;
		object-fit: contain;
	}

	.qr-label {
		font-size: 12px;
		font-weight: bold;
		margin-top: 3px;
		text-align: center;
	}



	/* Screen layout adjustments */
	@media screen {
		.print-layout {
			background: #f5f5f5;
		}
	}
</style> 