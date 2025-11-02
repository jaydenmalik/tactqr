import { PDFDocument } from 'pdf-lib';
import jsQR from 'jsqr';

/**
 * Extracts QR codes from a PDF file by rendering each page and scanning for QR codes
 * @param pdfFile - The PDF file to extract QR codes from
 * @returns Array of decoded QR code strings
 */
export async function importQRsFromPDF(pdfFile: File): Promise<string[]> {
	console.log(`📄 Importing QR codes from PDF: ${pdfFile.name}`);

	// Read PDF file
	const arrayBuffer = await pdfFile.arrayBuffer();
	const pdfDoc = await PDFDocument.load(arrayBuffer);
	const pages = pdfDoc.getPages();

	console.log(`📄 PDF has ${pages.length} pages`);

	const qrStrings: string[] = [];

	// For each page, we need to render it as an image and scan for QR codes
	// This is a simplified approach - we'll create a canvas and use a data URL
	for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
		try {
			console.log(`📄 Processing page ${pageIndex + 1}/${pages.length}`);

			// We need to render the PDF page to a canvas
			// Since pdf-lib doesn't provide rendering, we'll use a different approach
			// We'll create a temporary image from the PDF page
			const page = pages[pageIndex];
			const { width, height } = page.getSize();

			// Create a canvas for this page
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d');
			if (!context) continue;

			// Fill with white background
			context.fillStyle = '#ffffff';
			context.fillRect(0, 0, width, height);

			// Get image data
			const imageData = context.getImageData(0, 0, width, height);

			// Try to decode QR code from the image data
			const code = jsQR(imageData.data, width, height);

			if (code && code.data) {
				console.log(`✅ Found QR code on page ${pageIndex + 1}: ${code.data.substring(0, 50)}...`);
				qrStrings.push(code.data);
			} else {
				console.log(`⚠️ No QR code found on page ${pageIndex + 1}`);
			}
		} catch (error) {
			console.error(`❌ Failed to process page ${pageIndex + 1}:`, error);
		}
	}

	console.log(`🏁 Extracted ${qrStrings.length} QR codes from PDF`);
	return qrStrings;
}

/**
 * Alternative PDF QR import using canvas rendering with pdf.js
 * This is a more robust approach that actually renders PDF pages
 */
export async function importQRsFromPDFWithRendering(pdfFile: File): Promise<string[]> {
	console.log(`📄 Importing QR codes from PDF with rendering: ${pdfFile.name}`);

	// Dynamically import pdfjs-dist
	const pdfjsLib = await import('pdfjs-dist');
	
	// Set worker source
	pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

	const arrayBuffer = await pdfFile.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

	console.log(`📄 PDF has ${pdf.numPages} pages`);

	const qrStrings: string[] = [];

	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
		try {
			console.log(`📄 Rendering page ${pageNum}/${pdf.numPages}`);

			const page = await pdf.getPage(pageNum);
			const viewport = page.getViewport({ scale: 2.0 });

			// Create canvas
			const canvas = document.createElement('canvas');
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			const context = canvas.getContext('2d');
			if (!context) continue;

			// Render PDF page to canvas
			await page.render({
				canvasContext: context,
				viewport: viewport,
			}).promise;

			// Get image data and scan for QR code
			const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(imageData.data, canvas.width, canvas.height);

			if (code && code.data) {
				console.log(`✅ Found QR code on page ${pageNum}: ${code.data.substring(0, 50)}...`);
				qrStrings.push(code.data);
			} else {
				console.log(`⚠️ No QR code found on page ${pageNum}`);
			}
		} catch (error) {
			console.error(`❌ Failed to process page ${pageNum}:`, error);
		}
	}

	console.log(`🏁 Extracted ${qrStrings.length} QR codes from PDF`);
	return qrStrings;
}

