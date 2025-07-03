export type UUID = string;

export interface User {
  id: UUID;
  name: string;
  email: string;
}

// Enhanced Tagging System
export type TagCategory = 
  | 'note-type'          // e.g., 'password', 'document', 'reminder'
  | 'custom';            // User-defined tags

export interface Tag {
  id: UUID;
  userId: UUID;
  name: string;
  category: TagCategory;
  color?: string;        // Optional color for visualization
  description?: string;  // What this tag represents
  isSystem?: boolean;    // System-generated vs user-created
  parentTagId?: UUID;    // For hierarchical tags
  createdAt: Date;
  updatedAt: Date;
  taggedAt?: Date;       // When tags were last updated
}

export interface TaggedEntity {
  tags: UUID[];          // Array of tag IDs
  taggedAt?: Date;       // When tags were last updated
}

export interface Note extends TaggedEntity {
  id: UUID;
  userId: UUID;
  title: string;
  content: string;
  emoji: string;         // Emoji icon for the note
  isEncrypted?: boolean;
  importance: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}