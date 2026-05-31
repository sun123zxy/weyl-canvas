import { coweightToDrawing } from "../metrics";
import { coordKey, coordToNumber, rat, toNumber, translateCoord } from "../rational";
import type { Diagram, Facet, Rank2System, RootSystemType, RootVector, Vec2, Wall } from "../types";
import type { RationalCoord } from "../rational";

type Line = {
  root: RootVector;
  level: number;
};

type TemplateSegment = {
  from: RationalCoord;
  to: RationalCoord;
  line: Line;
};

type TemplateAlcove = {
  vertices: RationalCoord[];
};

type Template = {
  alcoves: TemplateAlcove[];
  segments: TemplateSegment[];
};

type DirectedEdge = {
  from: string;
  to: string;
};

const EPS = 1e-9;

export const rootSystems: Record<RootSystemType, Rank2System> = {
  A2: createSystem("A2", "A2", [[2, -1], [-1, 2]], [[1, 0], [0, 1], [1, 1]]),
  B2: createSystem("B2", "B2", [[2, -2], [-1, 2]], [[1, 0], [0, 1], [1, 1], [2, 1]]),
  G2: createSystem("G2", "G2", [[2, -3], [-1, 2]], [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]]),
};

export const rootSystemOptions = Object.values(rootSystems);

const templateCache = new Map<RootSystemType, Template>();

export function generateRank2Diagram(type: RootSystemType, range: number): Diagram {
  const system = rootSystems[type];
  const template = getTemplate(system);
  const vertices = new Map<string, { id: string; coord: Vec2 }>();
  const facets = new Map<string, Facet>();
  const walls = new Map<string, Wall>();
  const alcoves: Diagram["alcoves"] = [];

  for (let i = -range; i < range; i += 1) {
    for (let j = -range; j < range; j += 1) {
      for (const [index, alcove] of template.alcoves.entries()) {
        const globalVertices = alcove.vertices.map((vertex) => translateCoord(vertex, i, j));
        const vertexIds = globalVertices.map((vertex) => addVertex(vertices, system, vertex));
        alcoves.push({
          id: `a:${type}:${i}:${j}:${index}`,
          vertices: globalVertices.map(coordToNumber),
          vertexIds,
        });
      }

      for (const segment of template.segments) {
        const from = translateCoord(segment.from, i, j);
        const to = translateCoord(segment.to, i, j);
        const fromId = addVertex(vertices, system, from);
        const toId = addVertex(vertices, system, to);
        const level = segment.line.level + segment.line.root[0] * i + segment.line.root[1] * j;
        const wallId = makeWallId(type, segment.line.root, level);
        walls.set(wallId, { id: wallId, root: segment.line.root, level });
        const id = facetId(wallId, fromId, toId);
        facets.set(id, {
          id,
          wallId,
          endpoints: sortedPair(fromId, toId),
          from: coordToNumber(from),
          to: coordToNumber(to),
        });
      }
    }
  }

  return {
    system,
    walls: [...walls.values()],
    facets: [...facets.values()],
    vertices: [...vertices.values()],
    alcoves,
  };
}

export function simpleCoroots(system: Rank2System): [Vec2, Vec2] {
  return [
    { x: system.cartan[0][0], y: system.cartan[0][1] },
    { x: system.cartan[1][0], y: system.cartan[1][1] },
  ];
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

function getTemplate(system: Rank2System): Template {
  const cached = templateCache.get(system.type);
  if (cached) return cached;
  const template = buildTemplate(system);
  templateCache.set(system.type, template);
  return template;
}

function buildTemplate(system: Rank2System): Template {
  const lines = templateLines(system);
  const vertexMap = new Map<string, RationalCoord>();

  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      const point = intersectLines(lines[i], lines[j]);
      if (!point || !insideUnitSquare(point)) continue;
      vertexMap.set(coordKey(point), point);
    }
  }

  const vertices = [...vertexMap.values()];
  const segments = buildSegments(lines, vertices);
  const alcoves = traceFaces(system, vertices, segments);
  return { alcoves, segments };
}

function templateLines(system: Rank2System): Line[] {
  return system.positiveRoots.flatMap((root) => {
    const maxLevel = root[0] + root[1];
    return Array.from({ length: maxLevel + 1 }, (_, level) => ({ root, level }));
  });
}

function intersectLines(a: Line, b: Line): RationalCoord | undefined {
  const [a1, a2] = a.root;
  const [b1, b2] = b.root;
  const det = a1 * b2 - a2 * b1;
  if (det === 0) return undefined;
  return {
    x: rat(a.level * b2 - a2 * b.level, det),
    y: rat(a1 * b.level - a.level * b1, det),
  };
}

function insideUnitSquare(point: RationalCoord) {
  const x = toNumber(point.x);
  const y = toNumber(point.y);
  return x >= -EPS && x <= 1 + EPS && y >= -EPS && y <= 1 + EPS;
}

function buildSegments(lines: Line[], vertices: RationalCoord[]): TemplateSegment[] {
  const segments = new Map<string, TemplateSegment>();
  for (const line of lines) {
    const points = vertices
      .filter((point) => onLine(line, point))
      .sort((a, b) => lineParameter(line, a) - lineParameter(line, b));

    for (let index = 0; index < points.length - 1; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      if (coordKey(from) === coordKey(to)) continue;
      const key = segmentKey(coordKey(from), coordKey(to));
      segments.set(key, { from, to, line });
    }
  }
  return [...segments.values()];
}

function onLine(line: Line, point: RationalCoord) {
  const value = line.root[0] * toNumber(point.x) + line.root[1] * toNumber(point.y);
  return Math.abs(value - line.level) < EPS;
}

function lineParameter(line: Line, point: RationalCoord) {
  const [a, b] = line.root;
  return b * toNumber(point.x) - a * toNumber(point.y);
}

function traceFaces(system: Rank2System, vertices: RationalCoord[], segments: TemplateSegment[]): TemplateAlcove[] {
  const vertexByKey = new Map(vertices.map((vertex) => [coordKey(vertex), vertex]));
  const outgoing = new Map<string, DirectedEdge[]>();
  const directed = new Map<string, DirectedEdge>();

  for (const segment of segments) {
    const a = coordKey(segment.from);
    const b = coordKey(segment.to);
    addDirectedEdge(outgoing, directed, { from: a, to: b });
    addDirectedEdge(outgoing, directed, { from: b, to: a });
  }

  for (const edges of outgoing.values()) {
    edges.sort((a, b) => edgeAngle(system, vertexByKey, a) - edgeAngle(system, vertexByKey, b));
  }

  const visited = new Set<string>();
  const faces = new Map<string, TemplateAlcove>();

  for (const start of directed.values()) {
    const startKey = directedKey(start);
    if (visited.has(startKey)) continue;

    const polygon: RationalCoord[] = [];
    let current = start;

    for (let guard = 0; guard < 200; guard += 1) {
      const key = directedKey(current);
      if (visited.has(key)) break;
      visited.add(key);
      polygon.push(vertexByKey.get(current.from)!);
      current = nextLeftEdge(outgoing, current);
      if (directedKey(current) === startKey) break;
    }

    if (polygon.length < 3) continue;
    const area = drawingArea(system, polygon);
    if (area <= EPS) continue;
    const key = polygonKey(polygon);
    faces.set(key, { vertices: trimCollinear(system, polygon) });
  }

  return [...faces.values()].sort((a, b) => {
    const ca = centroid(a.vertices.map(coordToNumber));
    const cb = centroid(b.vertices.map(coordToNumber));
    return ca.x - cb.x || ca.y - cb.y;
  });
}

function addDirectedEdge(outgoing: Map<string, DirectedEdge[]>, directed: Map<string, DirectedEdge>, edge: DirectedEdge) {
  directed.set(directedKey(edge), edge);
  const edges = outgoing.get(edge.from) ?? [];
  edges.push(edge);
  outgoing.set(edge.from, edges);
}

function edgeAngle(system: Rank2System, vertexByKey: Map<string, RationalCoord>, edge: DirectedEdge) {
  const from = coweightToDrawing(system, coordToNumber(vertexByKey.get(edge.from)!));
  const to = coweightToDrawing(system, coordToNumber(vertexByKey.get(edge.to)!));
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function nextLeftEdge(outgoing: Map<string, DirectedEdge[]>, edge: DirectedEdge): DirectedEdge {
  const edges = outgoing.get(edge.to);
  if (!edges) throw new Error("Broken template graph.");
  const reverseKey = `${edge.to}->${edge.from}`;
  const index = edges.findIndex((candidate) => directedKey(candidate) === reverseKey);
  if (index < 0) throw new Error("Missing reverse edge.");
  return edges[(index - 1 + edges.length) % edges.length];
}

function drawingArea(system: Rank2System, polygon: RationalCoord[]) {
  const points = polygon.map((point) => coweightToDrawing(system, coordToNumber(point)));
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function trimCollinear(system: Rank2System, polygon: RationalCoord[]): RationalCoord[] {
  return polygon.filter((point, index) => {
    const previous = coweightToDrawing(system, coordToNumber(polygon[(index - 1 + polygon.length) % polygon.length]));
    const current = coweightToDrawing(system, coordToNumber(point));
    const next = coweightToDrawing(system, coordToNumber(polygon[(index + 1) % polygon.length]));
    const cross = (current.x - previous.x) * (next.y - current.y) - (current.y - previous.y) * (next.x - current.x);
    return Math.abs(cross) > EPS;
  });
}

function polygonKey(polygon: RationalCoord[]) {
  return polygon.map(coordKey).sort().join("|");
}

function addVertex(vertices: Map<string, { id: string; coord: Vec2 }>, system: Rank2System, coord: RationalCoord): string {
  const key = coordKey(coord);
  const id = `v:${system.type}:${key}`;
  if (!vertices.has(id)) {
    vertices.set(id, { id, coord: coordToNumber(coord) });
  }
  return id;
}

function createSystem(
  type: RootSystemType,
  label: string,
  cartan: [[number, number], [number, number]],
  positiveRoots: RootVector[],
): Rank2System {
  const basis = basisFromCartan(cartan);
  return {
    type,
    label,
    cartan,
    positiveRoots,
    coweightBasis: basis.coweightBasis,
  };
}

function basisFromCartan(cartan: [[number, number], [number, number]]): { coweightBasis: [Vec2, Vec2] } {
  const l1 = 1;
  const l2 = cartan[0][1] / cartan[1][0];
  const dot = cartan[0][1] * l1 / 2;
  const alpha1 = { x: Math.sqrt(l1), y: 0 };
  const alpha2 = { x: dot / alpha1.x, y: Math.sqrt(Math.max(0, l2 - (dot * dot) / l1)) };
  const det = alpha1.x * alpha2.y - alpha1.y * alpha2.x;
  const omega1 = { x: alpha2.y / det, y: -alpha2.x / det };
  const omega2 = { x: -alpha1.y / det, y: alpha1.x / det };
  const length1 = Math.hypot(omega1.x, omega1.y);
  const unit1 = { x: omega1.x / length1, y: omega1.y / length1 };
  const perp1 = { x: -unit1.y, y: unit1.x };
  const normalize = (vector: Vec2): Vec2 => ({
    x: (vector.x * unit1.x + vector.y * unit1.y) / length1,
    y: (vector.x * perp1.x + vector.y * perp1.y) / length1,
  });
  return {
    coweightBasis: [{ x: 1, y: 0 }, normalize(omega2)],
  };
}

function makeWallId(type: RootSystemType, root: RootVector, level: number) {
  return `w:${type}:${root[0]}:${root[1]}:${level}`;
}

function facetId(wall: string, a: string, b: string) {
  const [first, second] = sortedPair(a, b);
  return `f:${wall}:${first}:${second}`;
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function segmentKey(a: string, b: string) {
  const [first, second] = sortedPair(a, b);
  return `${first}|${second}`;
}

function directedKey(edge: DirectedEdge) {
  return `${edge.from}->${edge.to}`;
}
