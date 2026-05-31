export const visualRanges = {
  opacity: { min: 0, max: 1, step: 0.05 },
  lineWeight: { min: 0, max: 8, step: 0.1 },
  vertexSize: { min: 0, max: 8, step: 0.1 },
  labelSize: { min: 0.2, max: 8, step: 0.1 },
  labelOffset: { min: -120, max: 120, step: 1 },
} as const;

export const referenceVectorStyle = {
  coweightColor: "#1f5faa",
  corootColor: "#bf7a2f",
  weightMultiplier: 2,
  arrowHeadMultiplier: 3,
} as const;
