
/**
 * Downloads multiple converted image files as a single ZIP archive.
 * JSZip được nạp động khi người dùng bấm tải ZIP để không nằm trong bundle ban đầu.
 * @param {Array<Object>} items - Array of converted image objects
 * @param {string} [zipFilename='compressed-images.zip'] - Output zip name
 * @returns {Promise<number>} số tệp đã đưa vào ZIP
 */
export async function downloadAllAsZip(items, zipFilename = 'compressed-images.zip') {
  if (!items || items.length === 0) return 0;

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const folderName = zipFilename.replace(/\.zip$/i, '') || 'images';
  const folder = zip.folder(folderName);
  const usedNames = new Set();
  let added = 0;

  // Add each blob to zip
  items.forEach((item, index) => {
    const blob = item.outputBlob || item.webpBlob;
    const isReady = item.status === 'completed' || item.status === 'done';

    if (blob && isReady) {
      // Determine filename (theo định dạng THẬT của từng tệp)
      let name = item.outputFilename || item.webpFilename;
      if (!name) {
        const fmt = item.targetFormat;
        const ext = fmt === 'jpg' || fmt === 'jpeg' ? '.jpg' : fmt === 'avif' ? '.avif' : fmt === 'png' ? '.png' : '.webp';
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
      added += 1;
    }
  });

  if (added === 0) return 0;

  // Generate zip file
  const zipContent = await zip.generateAsync({ type: 'blob' });

  // Trigger browser download. Thu hồi URL ngay sau click có thể huỷ lượt tải
  // trên Safari/Firefox, nên chỉ thu hồi sau một khoảng trễ.
  const downloadUrl = URL.createObjectURL(zipContent);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
  return added;
}
