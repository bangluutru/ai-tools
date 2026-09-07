/**
 * In-browser Client-Safe OCR Engine for Vietnamese Invoices
 * Uses tesseract.js running locally inside Web Worker + WASM.
 * Zero data sent to external servers.
 */

let workerInstance = null;
let workerPromise = null;

/**
 * Initializes or reuses the Tesseract worker for Vietnamese and English
 */
export async function getOcrWorker(onProgress = null) {
  if (workerInstance) return workerInstance;

  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      // Initialize with Vietnamese (vie) and English (eng) for invoices
      const worker = await createWorker(['vie', 'eng'], undefined, {
        logger: (m) => {
          if (onProgress && typeof onProgress === 'function' && m.status === 'recognizing text') {
            onProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });
      workerInstance = worker;
      return worker;
    })();
  }

  return workerPromise;
}

/**
 * Performs OCR on an image file (File, Blob, HTMLCanvasElement, ImageData, URL)
 * @param {File|Blob|HTMLCanvasElement|string} imageSource
 * @param {Function} [onProgress]
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function recognizeImage(imageSource, onProgress = null) {
  try {
    const worker = await getOcrWorker(onProgress);
    const result = await worker.recognize(imageSource);
    return {
      text: result.data.text || '',
      confidence: result.data.confidence || 0,
    };
  } catch (err) {
    console.error('OCR Recognition failed:', err);
    throw err;
  }
}

/**
 * Renders a PDF page to an off-screen HTML5 Canvas and runs OCR
 * Used for scanned PDF invoices that contain no digital text layer
 * @param {ArrayBuffer} arrayBuffer
 * @param {Object} pdfjsLib
 * @param {Function} [onProgress]
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function recognizeScannedPdf(arrayBuffer, pdfjsLib, onProgress = null) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    if (pdf.numPages === 0) return { text: '', confidence: 0 };

    // Render first page at high DPI (scale = 2.0) for clear character recognition
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    return await recognizeImage(canvas, onProgress);
  } catch (err) {
    console.error('Failed to OCR scanned PDF:', err);
    throw err;
  }
}

/**
 * Terminates the OCR worker to release memory when idle
 */
export async function terminateOcrWorker() {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    workerPromise = null;
  }
}
