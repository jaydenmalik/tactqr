<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    open: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
    onClose?: () => void;
    children: any;
    header?: any;
  }

  let {
    open = $bindable(),
    title,
    size = 'md',
    class: className = '',
    onClose,
    children,
    header
  }: Props = $props();

  let dialog: HTMLDialogElement;
  let previousActiveElement: Element | null = null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  $effect(() => {
    if (open && dialog) {
      previousActiveElement = document.activeElement;
      dialog.showModal();
      // Focus the first focusable element
      const firstFocusable = dialog.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    } else if (!open && dialog) {
      dialog.close();
      // Restore focus
      if (previousActiveElement && 'focus' in previousActiveElement) {
        (previousActiveElement as HTMLElement).focus();
      }
    }
  });

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialog) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleClose() {
    open = false;
    onClose?.();
  }

  onMount(() => {
    return () => {
      if (previousActiveElement && 'focus' in previousActiveElement) {
        (previousActiveElement as HTMLElement).focus();
      }
    };
  });
</script>

<dialog 
  bind:this={dialog}
  class="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-transparent p-0 max-w-none w-full h-full"
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
>
  <div class="flex items-center justify-center min-h-full p-4">
    <div class="relative bg-background rounded-lg shadow-hard border animate-scale-in {sizeClasses[size]} w-full {className}">
      {#if title || header}
        <div class="flex items-center justify-between p-6 border-b">
          <div class="flex-1">
            {#if header}
              {@render header()}
            {:else if title}
              <h2 class="text-lg font-semibold">{title}</h2>
            {/if}
          </div>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground p-1 rounded-sm transition-colors ml-4"
            onclick={handleClose}
            aria-label="Close dialog"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      {/if}
      
      <div class="p-6">
        {@render children()}
      </div>
    </div>
  </div>
</dialog> 