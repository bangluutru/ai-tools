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
  const [selectedElementIds, setSelectedElementIds] = useState([]);
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

  const handleSelectElement = (id, isMulti = false) => {
    if (!id) {
      setSelectedElementIds([]);
      return;
    }
    if (isMulti) {
      setSelectedElementIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedElementIds([id]);
    }
  };

  const handleSelectElements = (ids) => {
    setSelectedElementIds(ids);
  };

  const handleUpdateElement = (updated) => {
    const newElements = currentSideData.elements.map((el) => (el.id === updated.id ? updated : el));
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: newElements,
      },
    };
    pushHistory(updatedProject);
  };

  const handleUpdateElements = (updatedList) => {
    const map = new Map(updatedList.map((e) => [e.id, e]));
    const newElements = currentSideData.elements.map((el) => map.get(el.id) || el);
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: newElements,
      },
    };
    pushHistory(updatedProject);
  };

  const handleAddElement = (newEl) => {
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: [...currentSideData.elements, newEl],
      },
    };
    pushHistory(updatedProject);
    setSelectedElementIds([newEl.id]);
  };

  const handleDeleteElement = (id) => {
    const newElements = currentSideData.elements.filter((el) => el.id !== id);
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: newElements,
      },
    };
    pushHistory(updatedProject);
    setSelectedElementIds([]);
  };

  const handleDeleteElements = (ids) => {
    const setIds = new Set(ids);
    const newElements = currentSideData.elements.filter((el) => !setIds.has(el.id));
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: newElements,
      },
    };
    pushHistory(updatedProject);
    setSelectedElementIds([]);
  };

  const handleDuplicateElement = (element) => {
    const cloned = {
      ...element,
      id: `el-${Date.now()}`,
      xMm: element.xMm + 2,
      yMm: element.yMm + 2,
      zIndex: currentSideData.elements.length + 1,
    };
    handleAddElement(cloned);
  };

  const handleDuplicateElements = (elementsToDup) => {
    const newElements = elementsToDup.map((el, i) => ({
      ...el,
      id: `el-${Date.now()}-${i}`,
      xMm: el.xMm + 2,
      yMm: el.yMm + 2,
      zIndex: currentSideData.elements.length + 1 + i,
    }));
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        elements: [...currentSideData.elements, ...newElements],
      },
    };
    pushHistory(updatedProject);
    setSelectedElementIds(newElements.map((e) => e.id));
  };

  const handleUpdateSide = (partialSide) => {
    const updatedProject = {
      ...project,
      [activeSide]: {
        ...currentSideData,
        ...partialSide,
      },
    };
    pushHistory(updatedProject);
  };

  const selectedElements = currentSideData.elements.filter((el) =>
    selectedElementIds.includes(el.id)
  );
  const selectedElement = selectedElements[0] || null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-surface-subtle">
      {/* Studio Top Control Bar */}
      <div className="bg-surface-container border-b border-border-subtle px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Left: Project Title Context */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-on-surface truncate max-w-xs sm:max-w-md">
            {project.title || "Meishi Project"}
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium px-2 py-0.5 rounded-md bg-surface-subtle border border-border-subtle">
            {activeSide === "front" ? t("sideFront") : t("sideBack")}
          </span>
        </div>

        {/* Right: Print Guides, Zoom & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Print Guides Checkboxes (Gộp ngang hàng với Zoom để tiết kiệm không gian) */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-medium text-on-surface-variant bg-surface-subtle px-2.5 py-1 rounded-lg border border-border-subtle">
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

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border-subtle">
            <button
              onClick={() => setScale((s) => Math.max(0.75, s - 0.25))}
              className="p-1 text-on-surface-variant hover:text-on-surface rounded cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 font-semibold text-on-surface-variant">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}
              className="p-1 text-on-surface-variant hover:text-on-surface rounded cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preflight Badge */}
          <button
            onClick={onOpenPreflight}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              preflight.passed
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"
            }`}
            title="Preflight"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("preflightScore")}</span>
            <span>{preflight.score}</span>
          </button>

          {/* Commercial Print Export Suite */}
          <button
            id="btn-editor-to-order"
            onClick={onOpenFreeExport}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("btnOrder")}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <SidebarToolbar
          onAddElement={handleAddElement}
          activeSide={activeSide}
          sideData={currentSideData}
          onUpdateSide={handleUpdateSide}
        />

        {/* Center Canvas */}
        <div className="flex-1 h-full overflow-hidden relative">
          <CardCanvas
            project={project}
            activeSide={activeSide}
            onToggleSide={() => {
              setActiveSide((s) => (s === "front" ? "back" : "front"));
              setSelectedElementIds([]);
            }}
            onChangeSide={(side) => {
              setActiveSide(side);
              setSelectedElementIds([]);
            }}
            selectedElementIds={selectedElementIds}
            onSelectElement={handleSelectElement}
            onSelectElements={handleSelectElements}
            onUpdateElement={handleUpdateElement}
            onUpdateElements={handleUpdateElements}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIdx > 0}
            canRedo={historyIdx < history.length - 1}
            scale={scale}
            showBleedGuide={showBleedGuide}
            showTrimGuide={showTrimGuide}
            showSafeGuide={showSafeGuide}
          />
        </div>

        {/* Right Property Inspector */}
        <PropertyInspector
          selectedElements={selectedElements}
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onUpdateElements={handleUpdateElements}
          onDeleteElement={handleDeleteElement}
          onDeleteElements={handleDeleteElements}
          onDuplicateElement={handleDuplicateElement}
          onDuplicateElements={handleDuplicateElements}
          project={project}
        />
      </div>
    </div>
  );
};
