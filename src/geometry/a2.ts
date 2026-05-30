import type { Alcove, Diagram, Facet, Vec2, Vertex, Wall, WallFamily } from "../types";

export const A2_RANGE = 8;
export const A2_UNIT = 76;
const SQRT3 = Math.sqrt(3);

const families: WallFamily[] = ["x", "y", "sum"];

export function vertexId(coord: Vec2): string {
  return `v:${coord.x}:${coord.y}`;
}

export function wallId(family: WallFamily, level: number): string {
  return `w:${family}:${level}`;
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function facetId(wall: string, a: string, b: string): string {
  const [first, second] = sortedPair(a, b);
  return `f:${wall}:${first}:${second}`;
}

function alcoveId(ids: string[]): string {
  return `a:${[...ids].sort().join(":")}`;
}

export function projectA2(coord: Vec2): Vec2 {
  return {
    x: A2_UNIT * (coord.x + coord.y / 2),
    y: -A2_UNIT * (SQRT3 / 2) * coord.y,
  };
}

export function generateA2Diagram(range = A2_RANGE): Diagram {
  const vertices = new Map<string, Vertex>();
  const facets = new Map<string, Facet>();
  const walls: Wall[] = [];
  const alcoves = new Map<string, Alcove>();

  for (const family of families) {
    for (let level = -range; level <= range; level += 1) {
      walls.push({ id: wallId(family, level), family, level });
    }
  }

  for (let x = -range; x <= range; x += 1) {
    for (let y = -range; y <= range; y += 1) {
      const coord = { x, y };
      vertices.set(vertexId(coord), { id: vertexId(coord), coord });
    }
  }

  for (let x = -range; x < range; x += 1) {
    for (let y = -range; y <= range; y += 1) {
      addFacet(facets, wallId("y", y), { x, y }, { x: x + 1, y });
    }
  }

  for (let x = -range; x <= range; x += 1) {
    for (let y = -range; y < range; y += 1) {
      addFacet(facets, wallId("x", x), { x, y }, { x, y: y + 1 });
    }
  }

  for (let x = -range; x < range; x += 1) {
    for (let y = -range; y < range; y += 1) {
      const level = x + y + 1;
      addFacet(facets, wallId("sum", level), { x: x + 1, y }, { x, y: y + 1 });
    }
  }

  for (let x = -range; x < range; x += 1) {
    for (let y = -range; y < range; y += 1) {
      const lowerIds: [string, string, string] = [
        vertexId({ x, y }),
        vertexId({ x: x + 1, y }),
        vertexId({ x, y: y + 1 }),
      ];
      const upperIds: [string, string, string] = [
        vertexId({ x: x + 1, y: y + 1 }),
        vertexId({ x: x + 1, y }),
        vertexId({ x, y: y + 1 }),
      ];

      alcoves.set(alcoveId(lowerIds), {
        id: alcoveId(lowerIds),
        vertexIds: lowerIds,
        vertices: [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }],
      });
      alcoves.set(alcoveId(upperIds), {
        id: alcoveId(upperIds),
        vertexIds: upperIds,
        vertices: [{ x: x + 1, y: y + 1 }, { x: x + 1, y }, { x, y: y + 1 }],
      });
    }
  }

  return {
    walls,
    facets: [...facets.values()],
    vertices: [...vertices.values()],
    alcoves: [...alcoves.values()],
  };
}

function addFacet(map: Map<string, Facet>, wall: string, from: Vec2, to: Vec2) {
  const fromId = vertexId(from);
  const toId = vertexId(to);
  const id = facetId(wall, fromId, toId);
  map.set(id, {
    id,
    wallId: wall,
    endpoints: sortedPair(fromId, toId),
    from,
    to,
  });
}

export function midpoint(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function centroid(points: Vec2[]): Vec2 {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}
