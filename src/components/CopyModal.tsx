import { useEffect, useRef, useState } from "react";

export type ExportModal = {
  title: string;
  code: string;
  previewSvg?: string;
};

export function CopyModal({
  title,
  code,
  previewSvg,
  onClose,
}: ExportModal & {
  onClose: () => void;
}) {
  const [status, setStatus] = useState("Ready to copy");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      setStatus("Copy failed. Select the text manually.");
    }
  };

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
      <section className="copyModal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modalHeader">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>Close</button>
        </header>
        <div className={previewSvg ? "modalBody withPreview" : "modalBody"}>
          {previewSvg && (
            <div className="exportPreview" aria-label="SVG preview" dangerouslySetInnerHTML={{ __html: previewSvg }} />
          )}
          <textarea ref={textareaRef} className="codeBox" readOnly value={code} />
        </div>
        <footer className="modalFooter">
          <span>{status}</span>
          <button type="button" onClick={copy}>Copy</button>
        </footer>
      </section>
    </div>
  );
}
