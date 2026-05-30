import { memo, useEffect, useMemo, useState } from "react";
import { centroid, generateA2Diagram, midpoint, projectA2 } from "../geometry/a2";
import { renderMath } from "../mathjax";
import { defaultFacetStyle, defaultLabelSize, defaultVertexStyle } from "../constants";
import { distanceToOrigin, idsForKind, isSelected } from "../utils";
import type {
  Alcove,
  AlcoveStyle,
  ExportRegion,
  Facet,
  Label,
  LineStyle,
  ObjectKind,
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
}: {
  alcoves: Alcove[];
  styles: Record<string, AlcoveStyle>;
  selection: SelectionItem[];
}) {
  const selectedIds = useMemo(() => idsForKind(selection, "alcove"), [selection]);
  return (
    <g>
      {alcoves.map((alcove) => {
        const selected = selectedIds.has(alcove.id);
        const points = alcove.vertices.map(projectA2).map((point) => `${point.x},${point.y}`).join(" ");
        return (
          <polygon
            key={alcove.id}
            className={selected ? "alcove selected" : "alcove"}
            data-select-kind="alcove"
            data-select-id={alcove.id}
            points={points}
            fill={styles[alcove.id]?.fill ?? "transparent"}
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
}: {
  facets: Facet[];
  styles: Styles;
  selection: SelectionItem[];
}) {
  const selectedFacetIds = useMemo(() => idsForKind(selection, "facet"), [selection]);
  const selectedWallIds = useMemo(() => idsForKind(selection, "wall"), [selection]);

  return (
    <g>
      {facets.map((facet) => {
        const from = projectA2(facet.from);
        const to = projectA2(facet.to);
        const style = resolveFacetStyle(facet, styles);
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
              vectorEffect="non-scaling-stroke"
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
}: {
  vertices: Vertex[];
  styles: Record<string, VertexStyle>;
  selection: SelectionItem[];
}) {
  const selectedIds = useMemo(() => idsForKind(selection, "vertex"), [selection]);
  return (
    <g>
      {vertices.map((vertex) => {
        const point = projectA2(vertex.coord);
        const style = styles[vertex.id];
        const selected = selectedIds.has(vertex.id);
        const size = style?.size ?? defaultVertexStyle.size;
        return (
          <circle
            key={vertex.id}
            className={selected ? "vertex selected" : "vertex"}
            data-select-kind="vertex"
            data-select-id={vertex.id}
            cx={point.x}
            cy={point.y}
            r={selected || style ? size : 2.2}
            fill={style?.color ?? defaultVertexStyle.color}
            vectorEffect="non-scaling-stroke"
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
}: {
  diagram: ReturnType<typeof generateA2Diagram>;
  styles: Styles;
  selection: SelectionItem[];
}) {
  const labels = useMemo(() => collectLabels(diagram, styles), [diagram, styles]);

  return (
    <g>
      {labels.map((entry) => (
        <MathLabel
          key={`${entry.kind}:${entry.id}:${entry.label.latex}`}
          latex={entry.label.latex}
          anchor={entry.anchor}
          offset={entry.label.offset}
          size={entry.label.size ?? defaultLabelSize}
          selected={isSelected(selection, entry.kind, entry.id)}
        />
      ))}
    </g>
  );
});

function MathLabel({ latex, anchor, offset, size, selected }: { latex: string; anchor: Vec2; offset: Vec2; size: number; selected: boolean }) {
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

  const point = projectA2(anchor);
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

function resolveFacetStyle(facet: Facet, styles: Styles): Required<Pick<LineStyle, "color" | "weight">> {
  const wall = styles.wallDefaults[facet.wallId];
  const own = styles.facetOverrides[facet.id];
  return {
    color: own?.color ?? wall?.color ?? defaultFacetStyle.color,
    weight: own?.weight ?? wall?.weight ?? defaultFacetStyle.weight,
  };
}

function collectLabels(diagram: ReturnType<typeof generateA2Diagram>, styles: Styles) {
  const labels: { id: string; kind: ObjectKind; anchor: Vec2; label: Label }[] = [];

  for (const alcove of diagram.alcoves) {
    const label = styles.alcoves[alcove.id]?.label;
    if (label?.latex.trim()) labels.push({ id: alcove.id, kind: "alcove", anchor: centroid(alcove.vertices), label });
  }
  for (const facet of diagram.facets) {
    const label = styles.facetOverrides[facet.id]?.label;
    if (label?.latex.trim()) labels.push({ id: facet.id, kind: "facet", anchor: midpoint(facet.from, facet.to), label });
  }
  for (const wall of diagram.walls) {
    const label = styles.wallDefaults[wall.id]?.label;
    if (!label?.latex.trim()) continue;
    let bestFacet: Facet | undefined;
    let bestDistance = Infinity;
    for (const facet of diagram.facets) {
      if (facet.wallId !== wall.id) continue;
      const distance = distanceToOrigin(midpoint(facet.from, facet.to));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestFacet = facet;
      }
    }
    if (bestFacet) labels.push({ id: wall.id, kind: "wall", anchor: midpoint(bestFacet.from, bestFacet.to), label });
  }
  for (const vertex of diagram.vertices) {
    const label = styles.vertices[vertex.id]?.label;
    if (label?.latex.trim()) labels.push({ id: vertex.id, kind: "vertex", anchor: vertex.coord, label });
  }

  return labels;
}
