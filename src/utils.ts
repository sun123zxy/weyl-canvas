import type { ObjectKind, SelectionItem } from "./types";

export function isSelected(selection: SelectionItem[], kind: ObjectKind, id: string) {
  return selection.some((item) => item.kind === kind && item.id === id);
}

export function idsForKind(selection: SelectionItem[], kind: ObjectKind) {
  return new Set(selection.filter((item) => item.kind === kind).map((item) => item.id));
}

export function labelForKind(kind: ObjectKind) {
  if (kind === "alcove") return "Alcove";
  if (kind === "facet") return "Facet";
  if (kind === "wall") return "Wall";
  return "Vertex";
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function updateMany<T extends object>(
  source: Record<string, T>,
  ids: string[],
  update: (value: T) => T,
): Record<string, T> {
  const next = { ...source };
  for (const id of ids) {
    next[id] = update(next[id] ?? ({} as T));
  }
  return next;
}

