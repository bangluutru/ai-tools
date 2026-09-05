export const ElementRenderer = ({
  element,
  isSelected,
  showHandles = true,
  onSelect,
  onStartResize,
  scale
}) => {
  const mmToPx = 3.7795275591 * scale;
  const style = {
    position: "absolute",
    left: `${element.xMm * mmToPx}px`,
    top: `${element.yMm * mmToPx}px`,
    width: `${element.widthMm * mmToPx}px`,
    height: `${element.heightMm * mmToPx}px`,
    opacity: element.opacity ?? 1,
    zIndex: element.zIndex,
    cursor: "move",
    transform: element.rotation ? `rotate(${element.rotation}deg)` : void 0
  };

  const RESIZE_HANDLES = [
    { handle: "nw", cursor: "cursor-nwse-resize", pos: "-top-1.5 -left-1.5" },
    { handle: "n", cursor: "cursor-ns-resize", pos: "-top-1.5 left-1/2 -translate-x-1/2" },
    { handle: "ne", cursor: "cursor-nesw-resize", pos: "-top-1.5 -right-1.5" },
    { handle: "e", cursor: "cursor-ew-resize", pos: "-right-1.5 top-1/2 -translate-y-1/2" },
    { handle: "se", cursor: "cursor-nwse-resize", pos: "-bottom-1.5 -right-1.5" },
    { handle: "s", cursor: "cursor-ns-resize", pos: "-bottom-1.5 left-1/2 -translate-x-1/2" },
    { handle: "sw", cursor: "cursor-nesw-resize", pos: "-bottom-1.5 -left-1.5" },
    { handle: "w", cursor: "cursor-ew-resize", pos: "-left-1.5 top-1/2 -translate-y-1/2" }
  ];

  return <div
    data-element-id={element.id}
    style={style}
    className={`group select-none ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface-canvas" : "hover:ring-1 hover:ring-brand-300/70"}`}
  >
      {
    /* 1. TEXT ELEMENT */
  }
      {element.type === "text" && <div
    className={`w-full h-full overflow-hidden ${element.verticalWriting ? "writing-v-rl" : ""}`}
    style={{
      color: element.color || "#000000",
      fontFamily: element.fontFamily,
      fontSize: `${element.fontSizePt * 0.352778 * mmToPx}px`,
      fontWeight: element.fontWeight || "normal",
      textAlign: element.align || "left",
      letterSpacing: `${(element.letterSpacingMm || 0) * mmToPx}px`,
      lineHeight: element.lineHeightRatio || 1.25,
      whiteSpace: element.verticalWriting ? "normal" : "pre-wrap"
    }}
  >
          {element.content}
        </div>}

      {
    /* 2. SHAPE ELEMENT */
  }
      {element.type === "shape" && <div
    className="w-full h-full"
    style={{
      backgroundColor: element.fill || "transparent",
      border: element.stroke ? `${(element.strokeWidthMm || 0.2) * mmToPx}px solid ${element.stroke}` : "none",
      borderRadius: element.shapeType === "circle" ? "50%" : element.shapeType === "rounded-rect" ? `${(element.borderRadiusMm || 1) * mmToPx}px` : "0"
    }}
  />}

      {
    /* 3. LINE ELEMENT */
  }
      {element.type === "line" && <div
    className="w-full"
    style={{
      height: `${Math.max(1, (element.strokeWidthMm || 0.2) * mmToPx)}px`,
      backgroundColor: element.stroke || "#000000",
      borderTop: element.dashed ? `${(element.strokeWidthMm || 0.2) * mmToPx}px dashed ${element.stroke}` : void 0
    }}
  />}

      {
    /* 4. QR CODE ELEMENT */
  }
      {element.type === "qr" && <div
    className="w-full h-full bg-white border border-border-subtle rounded p-1 flex items-center justify-center shadow-xs"
    style={{ backgroundColor: element.backgroundColor || "#ffffff" }}
  >
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-0.5">
            {
    /* SVG placeholder representation */
  }
            <div
    className="w-full h-full flex items-center justify-center font-mono font-bold text-[9px] rounded"
    style={{
      backgroundColor: element.foregroundColor || "#0f172a",
      color: element.backgroundColor || "#ffffff"
    }}
  >
              QR
            </div>
          </div>
        </div>}

      {
    /* 5. IMAGE / LOGO ELEMENT */
  }
      {element.type === "image" && element.src && <img
    src={element.src}
    alt="Asset"
    className="w-full h-full object-contain pointer-events-none"
  />}

      {
    /* Interactive 8-point Selection & Resize Handles */
  }
      {isSelected && showHandles && RESIZE_HANDLES.map(({ handle, cursor, pos }) => (
        <div
          key={handle}
          data-handle={handle}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartResize?.(element, handle, e);
          }}
          className={`absolute w-2.5 h-2.5 bg-primary border border-white dark:border-surface-canvas rounded-xs shadow-xs hover:scale-125 transition-transform z-30 ${cursor} ${pos}`}
          title={`Co giãn (${handle.toUpperCase()})`}
        />
      ))}
    </div>;
};
