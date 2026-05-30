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
  mixedNumber,
  mixedValue,
  omit,
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
  const entries = ids.map((id) => styles.alcoves[id] ?? {});
  const label = mixedLabel(entries);
  const fill = mixedValue(entries, "fill");
  return (
    <>
      <div className="propertyGroup">
        <div className="inlineControlRow">
          <span className="fieldLabel">Fill</span>
          <span className="fieldStatus">{fill ? "Set" : "Unset"}</span>
          <ColorField label="Fill" value={fill ?? "#d8e9ff"} onChange={(nextFill) => {
            onChange({ ...styles, alcoves: updateMany(styles.alcoves, ids, (style) => ({ ...style, fill: nextFill })) });
          }} />
          <button type="button" className="secondary compact" onClick={() => {
            onChange({ ...styles, alcoves: updateMany(styles.alcoves, ids, (style) => omit(style, "fill")) });
          }}>Clear</button>
        </div>
        <ColorSwatches onSelect={(nextFill) => {
          onChange({ ...styles, alcoves: updateMany(styles.alcoves, ids, (style) => ({ ...style, fill: nextFill })) });
        }} />
      </div>
      <LabelFields focusKey={`alcove:${ids.join("|")}`} label={label} onChange={(next) => {
        onChange({ ...styles, alcoves: updateMany(styles.alcoves, ids, (style) => ({ ...style, label: next })) });
      }} />
    </>
  );
}

function FacetInspector({ ids, styles, onChange }: InspectorProps) {
  const entries = ids.map((id) => styles.facetOverrides[id] ?? {});
  const label = mixedLabel(entries);
  return (
    <>
      <ColorField label="Color" value={mixedValue(entries, "color") ?? "#242933"} onChange={(color) => {
        onChange({ ...styles, facetOverrides: updateMany(styles.facetOverrides, ids, (style) => ({ ...style, color })) });
      }} />
      <ColorSwatches onSelect={(color) => {
        onChange({ ...styles, facetOverrides: updateMany(styles.facetOverrides, ids, (style) => ({ ...style, color })) });
      }} />
      <NumberField label="Weight" value={mixedNumber(entries, "weight", defaultFacetStyle.weight)} min={0.4} max={8} step={0.2} onChange={(weight) => {
        onChange({ ...styles, facetOverrides: updateMany(styles.facetOverrides, ids, (style) => ({ ...style, weight })) });
      }} />
      <button type="button" className="secondary" onClick={() => {
        const next = { ...styles.facetOverrides };
        ids.forEach((id) => delete next[id]);
        onChange({ ...styles, facetOverrides: next });
      }}>Use wall style</button>
      <LabelFields focusKey={`facet:${ids.join("|")}`} label={label} onChange={(next) => {
        onChange({ ...styles, facetOverrides: updateMany(styles.facetOverrides, ids, (style) => ({ ...style, label: next })) });
      }} />
    </>
  );
}

function WallInspector({ ids, styles, onChange }: InspectorProps) {
  const entries = ids.map((id) => styles.wallDefaults[id] ?? {});
  const label = mixedLabel(entries);
  return (
    <>
      <ColorField label="Fallback color" value={mixedValue(entries, "color") ?? "#242933"} onChange={(color) => {
        onChange({ ...styles, wallDefaults: updateMany(styles.wallDefaults, ids, (style) => ({ ...style, color })) });
      }} />
      <ColorSwatches onSelect={(color) => {
        onChange({ ...styles, wallDefaults: updateMany(styles.wallDefaults, ids, (style) => ({ ...style, color })) });
      }} />
      <NumberField label="Fallback weight" value={mixedNumber(entries, "weight", defaultFacetStyle.weight)} min={0.4} max={8} step={0.2} onChange={(weight) => {
        onChange({ ...styles, wallDefaults: updateMany(styles.wallDefaults, ids, (style) => ({ ...style, weight })) });
      }} />
      <LabelFields focusKey={`wall:${ids.join("|")}`} label={label} onChange={(next) => {
        onChange({ ...styles, wallDefaults: updateMany(styles.wallDefaults, ids, (style) => ({ ...style, label: next })) });
      }} />
    </>
  );
}

function VertexInspector({ ids, styles, onChange }: InspectorProps) {
  const entries = ids.map((id) => styles.vertices[id] ?? {});
  const label = mixedLabel(entries);
  return (
    <>
      <ColorField label="Color" value={mixedValue(entries, "color") ?? "#242933"} onChange={(color) => {
        onChange({ ...styles, vertices: updateMany(styles.vertices, ids, (style) => ({ ...style, color })) });
      }} />
      <ColorSwatches onSelect={(color) => {
        onChange({ ...styles, vertices: updateMany(styles.vertices, ids, (style) => ({ ...style, color })) });
      }} />
      <NumberField label="Weight" value={mixedNumber(entries, "size", defaultVertexStyle.size)} min={1.5} max={12} step={0.5} onChange={(size) => {
        onChange({ ...styles, vertices: updateMany(styles.vertices, ids, (style) => ({ ...style, size })) });
      }} />
      <LabelFields focusKey={`vertex:${ids.join("|")}`} label={label} onChange={(next) => {
        onChange({ ...styles, vertices: updateMany(styles.vertices, ids, (style) => ({ ...style, label: next })) });
      }} />
    </>
  );
}

type InspectorProps = {
  ids: string[];
  styles: Styles;
  onChange: (styles: Styles) => void;
};
