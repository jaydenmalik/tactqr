import type { Note } from '@tact/core/types';
import { getStorageData, setStorageData, STORAGE_KEYS } from '../client.js';

export class NoteRepository {
  private convertDates(note: any): Note {
    return {
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    };
  }

  async getAll(): Promise<Note[]> {
    const notes = getStorageData<Note>(STORAGE_KEYS.NOTES);
    return notes.map(note => this.convertDates(note));
  }

  async getById(id: string): Promise<Note | null> {
    const notes = await this.getAll();
    return notes.find(note => note.id === id) || null;
  }

  async getByUserId(userId: string): Promise<Note[]> {
    const notes = await this.getAll();
    return notes.filter(note => note.userId === userId);
  }

  async create(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const notes = await this.getAll();
    const now = new Date();
    
    const note: Note = {
      id: crypto.randomUUID(),
      ...noteData,
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [...notes, note];
    setStorageData(STORAGE_KEYS.NOTES, updatedNotes);
    
    return note;
  }

  async update(id: string, updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Note> {
    const notes = await this.getAll();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }

    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      updatedAt: new Date(),
    };

    notes[noteIndex] = updatedNote;
    setStorageData(STORAGE_KEYS.NOTES, notes);
    
    return updatedNote;
  }

  async delete(id: string): Promise<void> {
    const notes = await this.getAll();
    const filteredNotes = notes.filter(note => note.id !== id);
    
    if (filteredNotes.length === notes.length) {
      throw new Error('Note not found');
    }

    setStorageData(STORAGE_KEYS.NOTES, filteredNotes);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const notes = await this.getAll();
    const filteredNotes = notes.filter(note => note.userId !== userId);
    setStorageData(STORAGE_KEYS.NOTES, filteredNotes);
  }

  async searchByTitle(userId: string, searchTerm: string): Promise<Note[]> {
    const userNotes = await this.getByUserId(userId);
    return userNotes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  async getByTag(userId: string, tag: string): Promise<Note[]> {
    const userNotes = await this.getByUserId(userId);
    return userNotes.filter(note => note.tags?.includes(tag));
  }

  async getAllTags(userId: string): Promise<string[]> {
    const userNotes = await this.getByUserId(userId);
    const allTags = userNotes.flatMap(note => note.tags || []);
    return [...new Set(allTags)].sort();
  }
}

export const noteRepository = new NoteRepository(); 