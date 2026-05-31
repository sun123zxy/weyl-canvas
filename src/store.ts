import { create } from "zustand";
import {
  defaultExportRegion,
  defaultGridRange,
  emptyStyles,
  initialDefaultStyles,
} from "./constants";
import type { DefaultStyles, ExportRegion, RootSystemType, SelectionItem, Styles } from "./types";

type Update<T> = T | ((current: T) => T);

type EditorState = {
  rootSystemType: RootSystemType;
  gridRange: number;
  styles: Styles;
  defaultStyles: DefaultStyles;
  selection: SelectionItem[];
  exportRegion: ExportRegion;
  editorCheckerboard: boolean;
  showReferenceVectors: boolean;
  setRootSystemType: (rootSystemType: RootSystemType) => void;
  setGridRange: (gridRange: number) => void;
  setStyles: (styles: Update<Styles>) => void;
  setDefaultStyles: (defaultStyles: Update<DefaultStyles>) => void;
  setSelection: (selection: Update<SelectionItem[]>) => void;
  clearSelection: () => void;
  setExportRegion: (exportRegion: Update<ExportRegion>) => void;
  resetExportRegion: () => void;
  setEditorCheckerboard: (enabled: boolean) => void;
  setShowReferenceVectors: (enabled: boolean) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  rootSystemType: "A2",
  gridRange: defaultGridRange,
  styles: emptyStyles,
  defaultStyles: initialDefaultStyles,
  selection: [],
  exportRegion: defaultExportRegion,
  editorCheckerboard: true,
  showReferenceVectors: true,
  setRootSystemType: (rootSystemType) => set({ rootSystemType, selection: [] }),
  setGridRange: (gridRange) => set({ gridRange }),
  setStyles: (styles) => set((state) => ({ styles: resolveUpdate(styles, state.styles) })),
  setDefaultStyles: (defaultStyles) => set((state) => ({ defaultStyles: resolveUpdate(defaultStyles, state.defaultStyles) })),
  setSelection: (selection) => set((state) => ({ selection: resolveUpdate(selection, state.selection) })),
  clearSelection: () => set({ selection: [] }),
  setExportRegion: (exportRegion) => set((state) => ({ exportRegion: resolveUpdate(exportRegion, state.exportRegion) })),
  resetExportRegion: () => set({ exportRegion: defaultExportRegion }),
  setEditorCheckerboard: (editorCheckerboard) => set({ editorCheckerboard }),
  setShowReferenceVectors: (showReferenceVectors) => set({ showReferenceVectors }),
}));

function resolveUpdate<T>(update: Update<T>, current: T): T {
  return typeof update === "function" ? (update as (current: T) => T)(current) : update;
}
