function calculateSheetTiling(paper, standard, gapMm = 2, safeMarginMm = 3.5) {
  if (paper.id === "paper-single" || paper.widthMm <= 0 || paper.heightMm <= 0) {
    return {
      paper,
      standard,
      orientation: "portrait",
      cols: 1,
      rows: 1,
      totalPhotos: 1,
      photoWidthMm: standard.widthMm,
      photoHeightMm: standard.heightMm,
      paperWidthMm: standard.widthMm,
      paperHeightMm: standard.heightMm,
      safeMarginLeftMm: 0,
      safeMarginTopMm: 0,
      gapMm: 0,
      photos: [
        {
          xMm: 0,
          yMm: 0,
          widthMm: standard.widthMm,
          heightMm: standard.heightMm
        }
      ]
    };
  }
  const dim1 = Math.min(paper.widthMm, paper.heightMm);
  const dim2 = Math.max(paper.widthMm, paper.heightMm);
  const testPortrait = evaluatePacking(dim1, dim2, standard.widthMm, standard.heightMm, gapMm, safeMarginMm);
  const testLandscape = evaluatePacking(dim2, dim1, standard.widthMm, standard.heightMm, gapMm, safeMarginMm);
  const chosen = testLandscape.totalPhotos > testPortrait.totalPhotos ? testLandscape : testPortrait;
  const orientation = chosen === testLandscape ? "landscape" : "portrait";
  const paperW = chosen.paperW;
  const paperH = chosen.paperH;
  const photos = [];
  for (let r = 0; r < chosen.rows; r++) {
    for (let c = 0; c < chosen.cols; c++) {
      const xMm = chosen.marginLeft + c * (standard.widthMm + gapMm);
      const yMm = chosen.marginTop + r * (standard.heightMm + gapMm);
      photos.push({
        xMm: Math.round(xMm * 100) / 100,
        yMm: Math.round(yMm * 100) / 100,
        widthMm: standard.widthMm,
        heightMm: standard.heightMm
      });
    }
  }
  return {
    paper,
    standard,
    orientation,
    cols: chosen.cols,
    rows: chosen.rows,
    totalPhotos: chosen.totalPhotos,
    photoWidthMm: standard.widthMm,
    photoHeightMm: standard.heightMm,
    paperWidthMm: paperW,
    paperHeightMm: paperH,
    safeMarginLeftMm: chosen.marginLeft,
    safeMarginTopMm: chosen.marginTop,
    gapMm,
    photos
  };
}
function evaluatePacking(paperW, paperH, photoW, photoH, gapMm, safeMarginMm) {
  const availW = paperW - safeMarginMm * 2;
  const availH = paperH - safeMarginMm * 2;
  const cols = Math.max(1, Math.floor((availW + gapMm) / (photoW + gapMm)));
  const rows = Math.max(1, Math.floor((availH + gapMm) / (photoH + gapMm)));
  const gridTotalW = cols * photoW + (cols - 1) * gapMm;
  const gridTotalH = rows * photoH + (rows - 1) * gapMm;
  const marginLeft = Math.max(safeMarginMm, (paperW - gridTotalW) / 2);
  const marginTop = Math.max(safeMarginMm, (paperH - gridTotalH) / 2);
  return {
    paperW,
    paperH,
    cols,
    rows,
    totalPhotos: cols * rows,
    marginLeft: Math.round(marginLeft * 100) / 100,
    marginTop: Math.round(marginTop * 100) / 100
  };
}
export {
  calculateSheetTiling
};
