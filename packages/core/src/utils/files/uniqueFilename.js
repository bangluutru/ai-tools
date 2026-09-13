export function uniqueFilename(filename, usedNames) {
  const used = usedNames instanceof Set ? usedNames : new Set();
  if (!used.has(filename)) {
    used.add(filename);
    return filename;
  }

  const dotIndex = filename.lastIndexOf('.');
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const extension = dotIndex > 0 ? filename.slice(dotIndex) : '';
  let counter = 2;
  let candidate = `${base} (${counter})${extension}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }
  used.add(candidate);
  return candidate;
}
