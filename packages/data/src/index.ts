// Client utilities
export * from './client.js';

// Repositories
export * from './repos/user.js';
export * from './repos/note.js';

// Crypto utilities
export * from './crypto.js';

// Export/Import utilities
export * from './export.js';

// Multi-QR utilities
export * from './multiqr.js';

// Convenience functions for notes
export async function listNotes(userId: string) {
  const { noteRepository } = await import('./repos/note.js');
  return noteRepository.getByUserId(userId);
}

export async function createNote(noteData: { userId: string; title: string; content: string; emoji?: string; importance?: 'low' | 'medium' | 'high'; isEncrypted?: boolean; tags?: string[] }) {
  const { noteRepository } = await import('./repos/note.js');
  return noteRepository.create({
    ...noteData,
    tags: noteData.tags || [],
    emoji: noteData.emoji || '📝',
    importance: noteData.importance || 'medium',
    isEncrypted: noteData.isEncrypted || false
  });
}

export async function updateNote(id: string, updates: { title?: string; content?: string; emoji?: string; importance?: 'low' | 'medium' | 'high'; isEncrypted?: boolean; tags?: string[] }) {
  const { noteRepository } = await import('./repos/note.js');
  return noteRepository.update(id, updates);
}

export async function deleteNote(id: string) {
  const { noteRepository } = await import('./repos/note.js');
  return noteRepository.delete(id);
}

export async function searchNotes(userId: string, searchTerm: string) {
  const { noteRepository } = await import('./repos/note.js');
  return noteRepository.searchByTitle(userId, searchTerm);
}

export async function getNotesByTag(userId: string, tag: string) {
  const { noteRepository } = await import('./repos/note.js');
  return noteRepository.getByTag(userId, tag);
}

export async function getAllTags(userId: string) {
  const { noteRepository } = await import('./repos/note.js');
  return noteRepository.getAllTags(userId);
}

export { migrateLegacyData } from './client.js'; 