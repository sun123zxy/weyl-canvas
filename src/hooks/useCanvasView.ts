import { useCallback, useEffect, useRef, useState } from "react";
import type { WheelEvent as ReactWheelEvent } from "react";
import { clamp } from "../utils";
import type { Vec2, View } from "../types";

const minZoom = 0.35;
const maxZoom = 5;

export function useCanvasView() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 960, height: 720 });
  const [view, setView] = useState<View>({ tx: 480, ty: 360, zoom: 1 });
  const pendingView = useRef<View | null>(null);
  const viewFrame = useRef<number | null>(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const resize = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
      setView((current) => (
        current.tx === 480 && current.ty === 360
          ? { ...current, tx: rect.width / 2, ty: rect.height / 2 }
          : current
      ));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (viewFrame.current !== null) {
        cancelAnimationFrame(viewFrame.current);
      }
    };
  }, []);

  const scheduleView = useCallback((next: View) => {
    pendingView.current = next;
    if (viewFrame.current !== null) return;
    viewFrame.current = requestAnimationFrame(() => {
      viewFrame.current = null;
      if (!pendingView.current) return;
      setView(pendingView.current);
      pendingView.current = null;
    });
  }, []);

  const resetView = useCallback(() => {
    setView({ tx: size.width / 2, ty: size.height / 2, zoom: 1 });
  }, [size.height, size.width]);

  const zoomBy = useCallback((factor: number) => {
    setView((current) => ({ ...current, zoom: clamp(current.zoom * factor, minZoom, maxZoom) }));
  }, []);

  const screenPoint = useCallback((event: ReactWheelEvent): Vec2 => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const onWheel = useCallback((event: ReactWheelEvent) => {
    event.preventDefault();
    const point = screenPoint(event);
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    setView((current) => {
      const nextZoom = clamp(current.zoom * factor, minZoom, maxZoom);
      const worldX = (point.x - current.tx) / current.zoom;
      const worldY = (point.y - current.ty) / current.zoom;
      return {
        zoom: nextZoom,
        tx: point.x - worldX * nextZoom,
        ty: point.y - worldY * nextZoom,
      };
    });
  }, [screenPoint]);

  return {
    canvasRef,
    svgRef,
    size,
    view,
    scheduleView,
    resetView,
    zoomIn: () => zoomBy(1.12),
    zoomOut: () => zoomBy(1 / 1.12),
    onWheel,
  };
}
