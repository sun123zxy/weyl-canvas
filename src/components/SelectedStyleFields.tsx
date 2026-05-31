import { LabelFields, OptionalColorOpacityFields, OptionalNumberField } from "./InspectorControls";
import type { ToggleState } from "./InspectorControls";
import { updateMany } from "../utils";
import { visualRanges } from "../visualSpec";
import type { DefaultStyles, Label, ObjectKind, Styles } from "../types";

type InspectorProps = {
  ids: string[];
  styles: Styles;
  onChange: (styles: Styles) => void;
  defaults: DefaultStyles;
};

type StyleMapKey = keyof Styles;
type StyleEntry = Styles[StyleMapKey][string];
type ColorKey = "color" | "fill";
type OpacityKey = "colorOpacity" | "fillOpacity";
type NumberKey = "weight" | "size" | OpacityKey;
type StyleFieldKey = ColorKey | NumberKey | "label";

export function AlcoveInspector({ ids, styles, onChange, defaults }: InspectorProps) {
  return (
    <>
      <StyleColorOpacityControl
        label="Fill"
        mapKey="alcoves"
        colorKey="fill"
        opacityKey="fillOpacity"
        ids={ids}
        styles={styles}
        onChange={onChange}
        defaults={defaults}
        colorFallback={defaults.alcove.fill}
        opacityFallback={defaults.alcove.fillOpacity}
      />
      <StyleLabelFields kind="alcove" mapKey="alcoves" ids={ids} styles={styles} onChange={onChange} defaults={defaults} labelDefaults={defaults.alcove.label} />
    </>
  );
}

export function FacetInspector({ ids, styles, onChange, defaults }: InspectorProps) {
  return (
    <>
      <StyleColorOpacityControl
        label="Color"
        mapKey="facetOverrides"
        colorKey="color"
        opacityKey="colorOpacity"
        ids={ids}
        styles={styles}
        onChange={onChange}
        defaults={defaults}
        colorFallback={defaults.facet.color}
        opacityFallback={defaults.facet.colorOpacity}
      />
      <StyleNumberField label="Weight" mapKey="facetOverrides" fieldKey="weight" ids={ids} styles={styles} onChange={onChange} defaults={defaults} fallback={defaults.facet.weight} {...visualRanges.lineWeight} slider />
      <StyleLabelFields kind="facet" mapKey="facetOverrides" ids={ids} styles={styles} onChange={onChange} defaults={defaults} labelDefaults={defaults.facet.label} />
    </>
  );
}

export function WallInspector({ ids, styles, onChange, defaults }: InspectorProps) {
  return (
    <>
      <StyleColorOpacityControl
        label="Color"
        mapKey="wallDefaults"
        colorKey="color"
        opacityKey="colorOpacity"
        ids={ids}
        styles={styles}
        onChange={onChange}
        defaults={defaults}
        colorFallback={defaults.facet.color}
        opacityFallback={defaults.facet.colorOpacity}
      />
      <StyleNumberField label="Weight" mapKey="wallDefaults" fieldKey="weight" ids={ids} styles={styles} onChange={onChange} defaults={defaults} fallback={defaults.facet.weight} {...visualRanges.lineWeight} slider />
    </>
  );
}

export function VertexInspector({ ids, styles, onChange, defaults }: InspectorProps) {
  return (
    <>
      <StyleColorOpacityControl
        label="Color"
        mapKey="vertices"
        colorKey="color"
        opacityKey="colorOpacity"
        ids={ids}
        styles={styles}
        onChange={onChange}
        defaults={defaults}
        colorFallback={defaults.vertex.color}
        opacityFallback={defaults.vertex.colorOpacity}
      />
      <StyleNumberField label="Size" mapKey="vertices" fieldKey="size" ids={ids} styles={styles} onChange={onChange} defaults={defaults} fallback={defaults.vertex.size} {...visualRanges.vertexSize} slider />
      <StyleLabelFields kind="vertex" mapKey="vertices" ids={ids} styles={styles} onChange={onChange} defaults={defaults} labelDefaults={defaults.vertex.label} />
    </>
  );
}

function StyleColorOpacityControl({
  label,
  mapKey,
  colorKey,
  opacityKey,
  ids,
  styles,
  onChange,
  colorFallback,
  opacityFallback,
}: InspectorProps & {
  label: string;
  mapKey: StyleMapKey;
  colorKey: ColorKey;
  opacityKey: OpacityKey;
  colorFallback: string;
  opacityFallback: number;
}) {
  const entries = styleEntries(styles, mapKey, ids);
  const color = mixedStyleString(entries, colorKey);
  const opacity = mixedStyleNumber(entries, opacityKey, opacityFallback);
  return (
    <OptionalColorOpacityFields
      colorLabel={label}
      colorState={optionalState(entries, colorKey)}
      color={color}
      colorFallback={colorFallback}
      opacityState={optionalState(entries, opacityKey)}
      opacity={opacity}
      opacityFallback={opacityFallback}
      onColorToggle={(enabled) => {
        patchStyleMap(styles, onChange, mapKey, ids, (style) => enabled ? { ...style, [colorKey]: color ?? colorFallback } : omitStyleField(style, colorKey));
      }}
      onOpacityToggle={(enabled) => {
        patchStyleMap(styles, onChange, mapKey, ids, (style) => enabled ? { ...style, [opacityKey]: opacity ?? opacityFallback } : omitStyleField(style, opacityKey));
      }}
      onColorChange={(nextColor) => patchStyleMap(styles, onChange, mapKey, ids, (style) => ({ ...style, [colorKey]: nextColor }))}
      onOpacityChange={(nextOpacity) => patchStyleMap(styles, onChange, mapKey, ids, (style) => ({ ...style, [opacityKey]: nextOpacity }))}
    />
  );
}

function StyleNumberField({
  label,
  mapKey,
  fieldKey,
  ids,
  styles,
  onChange,
  fallback,
  min,
  max,
  step,
  slider = false,
}: InspectorProps & {
  label: string;
  mapKey: StyleMapKey;
  fieldKey: NumberKey;
  fallback: number;
  min: number;
  max: number;
  step: number;
  slider?: boolean;
}) {
  const entries = styleEntries(styles, mapKey, ids);
  return (
    <OptionalNumberField
      label={label}
      state={optionalState(entries, fieldKey)}
      value={mixedStyleNumber(entries, fieldKey, fallback)}
      fallback={fallback}
      min={min}
      max={max}
      step={step}
      slider={slider}
      onToggle={(enabled) => {
        patchStyleMap(styles, onChange, mapKey, ids, (style) => enabled ? { ...style, [fieldKey]: mixedStyleNumber(entries, fieldKey, fallback) ?? fallback } : omitStyleField(style, fieldKey));
      }}
      onChange={(value) => patchStyleMap(styles, onChange, mapKey, ids, (style) => ({ ...style, [fieldKey]: value }))}
    />
  );
}

function StyleLabelFields({
  kind,
  mapKey,
  ids,
  styles,
  onChange,
  labelDefaults,
}: InspectorProps & {
  kind: ObjectKind;
  mapKey: StyleMapKey;
  labelDefaults: { offset: { x: number; y: number }; size: number };
}) {
  const entries = styleEntries(styles, mapKey, ids);
  return (
    <LabelFields
      focusKey={`${kind}:${ids.join("|")}`}
      labels={entries.map(labelFromStyle)}
      defaults={labelDefaults}
      onPatch={(update) => patchStyleMap(styles, onChange, mapKey, ids, (style) => ({ ...style, label: update(labelFromStyle(style) ?? { latex: "" }) }))}
    />
  );
}

function labelFromStyle(style: StyleEntry): Label | undefined {
  return "label" in style ? style.label : undefined;
}

function styleEntries(styles: Styles, mapKey: StyleMapKey, ids: string[]): StyleEntry[] {
  return ids.map((id) => styles[mapKey][id] ?? {});
}

function patchStyleMap(
  styles: Styles,
  onChange: (styles: Styles) => void,
  mapKey: StyleMapKey,
  ids: string[],
  update: (style: StyleEntry) => StyleEntry,
) {
  onChange({
    ...styles,
    [mapKey]: updateMany(styles[mapKey], ids, update),
  });
}

function mixedStyleString(entries: StyleEntry[], key: ColorKey): string | undefined {
  const value = mixedStyleValue(entries, key);
  return typeof value === "string" ? value : undefined;
}

function mixedStyleNumber(entries: StyleEntry[], key: NumberKey, fallback: number): number {
  const value = mixedStyleValue(entries, key);
  return typeof value === "number" ? value : fallback;
}

function mixedStyleValue(entries: StyleEntry[], key: StyleFieldKey): unknown {
  const values = entries
    .map((entry) => styleField(entry, key))
    .filter((value) => value !== undefined);
  if (values.length === 0) return undefined;
  return values.every((value) => value === values[0]) ? values[0] : undefined;
}

function optionalState(entries: StyleEntry[], key: StyleFieldKey): ToggleState {
  const count = entries.filter((entry) => styleField(entry, key) !== undefined).length;
  if (count === 0) return "off";
  return count === entries.length ? "on" : "mixed";
}

function styleField(entry: StyleEntry, key: StyleFieldKey) {
  return (entry as Record<string, unknown>)[key];
}

function omitStyleField(entry: StyleEntry, key: StyleFieldKey): StyleEntry {
  const next = { ...entry } as Record<string, unknown>;
  delete next[key];
  return next as StyleEntry;
}
