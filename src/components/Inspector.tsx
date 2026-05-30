import {
  defaultFacetStyle,
  defaultVertexStyle,
  maxGridRange,
  minGridRange,
} from "../constants";
import { ColorField, ColorSwatches, LabelFields, NumberField } from "./InspectorControls";
import {
  clamp,
  labelForKind,
  mixedLabel,
  round,
  updateMany,
} from "../utils";
import type { ExportRegion, ObjectKind, SelectionItem, Styles } from "../types";

export function Inspector({
  selectedKind,
  selection,
  styles,
  onChange,
  exportRegion,
  onExportRegionChange,
  onUseCurrentView,
  onResetExportRegion,
  gridRange,
  onGridRangeChange,
}: {
  selectedKind?: ObjectKind;
  selection: SelectionItem[];
  styles: Styles;
  onChange: (styles: Styles) => void;
  exportRegion: ExportRegion;
  onExportRegionChange: (region: ExportRegion) => void;
  onUseCurrentView: () => void;
  onResetExportRegion: () => void;
  gridRange: number;
  onGridRangeChange: (range: number) => void;
}) {
  if (!selectedKind || selection.length === 0) {
    return (
      <aside className="inspector">
        <h2>No selection</h2>
        <p>Click an alcove, facet, or vertex. Double-click a facet to edit the whole wall.</p>
        <GridRangePanel value={gridRange} onChange={onGridRangeChange} />
        <ExportRegionPanel
          region={exportRegion}
          onChange={onExportRegionChange}
          onUseCurrentView={onUseCurrentView}
          onReset={onResetExportRegion}
        />
      </aside>
    );
  }

  const title = `${selection.length > 1 ? `${selection.length} ` : ""}${labelForKind(selectedKind)}${selection.length > 1 ? "s" : ""}`;
  const ids = selection.map((item) => item.id);

  return (
    <aside className="inspector">
      <h2>{title}</h2>
      {selectedKind === "alcove" && <AlcoveInspector ids={ids} styles={styles} onChange={onChange} />}
      {selectedKind === "facet" && <FacetInspector ids={ids} styles={styles} onChange={onChange} />}
      {selectedKind === "wall" && <WallInspector ids={ids} styles={styles} onChange={onChange} />}
      {selectedKind === "vertex" && <VertexInspector ids={ids} styles={styles} onChange={onChange} />}
      <GridRangePanel value={gridRange} onChange={onGridRangeChange} />
      <ExportRegionPanel
        region={exportRegion}
        onChange={onExportRegionChange}
        onUseCurrentView={onUseCurrentView}
        onReset={onResetExportRegion}
      />
    </aside>
  );
}

function GridRangePanel({ value, onChange }: { value: number; onChange: (range: number) => void }) {
  return (
    <section className="globalPanel">
      <h2>Grid</h2>
      <NumberField
        label="Grid range"
        value={value}
        min={minGridRange}
        max={maxGridRange}
        step={1}
        onChange={(next) => onChange(clamp(Math.round(next), minGridRange, maxGridRange))}
      />
    </section>
  );
}

function ExportRegionPanel({
  region,
  onChange,
  onUseCurrentView,
  onReset,
}: {
  region: ExportRegion;
  onChange: (region: ExportRegion) => void;
  onUseCurrentView: () => void;
  onReset: () => void;
}) {
  const setField = (key: keyof ExportRegion, value: number) => {
    onChange({
      ...region,
      [key]: key === "width" || key === "height" ? Math.max(1, value) : value,
    });
  };

  return (
    <section className="globalPanel">
      <h2>Export region</h2>
      <div className="fieldRow">
        <NumberField label="X" value={round(region.x)} step={10} onChange={(value) => setField("x", value)} />
        <NumberField label="Y" value={round(region.y)} step={10} onChange={(value) => setField("y", value)} />
      </div>
      <div className="fieldRow">
        <NumberField label="Width" value={round(region.width)} min={1} step={10} onChange={(value) => setField("width", value)} />
        <NumberField label="Height" value={round(region.height)} min={1} step={10} onChange={(value) => setField("height", value)} />
      </div>
      <div className="buttonRow">
        <button type="button" onClick={onUseCurrentView}>Use current view</button>
        <button type="button" onClick={onReset}>Reset</button>
      </div>
    </section>
  );
}

function AlcoveInspector({ ids, styles, onChange }: InspectorProps) {
  return (
    <>
      <StyleColorControl
        label="Fill"
        mapKey="alcoves"
        colorKey="fill"
        ids={ids}
        styles={styles}
        onChange={onChange}
        fallback="#d8e9ff"
      />
      <StyleLabelFields kind="alcove" mapKey="alcoves" ids={ids} styles={styles} onChange={onChange} />
    </>
  );
}

function FacetInspector({ ids, styles, onChange }: InspectorProps) {
  return (
    <>
      <StyleColorControl
        label="Color"
        mapKey="facetOverrides"
        colorKey="color"
        ids={ids}
        styles={styles}
        onChange={onChange}
        fallback={defaultFacetStyle.color}
      />
      <StyleNumberField label="Weight" mapKey="facetOverrides" fieldKey="weight" ids={ids} styles={styles} onChange={onChange} fallback={defaultFacetStyle.weight} min={0.4} max={8} step={0.2} />
      <StyleLabelFields kind="facet" mapKey="facetOverrides" ids={ids} styles={styles} onChange={onChange} />
    </>
  );
}

function WallInspector({ ids, styles, onChange }: InspectorProps) {
  return (
    <>
      <StyleColorControl
        label="Fallback color"
        mapKey="wallDefaults"
        colorKey="color"
        ids={ids}
        styles={styles}
        onChange={onChange}
        fallback={defaultFacetStyle.color}
      />
      <StyleNumberField label="Fallback weight" mapKey="wallDefaults" fieldKey="weight" ids={ids} styles={styles} onChange={onChange} fallback={defaultFacetStyle.weight} min={0.4} max={8} step={0.2} />
      <StyleLabelFields kind="wall" mapKey="wallDefaults" ids={ids} styles={styles} onChange={onChange} />
    </>
  );
}

function VertexInspector({ ids, styles, onChange }: InspectorProps) {
  return (
    <>
      <StyleColorControl
        label="Color"
        mapKey="vertices"
        colorKey="color"
        ids={ids}
        styles={styles}
        onChange={onChange}
        fallback={defaultVertexStyle.color}
      />
      <StyleNumberField label="Weight" mapKey="vertices" fieldKey="size" ids={ids} styles={styles} onChange={onChange} fallback={defaultVertexStyle.size} min={1.5} max={12} step={0.5} />
      <StyleLabelFields kind="vertex" mapKey="vertices" ids={ids} styles={styles} onChange={onChange} />
    </>
  );
}

type InspectorProps = {
  ids: string[];
  styles: Styles;
  onChange: (styles: Styles) => void;
};

type StyleMapKey = keyof Styles;
type StyleEntry = Styles[StyleMapKey][string];
type ColorKey = "color" | "fill";
type NumberKey = "weight" | "size";
type StyleFieldKey = ColorKey | NumberKey | "label";

function StyleColorControl({
  label,
  mapKey,
  colorKey,
  ids,
  styles,
  onChange,
  fallback,
}: InspectorProps & {
  label: string;
  mapKey: StyleMapKey;
  colorKey: ColorKey;
  fallback: string;
}) {
  const entries = styleEntries(styles, mapKey, ids);
  const value = mixedStyleString(entries, colorKey);
  return (
    <UnsetColorControl
      label={label}
      value={value}
      fallback={fallback}
      status={colorStatus(value, hasDefinedStyleValue(entries, colorKey))}
      onSelect={(color) => patchStyleMap(styles, onChange, mapKey, ids, (style) => ({ ...style, [colorKey]: color }))}
      onClear={() => patchStyleMap(styles, onChange, mapKey, ids, (style) => omitStyleField(style, colorKey))}
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
}: InspectorProps & {
  label: string;
  mapKey: StyleMapKey;
  fieldKey: NumberKey;
  fallback: number;
  min: number;
  max: number;
  step: number;
}) {
  const entries = styleEntries(styles, mapKey, ids);
  return (
    <NumberField
      label={label}
      value={mixedStyleNumber(entries, fieldKey, fallback)}
      min={min}
      max={max}
      step={step}
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
}: InspectorProps & {
  kind: ObjectKind;
  mapKey: StyleMapKey;
}) {
  const entries = styleEntries(styles, mapKey, ids);
  return (
    <LabelFields
      focusKey={`${kind}:${ids.join("|")}`}
      label={mixedLabel(entries)}
      onChange={(label) => patchStyleMap(styles, onChange, mapKey, ids, (style) => ({ ...style, label }))}
    />
  );
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

function hasDefinedStyleValue(entries: StyleEntry[], key: StyleFieldKey) {
  return entries.some((entry) => styleField(entry, key) !== undefined);
}

function styleField(entry: StyleEntry, key: StyleFieldKey) {
  return (entry as Record<string, unknown>)[key];
}

function omitStyleField(entry: StyleEntry, key: StyleFieldKey): StyleEntry {
  const next = { ...entry } as Record<string, unknown>;
  delete next[key];
  return next as StyleEntry;
}

function UnsetColorControl({
  label,
  value,
  fallback,
  status,
  onSelect,
  onClear,
}: {
  label: string;
  value?: string;
  fallback: string;
  status: "Set" | "Unset" | "Mixed";
  onSelect: (color: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="propertyGroup">
      <div className="inlineControlRow">
        <span className="fieldLabel">{label}</span>
        <span className="fieldStatus">{status}</span>
        <ColorField label={label} value={value ?? fallback} onChange={onSelect} />
        <button type="button" className="secondary compact" onClick={onClear}>Clear</button>
      </div>
      <ColorSwatches onSelect={onSelect} />
    </div>
  );
}

function colorStatus(value: string | undefined, hasAnyValue: boolean): "Set" | "Unset" | "Mixed" {
  if (value) return "Set";
  return hasAnyValue ? "Mixed" : "Unset";
}
