import type { ExportRegion, Styles } from "./types";

export const defaultFacetStyle = { color: "#242933", weight: 1.2 };
export const defaultVertexStyle = { color: "#242933", size: 3.5 };
export const defaultLabelSize = 1;

export const emptyStyles: Styles = {
  alcoves: {},
  facetOverrides: {},
  wallDefaults: {},
  vertices: {},
};

export const defaultExportRegion: ExportRegion = {
  x: -360,
  y: -300,
  width: 720,
  height: 600,
};

export const minGridRange = 2;
export const maxGridRange = 20;
export const defaultGridRange = 8;

export const lightColorPresets = [
  "#f7caca",
  "#f8dfb6",
  "#f6efb8",
  "#ccefd8",
  "#cbeff1",
  "#d8e9ff",
  "#efd8ff",
];

export const darkColorPresets = [
  "#bf3f3f",
  "#bf7a2f",
  "#a48a20",
  "#2f8f5b",
  "#2f8994",
  "#1f5faa",
  "#8845a8",
];
