export type RenderedMath = {
  latex: string;
  svg: string;
};

type MathJaxWindow = Window & {
  MathJax?: {
    startup?: {
      promise?: Promise<void>;
    };
    tex2svgPromise?: (latex: string, options: { display: boolean }) => Promise<HTMLElement>;
    typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
    typesetClear?: (elements?: HTMLElement[]) => void;
  };
};

const cache = new Map<string, Promise<RenderedMath>>();
type ReadyMathJax = {
  startup?: {
    promise?: Promise<void>;
  };
  tex2svgPromise: (latex: string, options: { display: boolean }) => Promise<HTMLElement>;
  typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
  typesetClear?: (elements?: HTMLElement[]) => void;
};

let mathJaxReady: Promise<ReadyMathJax> | undefined;

export function renderMath(latex: string): Promise<RenderedMath> {
  const key = latex.trim();
  if (!key) {
    return Promise.resolve({ latex: key, svg: "" });
  }

  const existing = cache.get(key);
  if (existing) {
    return existing;
  }

  const rendered = compileMath(key).catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, rendered);
  return rendered;
}

export function ensureMathJaxReady(): Promise<void> {
  return waitForMathJax().then(() => undefined);
}

export async function typesetMathElement(element: HTMLElement): Promise<void> {
  const mathJax = await waitForMathJax();
  mathJax.typesetClear?.([element]);
  await mathJax.typesetPromise?.([element]);
}

async function compileMath(latex: string): Promise<RenderedMath> {
  const mathJax = await waitForMathJax();
  const container = await mathJax.tex2svgPromise(latex, { display: false });
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("MathJax did not return SVG output.");
  }

  svg.removeAttribute("role");
  svg.setAttribute("overflow", "visible");
  centerInlineSvg(svg);
  return { latex, svg: svg.outerHTML };
}

function waitForMathJax() {
  if (!mathJaxReady) {
    mathJaxReady = pollForMathJax();
  }
  return mathJaxReady;
}

async function pollForMathJax() {
  while (true) {
    const mathJax = (window as MathJaxWindow).MathJax;
    if (isReadyMathJax(mathJax)) {
      await mathJax.startup?.promise;
      return mathJax;
    }
    await delay(50);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isReadyMathJax(mathJax: MathJaxWindow["MathJax"]): mathJax is ReadyMathJax {
  return typeof mathJax?.tex2svgPromise === "function";
}

function centerInlineSvg(svg: SVGSVGElement) {
  const width = svg.getAttribute("width");
  const height = svg.getAttribute("height");
  const x = halfLength(width);
  const y = halfLength(height);
  if (x) svg.setAttribute("x", `-${x}`);
  if (y) svg.setAttribute("y", `-${y}`);
}

function halfLength(value: string | null) {
  if (!value) return undefined;
  const match = value.trim().match(/^([0-9.]+)([a-z%]*)$/i);
  if (!match) return undefined;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return undefined;
  return `${amount / 2}${match[2]}`;
}
