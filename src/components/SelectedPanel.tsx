import { labelForKind } from "../utils";
import type { DefaultStyles, ObjectKind, SelectionItem, Styles } from "../types";
import { AlcoveInspector, FacetInspector, VertexInspector, WallInspector } from "./SelectedStyleFields";

export function SelectedPanel({
  selectedKind,
  selection,
  styles,
  onChange,
  defaultStyles,
}: {
  selectedKind?: ObjectKind;
  selection: SelectionItem[];
  styles: Styles;
  onChange: (styles: Styles) => void;
  defaultStyles: DefaultStyles;
}) {
  const title = selectedKind
    ? `${selection.length > 1 ? `${selection.length} ` : ""}${labelForKind(selectedKind)}${selection.length > 1 ? "s" : ""}`
    : "No selection";
  const ids = selection.map((item) => item.id);

  return (
    <>
      <h2>{title}</h2>
      {!selectedKind || selection.length === 0 ? (
        <p>Click an alcove, facet, or vertex. Shift-click to multi-select the same type. Double-click a facet to edit the whole wall.</p>
      ) : (
        <>
          {selectedKind === "alcove" && <AlcoveInspector ids={ids} styles={styles} onChange={onChange} defaults={defaultStyles} />}
          {selectedKind === "facet" && <FacetInspector ids={ids} styles={styles} onChange={onChange} defaults={defaultStyles} />}
          {selectedKind === "wall" && <WallInspector ids={ids} styles={styles} onChange={onChange} defaults={defaultStyles} />}
          {selectedKind === "vertex" && <VertexInspector ids={ids} styles={styles} onChange={onChange} defaults={defaultStyles} />}
        </>
      )}
    </>
  );
}
