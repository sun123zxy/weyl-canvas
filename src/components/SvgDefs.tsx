export function SvgDefs() {
  return (
    <defs data-export-hidden="true">
      <pattern id="editorCheckerboard" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="var(--checkerboard-base)" />
        <rect width="10" height="10" fill="var(--checkerboard-tile)" />
        <rect x="10" y="10" width="10" height="10" fill="var(--checkerboard-tile)" />
      </pattern>
      <filter id="alcoveHoverInnerGlow" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="erode" radius="1" result="eroded" />
        <feComposite in="SourceAlpha" in2="eroded" operator="out" result="innerEdge" />
        <feGaussianBlur in="innerEdge" stdDeviation="0.9" result="softEdge" />
        <feFlood floodColor="#2f6db3" floodOpacity="0.32" result="color" />
        <feComposite in="color" in2="softEdge" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="glow" />
        </feMerge>
      </filter>
      <filter id="alcoveSelectedInnerGlow" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="erode" radius="1.25" result="eroded" />
        <feComposite in="SourceAlpha" in2="eroded" operator="out" result="innerEdge" />
        <feGaussianBlur in="innerEdge" stdDeviation="1.1" result="softEdge" />
        <feFlood floodColor="#1f5faa" floodOpacity="0.42" result="color" />
        <feComposite in="color" in2="softEdge" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="glow" />
        </feMerge>
      </filter>
      <filter id="lineHoverGlow" x="-10000" y="-10000" width="20000" height="20000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="0.33" result="thickAlpha" />
        <feGaussianBlur in="thickAlpha" stdDeviation="0.85" result="blur" />
        <feFlood floodColor="#2f6db3" floodOpacity="0.32" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="lineSelectedGlow" x="-10000" y="-10000" width="20000" height="20000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="thickAlpha" />
        <feGaussianBlur in="thickAlpha" stdDeviation="1.1" result="blur" />
        <feFlood floodColor="#1f5faa" floodOpacity="0.42" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="pointHoverGlow" x="-10000" y="-10000" width="20000" height="20000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="0.8" result="thickAlpha" />
        <feGaussianBlur in="thickAlpha" stdDeviation="1.2" result="blur" />
        <feFlood floodColor="#2f6db3" floodOpacity="0.32" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="pointSelectedGlow" x="-10000" y="-10000" width="20000" height="20000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="thickAlpha" />
        <feGaussianBlur in="thickAlpha" stdDeviation="1.8" result="blur" />
        <feFlood floodColor="#1f5faa" floodOpacity="0.42" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
