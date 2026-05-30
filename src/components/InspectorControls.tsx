import { useEffect, useRef } from "react";
import { darkColorPresets, defaultLabelSize, lightColorPresets } from "../constants";
import type { Label } from "../types";

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

export function ColorSwatches({ onSelect }: { onSelect: (color: string) => void }) {
  return (
    <div className="colorSwatches" aria-label="Color presets">
      {[lightColorPresets, darkColorPresets].map((row, index) => (
        <div className="colorSwatchRow" key={index === 0 ? "light" : "dark"}>
          {row.map((color) => (
            <button
              key={color}
              type="button"
              className="colorSwatch"
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Use ${color}`}
              onClick={() => onSelect(color)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

export function LabelFields({
  focusKey,
  label,
  onChange,
}: {
  focusKey: string;
  label: Label | "mixed" | undefined;
  onChange: (label: Label | undefined) => void;
}) {
  const current = label === "mixed" || !label ? { latex: "", offset: { x: 0, y: 0 }, size: defaultLabelSize } : { ...label, size: label.size ?? defaultLabelSize };
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusKey]);

  return (
    <section className="labelEditor">
      <label className="field stacked">
        <span>Label</span>
        <input
          ref={inputRef}
          type="text"
          value={label === "mixed" ? "" : current.latex}
          placeholder={label === "mixed" ? "Mixed" : "\\lambda"}
          onChange={(event) => {
            const latex = event.currentTarget.value;
            onChange(latex ? { ...current, latex } : undefined);
          }}
        />
      </label>
      <div className="fieldRow">
        <NumberField label="Label X" value={current.offset.x} min={-120} max={120} step={1} onChange={(x) => onChange({ ...current, offset: { ...current.offset, x } })} />
        <NumberField label="Label Y" value={current.offset.y} min={-120} max={120} step={1} onChange={(y) => onChange({ ...current, offset: { ...current.offset, y } })} />
      </div>
      <NumberField label="Label size" value={current.size} min={0.5} max={4} step={0.1} onChange={(size) => onChange({ ...current, size })} />
      <button type="button" className="secondary" onClick={() => onChange(current.latex ? { ...current, offset: { x: 0, y: 0 } } : undefined)}>
        Reset label offset
      </button>
    </section>
  );
}
