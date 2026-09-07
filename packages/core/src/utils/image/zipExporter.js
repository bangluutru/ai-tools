import JSZip from 'jszip';

/**
 * Downloads multiple converted image files as a single ZIP archive
 * @param {Array<Object>} items - Array of converted image objects
 * @param {string} [zipFilename='compressed-images.zip'] - Output zip name
 */
export async function downloadAllAsZip(items, zipFilename = 'compressed-images.zip') {
  if (!items || items.length === 0) return;

  const zip = new JSZip();
  const folderName = zipFilename.replace(/\.zip$/i, '') || 'images';
  const folder = zip.folder(folderName);
  const usedNames = new Set();

  // Add each blob to zip
  items.forEach((item, index) => {
    const blob = item.outputBlob || item.webpBlob;
    const isReady = item.status === 'completed' || item.status === 'done';

    if (blob && isReady) {
      // Determine filename
      let name = item.outputFilename || item.webpFilename;
      if (!name) {
        const ext = item.targetFormat === 'jpg' || item.targetFormat === 'jpeg' ? '.jpg' : item.targetFormat === 'avif' ? '.avif' : '.webp';
        name = `image_${index + 1}${ext}`;
      }

      const dotIndex = name.lastIndexOf('.');
      const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
      const extension = dotIndex > 0 ? name.slice(dotIndex) : '';
      let suffix = 2;
      while (usedNames.has(name.toLowerCase())) {
        name = `${baseName}_${suffix}${extension}`;
        suffix += 1;
      }
      usedNames.add(name.toLowerCase());
      folder.file(name, blob);
    }
  });

  // Generate zip file
  const zipContent = await zip.generateAsync({ type: 'blob' });

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(zipContent);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
