<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { getTheme, setTheme, type Theme, getAllThemes } from '@tact/design';
	import { store, isLoaded, selectedTags, filterMode, searchTerm, tagSearchTerm, filteredTags, gridColumns, cardHeight, sortMode } from '$lib/store';
	import { Button } from '@tact/ui';
	import { getOrCreateLocalUser, exportUserBackup, estimateExportSize, importUserData, mergeImportedData } from '@tact/data';
	import type { User } from '@tact/core';
	import QrScanner from '$lib/components/QrScanner.svelte';
	import '../app.css';
	
	interface Props {
		children: any;
	}
	
	let { children }: Props = $props();
	
	// Theme functionality
	let currentTheme = $state<Theme>(getTheme());
	const themes = getAllThemes();

	// Export functionality state
	let user = $state<User | null>(null);
	let showExportModal = $state(false);
	let exportPassword = $state('');
	let exportLoading = $state(false);
	let qrCodeUrl = $state<string | null>(null);
	let zipBlob = $state<Blob | null>(null);
	let qrCount = $state<number>(0);
	let exportSize = $state({ uncompressed: 0, estimated: 0, itemCount: 0 });
	let exportType = $state<'single' | 'multi' | null>(null);
	
	// Import functionality state
	let showImportModal = $state(false);
	let importPassword = $state('');
	let importError = $state<string | null>(null);
	let isScanning = $state(false);
	let fileInput = $state<HTMLInputElement>();

	function handleThemeChange(theme: Theme) {
		currentTheme = theme;
		setTheme(theme);
	}

	// Export functionality
	function openExportModal() {
		if (user?.id) {
			exportSize = estimateExportSize(user.id);
		}
		showExportModal = true;
	}

	function closeExportModal() {
		showExportModal = false;
		exportPassword = '';
		qrCodeUrl = null;
		zipBlob = null;
		qrCount = 0;
		exportType = null;
	}

	async function handleExport() {
		if (!user?.id || !exportPassword) return;
		
		exportLoading = true;
		try {
			const result = await exportUserBackup(user.id, exportPassword);
			
			exportType = result.type;
			qrCodeUrl = result.type === 'single' ? result.qrDataUrl : result.maestroDataUrl;
			
			if (result.type === 'multi') {
				zipBlob = result.zipBlob;
				qrCount = result.qrCount;
			}
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			exportLoading = false;
		}
	}

	// Import functionality
	function openImportModal() {
		showImportModal = true;
		importError = null;
		importPassword = '';
		isScanning = false;
	}

	function closeImportModal() {
		showImportModal = false;
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;
		
		importError = null;

		if (!importPassword) {
			importError = 'Please enter the password first.';
			return;
		}

		try {
			const { scanZipFile, scanQRCodeFiles, consumeQRString } = await import('@tact/data');
			
			let qrCodes: string[] = [];
			
			if (input.files.length === 1) {
				const file = input.files[0];
				
				if (file.name.toLowerCase().endsWith('.zip')) {
					qrCodes = await scanZipFile(file);
				} else {
					qrCodes = await scanQRCodeFiles([file]);
				}
			} else {
				qrCodes = await scanQRCodeFiles(Array.from(input.files));
			}
			
			if (qrCodes.length === 0) {
				importError = 'Could not detect any QR codes in the selected files. Please ensure the files contain clear QR codes.';
				return;
			}
			
			let foundComplete = false;
			for (const qrData of qrCodes) {
				if (qrData.startsWith('BQR|')) {
					const completedData = await consumeQRString(qrData, importPassword);
					if (completedData) {
						await handleScan(completedData);
						foundComplete = true;
						break;
					}
				} else {
					try {
						await handleScan(qrData);
						foundComplete = true;
						break;
					} catch (err) {
						// ignore, try next
					}
				}
			}
			
			if (!foundComplete) {
				if (qrCodes.some(qr => qr.startsWith('BQR|'))) {
					importError = `Found ${qrCodes.length} QR code(s) but backup is incomplete. Please ensure you have all QR codes from the backup package.`;
				} else {
					importError = 'Could not process the QR codes found in the files. Please check your password or try different files.';
				}
			}
		} catch (err) {
			importError = 'Could not process the selected files. Please ensure they contain valid QR codes and try again.';
		} finally {
			input.value = '';
		}
	}

	async function handleScan(data: string) {
		isScanning = false;
		if (!importPassword) {
			importError = 'Please enter the password for your backup.';
			return;
		}

		try {
			let importedData;
			
			try {
				importedData = JSON.parse(data);
			} catch {
				importedData = await importUserData(data, importPassword);
			}
			
			mergeImportedData(importedData);
			location.reload();
		} catch (err) {
			console.error(err);
			importError = err instanceof Error ? err.message : 'An unknown error occurred during import.';
		}
	}

	function handleScanError(error: string | Error) {
		isScanning = false;
		importError = error instanceof Error ? error.message : 'Could not start the camera. Please check permissions.';
	}

	onMount(async () => {
		// Handle GitHub Pages 404 redirect
		const redirect = sessionStorage.redirect;
		if (redirect) {
			delete sessionStorage.redirect;
			const url = new URL(redirect);
			const path = url.pathname.replace('/tactqr', '');
			if (path && path !== '/') {
				const { goto } = await import('$app/navigation');
				goto(`${base}${path}`);
				return;
			}
		}
		
		store.loadAllData();
		user = await getOrCreateLocalUser();
		
		// Initialize theme system
		const theme = getTheme();
		setTheme(theme);
		
		// Apply the theme class immediately to prevent flash
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('light', 'dark', 'high-contrast', 'github-dark', 'terminal');
			document.documentElement.classList.add(theme);
		}
	});
</script>

{#if $isLoaded}
	<div class="min-h-screen bg-background text-foreground">
		<!-- Top Navigation Bar -->
		<nav class="bg-card border-b border-border sticky top-0 z-50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<!-- Left side - Logo/Brand -->
					<div class="flex items-center space-x-4">
						<div class="flex items-center gap-2">
							<a href="{base}/" class="text-2xl font-bold text-foreground hover:text-primary transition-colors">
								Tact
							</a>
							<div class="spinning-key"></div>
						</div>
					</div>

					<!-- Right side - Actions -->
					<div class="flex items-center space-x-3">
						<!-- Theme Switcher -->
						<select 
							bind:value={currentTheme}
							onchange={(e) => handleThemeChange(e.target.value)}
							class="px-2 py-1 rounded-full text-sm border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 w-12 text-center"
							title="Switch theme"
						>
							{#each themes as { key, meta }}
								<option value={key}>{meta.icon}</option>
							{/each}
						</select>

						<!-- Export Button -->
						<button onclick={openExportModal} class="text-xl hover:opacity-70 transition-opacity" title="Export Data">
							📦
						</button>

						<!-- Import Button -->
						<button onclick={openImportModal} class="text-xl hover:opacity-70 transition-opacity" title="Import Data">
							📥
						</button>

						<!-- Print Button -->
						<a href="{base}/print" class="text-xl hover:opacity-70 transition-opacity" title="Print QR Codes">
							🖨️
						</a>
						
						<a href="{base}/notes/new" class="text-xl hover:opacity-70 transition-opacity" title="Add Note">
							➕
						</a>
					</div>
				</div>

				<!-- Tag Filtering Bar -->
				{#if $page.route.id === '/'}
					<div class="border-t border-border px-2 py-3">
						<div class="flex items-center space-x-4 flex-wrap gap-2">
							<!-- Search Bars -->
							<div class="flex items-center space-x-2">
								<input
									type="text"
									placeholder="Search notes..."
									bind:value={$searchTerm}
									class="px-3 py-1 rounded-full text-xs border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-32"
								/>
								<input
									type="text"
									placeholder="Search tags..."
									bind:value={$tagSearchTerm}
									class="px-3 py-1 rounded-full text-xs border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-28"
								/>
							</div>

							<!-- Sorting Controls -->
							<div class="flex items-center space-x-2">
								<span class="text-xs text-muted-foreground">Sort:</span>
								<select 
									bind:value={$sortMode}
									onchange={(e) => store.setSortMode(e.target.value)}
									class="px-3 py-1 rounded-full text-xs border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
								>
									<option value="updated-desc">Latest Updated</option>
									<option value="updated-asc">Oldest Updated</option>
									<option value="created-desc">Latest Created</option>
									<option value="created-asc">Oldest Created</option>
								</select>
							</div>

							<!-- Grid Configuration -->
							<div class="flex items-center space-x-2">
								<span class="text-xs text-muted-foreground">Columns:</span>
								<input
									type="range"
									min="1"
									max="4"
									step="1"
									bind:value={$gridColumns}
									onchange={(e) => store.setGridColumns(parseInt(e.target.value))}
									class="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
									title="Grid columns: {$gridColumns}"
								/>
								<span class="text-xs text-muted-foreground">{$gridColumns}</span>
							</div>

							<!-- Filter Mode Toggle -->
							{#if $filteredTags.length > 0}
								<div class="flex items-center space-x-2">
									<span class="text-xs text-muted-foreground">Filter:</span>
									<button 
										onclick={() => store.setFilterMode('any')}
										class="px-3 py-1 rounded-full text-xs font-medium transition-colors {$filterMode === 'any' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
									>
										Any
									</button>
									<button 
										onclick={() => store.setFilterMode('both')}
										class="px-3 py-1 rounded-full text-xs font-medium transition-colors {$filterMode === 'both' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
									>
										Both
									</button>
								</div>

								<!-- Tag Bubbles -->
								<div class="flex items-center space-x-2 flex-wrap gap-2">
									{#each $filteredTags as tag}
										<button
											onclick={() => store.toggleTag(tag)}
											class="px-3 py-1 rounded-full text-xs font-medium transition-colors {$selectedTags.includes(tag) 
												? 'bg-primary text-primary-foreground' 
												: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
										>
											{tag}
										</button>
									{/each}
								</div>
							{/if}

							<!-- Clear Filters -->
							{#if $selectedTags.length > 0 || $searchTerm || $tagSearchTerm}
								<button
									onclick={store.clearAll}
									class="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
								>
									Clear All
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</nav>

		<!-- Main Content Area -->
		<main class="min-h-[calc(100vh-64px)] overflow-y-auto">
			{@render children()}
		</main>
	</div>

	<!-- Export Modal -->
	{#if showExportModal}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
			onclick={(e) => e.target === e.currentTarget && closeExportModal()}
			onkeydown={(e) => e.key === 'Escape' && closeExportModal()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-lg">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-card-foreground">📦 Export Your Data</h2>
					<button
						onclick={closeExportModal}
						class="p-1 hover:bg-muted rounded-md transition-colors"
						aria-label="Close export modal"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if !qrCodeUrl}
					<div class="space-y-4">
						<p class="text-sm text-muted-foreground">
							Export all your notes and data as an encrypted QR code image. 
							You can import this data on any device by scanning the QR codes or uploading the image file.
						</p>
						
						<div class="bg-muted/50 p-3 rounded text-sm space-y-1">
							<div class="flex justify-between">
								<span>Data size:</span>
								<span>{(exportSize.uncompressed / 1024).toFixed(1)} KB</span>
							</div>
							<div class="flex justify-between">
								<span>Compressed:</span>
								<span>{(exportSize.estimated / 1024).toFixed(1)} KB</span>
							</div>
							<div class="flex justify-between">
								<span>Items:</span>
								<span>{exportSize.itemCount}</span>
							</div>
						</div>

						<div class="space-y-2">
							<label for="export-password" class="text-sm font-medium">Encryption Password</label>
							<input
								id="export-password"
								bind:value={exportPassword}
								type="password"
								placeholder="Choose a strong password"
								class="w-full px-3 py-2 border border-border rounded-md bg-background"
								required
							/>
							<p class="text-xs text-muted-foreground">
								Remember this password - you'll need it to import your data
							</p>
						</div>

						<div class="flex gap-2 pt-4">
							<button 
								onclick={closeExportModal}
								class="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
							>
								Cancel
							</button>
							<button 
								onclick={handleExport} 
								disabled={!exportPassword || exportLoading}
								class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
							>
								{exportLoading ? 'Exporting...' : 'Export Notes & Data'}
							</button>
						</div>
					</div>
				{:else}
					<div class="space-y-4 text-center">
						<div class="text-green-600 text-4xl mb-2">✅</div>
						<p class="text-lg font-medium">Export Successful!</p>
						<p class="text-sm text-muted-foreground">
							Your backup is ready as {exportType === 'single' ? 'a single QR code' : 'multiple QR codes'}.
						</p>
						
						{#if zipBlob}
							<div class="border rounded-lg p-4 bg-muted/30">
								<p class="text-sm font-medium mb-2">QR Code Package Ready</p>
								<div class="flex items-center justify-center p-8 bg-background border rounded">
									<div class="text-center">
										<div class="text-6xl mb-2">📦</div>
										<p class="font-medium">{qrCount} Individual QR Codes</p>
										<p class="text-sm text-muted-foreground">Each QR code is crystal clear and easy to scan</p>
									</div>
								</div>
								<p class="text-xs text-muted-foreground mt-2">
									ZIP file contains {qrCount} high-quality QR code images + instructions
								</p>
							</div>
						{:else if qrCodeUrl}
							<div class="border rounded-lg p-4 bg-muted/30">
								<p class="text-sm font-medium mb-2">QR Code Preview</p>
								<img src={qrCodeUrl} alt="Single QR Code" class="mx-auto border rounded" style="width: 256px; height: 256px;" />
							</div>
						{/if}
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							<button 
								onclick={closeExportModal}
								class="px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
							>
								Done
							</button>
							
							<button 
								onclick={() => {
									const link = document.createElement('a');
									const timestamp = new Date().toISOString().split('T')[0];
									
									if (zipBlob) {
										// Download ZIP file
										const url = URL.createObjectURL(zipBlob);
										link.href = url;
										link.download = `tact-backup-${timestamp}.zip`;
									} else if (qrCodeUrl) {
										// Download single PNG
										link.href = qrCodeUrl;
										link.download = `tact-qr-${timestamp}.png`;
									}
									
									link.style.display = 'none';
									document.body.appendChild(link);
									link.click();
									document.body.removeChild(link);
									
									// Clean up blob URL
									if (zipBlob) {
										URL.revokeObjectURL(link.href);
									}
								}}
								class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
							>
								📦 Download {exportType === 'multi' ? 'ZIP Package' : 'PNG Image'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Import Modal -->
	{#if showImportModal}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
			onclick={(e) => e.target === e.currentTarget && closeImportModal()}
			onkeydown={(e) => e.key === 'Escape' && closeImportModal()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-lg">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-card-foreground">📦 Import Your Data</h2>
					<button
						onclick={closeImportModal}
						class="p-1 hover:bg-muted rounded-md transition-colors"
						aria-label="Close import modal"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="space-y-4">
					<p class="text-muted-foreground text-sm">
						Enter your backup password, then use your camera or upload your backup files (ZIP package or individual QR code images).
					</p>

					<input
						bind:value={importPassword}
						type="password"
						placeholder="Enter your backup password"
						class="w-full px-3 py-2 border border-border rounded-md bg-background"
						required
					/>

					{#if isScanning}
						<QrScanner onScan={handleScan} onError={handleScanError} password={importPassword} />
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
							<button onclick={() => isScanning = true} class="w-full py-3 border rounded-lg" disabled={!importPassword}>
								📷 Use Camera
							</button>
							<button onclick={() => fileInput?.click()} class="w-full py-3 border rounded-lg" disabled={!importPassword}>
								📁 Upload Files
							</button>
						</div>
						<input type="file" bind:this={fileInput} onchange={handleFileSelect} accept="image/*,.zip" multiple class="hidden" />
					{/if}

					{#if importError && importPassword}
						<p class="text-destructive text-sm text-center">{importError}</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{:else}
	<!-- Global loading skeleton -->
	<div class="min-h-screen flex items-center justify-center bg-background">
		<div class="w-10 h-10 spinner"></div>
	</div>
{/if}