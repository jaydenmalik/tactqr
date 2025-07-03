import { writable, derived } from 'svelte/store';
import type { User, Note } from '@tact/core';
import * as data from '@tact/data';
import { cleanupLegacyData } from './cleanupData';

type FilterMode = 'both' | 'any';
type SortMode = 'created-desc' | 'created-asc' | 'updated-desc' | 'updated-asc';

// Base stores
export const user = writable<User | null>(null);
export const notes = writable<Note[]>([]);
export const isLoaded = writable(false);

// Filter stores
export const selectedTags = writable<string[]>([]);
export const filterMode = writable<FilterMode>('any');
export const searchTerm = writable('');
export const tagSearchTerm = writable('');

// Sorting store
export const sortMode = writable<SortMode>('updated-desc'); // Default to newest updated first

// Grid configuration stores
export const gridColumns = writable(3); // Default 3 columns
export const cardHeight = writable(200); // Default height set to 200px

// Derived stores
export const availableTags = derived(notes, ($notes) => {
	const allTags = $notes.flatMap(note => note.tags || []);
	return [...new Set(allTags)].sort();
});

export const filteredTags = derived(
	[availableTags, tagSearchTerm],
	([$availableTags, $tagSearchTerm]) => {
		if (!$tagSearchTerm.trim()) {
			return $availableTags;
		}
		const searchLower = $tagSearchTerm.toLowerCase().trim();
		return $availableTags.filter(tag => 
			tag.toLowerCase().includes(searchLower)
		);
	}
);

export const filteredNotes = derived(
	[notes, selectedTags, filterMode, searchTerm, tagSearchTerm, sortMode],
	([$notes, $selectedTags, $filterMode, $searchTerm, $tagSearchTerm, $sortMode]) => {
		let filtered = $notes;

		// Apply general text search
		if ($searchTerm.trim()) {
			const searchLower = $searchTerm.toLowerCase().trim();
			filtered = filtered.filter(note => 
				note.title.toLowerCase().includes(searchLower) ||
				note.content.toLowerCase().includes(searchLower)
			);
		}

		// Apply tag content search
		if ($tagSearchTerm.trim()) {
			const tagSearchLower = $tagSearchTerm.toLowerCase().trim();
			filtered = filtered.filter(note => 
				(note.tags || []).some(tag => tag.toLowerCase().includes(tagSearchLower))
			);
		}

		// Apply selected tag filters
		if ($selectedTags.length > 0) {
			filtered = filtered.filter(note => {
				const noteTags = note.tags || [];
				
				if ($filterMode === 'both') {
					// AND logic: note must have ALL selected tags
					return $selectedTags.every(tag => noteTags.includes(tag));
				} else {
					// OR logic: note must have ANY selected tag
					return $selectedTags.some(tag => noteTags.includes(tag));
				}
			});
		}

		// Apply sorting
		filtered.sort((a, b) => {
			switch ($sortMode) {
				case 'created-desc':
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case 'created-asc':
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case 'updated-desc':
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
				case 'updated-asc':
					return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
				default:
					return 0;
			}
		});

		return filtered;
	}
);

// Store actions
export const store = {
	// Data loading
	async loadAllData() {
		// Run migration from budget to tact data
		data.migrateLegacyData();
		
		// Clean up old budget data after successful migration
		cleanupLegacyData();
		
		const localUser = await data.getOrCreateLocalUser();
		if (localUser) {
			const userNotes = await data.listNotes(localUser.id);

			const migratedNotes = userNotes.map(note => ({ 
				...note, 
				tags: note.tags || [],
				emoji: note.emoji || '📝',
				createdAt: new Date(note.createdAt),
				updatedAt: new Date(note.updatedAt)
			}));
			
			user.set(localUser);
			notes.set(migratedNotes);
			isLoaded.set(true);
		}
	},

	// Note operations
	async addNote(noteData: { title: string; content: string; userId: string; emoji?: string; importance?: 'low' | 'medium' | 'high'; isEncrypted?: boolean; tags?: string[] }) {
		const note = await data.createNote({
			...noteData,
			emoji: noteData.emoji || '📝'
		});
		
		const noteWithDates = {
			...note,
			createdAt: new Date(note.createdAt),
			updatedAt: new Date(note.updatedAt)
		};
		
		notes.update(currentNotes => [...currentNotes, noteWithDates]);
		return noteWithDates;
	},

	async updateNote(id: string, updates: { title?: string; content?: string; emoji?: string; importance?: 'low' | 'medium' | 'high'; isEncrypted?: boolean; tags?: string[] }) {
		const updatedNote = await data.updateNote(id, updates);
		
		const noteWithDates = {
			...updatedNote,
			createdAt: new Date(updatedNote.createdAt),
			updatedAt: new Date(updatedNote.updatedAt)
		};
		
		notes.update(currentNotes => 
			currentNotes.map(note => note.id === id ? noteWithDates : note)
		);
		return noteWithDates;
	},

	async deleteNote(id: string) {
		await data.deleteNote(id);
		notes.update(currentNotes => currentNotes.filter(note => note.id !== id));
	},

	// Filter actions
	toggleTag(tag: string) {
		selectedTags.update(tags => 
			tags.includes(tag) 
				? tags.filter(t => t !== tag)
				: [...tags, tag]
		);
	},

	setFilterMode(mode: FilterMode) {
		filterMode.set(mode);
	},

	clearFilters() {
		selectedTags.set([]);
	},

	clearSearch() {
		searchTerm.set('');
		tagSearchTerm.set('');
	},

	clearAll() {
		selectedTags.set([]);
		searchTerm.set('');
		tagSearchTerm.set('');
	},

	// Sorting actions
	setSortMode(mode: SortMode) {
		sortMode.set(mode);
	},

	// Grid configuration actions
	setGridColumns(columns: number) {
		gridColumns.set(Math.max(1, Math.min(4, columns))); // Limit between 1-4 columns
	}
}; 