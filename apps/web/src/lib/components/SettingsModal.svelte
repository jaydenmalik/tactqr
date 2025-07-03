<script lang="ts">
  import { getTheme, setTheme, getAllThemes, type Theme } from '@tact/design';
  import { createEventDispatcher, onMount } from 'svelte';
  import { getOrCreateLocalUser, exportUserBackup, estimateExportSize, importUserData, mergeImportedData } from '@tact/data';
  import type { User } from '@tact/core';
  import { goto } from '$app/navigation';
  import QrScanner from '$lib/components/QrScanner.svelte';
  
  interface Props {
    isOpen: boolean;
  }
  
  let { isOpen = false }: Props = $props();
  
  const dispatch = createEventDispatcher();
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
  
  function closeModal() {
    dispatch('close');
  }
  
  function handleThemeChange(theme: Theme) {
    currentTheme = theme;
    setTheme(theme);
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
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
  
  // Update currentTheme when theme changes externally
  $effect(() => {
    currentTheme = getTheme();
  });

  onMount(async () => {
    user = await getOrCreateLocalUser();
  });

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
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div class="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-lg">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 id="settings-title" class="text-xl font-bold text-card-foreground">⚙️ Settings</h2>
        <button
          onclick={closeModal}
          class="p-1 hover:bg-muted rounded-md transition-colors"
          aria-label="Close settings"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Theme Selection -->
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-semibold text-card-foreground mb-3">🎨 Theme</h3>
          <p class="text-sm text-muted-foreground mb-4">Choose your preferred color theme</p>
          
          <div class="space-y-3">
            {#each themes as { key, meta }}
              <label class="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="theme"
                  value={key}
                  checked={currentTheme === key}
                  onchange={() => handleThemeChange(key)}
                  class="w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-2"
                />
                <div class="flex items-center gap-3 flex-1">
                  <span class="text-2xl">{meta.icon}</span>
                  <div>
                    <div class="font-medium text-card-foreground">{meta.name}</div>
                    <div class="text-sm text-muted-foreground">{meta.description}</div>
                  </div>
                </div>
                
                <!-- Theme Preview -->
                <div class="flex gap-1">
                  {#if key === 'light'}
                    <div class="w-4 h-4 rounded-full bg-amber-50 border border-amber-200"></div>
                    <div class="w-4 h-4 rounded-full bg-blue-500"></div>
                    <div class="w-4 h-4 rounded-full bg-slate-800"></div>
                  {:else if key === 'dark'}
                    <div class="w-4 h-4 rounded-full bg-slate-900"></div>
                    <div class="w-4 h-4 rounded-full bg-blue-400"></div>
                    <div class="w-4 h-4 rounded-full bg-slate-300"></div>
                  {:else if key === 'high-contrast'}
                    <div class="w-4 h-4 rounded-full bg-black"></div>
                    <div class="w-4 h-4 rounded-full bg-green-500"></div>
                    <div class="w-4 h-4 rounded-full bg-green-300"></div>
                  {/if}
                </div>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Additional Settings Placeholder -->
        <div class="border-t border-border pt-4">
          <h3 class="text-lg font-semibold text-card-foreground mb-3">💾 Data</h3>
          <div class="space-y-2">
            <button 
              onclick={openExportModal}
              class="w-full p-3 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div class="font-medium text-card-foreground">Export Data</div>
              <div class="text-sm text-muted-foreground">Download all your notes as encrypted QR codes</div>
            </button>
            <button 
              onclick={openImportModal}
              class="w-full p-3 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div class="font-medium text-card-foreground">Import Data</div>
              <div class="text-sm text-muted-foreground">Import notes from an encrypted backup</div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-6 flex justify-end gap-3">
        <button
          onclick={closeModal}
          class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Export Modal -->
{#if showExportModal}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    onclick={(e) => e.target === e.currentTarget && closeExportModal()}
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

<style>
  /* Ensure modal appears above everything */
  :global(.settings-modal) {
    z-index: 9999;
  }
</style> 