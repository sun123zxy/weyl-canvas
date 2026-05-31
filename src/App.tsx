import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { generateRank2Diagram } from "./geometry/rank2";
import { buildTikz, serializeSvg } from "./export";
import { ensureMathJaxReady } from "./mathjax";
import { useEditorStore } from "./store";
import { useCanvasView } from "./hooks/useCanvasView";
import { Canvas } from "./components/Canvas";
import { CopyModal } from "./components/CopyModal";
import type { ExportModal } from "./components/CopyModal";
import { Inspector } from "./components/Inspector";
import { Toolbar } from "./components/Toolbar";
import type { MathJaxLoadStatus } from "./components/MathJaxBadge";
import type { SelectionItem, View } from "./types";

type SelectionTarget = {
  item: SelectionItem;
  wallId?: string;
};

export function App() {
  const rootSystemType = useEditorStore((state) => state.rootSystemType);
  const gridRange = useEditorStore((state) => state.gridRange);
  const styles = useEditorStore((state) => state.styles);
  const defaultStyles = useEditorStore((state) => state.defaultStyles);
  const selection = useEditorStore((state) => state.selection);
  const exportRegion = useEditorStore((state) => state.exportRegion);
  const editorCheckerboard = useEditorStore((state) => state.editorCheckerboard);
  const showReferenceVectors = useEditorStore((state) => state.showReferenceVectors);
  const setSelection = useEditorStore((state) => state.setSelection);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setExportRegion = useEditorStore((state) => state.setExportRegion);
  const diagram = useMemo(() => generateRank2Diagram(rootSystemType, gridRange), [gridRange, rootSystemType]);
  const {
    canvasRef,
    svgRef,
    size,
    view,
    scheduleView,
    resetView,
    zoomIn,
    zoomOut,
    onWheel,
  } = useCanvasView();
  const [exportModal, setExportModal] = useState<ExportModal | undefined>();
  const [mathJaxStatus, setMathJaxStatus] = useState<MathJaxLoadStatus>("loading");
  const pan = useRef<{
    pointerId: number;
    x: number;
    y: number;
    view: View;
    moved: boolean;
    target?: SelectionTarget;
    additive: boolean;
  } | null>(null);
  const lastClick = useRef<{ time: number; item: SelectionItem } | null>(null);
  useEffect(() => {
    let cancelled = false;
    ensureMathJaxReady().then(() => {
      if (!cancelled) setMathJaxStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    lastClick.current = null;
  }, [rootSystemType]);

  const select = useCallback((item: SelectionItem, additive: boolean) => {
    setSelection((current) => {
      if (!additive || current.length === 0 || current[0].kind !== item.kind) {
        return [item];
      }

      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.filter((entry) => entry.id !== item.id) : [...current, item];
    });
  }, [setSelection]);

  const onCanvasPointerDown = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    pan.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      view,
      moved: false,
      target: selectionTargetFromTarget(event.target),
      additive: event.shiftKey,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [view]);

  const onCanvasPointerMove = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (!pan.current || pan.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - pan.current.x;
    const dy = event.clientY - pan.current.y;
    if (Math.hypot(dx, dy) < 3 && !pan.current.moved) return;
    pan.current.moved = true;
    scheduleView({ ...pan.current.view, tx: pan.current.view.tx + dx, ty: pan.current.view.ty + dy });
  }, [scheduleView]);

  const onCanvasPointerUp = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (pan.current?.pointerId === event.pointerId) {
      if (!pan.current.moved) {
        if (pan.current.target) {
          const now = performance.now();
          const { item, wallId } = pan.current.target;
          const shouldSelectWall = item.kind === "facet" &&
            lastClick.current?.item.kind === "facet" &&
            lastClick.current.item.id === item.id &&
            now - lastClick.current.time < 360 &&
            Boolean(wallId);

          if (shouldSelectWall && wallId) {
            select({ kind: "wall", id: wallId }, pan.current.additive);
            lastClick.current = null;
          } else {
            select(item, pan.current.additive);
            lastClick.current = { time: now, item };
          }
        } else {
          clearSelection();
          lastClick.current = null;
        }
      }
      pan.current = null;
    }
  }, [clearSelection, select]);

  const openSvgExport = useCallback(() => {
    if (!svgRef.current) return;
    const code = serializeSvg(svgRef.current, exportRegion);
    setExportModal({
      title: "Export SVG",
      code,
      filename: `weyl-canvas-${rootSystemType.toLowerCase()}.svg`,
      mimeType: "image/svg+xml;charset=utf-8",
      previewSvg: code,
    });
  }, [exportRegion, rootSystemType]);

  const openTikzExport = useCallback(() => {
    setExportModal({
      title: "Export TikZ",
      code: buildTikz(diagram, styles, exportRegion, defaultStyles, { showReferenceVectors }),
      filename: `weyl-canvas-${rootSystemType.toLowerCase()}.tex`,
      mimeType: "text/x-tex;charset=utf-8",
    });
  }, [defaultStyles, diagram, exportRegion, rootSystemType, showReferenceVectors, styles]);

  const useCurrentViewAsExportRegion = useCallback(() => {
    setExportRegion({
      x: -view.tx / view.zoom,
      y: -view.ty / view.zoom,
      width: size.width / view.zoom,
      height: size.height / view.zoom,
    });
  }, [setExportRegion, size.height, size.width, view.tx, view.ty, view.zoom]);

  return (
    <div className="app">
      <Toolbar
        mathJaxStatus={mathJaxStatus}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        onExportSvg={openSvgExport}
        onExportTikz={openTikzExport}
      />

      <main className="workspace">
        <Canvas
          canvasRef={canvasRef}
          svgRef={svgRef}
          size={size}
          view={view}
          diagram={diagram}
          styles={styles}
          defaultStyles={defaultStyles}
          selection={selection}
          exportRegion={exportRegion}
          editorCheckerboard={editorCheckerboard}
          showReferenceVectors={showReferenceVectors}
          onWheel={onWheel}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
        />

        <Inspector onUseCurrentView={useCurrentViewAsExportRegion} />
      </main>
      {exportModal && (
        <CopyModal
          title={exportModal.title}
          code={exportModal.code}
          filename={exportModal.filename}
          mimeType={exportModal.mimeType}
          previewSvg={exportModal.previewSvg}
          onClose={() => setExportModal(undefined)}
        />
      )}
    </div>
  );
}

function selectionTargetFromTarget(target: EventTarget): SelectionTarget | undefined {
  if (!(target instanceof Element)) return undefined;
  const element = target.closest<SVGElement>("[data-select-kind][data-select-id]");
  const kind = element?.dataset.selectKind;
  const id = element?.dataset.selectId;
  if (!id || !isObjectKind(kind)) return undefined;
  return {
    item: { kind, id },
    wallId: element.dataset.wallId,
  };
}

function isObjectKind(value: string | undefined): value is SelectionItem["kind"] {
  return value === "alcove" || value === "facet" || value === "wall" || value === "vertex";
}
