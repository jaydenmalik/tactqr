<script lang="ts">
  interface Props {
    emoji: string;
    onEmojiSelect: (emoji: string) => void;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let { emoji, onEmojiSelect, size = 'md', class: className = '' }: Props = $props();
  let showSelector = $state(false);

  function handleClick() {
    showSelector = true;
  }

  function handleEmojiSelect(selectedEmoji: string) {
    onEmojiSelect(selectedEmoji);
    showSelector = false;
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl'
  };
</script>

<div class="relative">
  <button
    onclick={handleClick}
    class="flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted transition-colors {sizeClasses[size]} {className}"
    type="button"
  >
    {emoji}
  </button>

  {#if showSelector}
    {#await import('./EmojiSelector.svelte') then { default: EmojiSelector }}
      <EmojiSelector
        onSelect={handleEmojiSelect}
        onClose={() => showSelector = false}
      />
    {/await}
  {/if}
</div> 