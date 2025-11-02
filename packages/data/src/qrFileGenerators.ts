import QRCode from 'qrcode';
import jsPDF from 'jspdf';

/**
 * Generates a PDF file with one QR code per page
 * @param maestroQR - The maestro QR string
 * @param qrStrings - Array of QR code strings for chunks
 * @param filename - Name for the downloaded file
 */
export async function exportMultiQRPDF(maestroQR: string, qrStrings: string[], filename: string): Promise<void> {
	const pdf = new jsPDF();
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const qrSize = 150; // Size of QR code in PDF
	const margin = 20;

	// Helper to add a QR code to a page
	async function addQRPage(qrString: string, pageNumber: number, totalPages: number, label: string) {
		if (pageNumber > 1) {
			pdf.addPage();
		}

		// Generate QR code as data URL
		const qrDataUrl = await QRCode.toDataURL(qrString, {
			errorCorrectionLevel: 'M',
			width: 400,
			margin: 2,
		});

		// Center the QR code
		const x = (pageWidth - qrSize) / 2;
		const y = (pageHeight - qrSize) / 2 - 20;

		pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);

		// Add label above QR
		pdf.setFontSize(14);
		pdf.setFont('helvetica', 'bold');
		pdf.text(label, pageWidth / 2, y - 15, { align: 'center' });

		// Add page number at bottom
		pdf.setFontSize(10);
		pdf.setFont('helvetica', 'normal');
		pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
	}

	// Add maestro QR (first page)
	await addQRPage(maestroQR, 1, qrStrings.length + 1, 'Maestro QR (Scan First)');

	// Add all chunk QRs
	for (let i = 0; i < qrStrings.length; i++) {
		await addQRPage(qrStrings[i], i + 2, qrStrings.length + 1, `QR Code ${i + 1} of ${qrStrings.length}`);
	}

	// Save the PDF
	pdf.save(filename);
}

/**
 * Generates a .webm video file showing QR codes in sequence (one every 0.5 seconds)
 * @param maestroQR - The maestro QR string
 * @param qrStrings - Array of QR code strings for chunks
 * @param filename - Name for the downloaded file
 */
export async function exportMultiQRVideo(maestroQR: string, qrStrings: string[], filename: string): Promise<void> {
	const canvas = document.createElement('canvas');
	canvas.width = 512;
	canvas.height = 512;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Failed to get canvas context');

	const allQRStrings = [maestroQR, ...qrStrings];
	const frameDuration = 500; // 0.5 seconds per QR code
	const fps = 2; // 2 frames per second (one frame = 0.5s)

	// Generate all QR code images first
	const qrImages: HTMLImageElement[] = [];
	for (const qrString of allQRStrings) {
		const qrDataUrl = await QRCode.toDataURL(qrString, {
			errorCorrectionLevel: 'M',
			width: 512,
			margin: 2,
		});

		const img = new Image();
		img.src = qrDataUrl;
		await new Promise((resolve) => { img.onload = resolve; });
		qrImages.push(img);
	}

	// Create video stream from canvas
	const stream = canvas.captureStream(fps);
	const mediaRecorder = new MediaRecorder(stream, {
		mimeType: 'video/webm;codecs=vp8',
		videoBitsPerSecond: 2500000,
	});

	const chunks: Blob[] = [];
	mediaRecorder.ondataavailable = (event) => {
		if (event.data.size > 0) {
			chunks.push(event.data);
		}
	};

	mediaRecorder.onstop = () => {
		const blob = new Blob(chunks, { type: 'video/webm' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.download = filename;
		link.href = url;
		link.click();
		URL.revokeObjectURL(url);
	};

	// Start recording
	mediaRecorder.start();

	// Draw each QR code for the specified duration
	for (let i = 0; i < qrImages.length; i++) {
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(qrImages[i], 0, 0, canvas.width, canvas.height);

		// Add text label
		ctx.fillStyle = '#000000';
		ctx.font = 'bold 20px sans-serif';
		ctx.textAlign = 'center';
		const label = i === 0 ? 'Maestro QR (Scan First)' : `QR ${i}/${qrStrings.length}`;
		ctx.fillText(label, canvas.width / 2, 30);

		// Wait for frame duration
		await new Promise(resolve => setTimeout(resolve, frameDuration));
	}

	// Stop recording
	mediaRecorder.stop();
}

