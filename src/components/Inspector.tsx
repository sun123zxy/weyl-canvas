import { useEffect, useState } from "react";
import { useEditorStore } from "../store";
import { DefaultPanel } from "./DefaultPanel";
import { GlobalPanel } from "./GlobalPanel";
import { SelectedPanel } from "./SelectedPanel";

type InspectorTab = "selected" | "default" | "global";

export function Inspector({
  onUseCurrentView,
}: {
  onUseCurrentView: () => void;
}) {
  const selection = useEditorStore((state) => state.selection);
  const styles = useEditorStore((state) => state.styles);
  const onChange = useEditorStore((state) => state.setStyles);
  const defaultStyles = useEditorStore((state) => state.defaultStyles);
  const onDefaultStylesChange = useEditorStore((state) => state.setDefaultStyles);
  const [tab, setTab] = useState<InspectorTab>("selected");
  const selectedKind = selection[0]?.kind;
  const selectionKey = selection.map((item) => `${item.kind}:${item.id}`).join("|");

  useEffect(() => {
    if (selection.length > 0) setTab("selected");
  }, [selection.length, selectionKey]);

  return (
    <aside className="inspector">
      <div className="inspectorTabs">
        <button type="button" className={tab === "selected" ? "active" : ""} onClick={() => setTab("selected")}>Selected</button>
        <button type="button" className={tab === "default" ? "active" : ""} onClick={() => setTab("default")}>Default</button>
        <button type="button" className={tab === "global" ? "active" : ""} onClick={() => setTab("global")}>Global</button>
      </div>

      {tab === "selected" && (
        <SelectedPanel
          selectedKind={selectedKind}
          selection={selection}
          styles={styles}
          onChange={onChange}
          defaultStyles={defaultStyles}
        />
      )}

      {tab === "default" && (
        <DefaultPanel defaults={defaultStyles} onChange={onDefaultStylesChange} />
      )}

      {tab === "global" && (
        <GlobalPanel onUseCurrentView={onUseCurrentView} />
      )}
    </aside>
  );
}
