import { defaultLabelSize } from "./constants";
import type { Label, ObjectKind, SelectionItem } from "./types";

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

export function mixedValue<T extends object, K extends keyof T>(entries: T[], key: K): T[K] | undefined {
  const values = entries.map((entry) => entry[key]).filter(Boolean);
  if (values.length === 0) return undefined;
  return values.every((value) => value === values[0]) ? values[0] : undefined;
}

export function mixedNumber<T extends object, K extends keyof T>(entries: T[], key: K, fallback: number): number {
  const value = mixedValue(entries, key);
  return typeof value === "number" ? value : fallback;
}

export function mixedLabel(entries: { label?: Label }[]): Label | "mixed" | undefined {
  const labels = entries.map((entry) => entry.label).filter((label): label is Label => Boolean(label));
  if (labels.length === 0) return undefined;
  const first = labels[0];
  return labels.every((label) => (
    label.latex === first.latex &&
    label.offset.x === first.offset.x &&
    label.offset.y === first.offset.y &&
    (label.size ?? defaultLabelSize) === (first.size ?? defaultLabelSize)
  )) ? first : "mixed";
}

export function omit<T extends object, K extends keyof T>(source: T, key: K): Omit<T, K> {
  const next = { ...source };
  delete next[key];
  return next;
}

export function distanceToOrigin(point: { x: number; y: number }) {
  return point.x * point.x + point.y * point.y;
}
