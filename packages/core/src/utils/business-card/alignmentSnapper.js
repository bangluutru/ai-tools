/**
 * Alignment & Smart Snapping Engine for Business Card Studio
 * Precise millimeter-based snapping against card bounds, safe margins, and sibling elements.
 */

/**
 * Calculate magnetic snapping position and active guide lines when dragging an element.
 * @param {Object} params
 * @param {Object} params.movingEl - Element being moved { id, xMm, yMm, widthMm, heightMm }
 * @param {Array} params.allElements - All other elements on the current side
 * @param {number} params.cardW - Finished card width in mm (e.g. 91)
 * @param {number} params.cardH - Finished card height in mm (e.g. 55)
 * @param {number} params.safeMargin - Safe margin in mm (e.g. 3)
 * @param {number} params.thresholdMm - Snapping threshold distance in mm (default 1.0)
 * @returns {{ xMm: number, yMm: number, guides: Array }}
 */
export function calculateSnap({
  movingEl,
  allElements = [],
  cardW = 91,
  cardH = 55,
  safeMargin = 3,
  thresholdMm = 1.0
}) {
  const otherElements = allElements.filter((el) => el.id !== movingEl.id);

  // 1. Vertical candidate lines (X axis)
  const candidateXLines = [
    { posMm: cardW / 2, type: 'card-center', label: 'Căn giữa trang (Ngang)' },
    { posMm: safeMargin, type: 'safe-margin', label: 'Lề an toàn trái (3mm)' },
    { posMm: cardW - safeMargin, type: 'safe-margin', label: 'Lề an toàn phải (3mm)' },
    { posMm: 0, type: 'card-edge', label: 'Mép trái trang' },
    { posMm: cardW, type: 'card-edge', label: 'Mép phải trang' }
  ];

  // Add sibling elements' X anchor lines
  for (const sibling of otherElements) {
    candidateXLines.push(
      { posMm: sibling.xMm, type: 'element-edge', label: 'Gióng lề trái đối tượng' },
      { posMm: sibling.xMm + sibling.widthMm / 2, type: 'element-center', label: 'Gióng tâm đối tượng' },
      { posMm: sibling.xMm + sibling.widthMm, type: 'element-edge', label: 'Gióng lề phải đối tượng' }
    );
  }

  // 2. Horizontal candidate lines (Y axis)
  const candidateYLines = [
    { posMm: cardH / 2, type: 'card-center', label: 'Căn giữa trang (Dọc)' },
    { posMm: safeMargin, type: 'safe-margin', label: 'Lề an toàn trên (3mm)' },
    { posMm: cardH - safeMargin, type: 'safe-margin', label: 'Lề an toàn dưới (3mm)' },
    { posMm: 0, type: 'card-edge', label: 'Mép trên trang' },
    { posMm: cardH, type: 'card-edge', label: 'Mép dưới trang' }
  ];

  // Add sibling elements' Y anchor lines
  for (const sibling of otherElements) {
    candidateYLines.push(
      { posMm: sibling.yMm, type: 'element-edge', label: 'Gióng lề trên đối tượng' },
      { posMm: sibling.yMm + sibling.heightMm / 2, type: 'element-center', label: 'Gióng tâm đối tượng' },
      { posMm: sibling.yMm + sibling.heightMm, type: 'element-edge', label: 'Gióng lề dưới đối tượng' }
    );
  }

  // 3. Moving element anchors
  const movingXAnchors = [
    { offset: 0, name: 'left' },
    { offset: movingEl.widthMm / 2, name: 'center' },
    { offset: movingEl.widthMm, name: 'right' }
  ];

  const movingYAnchors = [
    { offset: 0, name: 'top' },
    { offset: movingEl.heightMm / 2, name: 'center' },
    { offset: movingEl.heightMm, name: 'bottom' }
  ];

  // 4. Find closest X snap
  let bestSnapDiffX = null;
  let minDistanceX = thresholdMm;
  let activeGuideX = null;

  for (const candidate of candidateXLines) {
    for (const anchor of movingXAnchors) {
      const currentAnchorPos = movingEl.xMm + anchor.offset;
      const dist = Math.abs(currentAnchorPos - candidate.posMm);
      if (dist <= minDistanceX) {
        minDistanceX = dist;
        bestSnapDiffX = candidate.posMm - currentAnchorPos;
        activeGuideX = {
          axis: 'x',
          posMm: candidate.posMm,
          label: candidate.label,
          type: candidate.type
        };
      }
    }
  }

  // 5. Find closest Y snap
  let bestSnapDiffY = null;
  let minDistanceY = thresholdMm;
  let activeGuideY = null;

  for (const candidate of candidateYLines) {
    for (const anchor of movingYAnchors) {
      const currentAnchorPos = movingEl.yMm + anchor.offset;
      const dist = Math.abs(currentAnchorPos - candidate.posMm);
      if (dist <= minDistanceY) {
        minDistanceY = dist;
        bestSnapDiffY = candidate.posMm - currentAnchorPos;
        activeGuideY = {
          axis: 'y',
          posMm: candidate.posMm,
          label: candidate.label,
          type: candidate.type
        };
      }
    }
  }

  const snappedX = movingEl.xMm + (bestSnapDiffX !== null ? bestSnapDiffX : 0);
  const snappedY = movingEl.yMm + (bestSnapDiffY !== null ? bestSnapDiffY : 0);

  const guides = [];
  if (activeGuideX) guides.push(activeGuideX);
  if (activeGuideY) guides.push(activeGuideY);

  return {
    xMm: Math.round(snappedX * 10) / 10,
    yMm: Math.round(snappedY * 10) / 10,
    guides
  };
}

/**
 * Calculate resized dimensions and origin based on active handle and mouse deltas.
 * @param {Object} params
 * @param {Object} params.startEl - Initial element geometry { xMm, yMm, widthMm, heightMm, type, shapeType }
 * @param {string} params.handle - Handle type: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
 * @param {number} params.deltaXMm - Mouse delta X in mm
 * @param {number} params.deltaYMm - Mouse delta Y in mm
 * @param {number} params.minW - Minimum width in mm (default 3)
 * @param {number} params.minH - Minimum height in mm (default 2)
 * @returns {{ xMm: number, yMm: number, widthMm: number, heightMm: number }}
 */
export function calculateResize({
  startEl,
  handle,
  deltaXMm,
  deltaYMm,
  minW = 3,
  minH = 2
}) {
  let newX = startEl.xMm;
  let newY = startEl.yMm;
  let newW = startEl.widthMm;
  let newH = startEl.heightMm;

  const isSquareLocked = startEl.type === 'qr' || startEl.shapeType === 'circle';

  // Handle horizontal modifications
  if (handle.includes('e')) {
    newW = Math.max(minW, startEl.widthMm + deltaXMm);
  } else if (handle.includes('w')) {
    const rawW = startEl.widthMm - deltaXMm;
    newW = Math.max(minW, rawW);
    newX = startEl.xMm + (startEl.widthMm - newW);
  }

  // Handle vertical modifications
  if (handle.includes('s')) {
    newH = Math.max(minH, startEl.heightMm + deltaYMm);
  } else if (handle.includes('n')) {
    const rawH = startEl.heightMm - deltaYMm;
    newH = Math.max(minH, rawH);
    newY = startEl.yMm + (startEl.heightMm - newH);
  }

  // Maintain aspect ratio for square-locked elements (e.g. QR codes)
  if (isSquareLocked) {
    const unifiedSize = Math.max(minW, Math.max(newW, newH));
    if (handle.includes('w')) {
      newX = startEl.xMm + (startEl.widthMm - unifiedSize);
    }
    if (handle.includes('n')) {
      newY = startEl.yMm + (startEl.heightMm - unifiedSize);
    }
    newW = unifiedSize;
    newH = unifiedSize;
  }

  return {
    xMm: Math.round(newX * 10) / 10,
    yMm: Math.round(newY * 10) / 10,
    widthMm: Math.round(newW * 10) / 10,
    heightMm: Math.round(newH * 10) / 10
  };
}

/**
 * Align element relative to card bounds (center horizontal/vertical, safe margins).
 * @param {Object} el
 * @param {'center-h'|'center-v'|'left'|'right'|'top'|'bottom'} alignment
 * @param {Object} cardConfig - { cardW, cardH, safeMargin }
 * @returns {Object} Updated element with new coordinates
 */
export function alignElementToCard(el, alignment, { cardW = 91, cardH = 55, safeMargin = 3 } = {}) {
  let newX = el.xMm;
  let newY = el.yMm;

  switch (alignment) {
    case 'center-h':
      newX = (cardW - el.widthMm) / 2;
      break;
    case 'center-v':
      newY = (cardH - el.heightMm) / 2;
      break;
    case 'left':
      newX = safeMargin;
      break;
    case 'right':
      newX = cardW - safeMargin - el.widthMm;
      break;
    case 'top':
      newY = safeMargin;
      break;
    case 'bottom':
      newY = cardH - safeMargin - el.heightMm;
      break;
    default:
      break;
  }

  return {
    ...el,
    xMm: Math.round(newX * 10) / 10,
    yMm: Math.round(newY * 10) / 10
  };
}

/**
 * Align multiple elements relative to their mutual bounding box.
 * @param {Array<Object>} elements - Array of element objects with xMm, yMm, widthMm, heightMm
 * @param {'left'|'center-h'|'right'|'top'|'center-v'|'bottom'|'distribute-h'|'distribute-v'} alignment
 * @returns {Array<Object>}
 */
export function alignMultipleElements(elements, alignment) {
  if (!elements || elements.length <= 1) return elements;

  const minX = Math.min(...elements.map((e) => e.xMm));
  const maxX = Math.max(...elements.map((e) => e.xMm + e.widthMm));
  const minY = Math.min(...elements.map((e) => e.yMm));
  const maxY = Math.max(...elements.map((e) => e.yMm + e.heightMm));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  switch (alignment) {
    case 'left':
      return elements.map((e) => ({ ...e, xMm: Math.round(minX * 10) / 10 }));
    case 'center-h':
      return elements.map((e) => ({
        ...e,
        xMm: Math.round((centerX - e.widthMm / 2) * 10) / 10
      }));
    case 'right':
      return elements.map((e) => ({
        ...e,
        xMm: Math.round((maxX - e.widthMm) * 10) / 10
      }));
    case 'top':
      return elements.map((e) => ({ ...e, yMm: Math.round(minY * 10) / 10 }));
    case 'center-v':
      return elements.map((e) => ({
        ...e,
        yMm: Math.round((centerY - e.heightMm / 2) * 10) / 10
      }));
    case 'bottom':
      return elements.map((e) => ({
        ...e,
        yMm: Math.round((maxY - e.heightMm) * 10) / 10
      }));
    case 'distribute-h': {
      if (elements.length < 3) return elements;
      const sorted = [...elements].sort((a, b) => a.xMm - b.xMm);
      const totalWidths = sorted.reduce((sum, e) => sum + e.widthMm, 0);
      const span = maxX - minX;
      const totalGap = span - totalWidths;
      const gap = totalGap / (sorted.length - 1);
      let currentX = minX;
      return sorted.map((e, idx) => {
        if (idx === 0) return { ...e, xMm: Math.round(minX * 10) / 10 };
        currentX += sorted[idx - 1].widthMm + gap;
        return { ...e, xMm: Math.round(currentX * 10) / 10 };
      });
    }
    case 'distribute-v': {
      if (elements.length < 3) return elements;
      const sorted = [...elements].sort((a, b) => a.yMm - b.yMm);
      const totalHeights = sorted.reduce((sum, e) => sum + e.heightMm, 0);
      const span = maxY - minY;
      const totalGap = span - totalHeights;
      const gap = totalGap / (sorted.length - 1);
      let currentY = minY;
      return sorted.map((e, idx) => {
        if (idx === 0) return { ...e, yMm: Math.round(minY * 10) / 10 };
        currentY += sorted[idx - 1].heightMm + gap;
        return { ...e, yMm: Math.round(currentY * 10) / 10 };
      });
    }
    default:
      return elements;
  }
}
