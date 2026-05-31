# Weyl Canvas

A frontend editor for producing illustrations of rank-2 affine Weyl groups. Supports A2, B2, and G2.

- Color / label / highlight alcoves, facets, walls, and vertices
- LaTeX support for labels via MathJax
- SVG / TikZ output with custom export region

An outcome of vibe coding. Code quality not guaranteed. Use at your own risk. Bug reports / Feature requests welcome.

## Tech stack

- React + TypeScript + Vite
- MathJax for LaTeX labels

## Development

Dev server:

```sh
npm ci
npm run dev
```

Run check:

```sh
npm run build
npm run test
```
