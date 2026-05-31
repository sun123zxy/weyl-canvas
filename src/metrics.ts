import type { Vec2 } from "./types";

export const A2_UNIT = 76;
export const SVG_LABEL_BASE_FONT_PX = 16;

const TEX_PT_PER_INCH = 72.27;
const CM_PER_INCH = 2.54;

export const TEX_PT_PER_CM = TEX_PT_PER_INCH / CM_PER_INCH;

export function svgToTikzLength(value: number): number {
  return value / A2_UNIT;
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
