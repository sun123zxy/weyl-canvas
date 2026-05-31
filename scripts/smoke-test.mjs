import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const tempDir = await mkdtemp(path.join(os.tmpdir(), "weyl-canvas-test-"));

try {
  const metricsSource = await readFile(path.join(root, "src", "metrics.ts"), "utf8");
  const metricsTranspiled = ts.transpileModule(metricsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  await writeFile(path.join(tempDir, "metrics.mjs"), metricsTranspiled, "utf8");

  const rationalSource = await readFile(path.join(root, "src", "rational.ts"), "utf8");
  const rationalTranspiled = ts.transpileModule(rationalSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  await writeFile(path.join(tempDir, "rational.mjs"), rationalTranspiled, "utf8");

  const geometryDir = path.join(tempDir, "geometry");
  await import("node:fs/promises").then((fs) => fs.mkdir(geometryDir, { recursive: true }));

  const rank2Source = await readFile(path.join(root, "src", "geometry", "rank2.ts"), "utf8");
  const rank2Transpiled = ts.transpileModule(
    rank2Source
      .replace('from "../metrics"', 'from "../metrics.mjs"')
      .replace('from "../rational"', 'from "../rational.mjs"'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: true,
      },
    },
  ).outputText;
  await writeFile(path.join(geometryDir, "rank2.mjs"), rank2Transpiled, "utf8");

  const rank2 = await import(`file://${path.join(geometryDir, "rank2.mjs").replaceAll("\\", "/")}`);
  const metrics = await import(`file://${path.join(tempDir, "metrics.mjs").replaceAll("\\", "/")}`);
  const diagram = rank2.generateRank2Diagram("A2", 2);
  const b2 = rank2.generateRank2Diagram("B2", 1);
  const g2 = rank2.generateRank2Diagram("G2", 1);

  assert.equal(diagram.walls.length, 17, "A2 range 2 should include every wall that supports a bounded facet.");
  assert.equal(diagram.vertices.length, 25, "A2 range 2 should have a 5 by 5 vertex grid.");
  assert.equal(diagram.facets.length, 56, "A2 range 2 should have the expected bounded facets.");
  assert.equal(diagram.alcoves.length, 32, "A2 range 2 should have two triangular alcoves per unit square.");
  assert.equal(b2.alcoves.length, 16, "B2 range 1 should have four alcoves per coweight unit square.");
  assert.equal(g2.alcoves.length, 48, "G2 range 1 should have twelve alcoves per coweight unit square.");
  assert.ok(b2.vertices.some((vertex) => vertex.id === "v:B2:1/2:0"), "B2 should have half-integral coweight vertices.");
  assert.ok(g2.vertices.some((vertex) => vertex.id === "v:G2:1/3:0"), "G2 should have third-integral coweight vertices.");
  assertSimpleCorootNormals(rank2.rootSystems.B2, rank2, metrics);
  assertSimpleCorootNormals(rank2.rootSystems.G2, rank2, metrics);

  const diagonalFacet = diagram.facets.find((facet) => facet.wallId === "w:A2:1:1:1");
  assert.ok(diagonalFacet, "A diagonal A2 wall facet should exist.");

  const projectedOrigin = metrics.coweightToSvg(rank2.rootSystems.A2, { x: 0, y: 0 });
  assert.deepEqual(projectedOrigin, { x: 0, y: -0 }, "The origin should project to the SVG origin.");

  const projectedX = metrics.coweightToSvg(rank2.rootSystems.A2, { x: 1, y: 0 });
  const projectedY = metrics.coweightToSvg(rank2.rootSystems.A2, { x: 0, y: 1 });
  assert.equal(projectedX.x, 152, "The x basis vector should project one enlarged drawing unit to the right.");
  assert.equal(projectedX.y, -0, "The x basis vector should stay horizontal.");
  assert.equal(projectedY.x, 76, "The y basis vector should project half an enlarged drawing unit to the right.");
  assert.ok(projectedY.y < -131 && projectedY.y > -132, "The y basis vector should project at 60 degrees.");

  const exportSource = await readFile(path.join(root, "src", "export.ts"), "utf8");
  const constantsSource = await readFile(path.join(root, "src", "constants.ts"), "utf8");
  const visualSpecSource = await readFile(path.join(root, "src", "visualSpec.ts"), "utf8");
  const referenceVectorsSource = await readFile(path.join(root, "src", "referenceVectors.ts"), "utf8");
  const styleResolverSource = await readFile(path.join(root, "src", "styleResolver.ts"), "utf8");
  const constantsTranspiled = ts.transpileModule(constantsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  await writeFile(path.join(tempDir, "constants.mjs"), constantsTranspiled, "utf8");
  const visualSpecTranspiled = ts.transpileModule(visualSpecSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  await writeFile(path.join(tempDir, "visualSpec.mjs"), visualSpecTranspiled, "utf8");
  const referenceVectorsTranspiled = ts.transpileModule(
    referenceVectorsSource
      .replace('from "./geometry/rank2"', 'from "./geometry/rank2.mjs"')
      .replace('from "./visualSpec"', 'from "./visualSpec.mjs"'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: true,
      },
    },
  ).outputText;
  await writeFile(path.join(tempDir, "referenceVectors.mjs"), referenceVectorsTranspiled, "utf8");
  const styleResolverTranspiled = ts.transpileModule(styleResolverSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  await writeFile(path.join(tempDir, "styleResolver.mjs"), styleResolverTranspiled, "utf8");
  const exportTranspiled = ts.transpileModule(
    exportSource
      .replace('from "./geometry/rank2"', 'from "./geometry/rank2.mjs"')
      .replace('from "./constants"', 'from "./constants.mjs"')
      .replace('from "./metrics"', 'from "./metrics.mjs"')
      .replace('from "./referenceVectors"', 'from "./referenceVectors.mjs"')
      .replace('from "./styleResolver"', 'from "./styleResolver.mjs"'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: true,
      },
    },
  ).outputText;
  const exportPath = path.join(tempDir, "export.mjs");
  await writeFile(exportPath, exportTranspiled, "utf8");
  const { buildTikz } = await import(`file://${exportPath.replaceAll("\\", "/")}`);
  const styleResolver = await import(`file://${path.join(tempDir, "styleResolver.mjs").replaceAll("\\", "/")}`);

  const styledAlcove = diagram.alcoves.find((alcove) => alcove.id === "a:A2:0:0:0");
  const styledFacet = diagram.facets.find((facet) =>
    facet.endpoints.includes("v:A2:0:0") && facet.endpoints.includes("v:A2:1:0")
  );
  const styledVertex = diagram.vertices.find((vertex) => vertex.id === "v:A2:0:1");
  const labeledVertex = diagram.vertices.find((vertex) => vertex.id === "v:A2:0:0");
  assert.ok(styledAlcove, "The test alcove a:A2:0:0:0 should exist.");
  assert.ok(styledFacet, "The test facet from v:A2:0:0 to v:A2:1:0 should exist.");
  const styledWall = diagram.walls.find((wall) => wall.id === styledFacet.wallId);
  assert.ok(styledVertex, "The test vertex v:A2:0:1 should exist.");
  assert.ok(labeledVertex, "The test vertex v:A2:0:0 should exist.");
  const tikz = buildTikz(diagram, {
    alcoves: {
      [styledAlcove.id]: {
        fill: "#d8e9ff",
        fillOpacity: 1,
        label: { latex: "\\lambda", offset: { x: 0, y: -12 } },
      },
    },
    facetOverrides: {
      [styledFacet.id]: {
        color: "#ff0000",
        weight: 2,
        label: { latex: "s_1", offset: { x: 6, y: 4 } },
      },
    },
    wallDefaults: {
      [styledWall.id]: {
        color: "#008800",
        weight: 3,
      },
    },
    vertices: {
      [styledVertex.id]: {
        color: "#0000ff",
        size: 6,
      },
      [labeledVertex.id]: {
        color: "#0000ff",
        size: 6,
        label: { latex: "v", offset: { x: 0, y: -76 }, size: 1.8 },
      },
    },
  }, { x: -300, y: -300, width: 600, height: 600 });

  assert.match(tikz, /\\begin\{tikzpicture\}/, "TikZ export should include a tikzpicture.");
  assert.match(tikz, /\\clip \(-3\.947,3\.947\) rectangle \(3\.947,-3\.947\);/, "TikZ export should clip to the export region.");
  assert.match(tikz, /\\definecolor\{wc\d+\}\{HTML\}\{D8E9FF\}/, "TikZ export should define alcove fill colors.");
  assert.match(tikz, /\\fill\[wc\d+, opacity=1\.00\]/, "TikZ export should include alcove fills.");
  assert.match(tikz, /line width=0\.75pt/, "TikZ export should scale facet weights from SVG pixels to TikZ points.");
  assert.match(tikz, /\(1\.000,1\.732\) circle \(0\.079\)/, "TikZ should use enlarged mathematical coordinates and visible vertex radii.");
  assert.match(tikz, /\\node\[inner sep=0pt, font=\\fontsize\{10\.78pt\}\{12\.94pt\}\\selectfont\] at \(0\.000,1\.000\) \{\$v\$\};/, "TikZ labels should export their configured scale through the shared SVG-to-TikZ metric.");
  assert.match(tikz, /\$\\lambda\$/, "TikZ export should preserve alcove LaTeX labels.");
  assert.match(tikz, /\$s_1\$/, "TikZ export should preserve facet LaTeX labels.");

  const tikzWithOverlay = buildTikz(diagram, {
    alcoves: {},
    facetOverrides: {},
    wallDefaults: {},
    vertices: {},
  }, { x: -300, y: -300, width: 600, height: 600 }, undefined, { showReferenceVectors: true });
  assert.match(tikzWithOverlay, /\\definecolor\{wc\d+\}\{HTML\}\{1F5FAA\}/, "TikZ overlay should define the coweight vector color.");
  assert.match(tikzWithOverlay, /\\definecolor\{wc\d+\}\{HTML\}\{BF7A2F\}/, "TikZ overlay should define the coroot vector color.");
  assert.match(tikzWithOverlay, /\\draw\[wc\d+, line width=0\.75pt, ->\] \(0\.000,0\.000\) --/, "TikZ overlay should draw arrowed reference vectors with twice the default facet weight.");

  const opacityDefaults = {
    alcove: { fill: "#d8e9ff", fillOpacity: 0.25, label: { offset: { x: 0, y: 0 }, size: 1 } },
    facet: { color: "#242933", colorOpacity: 0.35, weight: 1.2, label: { offset: { x: 0, y: 0 }, size: 1 } },
    vertex: { color: "#242933", colorOpacity: 0.45, size: 2.2, label: { offset: { x: 0, y: 0 }, size: 1 } },
  };
  assert.equal(styleResolver.resolveAlcoveStyle({ fill: "#ff0000" }, opacityDefaults).fillOpacity, 0.25, "Alcove color overrides should not implicitly override opacity.");
  assert.equal(styleResolver.resolveVertexStyle({ color: "#ff0000" }, opacityDefaults).opacity, 0.45, "Vertex color overrides should not implicitly override opacity.");
  assert.equal(styleResolver.resolveFacetStyle(styledFacet, {
    alcoves: {},
    facetOverrides: { [styledFacet.id]: { color: "#ff0000" } },
    wallDefaults: {},
    vertices: {},
  }, opacityDefaults).opacity, 0.35, "Facet color overrides should not implicitly override opacity.");
  assert.equal(styleResolver.resolveFacetStyle(styledFacet, {
    alcoves: {},
    facetOverrides: {},
    wallDefaults: { [styledFacet.wallId]: { colorOpacity: 0.7 } },
    vertices: {},
  }, opacityDefaults).opacity, 0.7, "Wall opacity should remain the fallback for facet opacity.");

  console.log("Smoke tests passed.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

function assertSimpleCorootNormals(system, rank2, metrics) {
  const [coroot1, coroot2] = rank2.simpleCoroots(system);
  const omega1 = metrics.coweightToDrawing(system, { x: 1, y: 0 });
  const omega2 = metrics.coweightToDrawing(system, { x: 0, y: 1 });
  const drawnCoroot1 = metrics.coweightToDrawing(system, coroot1);
  const drawnCoroot2 = metrics.coweightToDrawing(system, coroot2);
  assert.ok(Math.abs(dot(drawnCoroot1, omega2)) < 1e-9, `${system.type} first simple coroot should be normal to the first simple wall.`);
  assert.ok(Math.abs(dot(drawnCoroot2, omega1)) < 1e-9, `${system.type} second simple coroot should be normal to the second simple wall.`);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}
