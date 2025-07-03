import QRCode from 'qrcode';
import { encrypt, decrypt } from './crypto.js';
import * as pako from 'pako';
import JSZip from 'jszip';

// Constants
const QR_OVERHEAD = 60; // Increased overhead estimate for safety (BQR|sessionId|seq|total|)
const MAX_QR_SIZE = 350; // Reduced to ensure better scanning (0.35 KB)
const CHUNK_SIZE = MAX_QR_SIZE - QR_OVERHEAD; // Actual payload size after overhead
const PREFIX = 'BQR'; // Magic prefix to identify our QRs
const QR_SIZE = 400; // Large, clear QR codes (400x400px)

export interface MultiQRExportResult {
  maestroDataUrl: string;
  zipBlob: Blob; // ZIP file containing all QR codes
  qrCount: number;
  type: 'single' | 'multi';
}

/**
 * Creates individual, large QR code images and packages them in a ZIP
 */
async function createQRZipPackage(qrDataUrls: string[], sessionId: string): Promise<Blob> {
  const zip = new JSZip();
  
  // Add a README file with instructions
  const readmeContent = `Budget Backup - Session: ${sessionId}
Total QR Codes: ${qrDataUrls.length}

INSTRUCTIONS:
1. Each PNG file contains a single, high-quality QR code
2. Scan all QR codes using your budget app's import feature
3. The app will automatically combine them to restore your data
4. Files are numbered in order (qr-001.png, qr-002.png, etc.)

SCANNING TIPS:
- Use good lighting when scanning
- Hold your device steady
- Ensure the entire QR code is visible in the camera frame
- You can scan the codes in any order

Generated: ${new Date().toISOString()}`;

  zip.file('README.txt', readmeContent);
  
  // Add each QR code as a separate PNG file
  for (let i = 0; i < qrDataUrls.length; i++) {
    const dataUrl = qrDataUrls[i];
    
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Add to ZIP with padded filename
    const filename = `qr-${(i + 1).toString().padStart(3, '0')}.png`;
    zip.file(filename, blob);
  }
  
  // Generate ZIP file
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Split encrypted (base64) string into QR payloads and build individual QR images
 */
export async function createMultiQR(payload: string): Promise<MultiQRExportResult> {
  const sessionId = Math.random().toString(36).slice(2, 10); // 8-char id
  const chunks: string[] = [];
  for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
    chunks.push(payload.slice(i, i + CHUNK_SIZE));
  }
  const total = chunks.length;

  console.log(`📦 Creating ${total + 1} individual QR codes (${total} chunks + 1 maestro)`);

  // Generate maestro QR content
  const maestroContent = `${PREFIX}|${sessionId}|M|${total}`;
  
  // Validate maestro QR size
  if (maestroContent.length > MAX_QR_SIZE) {
    console.warn(`Maestro QR exceeds ${MAX_QR_SIZE} chars: ${maestroContent.length}`);
  }
  
  // Generate large, clear QR codes
  const maestroDataUrl = await QRCode.toDataURL(maestroContent, {
    errorCorrectionLevel: 'M', // Medium error correction for good balance
    type: 'image/png',
    margin: 4, // Good margin for better scanning
    width: QR_SIZE, // Large size for clarity
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // Generate chunk QR codes
  const chunkDataUrls: string[] = [];
  for (let idx = 0; idx < total; idx++) {
    const chunkContent = `${PREFIX}|${sessionId}|${idx}|${total}|${chunks[idx]}`;
    
    // Validate QR code size
    if (chunkContent.length > MAX_QR_SIZE) {
      console.warn(`QR code ${idx} exceeds ${MAX_QR_SIZE} chars: ${chunkContent.length}`);
    }
    
    const dataUrl = await QRCode.toDataURL(chunkContent, {
      errorCorrectionLevel: 'M', // Medium error correction for good balance
      type: 'image/png',
      margin: 4, // Good margin for better scanning
      width: QR_SIZE, // Large size for clarity
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    chunkDataUrls.push(dataUrl);
  }

  // Create ZIP package with maestro + all chunks
  const allDataUrls = [maestroDataUrl, ...chunkDataUrls];
  const zipBlob = await createQRZipPackage(allDataUrls, sessionId);

  return { 
    maestroDataUrl, 
    zipBlob,
    qrCount: allDataUrls.length,
    type: total > 0 ? 'multi' : 'single'
  };
}

interface CollectState {
  total: number;
  chunks: Map<number, string>;
  maestroSeen: boolean;
}

const collectors = new Map<string, CollectState>();

/**
 * Feed raw QR string into collector. Returns decrypted JSON string when full set is complete.
 */
export async function consumeQRString(data: string, password: string): Promise<string | null> {
  if (!data.startsWith(`${PREFIX}|`)) return null;
  const parts = data.split('|');
  if (parts.length < 4) return null;
  const [, sessionId, marker] = parts;
  let state = collectors.get(sessionId);
  if (!state) {
    state = { total: 0, chunks: new Map(), maestroSeen: false };
    collectors.set(sessionId, state);
  }

  if (marker === 'M') {
    const total = parseInt(parts[3], 10);
    state.total = total;
    state.maestroSeen = true;
    console.log(`📋 Maestro QR processed. Session: ${sessionId}, Expected chunks: ${total}`);
  } else {
    const seq = parseInt(marker, 10);
    const total = parseInt(parts[3], 10);
    state.total = total;
    const chunkData = parts.slice(4).join('|');
    state.chunks.set(seq, chunkData);
    console.log(`📄 Chunk ${seq + 1}/${total} processed for session ${sessionId}`);
  }

  console.log(`📊 Progress: ${state.chunks.size}/${state.total} chunks, Maestro: ${state.maestroSeen ? 'Yes' : 'No'}`);

  if (state.maestroSeen && state.chunks.size === state.total) {
    console.log(`✅ All QR codes collected for session ${sessionId}. Assembling data...`);
    
    // assemble
    const ordered: string[] = [];
    for (let i = 0; i < state.total; i++) {
      const part = state.chunks.get(i);
      if (!part) {
        console.error(`❌ Missing chunk ${i} for session ${sessionId}`);
        return null; // missing
      }
      ordered.push(part);
    }
    const encryptedB64 = ordered.join('');
    collectors.delete(sessionId);

    console.log(`🔓 Decrypting and decompressing data...`);
    // decrypt path same as importUserData
    const compressedB64 = await decrypt(encryptedB64, password);
    const compressed = new Uint8Array(
      atob(compressedB64).split('').map(c => c.charCodeAt(0))
    );
    const decompressed = pako.ungzip(compressed, { to: 'string' });
    
    console.log(`🎉 Import successful! Data restored.`);
    return decompressed; // JSON string caller will parse
  }
  return null; // not finished yet
}

/**
 * Scans individual QR code files (either from ZIP extraction or direct file selection)
 */
export async function scanQRCodeFiles(files: File[]): Promise<string[]> {
  console.log(`🔍 Scanning ${files.length} individual QR code files...`);
  
  const QrScanner = (await import('qr-scanner')).default;
  const results: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📷 Scanning file ${i + 1}/${files.length}: ${file.name}`);
    
    try {
      // Create image from file
      const img = await createImageElement(file);
      
      // Scan the individual QR code (should be crystal clear)
      const qrResult = await QrScanner.scanImage(img);
      
      if (qrResult && !results.includes(qrResult)) {
        console.log(`✅ QR code found in ${file.name}:`, qrResult.substring(0, 60) + '...');
        results.push(qrResult);
      }
      
      // Clean up
      URL.revokeObjectURL(img.src);
      
    } catch (error) {
      console.log(`❌ Failed to scan ${file.name}:`, error);
    }
  }
  
  console.log(`🏁 Scan completed: Found ${results.length} QR codes from ${files.length} files`);
  return results;
}

/**
 * Extracts files from a ZIP and scans for QR codes
 */
export async function scanZipFile(zipFile: File): Promise<string[]> {
  console.log(`📦 Extracting and scanning ZIP file: ${zipFile.name}`);
  
  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipFile);
    
    const imageFiles: File[] = [];
    
    // Extract PNG files from ZIP
    for (const filename of Object.keys(zipContent.files)) {
      const file = zipContent.files[filename];
      
      if (!file.dir && filename.toLowerCase().endsWith('.png')) {
        console.log(`📄 Found QR image: ${filename}`);
        
        const blob = await file.async('blob');
        const imageFile = new File([blob], filename, { type: 'image/png' });
        imageFiles.push(imageFile);
      }
    }
    
    console.log(`📂 Extracted ${imageFiles.length} PNG files from ZIP`);
    
    // Scan each extracted image
    return await scanQRCodeFiles(imageFiles);
    
  } catch (error) {
    console.error(`💥 ZIP extraction failed:`, error);
    throw new Error('Failed to extract or process ZIP file');
  }
}

/**
 * Helper to create an image element from file
 */
function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
} 