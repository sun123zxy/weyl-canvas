export type Vec2 = {
  x: number;
  y: number;
};

export type RootSystemType = "A2" | "B2" | "G2";

export type RootVector = readonly [number, number];

export type Rank2System = {
  type: RootSystemType;
  label: string;
  cartan: readonly [readonly [number, number], readonly [number, number]];
  positiveRoots: readonly RootVector[];
  coweightBasis: readonly [Vec2, Vec2];
};

export type ObjectKind = "alcove" | "facet" | "wall" | "vertex";

export type Label = {
  latex?: string;
  offset?: Vec2;
  size?: number;
};

export type Wall = {
  id: string;
  root: RootVector;
  level: number;
};

export type Vertex = {
  id: string;
  coord: Vec2;
};

export type Facet = {
  id: string;
  wallId: string;
  endpoints: [string, string];
  from: Vec2;
  to: Vec2;
};

export type Alcove = {
  id: string;
  vertices: Vec2[];
  vertexIds: string[];
};

export type Diagram = {
  system: Rank2System;
  walls: Wall[];
  facets: Facet[];
  vertices: Vertex[];
  alcoves: Alcove[];
};

export type AlcoveStyle = {
  fill?: string;
  fillOpacity?: number;
  label?: Label;
};

export type LineVisualStyle = {
  color?: string;
  colorOpacity?: number;
  weight?: number;
};

export type LineStyle = LineVisualStyle & {
  label?: Label;
};

export type WallStyle = LineVisualStyle;

export type VertexStyle = {
  color?: string;
  colorOpacity?: number;
  size?: number;
  label?: Label;
};

export type Styles = {
  alcoves: Record<string, AlcoveStyle>;
  facetOverrides: Record<string, LineStyle>;
  wallDefaults: Record<string, WallStyle>;
  vertices: Record<string, VertexStyle>;
};

export type DefaultStyles = {
  alcove: {
    fill: string;
    fillOpacity: number;
    label: {
      offset: Vec2;
      size: number;
    };
  };
  facet: {
    color: string;
    colorOpacity: number;
    weight: number;
    label: {
      offset: Vec2;
      size: number;
    };
  };
  vertex: {
    color: string;
    colorOpacity: number;
    size: number;
    label: {
      offset: Vec2;
      size: number;
    };
  };
};

export type SelectionItem = {
  kind: ObjectKind;
  id: string;
};

export type View = {
  tx: number;
  ty: number;
  zoom: number;
};

export type ExportRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};
