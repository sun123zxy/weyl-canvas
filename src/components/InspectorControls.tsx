import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { darkColorPresets, lightColorPresets } from "../constants";
import { visualRanges } from "../visualSpec";
import type { Label, Vec2 } from "../types";

export type ToggleState = "on" | "off" | "mixed";

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

export function ColorOpacityFields({
  colorLabel,
  opacityLabel = "Opacity",
  color,
  opacity,
  onColorChange,
  onOpacityChange,
  showSwatches = true,
}: {
  colorLabel: string;
  opacityLabel?: string;
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  showSwatches?: boolean;
}) {
  return (
    <ColorOpacityGroup
      colorControl={<ColorField label={colorLabel} value={color} onChange={onColorChange} />}
      showSwatches={showSwatches}
      onSwatchSelect={onColorChange}
      opacityControl={<NumberField label={opacityLabel} value={opacity} {...visualRanges.opacity} slider onChange={onOpacityChange} />}
    />
  );
}

export function OptionalColorOpacityFields({
  colorLabel,
  colorState,
  color,
  colorFallback,
  opacityLabel = "Opacity",
  opacityState,
  opacity,
  opacityFallback,
  showSwatches = true,
  onColorToggle,
  onOpacityToggle,
  onColorChange,
  onOpacityChange,
}: {
  colorLabel: string;
  colorState: ToggleState;
  color?: string;
  colorFallback: string;
  opacityLabel?: string;
  opacityState: ToggleState;
  opacity?: number;
  opacityFallback: number;
  showSwatches?: boolean;
  onColorToggle: (enabled: boolean) => void;
  onOpacityToggle: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
}) {
  return (
    <ColorOpacityGroup
      colorControl={(
        <ToggleRow label={colorLabel} state={colorState} onToggle={onColorToggle}>
          <input type="color" value={color ?? colorFallback} onChange={(event) => onColorChange(event.currentTarget.value)} />
        </ToggleRow>
      )}
      showSwatches={showSwatches}
      onSwatchSelect={onColorChange}
      opacityControl={(
        <OptionalNumberField
          label={opacityLabel}
          state={opacityState}
          value={opacity}
          fallback={opacityFallback}
          {...visualRanges.opacity}
          slider
          onToggle={onOpacityToggle}
          onChange={onOpacityChange}
        />
      )}
    />
  );
}

function ColorOpacityGroup({
  colorControl,
  opacityControl,
  showSwatches,
  onSwatchSelect,
}: {
  colorControl: ReactNode;
  opacityControl: ReactNode;
  showSwatches: boolean;
  onSwatchSelect: (color: string) => void;
}) {
  return (
    <div className="propertyGroup">
      {colorControl}
      {showSwatches && <ColorSwatches onSelect={onSwatchSelect} />}
      {opacityControl}
    </div>
  );
}

export function OptionalNumberField({
  label,
  state,
  value,
  fallback,
  min,
  max,
  step,
  slider = false,
  onToggle,
  onChange,
}: {
  label: string;
  state: ToggleState;
  value?: number;
  fallback: number;
  min?: number;
  max?: number;
  step: number;
  slider?: boolean;
  onToggle: (enabled: boolean) => void;
  onChange: (value: number) => void;
}) {
  const current = value ?? fallback;
  return (
    <ToggleRow label={label} state={state} onToggle={onToggle}>
      <NumberInput value={current} min={min} max={max} step={step} slider={slider} onChange={onChange} />
    </ToggleRow>
  );
}

export function OptionalPositionField({
  state,
  value,
  fallback,
  onToggle,
  onChange,
}: {
  state: ToggleState;
  value?: Vec2;
  fallback: Vec2;
  onToggle: (enabled: boolean) => void;
  onChange: (value: Vec2) => void;
}) {
  const current = value ?? fallback;
  return (
    <ToggleRow label="Position" state={state} onToggle={onToggle}>
      <PositionInput value={current} onChange={onChange} />
    </ToggleRow>
  );
}

export function PositionField({ value, onChange }: { value: Vec2; onChange: (value: Vec2) => void }) {
  return (
    <label className="field">
      <span>Position</span>
      <PositionInput value={value} onChange={onChange} />
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
  slider = false,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step: number;
  slider?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <NumberInput value={value} min={min} max={max} step={step} slider={slider} onChange={onChange} />
    </label>
  );
}

function NumberInput({
  value,
  min,
  max,
  step,
  slider,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step: number;
  slider: boolean;
  onChange: (value: number) => void;
}) {
  if (!slider) {
    return (
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    );
  }

  return (
    <div className="sliderInput">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  );
}

export function LabelFields({
  focusKey,
  labels,
  defaults,
  onPatch,
}: {
  focusKey: string;
  labels: (Label | undefined)[];
  defaults: { offset: Vec2; size: number };
  onPatch: (update: (label: Label) => Label) => void;
}) {
  const latex = commonValue(labels.map((label) => label?.latex));
  const offsetValue = commonOffset(labels);
  const sizeValue = commonValue(labels.map((label) => label?.size));
  const latexState = fieldState(labels, "latex");
  const offsetState = fieldState(labels, "offset");
  const sizeState = fieldState(labels, "size");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusKey]);

  return (
    <section className="labelEditor">
      <ToggleRow
        label="Label"
        state={latexState}
        onToggle={(enabled) => onPatch((label) => enabled ? { ...label, latex: label.latex ?? "" } : omitLabelField(label, "latex"))}
      >
        <input
          ref={inputRef}
          type="text"
          value={latex ?? ""}
          placeholder={latex === undefined ? "Mixed" : "\\lambda"}
          onChange={(event) => {
            const latex = event.currentTarget.value;
            onPatch((label) => ({ ...label, latex }));
          }}
        />
      </ToggleRow>
      <OptionalPositionField
        state={offsetState}
        value={offsetValue}
        fallback={defaults.offset}
        onToggle={(enabled) => onPatch((label) => enabled ? { ...label, offset: label.offset ?? defaults.offset } : omitLabelField(label, "offset"))}
        onChange={(offset) => onPatch((label) => ({ ...label, offset }))}
      />
      <OptionalNumberField
        label="Size"
        state={sizeState}
        value={sizeValue}
        fallback={defaults.size}
        {...visualRanges.labelSize}
        slider
        onToggle={(enabled) => onPatch((label) => enabled ? { ...label, size: label.size ?? defaults.size } : omitLabelField(label, "size"))}
        onChange={(size) => onPatch((label) => ({ ...label, size }))}
      />
    </section>
  );
}

export function LabelDefaultsFields({
  defaults,
  onChange,
}: {
  defaults: { offset: Vec2; size: number };
  onChange: (defaults: { offset: Vec2; size: number }) => void;
}) {
  return (
    <section className="labelEditor">
      <h4>Label</h4>
      <PositionField
        value={defaults.offset}
        onChange={(offset) => onChange({ ...defaults, offset })}
      />
      <NumberField
        label="Size"
        value={defaults.size}
        {...visualRanges.labelSize}
        slider
        onChange={(size) => onChange({ ...defaults, size })}
      />
    </section>
  );
}

function ToggleRow({
  label,
  state,
  children,
  onToggle,
}: {
  label: string;
  state: ToggleState;
  children: ReactNode;
  onToggle: (enabled: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "mixed";
  }, [state]);

  return (
    <div className="toggleField">
      <input
        ref={ref}
        type="checkbox"
        checked={state === "on"}
        onChange={(event) => onToggle(event.currentTarget.checked)}
      />
      <span>{label}</span>
      {children}
    </div>
  );
}

function PositionInput({ value, onChange }: { value: Vec2; onChange: (value: Vec2) => void }) {
  return (
    <div className="compactPair">
      <input
        type="number"
        {...visualRanges.labelOffset}
        value={value.x}
        aria-label="Label X"
        onChange={(event) => onChange({ ...value, x: Number(event.currentTarget.value) })}
      />
      <input
        type="number"
        {...visualRanges.labelOffset}
        value={value.y}
        aria-label="Label Y"
        onChange={(event) => onChange({ ...value, y: Number(event.currentTarget.value) })}
      />
    </div>
  );
}

function fieldState(entries: (Label | undefined)[], key: keyof Label): ToggleState {
  const count = entries.filter((entry) => entry?.[key] !== undefined).length;
  if (count === 0) return "off";
  return count === entries.length ? "on" : "mixed";
}

function omitLabelField<K extends keyof Label>(label: Label, key: K): Label {
  const next = { ...label };
  delete next[key];
  return next;
}

function commonValue<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  const first = values[0];
  return values.every((value) => value === first) ? first : undefined;
}

function commonOffset(labels: (Label | undefined)[]): Vec2 | undefined {
  const offsets = labels.map((label) => label?.offset);
  if (!offsets.every(Boolean)) return undefined;
  const first = offsets[0]!;
  return offsets.every((offset) => offset!.x === first.x && offset!.y === first.y) ? first : undefined;
}
