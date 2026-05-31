import { memo, useEffect, useMemo, useState } from "react";
import { centroid, midpoint } from "../geometry/rank2";
import { coweightToSvg } from "../metrics";
import { renderMath } from "../mathjax";
import { referenceVectors } from "../referenceVectors";
import { resolveAlcoveStyle, resolveFacetStyle, resolveVertexStyle } from "../styleResolver";
import { idsForKind, isSelected } from "../utils";
import { referenceVectorStyle } from "../visualSpec";
import type {
  Alcove,
  AlcoveStyle,
  DefaultStyles,
  Diagram,
  ExportRegion,
  Facet,
  Label,
  ObjectKind,
  Rank2System,
  SelectionItem,
  Styles,
  Vec2,
  Vertex,
  VertexStyle,
} from "../types";

type MathStatus = "loading" | "ready" | "error";

export function ExportRegionOverlay({ region }: { region: ExportRegion }) {
  return (
    <rect
      className="exportRegion"
      data-export-hidden="true"
      x={region.x}
      y={region.y}
      width={region.width}
      height={region.height}
    />
  );
}

export const AlcoveLayer = memo(function AlcoveLayer({
  alcoves,
  styles,
  selection,
  diagram,
  defaults,
}: {
  alcoves: Alcove[];
  styles: Record<string, AlcoveStyle>;
  selection: SelectionItem[];
  diagram: Diagram;
  defaults: DefaultStyles;
}) {
  const selectedIds = useMemo(() => idsForKind(selection, "alcove"), [selection]);
  return (
    <g>
      {alcoves.map((alcove) => {
        const selected = selectedIds.has(alcove.id);
        const style = resolveAlcoveStyle(styles[alcove.id], defaults);
        const points = alcove.vertices.map((vertex) => coweightToSvg(diagram.system, vertex)).map((point) => `${point.x},${point.y}`).join(" ");
        return (
          <polygon
            key={alcove.id}
            className={selected ? "alcove selected" : "alcove"}
            data-select-kind="alcove"
            data-select-id={alcove.id}
            points={points}
            fill={style.fill}
            fillOpacity={style.fillOpacity}
          />
        );
      })}
    </g>
  );
});

export const FacetLayer = memo(function FacetLayer({
  facets,
  styles,
  selection,
  diagram,
  defaults,
}: {
  facets: Facet[];
  styles: Styles;
  selection: SelectionItem[];
  diagram: Diagram;
  defaults: DefaultStyles;
}) {
  const selectedFacetIds = useMemo(() => idsForKind(selection, "facet"), [selection]);
  const selectedWallIds = useMemo(() => idsForKind(selection, "wall"), [selection]);

  return (
    <g>
      {facets.map((facet) => {
        const from = coweightToSvg(diagram.system, facet.from);
        const to = coweightToSvg(diagram.system, facet.to);
        const style = resolveFacetStyle(facet, styles, defaults);
        const selected = selectedFacetIds.has(facet.id) || selectedWallIds.has(facet.wallId);

        return (
          <g key={facet.id}>
            <line
              className="facetHit"
              data-export-hidden="true"
              data-select-kind="facet"
              data-select-id={facet.id}
              data-wall-id={facet.wallId}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
            <line
              className={selected ? "facet selected" : "facet"}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={style.color}
              strokeWidth={style.weight}
              strokeOpacity={style.opacity}
              pointerEvents="none"
            />
          </g>
        );
      })}
    </g>
  );
});

export const VertexLayer = memo(function VertexLayer({
  vertices,
  styles,
  selection,
  diagram,
  defaults,
}: {
  vertices: Vertex[];
  styles: Record<string, VertexStyle>;
  selection: SelectionItem[];
  diagram: Diagram;
  defaults: DefaultStyles;
}) {
  const selectedIds = useMemo(() => idsForKind(selection, "vertex"), [selection]);
  return (
    <g>
      {vertices.map((vertex) => {
        const point = coweightToSvg(diagram.system, vertex.coord);
        const style = resolveVertexStyle(styles[vertex.id], defaults);
        const selected = selectedIds.has(vertex.id);
        return (
          <circle
            key={vertex.id}
            className={selected ? "vertex selected" : "vertex"}
            data-select-kind="vertex"
            data-select-id={vertex.id}
            cx={point.x}
            cy={point.y}
            r={style.size}
            fill={style.color}
            fillOpacity={style.opacity}
          />
        );
      })}
    </g>
  );
});

export const LabelLayer = memo(function LabelLayer({
  diagram,
  styles,
  selection,
  defaults,
}: {
  diagram: Diagram;
  styles: Styles;
  selection: SelectionItem[];
  defaults: DefaultStyles;
}) {
  const labels = useMemo(() => collectLabels(diagram, styles, defaults), [defaults, diagram, styles]);

  return (
    <g>
      {labels.map((entry) => (
        <MathLabel
          key={`${entry.kind}:${entry.id}:${entry.label.latex}`}
          latex={entry.label.latex}
          anchor={entry.anchor}
          offset={entry.label.offset ?? entry.defaults.offset}
          size={entry.label.size ?? entry.defaults.size}
          system={diagram.system}
          selected={isSelected(selection, entry.kind, entry.id)}
        />
      ))}
    </g>
  );
});

function MathLabel({ latex, anchor, offset, size, system, selected }: { latex: string; anchor: Vec2; offset: Vec2; size: number; system: Rank2System; selected: boolean }) {
  const [status, setStatus] = useState<MathStatus>("loading");
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    renderMath(latex)
      .then((result) => {
        if (cancelled) return;
        setSvg(result.svg);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [latex]);

  const point = coweightToSvg(system, anchor);
  const x = point.x + offset.x;
  const y = point.y + offset.y;

  if (status === "error") {
    return (
      <text className={selected ? "labelText selected" : "labelText error"} x={x} y={y}>
        {latex}
      </text>
    );
  }

  if (status !== "ready") {
    return (
      <text className="labelText muted" x={x} y={y}>
        {latex}
      </text>
    );
  }

  return (
    <g className={selected ? "label selected" : "label"} transform={`translate(${x} ${y}) scale(${size})`} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

export function ReferenceVectorOverlay({ system, weight }: { system: Rank2System; weight: number }) {
  const vectors = referenceVectors(system);

  if (weight <= 0) return null;

  return (
    <g className="referenceVectorOverlay" pointerEvents="none">
      {vectors.map(({ id, coord, color }) => {
        const vector = coweightToSvg(system, coord);
        const length = Math.hypot(vector.x, vector.y) || 1;
        const unit = { x: vector.x / length, y: vector.y / length };
        const end = { x: vector.x, y: vector.y };
        const headSize = weight * referenceVectorStyle.arrowHeadMultiplier;
        const shaftEnd = { x: end.x - unit.x * headSize, y: end.y - unit.y * headSize };
        return (
          <g key={id}>
            <line
              x1={0}
              y1={0}
              x2={shaftEnd.x}
              y2={shaftEnd.y}
              stroke={color}
              strokeWidth={weight}
              strokeLinecap="round"
            />
            <ArrowHead end={end} unit={unit} color={color} size={headSize} />
          </g>
        );
      })}
    </g>
  );
}

function ArrowHead({ end, unit, color, size }: { end: Vec2; unit: Vec2; color: string; size: number }) {
  const normal = { x: -unit.y, y: unit.x };
  const base = { x: end.x - unit.x * size, y: end.y - unit.y * size };
  const left = { x: base.x + normal.x * size * 0.45, y: base.y + normal.y * size * 0.45 };
  const right = { x: base.x - normal.x * size * 0.45, y: base.y - normal.y * size * 0.45 };
  return (
    <polygon
      points={`${end.x},${end.y} ${left.x},${left.y} ${right.x},${right.y}`}
      fill={color}
    />
  );
}

type VisibleLabel = Label & { latex: string };

function collectLabels(diagram: Diagram, styles: Styles, defaults: DefaultStyles) {
  const labels: { id: string; kind: ObjectKind; anchor: Vec2; label: VisibleLabel; defaults: { offset: Vec2; size: number } }[] = [];

  for (const alcove of diagram.alcoves) {
    const label = styles.alcoves[alcove.id]?.label;
    if (hasVisibleLatex(label)) labels.push({ id: alcove.id, kind: "alcove", anchor: centroid(alcove.vertices), label, defaults: defaults.alcove.label });
  }
  for (const facet of diagram.facets) {
    const label = styles.facetOverrides[facet.id]?.label;
    if (hasVisibleLatex(label)) labels.push({ id: facet.id, kind: "facet", anchor: midpoint(facet.from, facet.to), label, defaults: defaults.facet.label });
  }
  for (const vertex of diagram.vertices) {
    const label = styles.vertices[vertex.id]?.label;
    if (hasVisibleLatex(label)) labels.push({ id: vertex.id, kind: "vertex", anchor: vertex.coord, label, defaults: defaults.vertex.label });
  }

  return labels;
}

function hasVisibleLatex(label: Label | undefined): label is VisibleLabel {
  return Boolean(label?.latex?.trim());
}
