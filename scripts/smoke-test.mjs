import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const tempDir = await mkdtemp(path.join(os.tmpdir(), "weyl-canvas-test-"));

try {
  const source = await readFile(path.join(root, "src", "geometry", "a2.ts"), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  const geometryDir = path.join(tempDir, "geometry");
  await import("node:fs/promises").then((fs) => fs.mkdir(geometryDir, { recursive: true }));
  const modulePath = path.join(geometryDir, "a2.mjs");
  await writeFile(modulePath, transpiled, "utf8");

  const a2 = await import(`file://${modulePath.replaceAll("\\", "/")}`);
  const diagram = a2.generateA2Diagram(2);

  assert.equal(diagram.walls.length, 15, "A2 range 2 should have 3 families with 5 walls each.");
  assert.equal(diagram.vertices.length, 25, "A2 range 2 should have a 5 by 5 vertex grid.");
  assert.equal(diagram.facets.length, 56, "A2 range 2 should have the expected bounded facets.");
  assert.equal(diagram.alcoves.length, 32, "A2 range 2 should have two triangular alcoves per unit square.");

  const diagonalFacet = diagram.facets.find((facet) => facet.wallId === "w:sum:1");
  assert.ok(diagonalFacet, "A diagonal A2 wall facet should exist.");

  const projectedOrigin = a2.projectA2({ x: 0, y: 0 });
  assert.deepEqual(projectedOrigin, { x: 0, y: -0 }, "The origin should project to the SVG origin.");

  const projectedX = a2.projectA2({ x: 1, y: 0 });
  const projectedY = a2.projectA2({ x: 0, y: 1 });
  assert.equal(projectedX.x, 76, "The x basis vector should project one unit to the right.");
  assert.equal(projectedX.y, -0, "The x basis vector should stay horizontal.");
  assert.equal(projectedY.x, 38, "The y basis vector should project half a unit to the right.");
  assert.ok(projectedY.y < -65 && projectedY.y > -66, "The y basis vector should project at 60 degrees.");

  const exportSource = await readFile(path.join(root, "src", "export.ts"), "utf8");
  const constantsSource = await readFile(path.join(root, "src", "constants.ts"), "utf8");
  const constantsTranspiled = ts.transpileModule(constantsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  await writeFile(path.join(tempDir, "constants.mjs"), constantsTranspiled, "utf8");
  const exportTranspiled = ts.transpileModule(
    exportSource
      .replace('from "./geometry/a2"', 'from "./geometry/a2.mjs"')
      .replace('from "./constants"', 'from "./constants.mjs"'),
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

  const styledAlcove = diagram.alcoves[0];
  const styledFacet = diagram.facets[0];
  const styledWall = diagram.walls.find((wall) => wall.id === styledFacet.wallId);
  const styledVertex = diagram.vertices.find((vertex) => vertex.id === "v:0:1");
  const labeledVertex = diagram.vertices.find((vertex) => vertex.id === "v:0:0");
  assert.ok(styledVertex, "The test vertex v:0:1 should exist.");
  assert.ok(labeledVertex, "The test vertex v:0:0 should exist.");
  const tikz = buildTikz(diagram, {
    alcoves: {
      [styledAlcove.id]: {
        fill: "#d8e9ff",
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
        label: { latex: "H", offset: { x: 0, y: 10 } },
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
        label: { latex: "v", offset: { x: 0, y: -76 } },
      },
    },
  }, { x: -300, y: -300, width: 600, height: 600 });

  assert.match(tikz, /\\begin\{tikzpicture\}/, "TikZ export should include a tikzpicture.");
  assert.match(tikz, /\\clip \(-3\.947,3\.947\) rectangle \(3\.947,-3\.947\);/, "TikZ export should clip to the export region.");
  assert.match(tikz, /\\definecolor\{wc\d+\}\{HTML\}\{D8E9FF\}/, "TikZ export should define alcove fill colors.");
  assert.match(tikz, /\\fill\[wc\d+\]/, "TikZ export should include alcove fills.");
  assert.match(tikz, /line width=0\.75pt/, "TikZ export should scale facet weights from SVG pixels to TikZ points.");
  assert.match(tikz, /\(0\.500,0\.866\) circle \(0\.079\)/, "TikZ should use visible vertex radii in mathematical coordinates.");
  assert.match(tikz, /\\node\[inner sep=0pt, scale=1\.00\] at \(0\.000,1\.000\) \{\$v\$\};/, "TikZ label offsets should use the same centered anchor semantics as SVG labels.");
  assert.match(tikz, /\$\\lambda\$/, "TikZ export should preserve alcove LaTeX labels.");
  assert.match(tikz, /\$s_1\$/, "TikZ export should preserve facet LaTeX labels.");

  console.log("Smoke tests passed.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
