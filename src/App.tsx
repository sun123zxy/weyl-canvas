import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { generateA2Diagram } from "./geometry/a2";
import { buildTikz, serializeSvg } from "./export";
import { ensureMathJaxReady } from "./mathjax";
import {
  defaultExportRegion,
  defaultGridRange,
  emptyStyles,
} from "./constants";
import { clamp } from "./utils";
import { CopyModal } from "./components/CopyModal";
import type { ExportModal } from "./components/CopyModal";
import {
  AlcoveLayer,
  ExportRegionOverlay,
  FacetLayer,
  LabelLayer,
  VertexLayer,
} from "./components/CanvasLayers";
import { Inspector } from "./components/Inspector";
import { MathJaxBadge } from "./components/MathJaxBadge";
import type { MathJaxLoadStatus } from "./components/MathJaxBadge";
import type { SelectionItem, Styles, Vec2, View } from "./types";

type SelectionTarget = {
  item: SelectionItem;
  wallId?: string;
};

export function App() {
  const [gridRange, setGridRange] = useState(defaultGridRange);
  const diagram = useMemo(() => generateA2Diagram(gridRange), [gridRange]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 960, height: 720 });
  const [view, setView] = useState<View>({ tx: 480, ty: 360, zoom: 1 });
  const [styles, setStyles] = useState<Styles>(emptyStyles);
  const [selection, setSelection] = useState<SelectionItem[]>([]);
  const [exportModal, setExportModal] = useState<ExportModal | undefined>();
  const [mathJaxStatus, setMathJaxStatus] = useState<MathJaxLoadStatus>("loading");
  const [exportRegion, setExportRegion] = useState(defaultExportRegion);
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
  const pendingView = useRef<View | null>(null);
  const viewFrame = useRef<number | null>(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const resize = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
      setView((current) => (
        current.tx === 480 && current.ty === 360
          ? { ...current, tx: rect.width / 2, ty: rect.height / 2 }
          : current
      ));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (viewFrame.current !== null) {
        cancelAnimationFrame(viewFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureMathJaxReady().then(() => {
      if (!cancelled) setMathJaxStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleView = useCallback((next: View) => {
    pendingView.current = next;
    if (viewFrame.current !== null) return;
    viewFrame.current = requestAnimationFrame(() => {
      viewFrame.current = null;
      if (!pendingView.current) return;
      setView(pendingView.current);
      pendingView.current = null;
    });
  }, []);

  const select = useCallback((item: SelectionItem, additive: boolean) => {
    setSelection((current) => {
      if (!additive || current.length === 0 || current[0].kind !== item.kind) {
        return [item];
      }

      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.filter((entry) => entry.id !== item.id) : [...current, item];
    });
  }, []);

  const resetView = useCallback(() => setView({ tx: size.width / 2, ty: size.height / 2, zoom: 1 }), [size.height, size.width]);

  const screenPoint = useCallback((event: ReactPointerEvent | ReactWheelEvent): Vec2 => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const onWheel = useCallback((event: ReactWheelEvent) => {
    event.preventDefault();
    const point = screenPoint(event);
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    setView((current) => {
      const nextZoom = clamp(current.zoom * factor, 0.35, 3.8);
      const worldX = (point.x - current.tx) / current.zoom;
      const worldY = (point.y - current.ty) / current.zoom;
      return {
        zoom: nextZoom,
        tx: point.x - worldX * nextZoom,
        ty: point.y - worldY * nextZoom,
      };
    });
  }, [screenPoint]);

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
          setSelection([]);
          lastClick.current = null;
        }
      }
      pan.current = null;
    }
  }, [select]);

  const openSvgExport = useCallback(() => {
    if (!svgRef.current) return;
    const code = serializeSvg(svgRef.current, exportRegion);
    setExportModal({
      title: "Copy SVG",
      code,
      previewSvg: code,
    });
  }, [exportRegion]);

  const openTikzExport = useCallback(() => {
    setExportModal({
      title: "Copy TikZ",
      code: buildTikz(diagram, styles, exportRegion),
    });
  }, [diagram, exportRegion, styles]);

  const useCurrentViewAsExportRegion = useCallback(() => {
    setExportRegion({
      x: -view.tx / view.zoom,
      y: -view.ty / view.zoom,
      width: size.width / view.zoom,
      height: size.height / view.zoom,
    });
  }, [size.height, size.width, view.tx, view.ty, view.zoom]);

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <strong>Weyl Canvas</strong>
          <span>A2 affine arrangement</span>
        </div>
        <MathJaxBadge status={mathJaxStatus} />
        <div className="toolbarActions">
          <button type="button" onClick={() => setView((current) => ({ ...current, zoom: clamp(current.zoom * 1.12, 0.35, 3.8) }))}>Zoom in</button>
          <button type="button" onClick={() => setView((current) => ({ ...current, zoom: clamp(current.zoom / 1.12, 0.35, 3.8) }))}>Zoom out</button>
          <button type="button" onClick={resetView}>Reset view</button>
          <button type="button" onClick={openSvgExport}>Copy SVG</button>
          <button type="button" onClick={openTikzExport}>Copy TikZ</button>
        </div>
      </header>

      <main className="workspace">
        <div className="canvasPanel" ref={canvasRef}>
          <svg
            ref={svgRef}
            className="canvas"
            width={size.width}
            height={size.height}
            viewBox={`0 0 ${size.width} ${size.height}`}
            onWheel={onWheel}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={onCanvasPointerUp}
          >
            <rect
              className="canvasBackground"
              width={size.width}
              height={size.height}
              fill="#f7f8f4"
            />
            <g className="sceneLayer" transform={`translate(${view.tx} ${view.ty}) scale(${view.zoom})`}>
              <AlcoveLayer alcoves={diagram.alcoves} styles={styles.alcoves} selection={selection} />
              <FacetLayer facets={diagram.facets} styles={styles} selection={selection} />
              <VertexLayer vertices={diagram.vertices} styles={styles.vertices} selection={selection} />
              <LabelLayer diagram={diagram} styles={styles} selection={selection} />
              <ExportRegionOverlay region={exportRegion} />
            </g>
          </svg>
        </div>

        <Inspector
          selectedKind={selection[0]?.kind}
          selection={selection}
          styles={styles}
          onChange={setStyles}
          exportRegion={exportRegion}
          onExportRegionChange={setExportRegion}
          onUseCurrentView={useCurrentViewAsExportRegion}
          onResetExportRegion={() => setExportRegion(defaultExportRegion)}
          gridRange={gridRange}
          onGridRangeChange={setGridRange}
        />
      </main>
      {exportModal && (
        <CopyModal
          title={exportModal.title}
          code={exportModal.code}
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
