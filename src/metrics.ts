import type { Rank2System, Vec2 } from "./types";

export const SVG_UNITS_PER_TIKZ_CM = 76;
export const TIKZ_CM_PER_DRAWING_UNIT = 2;
export const DRAWING_UNIT = SVG_UNITS_PER_TIKZ_CM * TIKZ_CM_PER_DRAWING_UNIT;
export const SVG_LABEL_BASE_FONT_PX = 16;

const TEX_PT_PER_INCH = 72.27;
const CM_PER_INCH = 2.54;

export const TEX_PT_PER_CM = TEX_PT_PER_INCH / CM_PER_INCH;

export function coweightToDrawing(system: Rank2System, coord: Vec2): Vec2 {
  const [omega1, omega2] = system.coweightBasis;
  return {
    x: coord.x * omega1.x + coord.y * omega2.x,
    y: coord.x * omega1.y + coord.y * omega2.y,
  };
}

export function drawingToSvg(point: Vec2): Vec2 {
  return {
    x: point.x * DRAWING_UNIT,
    y: -point.y * DRAWING_UNIT,
  };
}

export function coweightToSvg(system: Rank2System, coord: Vec2): Vec2 {
  return drawingToSvg(coweightToDrawing(system, coord));
}

export function svgToTikzLength(value: number): number {
  return value / SVG_UNITS_PER_TIKZ_CM;
}

export function svgToTikzPoint(point: Vec2): Vec2 {
  return {
    x: svgToTikzLength(point.x),
    y: -svgToTikzLength(point.y),
  };
}

export function svgLengthToTexPt(value: number): number {
  return svgToTikzLength(value) * TEX_PT_PER_CM;
}

export function labelScaleToTexPt(scale: number): number {
  return svgLengthToTexPt(scale * SVG_LABEL_BASE_FONT_PX);
}
