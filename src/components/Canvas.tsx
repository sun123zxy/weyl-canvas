import type { PointerEvent as ReactPointerEvent, RefObject, WheelEvent as ReactWheelEvent } from "react";
import { referenceVectorWeight } from "../referenceVectors";
import {
  AlcoveLayer,
  ExportRegionOverlay,
  FacetLayer,
  LabelLayer,
  ReferenceVectorOverlay,
  VertexLayer,
} from "./CanvasLayers";
import { SvgDefs } from "./SvgDefs";
import type { DefaultStyles, Diagram, ExportRegion, SelectionItem, Styles, View } from "../types";

export function Canvas({
  canvasRef,
  svgRef,
  size,
  view,
  diagram,
  styles,
  defaultStyles,
  selection,
  exportRegion,
  editorCheckerboard,
  showReferenceVectors,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  svgRef: RefObject<SVGSVGElement | null>;
  size: { width: number; height: number };
  view: View;
  diagram: Diagram;
  styles: Styles;
  defaultStyles: DefaultStyles;
  selection: SelectionItem[];
  exportRegion: ExportRegion;
  editorCheckerboard: boolean;
  showReferenceVectors: boolean;
  onWheel: (event: ReactWheelEvent<SVGSVGElement>) => void;
  onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: ReactPointerEvent<SVGSVGElement>) => void;
}) {
  return (
    <div className="canvasPanel" ref={canvasRef}>
      <svg
        ref={svgRef}
        className="canvas"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <SvgDefs />
        <rect
          className="canvasBackground"
          width={size.width}
          height={size.height}
          fill={editorCheckerboard ? "url(#editorCheckerboard)" : "#f7f8f4"}
        />
        <g className="sceneLayer" transform={`translate(${view.tx} ${view.ty}) scale(${view.zoom})`}>
          <AlcoveLayer diagram={diagram} alcoves={diagram.alcoves} styles={styles.alcoves} selection={selection} defaults={defaultStyles} />
          <FacetLayer diagram={diagram} facets={diagram.facets} styles={styles} selection={selection} defaults={defaultStyles} />
          <VertexLayer diagram={diagram} vertices={diagram.vertices} styles={styles.vertices} selection={selection} defaults={defaultStyles} />
          <LabelLayer diagram={diagram} styles={styles} selection={selection} defaults={defaultStyles} />
          {showReferenceVectors && <ReferenceVectorOverlay system={diagram.system} weight={referenceVectorWeight(defaultStyles.facet.weight)} />}
          <ExportRegionOverlay region={exportRegion} />
        </g>
      </svg>
    </div>
  );
}
