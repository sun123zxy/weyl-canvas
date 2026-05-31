import { simpleCoroots } from "./geometry/rank2";
import { referenceVectorStyle } from "./visualSpec";
import type { Rank2System, Vec2 } from "./types";

export type ReferenceVector = {
  id: string;
  coord: Vec2;
  color: string;
};

export function referenceVectors(system: Rank2System): ReferenceVector[] {
  const [coroot1, coroot2] = simpleCoroots(system);
  return [
    { id: "omega1", coord: { x: 1, y: 0 }, color: referenceVectorStyle.coweightColor },
    { id: "omega2", coord: { x: 0, y: 1 }, color: referenceVectorStyle.coweightColor },
    { id: "coroot1", coord: coroot1, color: referenceVectorStyle.corootColor },
    { id: "coroot2", coord: coroot2, color: referenceVectorStyle.corootColor },
  ];
}

export function referenceVectorWeight(facetWeight: number): number {
  return facetWeight * referenceVectorStyle.weightMultiplier;
}
