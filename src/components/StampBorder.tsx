import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size: number;
  frameColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  /** Distance from SVG edge to the perforation center line */
  margin?: number;
  /** Radius of each perforation semicircle */
  perfRadius?: number;
}

/**
 * Builds the perforated stamp path. The arcs bulge OUTWARD from the rectangular
 * inner area, creating the classic postage-stamp scalloped edge.
 *
 * Sweep directions (SVG y-down coordinate system, path goes clockwise):
 *   Top  (L→R): outward = up    → sweep 0 (CCW arc)
 *   Right(T→B): outward = right → sweep 1 (CW arc)
 *   Bottom(R→L): outward = down → sweep 1 (CW arc)
 *   Left (B→T): outward = left  → sweep 0 (CCW arc)
 */
function buildStampPath(
  x0: number, y0: number,
  x1: number, y1: number,
  r: number,
): string {
  const W = x1 - x0;
  const H = y1 - y0;

  // Number of perforations per edge (spacing ≈ 3× diameter)
  const numH = Math.max(3, Math.round(W / (r * 3.2)));
  const numV = Math.max(3, Math.round(H / (r * 3.2)));

  const hStep = W / numH;
  const vStep = H / numV;

  // Centers along each edge (skip the two corner slots)
  const hPos = Array.from({ length: numH - 1 }, (_, i) => x0 + hStep * (i + 1));
  const vPos = Array.from({ length: numV - 1 }, (_, i) => y0 + vStep * (i + 1));

  let d = `M ${x0} ${y0}`;

  // Top edge left→right, bumps UP (outward), sweep=0
  for (const cx of hPos) {
    d += ` L ${cx - r} ${y0} A ${r} ${r} 0 0 0 ${cx + r} ${y0}`;
  }
  d += ` L ${x1} ${y0}`;

  // Right edge top→bottom, bumps RIGHT (outward), sweep=1
  for (const cy of vPos) {
    d += ` L ${x1} ${cy - r} A ${r} ${r} 0 0 1 ${x1} ${cy + r}`;
  }
  d += ` L ${x1} ${y1}`;

  // Bottom edge right→left, bumps DOWN (outward), sweep=1
  for (const cx of [...hPos].reverse()) {
    d += ` L ${cx + r} ${y1} A ${r} ${r} 0 0 1 ${cx - r} ${y1}`;
  }
  d += ` L ${x0} ${y1}`;

  // Left edge bottom→top, bumps LEFT (outward), sweep=0
  for (const cy of [...vPos].reverse()) {
    d += ` L ${x0} ${cy + r} A ${r} ${r} 0 0 0 ${x0} ${cy - r}`;
  }

  d += ' Z';
  return d;
}

/**
 * Two modes:
 *
 * Frame mode (default): renders a filled frame around an image.
 *   Place this as an absolute-fill child of a View that also contains the image.
 *   The even-odd cut-out reveals the image through the perforated opening.
 *
 * Stroke mode (strokeColor provided): renders just the perforated border outline.
 *   Used as the camera viewfinder overlay.
 */
export default function StampBorder({
  size,
  frameColor = '#ffffff',
  strokeColor,
  strokeWidth = 2,
  margin,
  perfRadius,
}: Props) {
  const m = margin ?? size * 0.1;
  const r = perfRadius ?? Math.max(4, size * 0.055);

  const stampPath = buildStampPath(m, m, size - m, size - m, r);
  const outerRect = `M 0 0 H ${size} V ${size} H 0 Z`;

  if (strokeColor) {
    return (
      <Svg width={size} height={size}>
        <Path d={stampPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size}>
      {/* even-odd: outer rect filled, stamp-path area transparent → reveals image */}
      <Path d={`${outerRect} ${stampPath}`} fill={frameColor} fillRule="evenodd" />
    </Svg>
  );
}

export { buildStampPath };
