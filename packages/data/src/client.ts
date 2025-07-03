// Local storage keys
export const STORAGE_KEYS = {
  USERS: 'tact_users',
  NOTES: 'tact_notes'
} as const;

// Legacy storage keys for migration
const LEGACY_STORAGE_KEYS = {
  USERS: 'budget_users',
  NOTES: 'budget_notes'
} as const;

// Simple UUID generator for offline use
export function generateId(): string {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generic localStorage operations
export function getStorageData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Migration function to move data from budget_ keys to tact_ keys
export function migrateLegacyData(): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    // Check if migration is needed and not already done
    const migrationDone = localStorage.getItem('tact_migration_done');
    if (migrationDone) return;
    
    // Migrate users
    const legacyUsers = localStorage.getItem(LEGACY_STORAGE_KEYS.USERS);
    if (legacyUsers && !localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, legacyUsers);
    }
    
    // Migrate notes
    const legacyNotes = localStorage.getItem(LEGACY_STORAGE_KEYS.NOTES);
    if (legacyNotes && !localStorage.getItem(STORAGE_KEYS.NOTES)) {
      localStorage.setItem(STORAGE_KEYS.NOTES, legacyNotes);
    }
    
    // Migrate user ID
    const legacyUserId = localStorage.getItem('budget_local_user_id');
    if (legacyUserId && !localStorage.getItem('tact_local_user_id')) {
      localStorage.setItem('tact_local_user_id', legacyUserId);
    }
    
    // Mark migration as complete
    localStorage.setItem('tact_migration_done', 'true');
    
    console.log('Successfully migrated data from budget to tact');
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }
} 