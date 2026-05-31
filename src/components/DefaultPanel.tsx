import { useState } from "react";
import { ColorOpacityFields, LabelDefaultsFields, NumberField } from "./InspectorControls";
import { labelForKind } from "../utils";
import { visualRanges } from "../visualSpec";
import type { DefaultStyles } from "../types";

type DefaultObjectTab = "alcove" | "facet" | "vertex";
const defaultObjectTabs: DefaultObjectTab[] = ["alcove", "facet", "vertex"];

export function DefaultPanel({ defaults, onChange }: { defaults: DefaultStyles; onChange: (defaults: DefaultStyles) => void }) {
  const [tab, setTab] = useState<DefaultObjectTab>("alcove");

  return (
    <>
      <div className="objectTabs">
        {defaultObjectTabs.map((item) => (
          <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {labelForKind(item)}
          </button>
        ))}
      </div>
      {tab === "alcove" && <DefaultAlcovePanel defaults={defaults} onChange={onChange} />}
      {tab === "facet" && <DefaultFacetPanel defaults={defaults} onChange={onChange} />}
      {tab === "vertex" && <DefaultVertexPanel defaults={defaults} onChange={onChange} />}
    </>
  );
}

function DefaultAlcovePanel({ defaults, onChange }: { defaults: DefaultStyles; onChange: (defaults: DefaultStyles) => void }) {
  return (
    <section className="defaultObjectPanel">
      <ColorOpacityFields
        colorLabel="Fill"
        color={defaults.alcove.fill}
        opacity={defaults.alcove.fillOpacity}
        onColorChange={(fill) => onChange({ ...defaults, alcove: { ...defaults.alcove, fill } })}
        onOpacityChange={(fillOpacity) => onChange({ ...defaults, alcove: { ...defaults.alcove, fillOpacity } })}
      />
      <LabelDefaultsFields
        defaults={defaults.alcove.label}
        onChange={(label) => onChange({ ...defaults, alcove: { ...defaults.alcove, label } })}
      />
    </section>
  );
}

function DefaultFacetPanel({ defaults, onChange }: { defaults: DefaultStyles; onChange: (defaults: DefaultStyles) => void }) {
  return (
    <section className="defaultObjectPanel">
      <ColorOpacityFields
        colorLabel="Color"
        color={defaults.facet.color}
        opacity={defaults.facet.colorOpacity}
        onColorChange={(color) => onChange({ ...defaults, facet: { ...defaults.facet, color } })}
        onOpacityChange={(colorOpacity) => onChange({ ...defaults, facet: { ...defaults.facet, colorOpacity } })}
      />
      <NumberField label="Weight" value={defaults.facet.weight} {...visualRanges.lineWeight} slider onChange={(weight) => onChange({ ...defaults, facet: { ...defaults.facet, weight } })} />
      <LabelDefaultsFields
        defaults={defaults.facet.label}
        onChange={(label) => onChange({ ...defaults, facet: { ...defaults.facet, label } })}
      />
    </section>
  );
}

function DefaultVertexPanel({ defaults, onChange }: { defaults: DefaultStyles; onChange: (defaults: DefaultStyles) => void }) {
  return (
    <section className="defaultObjectPanel">
      <ColorOpacityFields
        colorLabel="Color"
        color={defaults.vertex.color}
        opacity={defaults.vertex.colorOpacity}
        onColorChange={(color) => onChange({ ...defaults, vertex: { ...defaults.vertex, color } })}
        onOpacityChange={(colorOpacity) => onChange({ ...defaults, vertex: { ...defaults.vertex, colorOpacity } })}
      />
      <NumberField label="Size" value={defaults.vertex.size} {...visualRanges.vertexSize} slider onChange={(size) => onChange({ ...defaults, vertex: { ...defaults.vertex, size } })} />
      <LabelDefaultsFields
        defaults={defaults.vertex.label}
        onChange={(label) => onChange({ ...defaults, vertex: { ...defaults.vertex, label } })}
      />
    </section>
  );
}
