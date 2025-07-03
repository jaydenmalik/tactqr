<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button, TextField } from '@tact/ui';
	import { store } from '$lib/store';
	import { getOrCreateLocalUser } from '@tact/data';
	import { getWordCount, formatWordCount } from '$lib/utils';
	import type { User } from '@tact/core/types';
	import EmojiButton from '$lib/components/EmojiButton.svelte';

	let user = $state<User | null>(null);
	let isSaving = $state(false);
	
	// Form state
	let title = $state('');
	let content = $state('');
	let emoji = $state('📝');
	let tags = $state('');
	let errors = $state<Record<string, string>>({});

	function handleEmojiSelect(selectedEmoji: string) {
		emoji = selectedEmoji;
	}

	async function handleSave() {
		errors = {};
		if (!title.trim()) {
			errors.title = 'Title is required.';
			return;
		}
		if (!content.trim()) {
			errors.content = 'Content is required.';
			return;
		}

		if (!user?.id) {
			errors.general = 'User not found. Please refresh the page.';
			return;
		}

		isSaving = true;
		try {
			const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
			
			const newNote = await store.addNote({
				userId: user.id,
				title: title.trim(),
				content: content.trim(),
				emoji: emoji,
				tags: tagArray.length > 0 ? tagArray : undefined
			});

			// Navigate to the new note
			goto(`/notes/${newNote.id}`);
		} catch (error) {
			console.error('Error creating note:', error);
			errors.general = 'Failed to create note.';
		} finally {
			isSaving = false;
		}
	}

	function handleCancel() {
		goto('/');
	}

	onMount(async () => {
		user = await getOrCreateLocalUser();
	});
</script>

<svelte:head>
	<title>New Note - Tact</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="border-b bg-card px-4 sm:px-6 py-4 sticky top-0 z-10">
		<div class="max-w-4xl mx-auto">
			<!-- Mobile Layout -->
			<div class="flex flex-col gap-3 sm:hidden">
				<!-- Top row: Back button and action buttons -->
				<div class="flex items-center justify-between">
					<Button onclick={handleCancel} variant="ghost" size="sm">
						{#snippet children()}← Back{/snippet}
					</Button>
					
					<div class="flex items-center gap-2">
						{#if isSaving}
							<span class="text-xs text-muted-foreground">Saving...</span>
						{/if}
						
						<Button onclick={handleCancel} variant="outline" size="sm">
							{#snippet children()}Cancel{/snippet}
						</Button>
						
						<Button onclick={handleSave} size="sm" disabled={isSaving || !user}>
							{#snippet children()}{isSaving ? 'Creating...' : 'Create'}{/snippet}
						</Button>
					</div>
				</div>
				
				<!-- Content row: Title/emoji and tags -->
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<EmojiButton 
							emoji={emoji} 
							onEmojiSelect={handleEmojiSelect}
							size="sm"
						/>
						<h1 class="text-lg font-bold">New Note</h1>
					</div>
					<input
						bind:value={tags}
						placeholder="tags..."
						class="text-sm bg-muted px-3 py-1 rounded-full border-none outline-none focus:ring-2 focus:ring-primary/50 w-full"
					/>
				</div>
			</div>

			<!-- Desktop Layout -->
			<div class="hidden sm:flex items-center justify-between">
				<div class="flex items-center gap-4 min-w-0 flex-1">
					<Button onclick={handleCancel} variant="ghost" size="sm">
						{#snippet children()}← Back{/snippet}
					</Button>
					
					<div class="flex items-center gap-3 flex-wrap min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<EmojiButton 
								emoji={emoji} 
								onEmojiSelect={handleEmojiSelect}
								size="sm"
							/>
							<h1 class="text-xl font-bold">New Note</h1>
						</div>
						<div class="flex items-center gap-1">
							<input
								bind:value={tags}
								placeholder="tags..."
								class="text-sm bg-muted px-3 py-1 rounded-full border-none outline-none focus:ring-2 focus:ring-primary/50 min-w-32"
							/>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2 flex-shrink-0">
					{#if isSaving}
						<span class="text-sm text-muted-foreground">Saving...</span>
					{/if}
					
					<Button onclick={handleCancel} variant="outline" size="sm">
						{#snippet children()}Cancel{/snippet}
					</Button>
					
					<Button onclick={handleSave} size="sm" disabled={isSaving || !user}>
						{#snippet children()}{isSaving ? 'Creating...' : 'Create Note'}{/snippet}
					</Button>
				</div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-4xl mx-auto px-6 py-8">
		<div class="space-y-6">
			<div>
				<TextField
					bind:value={title}
					label="Title"
					placeholder="Enter note title..."
					required
					error={errors.title}
				/>
			</div>
			
			<div>
				<div class="flex justify-between items-center mb-2">
					<label for="note-content" class="text-sm font-medium">Content</label>
					<span class="text-xs text-muted-foreground">{formatWordCount(getWordCount(content))}</span>
				</div>
				<textarea
					id="note-content"
					bind:value={content}
					placeholder="Write your note content here..."
					class="w-full min-h-96 px-4 py-3 border rounded-lg bg-background resize-y text-base leading-relaxed"
					style="font-family: inherit;"
				></textarea>
				{#if errors.content}
					<p class="text-sm text-destructive mt-1">{errors.content}</p>
				{/if}
			</div>



			{#if errors.general}
				<p class="text-sm text-destructive">{errors.general}</p>
			{/if}
		</div>
	</main>
</div> 