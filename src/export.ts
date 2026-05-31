import { centroid, midpoint } from "./geometry/rank2";
import { initialDefaultStyles } from "./constants";
import { TIKZ_CM_PER_DRAWING_UNIT, coweightToSvg, coweightToDrawing, labelScaleToTexPt, svgLengthToTexPt, svgToTikzLength, svgToTikzPoint } from "./metrics";
import { referenceVectors, referenceVectorWeight } from "./referenceVectors";
import { resolveAlcoveStyle, resolveFacetStyle, resolveVertexStyle } from "./styleResolver";
import type { DefaultStyles, Diagram, ExportRegion, Label, Rank2System, Styles, Vec2 } from "./types";

export function serializeSvg(svg: SVGSVGElement, region: ExportRegion) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("viewBox", `${region.x} ${region.y} ${region.width} ${region.height}`);
  clone.setAttribute("width", String(region.width));
  clone.setAttribute("height", String(region.height));
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
  clone.setAttribute("overflow", "hidden");
  clone.removeAttribute("class");
  clone.querySelector(".canvasBackground")?.remove();
  clone.querySelector(".sceneLayer")?.removeAttribute("transform");
  clone.querySelectorAll("[data-export-hidden='true']").forEach((node) => node.remove());
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

export function buildTikz(
  diagram: Diagram,
  styles: Styles,
  region?: ExportRegion,
  defaults: DefaultStyles = initialDefaultStyles,
  options: { showReferenceVectors?: boolean } = {},
) {
  const colorNames = new Map<string, string>();
  const lines: string[] = [
    "\\begin{tikzpicture}[x=1cm,y=1cm,line cap=round,line join=round,>=stealth]",
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
    const style = resolveAlcoveStyle(styles.alcoves[alcove.id], defaults);
    if (!style.fill) continue;
    if (style.fillOpacity <= 0) continue;
    if (region && !pointsIntersectRegion(diagram.system, alcove.vertices, region)) continue;
    const points = alcove.vertices.map((point) => tikzPoint(diagram.system, point));
    lines.push(`\\fill[${colorName(style.fill)}, opacity=${style.fillOpacity.toFixed(2)}] ${points.join(" -- ")} -- cycle;`);
  }

  for (const facet of diagram.facets) {
    if (region && !pointsIntersectRegion(diagram.system, [facet.from, facet.to], region)) continue;
    const style = resolveFacetStyle(facet, styles, defaults);
    const from = tikzPoint(diagram.system, facet.from);
    const to = tikzPoint(diagram.system, facet.to);
    lines.push(`\\draw[${colorName(style.color)}, opacity=${style.opacity.toFixed(2)}, line width=${tikzLineWidth(style.weight)}pt] ${from} -- ${to};`);
  }

  for (const vertex of diagram.vertices) {
    const style = resolveVertexStyle(styles.vertices[vertex.id], defaults);
    if (region && !pointsIntersectRegion(diagram.system, [vertex.coord], region)) continue;
    lines.push(`\\fill[${colorName(style.color)}, opacity=${style.opacity.toFixed(2)}] ${tikzPoint(diagram.system, vertex.coord)} circle (${svgToTikzLength(style.size).toFixed(3)});`);
  }

  emitLabels(lines, colorName, diagram, styles, defaults, region);
  if (options.showReferenceVectors) {
    emitReferenceVectors(lines, colorName, diagram.system, referenceVectorWeight(defaults.facet.weight));
  }
  lines.push("\\end{tikzpicture}");
  return lines.join("\n");
}

function emitReferenceVectors(
  lines: string[],
  colorName: (hex: string) => string,
  system: Rank2System,
  weight: number,
) {
  if (weight <= 0) return;

  for (const { coord, color } of referenceVectors(system)) {
    lines.push(`\\draw[${colorName(color)}, line width=${tikzLineWidth(weight)}pt, ->] (0.000,0.000) -- ${tikzPoint(system, coord)};`);
  }
}

function emitLabels(
  lines: string[],
  colorName: (hex: string) => string,
  diagram: Diagram,
  styles: Styles,
  defaults: DefaultStyles,
  region?: ExportRegion,
) {
  for (const alcove of diagram.alcoves) {
    const label = styles.alcoves[alcove.id]?.label;
    const anchor = centroid(alcove.vertices);
    if (hasVisibleLatex(label) && (!region || pointInRegion(diagram.system, anchor, region))) {
      lines.push(labelNode(diagram.system, label, anchor, defaults.alcove.label));
    }
  }

  for (const facet of diagram.facets) {
    const label = styles.facetOverrides[facet.id]?.label;
    const anchor = midpoint(facet.from, facet.to);
    if (hasVisibleLatex(label) && (!region || pointInRegion(diagram.system, anchor, region))) {
      lines.push(labelNode(diagram.system, label, anchor, defaults.facet.label));
    }
  }

  for (const vertex of diagram.vertices) {
    const label = styles.vertices[vertex.id]?.label;
    if (hasVisibleLatex(label) && (!region || pointInRegion(diagram.system, vertex.coord, region))) {
      lines.push(labelNode(diagram.system, label, vertex.coord, defaults.vertex.label));
    }
  }
}

type VisibleLabel = Label & { latex: string };

function labelNode(system: Rank2System, label: VisibleLabel, anchor: Vec2, labelDefaults: { offset: Vec2; size: number }): string {
  const base = coweightToSvg(system, anchor);
  const offset = label.offset ?? labelDefaults.offset;
  const shifted = { x: base.x + offset.x, y: base.y + offset.y };
  const fontSize = tikzLabelFontSize(label, labelDefaults);
  const lineHeight = (fontSize * 1.2).toFixed(2);
  return `\\node[inner sep=0pt, font=\\fontsize{${fontSize.toFixed(2)}pt}{${lineHeight}pt}\\selectfont] at ${tikzPointFromSvg(shifted)} {$${label.latex}$};`;
}

function hasVisibleLatex(label: Label | undefined): label is VisibleLabel {
  return Boolean(label?.latex?.trim());
}

function tikzPoint(system: Rank2System, point: Vec2): string {
  const drawing = coweightToDrawing(system, point);
  return `(${(drawing.x * TIKZ_CM_PER_DRAWING_UNIT).toFixed(3)},${(drawing.y * TIKZ_CM_PER_DRAWING_UNIT).toFixed(3)})`;
}

function tikzPointFromSvg(point: Vec2): string {
  const tikzPoint = svgToTikzPoint(point);
  return `(${tikzPoint.x.toFixed(3)},${tikzPoint.y.toFixed(3)})`;
}

function tikzLineWidth(svgWidth: number): string {
  return svgLengthToTexPt(svgWidth).toFixed(2);
}

function tikzLabelFontSize(label: Label, labelDefaults: { size: number }): number {
  return labelScaleToTexPt(label.size ?? labelDefaults.size);
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

function pointsIntersectRegion(system: Rank2System, points: Vec2[], region: ExportRegion) {
  const projected = points.map((point) => coweightToSvg(system, point));
  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  return maxX >= region.x &&
    minX <= region.x + region.width &&
    maxY >= region.y &&
    minY <= region.y + region.height;
}

function pointInRegion(system: Rank2System, point: Vec2, region: ExportRegion) {
  const projected = coweightToSvg(system, point);
  return projected.x >= region.x &&
    projected.x <= region.x + region.width &&
    projected.y >= region.y &&
    projected.y <= region.y + region.height;
}
