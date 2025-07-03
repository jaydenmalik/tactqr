import * as pako from 'pako';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import { encrypt, decrypt } from './crypto.js';
import { getStorageData, STORAGE_KEYS } from './client.js';
import type { User, Note } from '@tact/core/types';
import { createMultiQR } from './multiqr.js';
import type { MultiQRExportResult } from './multiqr.js';

export interface TactExport {
  version: string;
  exportedAt: string;
  userId: string;
  data: {
    user: User;
    notes: Note[];
  };
}

export type ExportResult =
  | { type: 'single'; qrDataUrl: string }
  | { type: 'multi'; zipBlob: Blob; maestroDataUrl: string; qrCount: number };

/**
 * Imports user data from encrypted QR code data
 */
export async function importUserData(encryptedData: string, password: string): Promise<TactExport> {
  try {
    // Decrypt the data
    const compressedB64 = await decrypt(encryptedData, password);

    // Convert from base64
    const compressed = new Uint8Array(
      atob(compressedB64).split('').map(char => char.charCodeAt(0))
    );

    // Decompress
    const decompressed = pako.ungzip(compressed, { to: 'string' });

    // Parse JSON
    const exportData: TactExport = JSON.parse(decompressed);

    // Validate structure
    if (!exportData.version || !exportData.data || !exportData.userId) {
      throw new Error('Invalid export data format');
    }

    return exportData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Decryption failed')) {
      throw error;
    }
    throw new Error('Failed to import data. The QR code may be corrupted or invalid.');
  }
}

/**
 * Merges imported data into local storage
 */
export function mergeImportedData(exportData: TactExport): void {
  const { data } = exportData;

  // Get existing data
  const existingUsers = getStorageData<User>(STORAGE_KEYS.USERS);
  const existingNotes = getStorageData<Note>(STORAGE_KEYS.NOTES);

  // Remove any existing data for this user (to avoid duplicates)
  const filteredUsers = existingUsers.filter(u => u.id !== data.user.id);
  const filteredNotes = existingNotes.filter(n => n.userId !== data.user.id);

  // Add imported data
  const newUsers = [...filteredUsers, data.user];
  const newNotes = [...filteredNotes, ...(data.notes || [])];

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(newNotes));

  // Ensure the imported user becomes the active local profile on this device
  	try {
		localStorage.setItem('tact_local_user_id', data.user.id);
	} catch {}
}

/**
 * Estimates the size of export data
 */
export function estimateExportSize(userId: string): { 
  uncompressed: number; 
  estimated: number; 
  itemCount: number; 
} {
  const users = getStorageData<User>(STORAGE_KEYS.USERS);
  const notes = getStorageData<Note>(STORAGE_KEYS.NOTES);

  const user = users.find(u => u.id === userId);
  if (!user) return { uncompressed: 0, estimated: 0, itemCount: 0 };

  const userNotes = notes.filter(n => n.userId === userId);

  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      user,
      notes: userNotes,
    },
  };

  const jsonSize = JSON.stringify(exportData).length;
  const estimatedCompressed = Math.round(jsonSize * 0.3); // Rough compression estimate

  return {
    uncompressed: jsonSize,
    estimated: estimatedCompressed,
    itemCount: userNotes.length,
  };
}

export async function exportUserBackup(userId: string, password: string): Promise<ExportResult> {
  // same gathering logic as exportUserData
  const users = getStorageData<User>(STORAGE_KEYS.USERS);
  const notes = getStorageData<Note>(STORAGE_KEYS.NOTES);

  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  const exportData: TactExport = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      user,
      notes: notes.filter(n => n.userId === userId),
    },
  };

  const json = JSON.stringify(exportData);
  const compressed = pako.gzip(json);
  const compressedB64 = btoa(String.fromCharCode(...compressed));
  const encrypted = await encrypt(compressedB64, password);

  // threshold ~350 chars (0.35 KB)
  if (encrypted.length < 350) {
    const qrDataUrl = await QRCode.toDataURL(encrypted, {
      errorCorrectionLevel: 'M',
      width: 512,
    });
    return { type: 'single', qrDataUrl };
  }
  // multi QR
  const multi = await createMultiQR(encrypted);
  return { type: 'multi', zipBlob: multi.zipBlob, maestroDataUrl: multi.maestroDataUrl, qrCount: multi.qrCount };
}

/**
 * Scans QR code from camera or file input
 */
export async function scanQRCode(videoElement: HTMLVideoElement): Promise<string> {
  return QrScanner.scanImage(videoElement);
} 