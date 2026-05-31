import { maxGridRange, minGridRange } from "../constants";
import { useEditorStore } from "../store";
import { clamp, round } from "../utils";
import { referenceVectorStyle } from "../visualSpec";
import type { ExportRegion } from "../types";
import { NumberField } from "./InspectorControls";

export function GlobalPanel({ onUseCurrentView }: { onUseCurrentView: () => void }) {
  const exportRegion = useEditorStore((state) => state.exportRegion);
  const onExportRegionChange = useEditorStore((state) => state.setExportRegion);
  const onResetExportRegion = useEditorStore((state) => state.resetExportRegion);
  const gridRange = useEditorStore((state) => state.gridRange);
  const onGridRangeChange = useEditorStore((state) => state.setGridRange);
  const editorCheckerboard = useEditorStore((state) => state.editorCheckerboard);
  const onEditorCheckerboardChange = useEditorStore((state) => state.setEditorCheckerboard);
  const showReferenceVectors = useEditorStore((state) => state.showReferenceVectors);
  const onShowReferenceVectorsChange = useEditorStore((state) => state.setShowReferenceVectors);

  return (
    <>
      <EditorPanel
        checkerboard={editorCheckerboard}
        onCheckerboardChange={onEditorCheckerboardChange}
        showReferenceVectors={showReferenceVectors}
        onShowReferenceVectorsChange={onShowReferenceVectorsChange}
      />
      <GridRangePanel value={gridRange} onChange={onGridRangeChange} />
      <ExportRegionPanel
        region={exportRegion}
        onChange={onExportRegionChange}
        onUseCurrentView={onUseCurrentView}
        onReset={onResetExportRegion}
      />
    </>
  );
}

function EditorPanel({
  checkerboard,
  onCheckerboardChange,
  showReferenceVectors,
  onShowReferenceVectorsChange,
}: {
  checkerboard: boolean;
  onCheckerboardChange: (enabled: boolean) => void;
  showReferenceVectors: boolean;
  onShowReferenceVectorsChange: (enabled: boolean) => void;
}) {
  return (
    <section className="globalPanel first">
      <h2>Editor</h2>
      <label className="checkboxField">
        <input
          type="checkbox"
          checked={checkerboard}
          onChange={(event) => onCheckerboardChange(event.currentTarget.checked)}
        />
        <span>Checkerboard background</span>
      </label>
      <label className="checkboxField">
        <input
          type="checkbox"
          checked={showReferenceVectors}
          onChange={(event) => onShowReferenceVectorsChange(event.currentTarget.checked)}
        />
        <span className="vectorLegend">
          <span className="corootLegend" style={{ color: referenceVectorStyle.corootColor }}>Coroot</span> and{" "}
          <span className="coweightLegend" style={{ color: referenceVectorStyle.coweightColor }}>coweight</span> vectors
        </span>
      </label>
    </section>
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
