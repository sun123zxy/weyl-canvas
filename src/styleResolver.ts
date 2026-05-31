import type { AlcoveStyle, DefaultStyles, Facet, LineStyle, Styles, VertexStyle, WallStyle } from "./types";

export type ResolvedAlcoveStyle = {
  fill: string;
  fillOpacity: number;
};

export type ResolvedLineStyle = {
  color: string;
  weight: number;
  opacity: number;
};

export type ResolvedVertexStyle = {
  color: string;
  size: number;
  opacity: number;
};

export function resolveAlcoveStyle(style: AlcoveStyle | undefined, defaults: DefaultStyles): ResolvedAlcoveStyle {
  return {
    fill: style?.fill ?? defaults.alcove.fill,
    fillOpacity: style?.fillOpacity ?? defaults.alcove.fillOpacity,
  };
}

export function resolveFacetStyle(facet: Facet, styles: Styles, defaults: DefaultStyles): ResolvedLineStyle {
  const wall = styles.wallDefaults[facet.wallId];
  const own = styles.facetOverrides[facet.id];
  return resolveLineStyle(own, wall, defaults);
}

export function resolveVertexStyle(style: VertexStyle | undefined, defaults: DefaultStyles): ResolvedVertexStyle {
  return {
    color: style?.color ?? defaults.vertex.color,
    size: style?.size ?? defaults.vertex.size,
    opacity: style?.colorOpacity ?? defaults.vertex.colorOpacity,
  };
}

function resolveLineStyle(own: LineStyle | undefined, fallback: WallStyle | undefined, defaults: DefaultStyles): ResolvedLineStyle {
  return {
    color: own?.color ?? fallback?.color ?? defaults.facet.color,
    weight: own?.weight ?? fallback?.weight ?? defaults.facet.weight,
    opacity: own?.colorOpacity ?? fallback?.colorOpacity ?? defaults.facet.colorOpacity,
  };
}
