import JSZip from 'jszip';

/**
 * Downloads multiple converted WebP files as a single ZIP archive
 * @param {Array<Object>} items - Array of converted image objects
 * @param {string} zipFilename - Output zip name
 */
export async function downloadAllAsZip(items, zipFilename = 'webp-images.zip') {
  if (!items || items.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('webp-images');

  // Add each blob to zip
  items.forEach((item, index) => {
    if (item.webpBlob && item.status === 'completed') {
      // Ensure unique filename if duplicates exist
      let name = item.webpFilename || `image_${index + 1}.webp`;
      folder.file(name, item.webpBlob);
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
