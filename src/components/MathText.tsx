import { useEffect, useRef } from "react";
import { typesetMathElement } from "../mathjax";

export function MathText({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const element = ref.current;
    if (!element) return;
    element.classList.add("muted");
    element.textContent = `\\(${latex}\\)`;
    typesetMathElement(element)
      .then(() => {
        if (!cancelled) element.classList.remove("muted");
      })
      .catch(() => {
        if (!cancelled) element.textContent = latex;
      });
    return () => {
      cancelled = true;
    };
  }, [latex]);

  return <span ref={ref} className="inlineMath muted">{latex}</span>;
}
