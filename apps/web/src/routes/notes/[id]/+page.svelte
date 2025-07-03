<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { Button, TextField } from '@tact/ui';
	import { store, notes, isLoaded } from '$lib/store';
	import { getWordCount, formatWordCount } from '$lib/utils';
	import type { Note } from '@tact/core/types';
	import EmojiButton from '$lib/components/EmojiButton.svelte';

	let note = $state<Note | null>(null);
	let isEditing = $state(false);
	let isLoading = $state(true);
	let isSaving = $state(false);
	let showSaved = $state(false);
	
	// Edit state
	let editTitle = $state('');
	let editContent = $state('');
	let editEmoji = $state('📝');
	let editTags = $state('');
	let editErrors = $state<Record<string, string>>({});

	// Auto-save timer
	let autoSaveTimer: NodeJS.Timeout | null = null;
	let savedIndicatorTimer: NodeJS.Timeout | null = null;
	let hasUnsavedChanges = $state(false);

	function loadNote() {
		const noteId = $page.params.id;
		const foundNote = $notes.find(n => n.id === noteId);
		
		if (!foundNote) {
			goto(`${base}/`);
			return;
		}
		
		note = foundNote;
		resetEditState();
		isLoading = false;
	}

	function resetEditState() {
		if (!note) return;
		editTitle = note.title;
		editContent = note.content;
		editEmoji = note.emoji;
		editTags = note.tags?.join(', ') || '';
		editErrors = {};
		hasUnsavedChanges = false;
	}

	function toggleEdit() {
		if (isEditing) {
			// Cancel editing
			resetEditState();
		}
		isEditing = !isEditing;
	}

	function handleEmojiSelect(emoji: string) {
		if (note && emoji !== note.emoji) {
			editEmoji = emoji;
			if (isEditing) {
				hasUnsavedChanges = true;
				scheduleAutoSave();
			}
		}
	}

	function scheduleAutoSave() {
		if (!hasUnsavedChanges) return; // Only auto-save if there are changes
		
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}
		const autoSaveDelay = 1000; // Auto-save after 1 second of inactivity
		autoSaveTimer = setTimeout(() => {
			handleSave();
		}, autoSaveDelay);
	}

	function handleTitleInput() {
		if (isEditing && note && editTitle !== note.title) {
			hasUnsavedChanges = true;
			scheduleAutoSave();
		}
	}

	function handleContentInput() {
		if (isEditing && note && editContent !== note.content) {
			hasUnsavedChanges = true;
			scheduleAutoSave();
		}
	}

	function handleTagsInput() {
		if (isEditing && note) {
			const currentTags = note.tags?.join(', ') || '';
			if (editTags !== currentTags) {
				hasUnsavedChanges = true;
				scheduleAutoSave();
			}
		}
	}

	async function handleSave() {
		if (!note || !isEditing) return;

		editErrors = {};
		if (!editTitle.trim()) {
			editErrors.title = 'Title is required.';
			return;
		}
		if (!editContent.trim()) {
			editErrors.content = 'Content is required.';
			return;
		}

		isSaving = true;
		try {
			const tags = editTags.split(',').map(tag => tag.trim()).filter(Boolean);
			
			const updatedNote = await store.updateNote(note.id, {
				title: editTitle.trim(),
				content: editContent.trim(),
				emoji: editEmoji,
				tags: tags.length > 0 ? tags : undefined
			});

			// Update the local note reference with the returned note
			note = updatedNote;
			hasUnsavedChanges = false; // Reset unsaved changes flag
			
			// Show saved indicator
			showSaved = true;
			if (savedIndicatorTimer) {
				clearTimeout(savedIndicatorTimer);
			}
			const savedIndicatorDelay = 2000; // Show "Saved" for 2 seconds
			savedIndicatorTimer = setTimeout(() => {
				showSaved = false;
			}, savedIndicatorDelay);
		} catch (error) {
			console.error('Error saving note:', error);
			editErrors.general = 'Failed to save note.';
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!note) return;
		
		if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
			await store.deleteNote(note.id);
			goto(`${base}/`);
		}
	}

	function formatDate(date: Date | string) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	onMount(() => {
		// Load the note once the store is ready
		if ($isLoaded) {
			loadNote();
		} else {
			// Wait for store to load
			const unsubscribe = isLoaded.subscribe((loaded) => {
				if (loaded && isLoading) {
					loadNote();
					unsubscribe();
				}
			});
		}

		return () => {
			if (autoSaveTimer) {
				clearTimeout(autoSaveTimer);
			}
			if (savedIndicatorTimer) {
				clearTimeout(savedIndicatorTimer);
			}
		};
	});
</script>

<svelte:head>
	<title>{note?.title || 'Note'} - Tact</title>
</svelte:head>

{#if isLoading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="w-10 h-10 spinner"></div>
	</div>
{:else if note}
	<div class="min-h-screen bg-background">
		<!-- Header -->
		<header class="border-b bg-card px-4 sm:px-6 py-4 sticky top-0 z-10">
			<div class="max-w-4xl mx-auto">
				<!-- Mobile Layout -->
				<div class="flex flex-col gap-3 sm:hidden">
					<!-- Top row: Back button and action buttons -->
					<div class="flex items-center justify-between">
						<Button onclick={() => goto(`${base}/`)} variant="ghost" size="sm">
							{#snippet children()}← Back{/snippet}
						</Button>
						
						<div class="flex items-center gap-2">
							{#if isSaving}
								<span class="text-xs text-muted-foreground">Saving...</span>
							{:else if showSaved}
								<span class="text-xs text-green-600 font-medium">✓ Saved</span>
							{/if}
							
							<Button onclick={toggleEdit} variant={isEditing ? "outline" : "default"} size="sm">
								{#snippet children()}
									{isEditing ? 'Cancel' : 'Edit'}
								{/snippet}
							</Button>
							
							{#if isEditing}
								<Button onclick={handleSave} size="sm" disabled={isSaving}>
									{#snippet children()}Save{/snippet}
								</Button>
							{/if}
							
							<Button onclick={handleDelete} variant="ghost" size="sm" class="text-destructive hover:text-destructive">
								{#snippet children()}🗑️{/snippet}
							</Button>
						</div>
					</div>
					
					<!-- Content row: Title/emoji and tags -->
					{#if isEditing}
						<div class="space-y-2">
							<div class="flex items-center gap-2">
								<EmojiButton 
									emoji={editEmoji} 
									onEmojiSelect={handleEmojiSelect}
									size="sm"
								/>
								<input
									bind:value={editTitle}
									oninput={handleTitleInput}
									class="text-lg font-bold bg-transparent border-none outline-none focus:ring-0 px-0 flex-1"
									placeholder="Note title..."
								/>
							</div>
							<input
								bind:value={editTags}
								oninput={handleTagsInput}
								placeholder="tags..."
								class="text-sm bg-muted px-3 py-1 rounded-full border-none outline-none focus:ring-2 focus:ring-primary/50 w-full"
							/>
						</div>
					{:else}
						<div class="space-y-2">
							<div class="flex items-center gap-2">
								<span class="text-2xl">{note.emoji}</span>
								<h1 class="text-lg font-bold">{note.title}</h1>
							</div>
							{#if note.tags && note.tags.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each note.tags as tag}
										<span class="inline-block px-2 py-1 text-xs bg-muted rounded-full">
											{tag}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Desktop Layout -->
				<div class="hidden sm:flex items-center justify-between">
					<div class="flex items-center gap-4 min-w-0 flex-1">
						<Button onclick={() => goto(`${base}/`)} variant="ghost" size="sm">
							{#snippet children()}← Back{/snippet}
						</Button>
						
						{#if isEditing}
							<div class="flex items-center gap-3 flex-wrap min-w-0 flex-1">
								<div class="flex items-center gap-2 min-w-0">
									<EmojiButton 
										emoji={editEmoji} 
										onEmojiSelect={handleEmojiSelect}
										size="sm"
									/>
									<input
										bind:value={editTitle}
										oninput={handleTitleInput}
										class="text-xl font-bold bg-transparent border-none outline-none focus:ring-0 px-0 min-w-0 flex-1"
										placeholder="Note title..."
									/>
								</div>
								<div class="flex items-center gap-1">
									<input
										bind:value={editTags}
										oninput={handleTagsInput}
										placeholder="tags..."
										class="text-sm bg-muted px-3 py-1 rounded-full border-none outline-none focus:ring-2 focus:ring-primary/50 min-w-32"
									/>
								</div>
							</div>
						{:else}
							<div class="flex items-center gap-3 flex-wrap min-w-0 flex-1">
								<div class="flex items-center gap-2 min-w-0">
									<span class="text-2xl">{note.emoji}</span>
									<h1 class="text-xl font-bold truncate">{note.title}</h1>
								</div>
								{#if note.tags && note.tags.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each note.tags as tag}
											<span class="inline-block px-2 py-1 text-xs bg-muted rounded-full">
												{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-2 flex-shrink-0">
						{#if isSaving}
							<span class="text-sm text-muted-foreground">Saving...</span>
						{:else if showSaved}
							<span class="text-sm text-green-600 font-medium">✓ Saved</span>
						{/if}
						
						<Button onclick={toggleEdit} variant={isEditing ? "outline" : "default"} size="sm">
							{#snippet children()}
								{isEditing ? 'Cancel' : 'Edit'}
							{/snippet}
						</Button>
						
						{#if isEditing}
							<Button onclick={handleSave} size="sm" disabled={isSaving}>
								{#snippet children()}Save{/snippet}
							</Button>
						{/if}
						
						<Button onclick={handleDelete} variant="ghost" size="sm" class="text-destructive hover:text-destructive">
							{#snippet children()}🗑️{/snippet}
						</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- Content -->
		<main class="max-w-4xl mx-auto px-6 py-8">
			{#if isEditing}
				<div class="space-y-6">
					{#if editErrors.title}
						<p class="text-sm text-destructive">{editErrors.title}</p>
					{/if}
					
					<div>
						<div class="flex justify-between items-center mb-2">
							<label for="edit-content" class="text-sm font-medium">Content</label>
							<span class="text-xs text-muted-foreground">{formatWordCount(getWordCount(editContent))}</span>
						</div>
						<textarea
							id="edit-content"
							bind:value={editContent}
							oninput={handleContentInput}
							placeholder="Write your note content here..."
							class="w-full min-h-96 px-4 py-3 border rounded-lg bg-background resize-y text-base leading-relaxed break-words"
							style="font-family: inherit; word-wrap: break-word;"
						></textarea>
						{#if editErrors.content}
							<p class="text-sm text-destructive mt-1">{editErrors.content}</p>
						{/if}
					</div>



					{#if editErrors.general}
						<p class="text-sm text-destructive">{editErrors.general}</p>
					{/if}
				</div>
			{:else}
				<article class="max-w-none">
					<div class="whitespace-pre-wrap text-base leading-relaxed text-foreground break-words overflow-wrap-anywhere">{note.content}</div>
				</article>



				<!-- Meta info -->
				<div class="mt-8 pt-6 border-t text-sm text-muted-foreground space-y-2">
					<div class="flex justify-between items-center">
						<div>
							<p>Created {formatDate(note.createdAt)}</p>
							{#if new Date(note.updatedAt).getTime() !== new Date(note.createdAt).getTime()}
								<p>Last updated {formatDate(note.updatedAt)}</p>
							{/if}
						</div>
						<div class="text-right">
							<p>{formatWordCount(getWordCount(note.content))}</p>
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>
{/if}

<style>
	.spinner {
		border: 2px solid #f3f3f3;
		border-top: 2px solid #3498db;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style> 