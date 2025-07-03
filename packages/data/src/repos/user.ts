import { generateId, getStorageData, setStorageData, STORAGE_KEYS } from '../client.js';
import type { User } from '@tact/core/types';

const LOCAL_USER_ID_KEY = 'tact_local_user_id';

/**
 * Gets the ID of the single local user.
 * This is used to associate all data with one profile on the device.
 */
function getLocalUserId(): string {
  let userId = localStorage.getItem(LOCAL_USER_ID_KEY);
  if (!userId) {
    userId = generateId();
    localStorage.setItem(LOCAL_USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * Retrieves or creates the single user profile for this device.
 */
export async function getOrCreateLocalUser(): Promise<User> {
  const users = getStorageData<User>(STORAGE_KEYS.USERS);
  const userId = getLocalUserId();
  
  let localUser = users.find(u => u.id === userId);
  
  if (!localUser) {
    		localUser = {
			id: userId,
			name: 'Local User',
			email: 'user@tact.local', // A dummy email
		};
    users.push(localUser);
    setStorageData(STORAGE_KEYS.USERS, users);
  }
  
  return localUser;
}

/**
 * Updates the local user's profile (e.g., to change their name).
 */
export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
  const users = getStorageData<User>(STORAGE_KEYS.USERS);
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  const updated = { ...users[index], ...updates };
  users[index] = updated;
  setStorageData(STORAGE_KEYS.USERS, users);
  
  return updated;
} 