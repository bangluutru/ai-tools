import { useState } from "react";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  ShieldCheck
} from "lucide-react";
import { CardCanvas } from "./CardCanvas.jsx";
import { SidebarToolbar } from "./SidebarToolbar.jsx";
import { PropertyInspector } from "./PropertyInspector.jsx";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const EditorStep = ({
  project,
  preflight,
  onUpdateProject,
  onOpenPreflight,
  onOpenFreeExport
}) => {
  const { t } = useLanguage();
  const [activeSide, setActiveSide] = useState("front");
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [scale, setScale] = useState(1.25);
  const [showBleedGuide, setShowBleedGuide] = useState(true);
  const [showTrimGuide, setShowTrimGuide] = useState(true);
  const [showSafeGuide, setShowSafeGuide] = useState(true);
  const [history, setHistory] = useState([project]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const pushHistory = (newProject) => {
    const updatedHistory = history.slice(0, historyIdx + 1);
    updatedHistory.push(newProject);
    setHistory(updatedHistory);
    setHistoryIdx(updatedHistory.length - 1);
    onUpdateProject(newProject);
  };
  const handleUndo = () => {
    if (historyIdx > 0) {
      const target = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      onUpdateProject(target);
    }
  };
  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const target = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      onUpdateProject(target);
    }
  };
  const currentSideData = activeSide === "front" ? project.front : project.back;
  const handleUpdateElement = (updated) => {
    const newElements = currentSideData.elements.map((el) => el.id === updated.id ? updated : el);
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: newElements
      }
    };
    pushHistory(updatedProject);
  };
  const handleAddElement = (newEl) => {
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: [...currentSideData.elements, newEl]
      }
    };
    pushHistory(updatedProject);
    setSelectedElementId(newEl.id);
  };
  const handleDeleteElement = (id) => {
    const newElements = currentSideData.elements.filter((el) => el.id !== id);
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: newElements
      }
    };
    pushHistory(updatedProject);
    setSelectedElementId(null);
  };
  const handleDuplicateElement = (element) => {
    const cloned = {
      ...element,
      id: `el-${Date.now()}`,
      xMm: element.xMm + 2,
      yMm: element.yMm + 2,
      zIndex: currentSideData.elements.length + 1
    };
    handleAddElement(cloned);
  };
  const handleUpdateSide = (partialSide) => {
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        ...partialSide
      }
    };
    pushHistory(updatedProject);
  };
  const selectedElement = currentSideData.elements.find((el) => el.id === selectedElementId) || null;
  return <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-surface-subtle">
      {
    /* Studio Top Control Bar */
  }
      <div className="bg-surface-container border-b border-border-subtle px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {
    /* Left: Side Switcher & History */
  }
        <div className="flex items-center gap-2">
          {
    /* Front / Back Switcher */
  }
          <div className="bg-surface-subtle p-0.5 rounded-lg flex items-center gap-1 border border-border-subtle">
            <button
    id="btn-editor-front"
    onClick={() => {
      setActiveSide("front");
      setSelectedElementId(null);
    }}
    className={`px-3 py-1 font-bold rounded-md transition-all ${activeSide === "front" ? "bg-surface-container text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
  >
              {t("frontSide")}
            </button>
            <button
    id="btn-editor-back"
    onClick={() => {
      setActiveSide("back");
      setSelectedElementId(null);
    }}
    className={`px-3 py-1 font-bold rounded-md transition-all ${activeSide === "back" ? "bg-surface-container text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
  >
              {t("backSide")}
            </button>
          </div>

          {
    /* Undo / Redo */
  }
          <div className="flex items-center gap-1 pl-2 border-l border-border-subtle">
            <button
    onClick={handleUndo}
    disabled={historyIdx === 0}
    className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 rounded hover:bg-surface-subtle transition-colors"
    title={t("undo")}
  >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
    onClick={handleRedo}
    disabled={historyIdx >= history.length - 1}
    className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 rounded hover:bg-surface-subtle transition-colors"
    title={t("redo")}
  >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {
    /* Center: Print Guides Checkboxes */
  }
        <div className="hidden md:flex items-center gap-4 text-[11px] font-medium text-on-surface-variant">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
    type="checkbox"
    checked={showBleedGuide}
    onChange={(e) => setShowBleedGuide(e.target.checked)}
    className="rounded text-red-600 focus:ring-red-500"
  />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {t("guideBleed")}
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
    type="checkbox"
    checked={showTrimGuide}
    onChange={(e) => setShowTrimGuide(e.target.checked)}
    className="rounded text-cyan-600 focus:ring-cyan-500"
  />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              {t("guideTrim")}
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
    type="checkbox"
    checked={showSafeGuide}
    onChange={(e) => setShowSafeGuide(e.target.checked)}
    className="rounded text-emerald-600 focus:ring-emerald-500"
  />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t("guideSafe")}
            </span>
          </label>
        </div>

        {
    /* Right: Zoom & Proceed Actions */
  }
        <div className="flex items-center gap-2">
          {
    /* Zoom Controls */
  }
          <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg">
            <button
    onClick={() => setScale((s) => Math.max(0.75, s - 0.25))}
    className="p-1 text-on-surface-variant hover:text-on-surface rounded"
    title="Zoom out"
  >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 font-semibold text-on-surface-variant">
              {Math.round(scale * 100)}%
            </span>
            <button
    onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}
    className="p-1 text-on-surface-variant hover:text-on-surface rounded"
    title="Zoom in"
  >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {
    /* Preflight Badge */
  }
          <button
    onClick={onOpenPreflight}
    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${preflight.passed ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"}`}
    title="Preflight"
  >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("preflightScore")}</span>
            <span>{preflight.score}</span>
          </button>

          {
    /* Free Commercial Print Export Suite */
  }
          <button
    id="btn-editor-to-order"
    onClick={onOpenFreeExport}
    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all"
  >
            <Download className="w-3.5 h-3.5" />
            <span>{t("btnOrder")}</span>
          </button>
        </div>
      </div>

      {
    /* Main Studio Workspace: 3 Columns */
  }
      <div className="flex-1 flex overflow-hidden">
        {
    /* Left Toolbar */
  }
        <SidebarToolbar
    onAddElement={handleAddElement}
    activeSide={activeSide}
    sideData={currentSideData}
    onUpdateSide={handleUpdateSide}
  />

        {
    /* Center Canvas */
  }
        <div className="flex-1 h-full overflow-hidden relative">
          <CardCanvas
    project={project}
    activeSide={activeSide}
    onToggleSide={() => {
      setActiveSide((s) => s === "front" ? "back" : "front");
      setSelectedElementId(null);
    }}
    onChangeSide={(side) => {
      setActiveSide(side);
      setSelectedElementId(null);
    }}
    selectedElementId={selectedElementId}
    onSelectElement={setSelectedElementId}
    onUpdateElement={handleUpdateElement}
    scale={scale}
    showBleedGuide={showBleedGuide}
    showTrimGuide={showTrimGuide}
    showSafeGuide={showSafeGuide}
  />
        </div>

        {
    /* Right Property Inspector */
  }
        <PropertyInspector
    selectedElement={selectedElement}
    onUpdateElement={handleUpdateElement}
    onDeleteElement={handleDeleteElement}
    onDuplicateElement={handleDuplicateElement}
    project={project}
  />
      </div>
    </div>;
};
