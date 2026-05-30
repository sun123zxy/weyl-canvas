import { A2_UNIT, centroid, midpoint, projectA2 } from "./geometry/a2";
import { defaultLabelSize } from "./constants";
import type { Diagram, ExportRegion, Facet, Label, LineStyle, Styles, Vec2, VertexStyle } from "./types";

const defaultFacetStyle: Required<Pick<LineStyle, "color" | "weight">> = {
  color: "#242933",
  weight: 1.2,
};

const defaultVertexStyle: Required<Pick<VertexStyle, "color" | "size">> = {
  color: "#242933",
  size: 3.5,
};

const PT_PER_CM = 28.45;

export function serializeSvg(svg: SVGSVGElement, region: ExportRegion) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("viewBox", `${region.x} ${region.y} ${region.width} ${region.height}`);
  clone.setAttribute("width", String(Math.round(region.width)));
  clone.setAttribute("height", String(Math.round(region.height)));
  clone.setAttribute("overflow", "hidden");
  const background = clone.querySelector(".canvasBackground");
  background?.setAttribute("x", String(region.x));
  background?.setAttribute("y", String(region.y));
  background?.setAttribute("width", String(region.width));
  background?.setAttribute("height", String(region.height));
  background?.setAttribute("fill", "#f7f8f4");
  clone.querySelector(".sceneLayer")?.removeAttribute("transform");
  clone.querySelectorAll("[data-export-hidden='true']").forEach((node) => node.remove());
  clone.querySelectorAll(".facet, .vertex").forEach((node) => {
    node.setAttribute("vector-effect", "non-scaling-stroke");
  });
  clone.querySelectorAll(".selected").forEach((node) => {
    removeClassToken(node, "selected");
    node.removeAttribute("filter");
  });
  clone.querySelectorAll("[data-select-kind], [data-select-id], [data-wall-id]").forEach((node) => {
    node.removeAttribute("data-select-kind");
    node.removeAttribute("data-select-id");
    node.removeAttribute("data-wall-id");
  });
  return new XMLSerializer().serializeToString(clone);
}

export function buildTikz(diagram: Diagram, styles: Styles, region?: ExportRegion) {
  const colorNames = new Map<string, string>();
  const lines: string[] = [
    "\\begin{tikzpicture}[x=1cm,y=1cm,line cap=round,line join=round]",
  ];
  if (region) {
    lines.push(`\\clip ${tikzPointFromSvg({ x: region.x, y: region.y })} rectangle ${tikzPointFromSvg({ x: region.x + region.width, y: region.y + region.height })};`);
  }

  const colorName = (hex: string) => {
    const normalized = hex.replace("#", "").toUpperCase();
    if (!colorNames.has(normalized)) {
      const name = `wc${colorNames.size}`;
      colorNames.set(normalized, name);
      lines.splice(0, 0, `\\definecolor{${name}}{HTML}{${normalized}}`);
    }
    return colorNames.get(normalized)!;
  };

  for (const alcove of diagram.alcoves) {
    const style = styles.alcoves[alcove.id];
    if (!style?.fill) continue;
    if (region && !pointsIntersectRegion(alcove.vertices, region)) continue;
    const points = alcove.vertices.map(tikzPoint);
    lines.push(`\\fill[${colorName(style.fill)}] ${points.join(" -- ")} -- cycle;`);
  }

  for (const facet of diagram.facets) {
    if (region && !pointsIntersectRegion([facet.from, facet.to], region)) continue;
    const style = resolveFacetStyle(facet, styles);
    const from = tikzPoint(facet.from);
    const to = tikzPoint(facet.to);
    lines.push(`\\draw[${colorName(style.color)}, line width=${tikzLineWidth(style.weight)}pt] ${from} -- ${to};`);
  }

  for (const vertex of diagram.vertices) {
    const style = styles.vertices[vertex.id];
    if (!style) continue;
    if (region && !pointsIntersectRegion([vertex.coord], region)) continue;
    const color = colorName(style.color ?? defaultVertexStyle.color);
    const size = style.size ?? defaultVertexStyle.size;
    lines.push(`\\fill[${color}] ${tikzPoint(vertex.coord)} circle (${(size / A2_UNIT).toFixed(3)});`);
  }

  emitLabels(lines, colorName, diagram, styles, region);
  lines.push("\\end{tikzpicture}");
  return lines.join("\n");
}

function resolveFacetStyle(facet: Facet, styles: Styles): Required<Pick<LineStyle, "color" | "weight">> {
  const wall = styles.wallDefaults[facet.wallId];
  const own = styles.facetOverrides[facet.id];
  return {
    color: own?.color ?? wall?.color ?? defaultFacetStyle.color,
    weight: own?.weight ?? wall?.weight ?? defaultFacetStyle.weight,
  };
}

function emitLabels(
  lines: string[],
  colorName: (hex: string) => string,
  diagram: Diagram,
  styles: Styles,
  region?: ExportRegion,
) {
  for (const alcove of diagram.alcoves) {
    const label = styles.alcoves[alcove.id]?.label;
    const anchor = centroid(alcove.vertices);
    if (label && (!region || pointInRegion(anchor, region))) {
      lines.push(labelNode(label, anchor));
    }
  }

  for (const facet of diagram.facets) {
    const label = styles.facetOverrides[facet.id]?.label;
    const anchor = midpoint(facet.from, facet.to);
    if (label && (!region || pointInRegion(anchor, region))) {
      lines.push(labelNode(label, anchor));
    }
  }

  for (const wall of diagram.walls) {
    const label = styles.wallDefaults[wall.id]?.label;
    if (!label) continue;
    const wallFacets = diagram.facets.filter((facet) => facet.wallId === wall.id);
    const best = wallFacets.sort((a, b) => lengthSquared(midpoint(a.from, a.to)) - lengthSquared(midpoint(b.from, b.to)))[0];
    if (best) {
      const anchor = midpoint(best.from, best.to);
      if (!region || pointInRegion(anchor, region)) {
        lines.push(labelNode(label, anchor));
      }
    }
  }

  for (const vertex of diagram.vertices) {
    const label = styles.vertices[vertex.id]?.label;
    if (label?.latex.trim() && (!region || pointInRegion(vertex.coord, region))) {
      lines.push(labelNode(label, vertex.coord));
    }
  }
}

function labelNode(label: Label, anchor: Vec2): string {
  const base = projectA2(anchor);
  const shifted = { x: base.x + label.offset.x, y: base.y + label.offset.y };
  return `\\node[inner sep=0pt, scale=${(label.size ?? defaultLabelSize).toFixed(2)}] at ${tikzPointFromSvg(shifted)} {$${label.latex}$};`;
}

function tikzPoint(point: Vec2): string {
  return tikzPointFromSvg(projectA2(point));
}

function tikzPointFromSvg(point: Vec2): string {
  return `(${(point.x / A2_UNIT).toFixed(3)},${(-point.y / A2_UNIT).toFixed(3)})`;
}

function tikzLineWidth(svgWidth: number): string {
  return ((svgWidth / A2_UNIT) * PT_PER_CM).toFixed(2);
}

function lengthSquared(point: Vec2): number {
  return point.x * point.x + point.y * point.y;
}

function removeClassToken(node: Element, token: string) {
  const nextClass = (node.getAttribute("class") ?? "")
    .split(/\s+/)
    .filter((part) => part && part !== token)
    .join(" ");
  if (nextClass) {
    node.setAttribute("class", nextClass);
  } else {
    node.removeAttribute("class");
  }
}

function pointsIntersectRegion(points: Vec2[], region: ExportRegion) {
  const projected = points.map(projectA2);
  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  return maxX >= region.x &&
    minX <= region.x + region.width &&
    maxY >= region.y &&
    minY <= region.y + region.height;
}

function pointInRegion(point: Vec2, region: ExportRegion) {
  const projected = projectA2(point);
  return projected.x >= region.x &&
    projected.x <= region.x + region.width &&
    projected.y >= region.y &&
    projected.y <= region.y + region.height;
}
