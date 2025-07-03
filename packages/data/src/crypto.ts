// Encryption utilities using Web Crypto API
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Derives a key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data with a password
 */
export async function encrypt(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Derive key from password
  const key = await deriveKey(password, salt);
  
  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    dataBytes
  );
  
  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...result));
}

/**
 * Decrypts data with a password
 */
export async function decrypt(encryptedData: string, password: string): Promise<string> {
  try {
    // Decode from base64
    const data = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract salt, IV, and encrypted data
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 16 + IV_LENGTH);
    const encrypted = data.slice(16 + IV_LENGTH);
    
    // Derive key from password
    const key = await deriveKey(password, salt);
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error('Decryption failed. Check your password.');
  }
}

/**
 * Generates a random password for demonstration
 */
export function generateRandomPassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
} 