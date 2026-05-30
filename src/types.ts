export type Vec2 = {
  x: number;
  y: number;
};

export type ObjectKind = "alcove" | "facet" | "wall" | "vertex";

export type Label = {
  latex: string;
  offset: Vec2;
};

export type WallFamily = "x" | "y" | "sum";

export type Wall = {
  id: string;
  family: WallFamily;
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
  vertices: [Vec2, Vec2, Vec2];
  vertexIds: [string, string, string];
};

export type Diagram = {
  walls: Wall[];
  facets: Facet[];
  vertices: Vertex[];
  alcoves: Alcove[];
};

export type AlcoveStyle = {
  fill?: string;
  label?: Label;
};

export type LineStyle = {
  color?: string;
  weight?: number;
  label?: Label;
};

export type VertexStyle = {
  color?: string;
  size?: number;
  label?: Label;
};

export type Styles = {
  alcoves: Record<string, AlcoveStyle>;
  facetOverrides: Record<string, LineStyle>;
  wallDefaults: Record<string, LineStyle>;
  vertices: Record<string, VertexStyle>;
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
