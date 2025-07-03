<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button, Card } from '@tact/ui';
	import { store, notes, selectedTags, filterMode, searchTerm, tagSearchTerm, filteredNotes, gridColumns } from '$lib/store';
	import { getOrCreateLocalUser } from '@tact/data';
	import { getWordCount } from '$lib/utils';
	import type { User, Note } from '@tact/core/types';

	let user = $state<User | null>(null);
	let isMobile = $state(false);

	// Check if we're on mobile (width < 768px)
	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768;
		}
	}

	async function handleDeleteNote(note: Note, event: Event) {
		event.stopPropagation(); // Prevent navigation to note page
		if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
			await store.deleteNote(note.id);
		}
	}

	function handleNoteClick(note: Note) {
		goto(`/notes/${note.id}`);
	}

	function handleNewNote() {
		goto('/notes/new');
	}

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function truncateContent(content: string, maxLength: number = 150) {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}

	onMount(async () => {
		user = await getOrCreateLocalUser();
		checkMobile();
		
		// Add resize listener
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
			return () => {
				window.removeEventListener('resize', checkMobile);
			};
		}
	});
</script>

<div class="container mx-auto p-6 space-y-6 max-w-6xl">
	<!-- Notes Grid -->
	{#if $filteredNotes.length === 0}
		<Card class="text-center p-8">
			<div class="space-y-4">
				<div class="text-6xl">📝</div>
				{#if $selectedTags.length > 0 || $searchTerm || $tagSearchTerm}
					<h3 class="text-xl font-medium">No notes match your criteria</h3>
					<p class="text-muted-foreground">
						{#if ($searchTerm || $tagSearchTerm) && $selectedTags.length > 0}
							Try adjusting your search terms or tag filters, or create a new note.
						{:else if $searchTerm || $tagSearchTerm}
							Try different search terms or create a new note with this content.
						{:else}
							Try adjusting your tag filters or create a new note with these tags.
						{/if}
					</p>
					<div class="flex justify-center space-x-2">
						<Button onclick={store.clearAll}>
							{#snippet children()}Clear Filters{/snippet}
						</Button>
						<Button onclick={handleNewNote} disabled={!user} variant="outline">
							{#snippet children()}Create New Note{/snippet}
						</Button>
					</div>
				{:else if $notes.length === 0}
					<h3 class="text-xl font-medium">No notes yet!</h3>
					<p class="text-muted-foreground">
						Create your first note to get started.
					</p>
					<Button onclick={handleNewNote} disabled={!user}>
						{#snippet children()}Create Your First Note{/snippet}
					</Button>
				{:else}
					<h3 class="text-xl font-medium">Something went wrong</h3>
					<p class="text-muted-foreground">
						Unable to load your notes. Please refresh the page.
					</p>
				{/if}
			</div>
		</Card>
	{:else}
		<div 
			class="grid gap-4"
			style="grid-template-columns: repeat({isMobile ? Math.min($gridColumns, 2) : $gridColumns}, minmax(0, 1fr));"
		>
			{#each $filteredNotes as note (note.id)}
				<div 
					class="border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer group overflow-hidden flex flex-col"
					style="height: 200px;"
					onclick={() => handleNoteClick(note)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNoteClick(note)}
					role="button"
					tabindex="0"
					aria-label="View note: {note.title}"
				>
					<div class="p-4 flex-1 flex flex-col justify-between">
						<!-- Note Header -->
						<div class="space-y-3 flex-1">
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-2 min-w-0 flex-1">
									<span class="text-2xl flex-shrink-0">{note.emoji}</span>
									<h3 class="font-medium text-lg leading-tight truncate">{note.title}</h3>
								</div>
								<Button 
									onclick={(e) => handleDeleteNote(note, e)}
									variant="ghost" 
									size="sm"
									class="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
								>
									{#snippet children()}🗑️{/snippet}
								</Button>
							</div>

							<!-- Note Content Preview -->
							<div class="flex-1 overflow-hidden">
								<p class="text-muted-foreground text-sm leading-relaxed overflow-hidden">
									{truncateContent(note.content, 40)}
								</p>
							</div>
						</div>

						<!-- Bottom Section -->
						<div class="space-y-2">
							<!-- Tags -->
							{#if note.tags && note.tags.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each note.tags.slice(0, 3) as tag}
										<span class="inline-block px-2 py-1 text-xs bg-muted rounded-full {$selectedTags.includes(tag) ? 'ring-2 ring-primary' : ''} {$tagSearchTerm && tag.toLowerCase().includes($tagSearchTerm.toLowerCase()) ? 'bg-green-200 text-green-800' : ''}">
											{tag}
										</span>
									{/each}
									{#if note.tags.length > 3}
										<span class="inline-block px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground">
											+{note.tags.length - 3}
										</span>
									{/if}
								</div>
							{/if}

							<!-- Note Footer -->
							<div class="text-xs text-muted-foreground border-t pt-2 space-y-1">
								<div class="flex justify-between items-center">
									<p>Updated {formatDate(note.updatedAt)}</p>
									<p>{getWordCount(note.content)} words</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div> 