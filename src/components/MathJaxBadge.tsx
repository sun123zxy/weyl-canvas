export type MathJaxLoadStatus = "loading" | "ready";

export function MathJaxBadge({ status }: { status: MathJaxLoadStatus }) {
  const text = status === "ready" ? "MathJax ready" : "Loading MathJax";

  return (
    <div className={`mathJaxBadge ${status}`} role="status" aria-live="polite">
      <span className="statusDot" />
      {text}
    </div>
  );
}
