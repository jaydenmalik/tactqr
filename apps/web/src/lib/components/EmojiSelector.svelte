<script lang="ts">
  interface Props {
    onSelect: (emoji: string) => void;
    onClose: () => void;
  }

  let { onSelect, onClose }: Props = $props();

  const emojiCategories = {
    'Notes & Documents': ['📝', '📄', '📋', '📊', '📈', '📉', '🗂️', '📁', '📑', '🗃️'],
    'Security & Privacy': ['🔐', '🔒', '🔑', '🛡️', '🔓', '🗝️', '⚡', '🔍', '👁️', '🚫'],
    'Work & Projects': ['💼', '🏢', '⚙️', '🔧', '🔨', '📊', '💡', '🎯', '📈', '🏆'],
    'Personal': ['❤️', '🏠', '👤', '👨‍👩‍👧‍👦', '🎂', '🎉', '💝', '📞', '✉️', '📱'],
    'Travel & Places': ['✈️', '🌍', '🗺️', '📍', '🏨', '🚗', '🚆', '⛰️', '🏖️', '🏝️'],
    'Money & Finance': ['💰', '💵', '💳', '🏦', '📊', '💎', '🪙', '💸', '📉', '📈'],
    'Health & Fitness': ['🏥', '💊', '🏃‍♂️', '🧘‍♀️', '🥗', '💪', '⚕️', '🩺', '🏋️', '🚴'],
    'Food & Drink': ['🍕', '🍔', '🍜', '🍱', '🥗', '🍰', '☕', '🍷', '🥤', '🍎'],
    'Education': ['📚', '🎓', '✏️', '📏', '🔬', '🧮', '🎨', '📖', '✒️', '📐'],
    'Entertainment': ['🎬', '🎮', '🎵', '📺', '🎭', '🎪', '🎨', '📷', '🎸', '🎤'],
    'Nature': ['🌱', '🌳', '🌸', '🌺', '🌻', '🌙', '⭐', '☀️', '🌈', '🦋'],
    'Objects': ['⏰', '📱', '💻', '🖥️', '⌚', '📷', '🔋', '💡', '🔌', '📺']
  };

  let selectedCategory = $state('Notes & Documents');

  function handleEmojiClick(emoji: string) {
    onSelect(emoji);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

<!-- Backdrop -->
<div 
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <!-- Emoji Selector Modal -->
  <div class="bg-card border border-border rounded-lg p-6 w-full max-w-lg shadow-lg">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Choose an Emoji</h3>
      <button
        onclick={onClose}
        class="p-1 hover:bg-muted rounded-md transition-colors"
        aria-label="Close emoji selector"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Category Tabs -->
    <div class="flex flex-wrap gap-1 mb-6">
      {#each Object.keys(emojiCategories) as category}
        <button
          onclick={() => selectedCategory = category}
          class="px-2 py-1 text-xs rounded transition-colors {selectedCategory === category ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}"
        >
          {category}
        </button>
      {/each}
    </div>

    <!-- Emoji Grid -->
    <div class="grid grid-cols-8 gap-3 max-h-80 overflow-y-auto">
      {#each emojiCategories[selectedCategory] as emoji}
        <button
          onclick={() => handleEmojiClick(emoji)}
          class="w-12 h-12 flex items-center justify-center text-2xl hover:bg-muted rounded transition-colors"
        >
          {emoji}
        </button>
      {/each}
    </div>
  </div>
</div> 