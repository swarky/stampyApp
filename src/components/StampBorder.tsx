import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { StampShape } from '../types';

// ─── General polygon perforated path ─────────────────────────────────────────
/**
 * Builds a perforated SVG path for any convex polygon given as a CW-ordered
 * list of vertices (SVG y-down coordinate system).
 *
 * Key insight: for a CW polygon in SVG y-down, ALL outward-bulging semicircle
 * arcs use sweep-flag = 1 (clockwise arc direction). This was verified
 * analytically for each edge direction by computing the signed triangle area
 * of (arcStart, peak, arcEnd) — it is always positive (CW) for outward arcs
 * on a CW polygon.
 *
 * Outward normal formula for CW polygon: (nx, ny) = (uy, -ux)
 * where (ux, uy) is the unit direction of the edge.
 */
function buildPolygonPerforatedPath(
  vertices: [number, number][],
  r: number,
): string {
  let d = '';

  for (let i = 0; i < vertices.length; i++) {
    const [ax, ay] = vertices[i];
    const [bx, by] = vertices[(i + 1) % vertices.length];

    // Edge direction (unit vector)
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;

    // Outward normal for CW polygon in SVG y-down
    const nx = uy, ny = -ux;

    // How many perforations fit along this edge (skip the two corner positions)
    const count = Math.max(2, Math.round(len / (r * 3.2)));
    const step  = len / count;

    // Start path / continue from previous vertex
    if (i === 0) d += `M ${ax.toFixed(2)} ${ay.toFixed(2)}`;

    for (let j = 1; j < count; j++) {
      const t  = step * j;
      const px = ax + ux * t, py = ay + uy * t; // perforation centre on edge

      // Arc endpoints (r away from centre, along the edge)
      const sx = px - ux * r, sy = py - uy * r; // arc start
      const ex = px + ux * r, ey = py + uy * r; // arc end

      // Line to arc start, then outward-bulging semicircle (sweep=1, CW)
      d += ` L ${sx.toFixed(2)} ${sy.toFixed(2)}`;
      d += ` A ${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
    }

    // Line to the next vertex
    d += ` L ${bx.toFixed(2)} ${by.toFixed(2)}`;
  }

  return d + ' Z';
}

// ─── Shape-specific builders ──────────────────────────────────────────────────

/** Axis-aligned rectangle (used for square, landscape, portrait stamps). */
export function buildStampPath(
  x0: number, y0: number,
  x1: number, y1: number,
  r: number,
): string {
  // CW vertex order: TL → TR → BR → BL
  return buildPolygonPerforatedPath(
    [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
    r,
  );
}

/** Diamond — the midpoints of the bounding rectangle's four edges. */
function buildDiamondPath(
  x0: number, y0: number,
  x1: number, y1: number,
  r: number,
): string {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  // CW: Top → Right → Bottom → Left
  return buildPolygonPerforatedPath(
    [[cx, y0], [x1, cy], [cx, y1], [x0, cy]],
    r,
  );
}

/**
 * Equilateral-ish triangle pointing upward, centred in the bounding box.
 * The centroid is placed at the visual centre of the box.
 */
function buildTrianglePath(
  x0: number, y0: number,
  x1: number, y1: number,
  r: number,
): string {
  const pad = r * 2.5;
  const W   = x1 - x0 - 2 * pad;
  const H   = y1 - y0 - 2 * pad;

  // Largest equilateral triangle that fits in the padded area
  const side  = Math.min(W, (H * 2) / Math.sqrt(3));
  const triH  = side * Math.sqrt(3) / 2;
  const cx    = (x0 + x1) / 2;
  const cy    = (y0 + y1) / 2;

  // Centroid divides height 2:1 from top vertex
  const top:  [number, number] = [cx,             cy - (triH * 2) / 3];
  const botR: [number, number] = [cx + side / 2,  cy + triH / 3      ];
  const botL: [number, number] = [cx - side / 2,  cy + triH / 3      ];

  // CW order in SVG y-down: Top → BotRight → BotLeft
  return buildPolygonPerforatedPath([top, botR, botL], r);
}

// ─── Public path dispatcher ───────────────────────────────────────────────────
export function buildShapePath(
  shape: StampShape,
  x0: number, y0: number,
  x1: number, y1: number,
  r: number,
): string {
  switch (shape) {
    case 'diamond':  return buildDiamondPath(x0, y0, x1, y1, r);
    case 'triangle': return buildTrianglePath(x0, y0, x1, y1, r);
    default:         return buildStampPath(x0, y0, x1, y1, r);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  size:         number;
  shape?:       StampShape;
  frameColor?:  string;
  /** Stroke-only mode: renders just the outline (used by camera viewfinder). */
  strokeColor?: string;
  strokeWidth?: number;
  margin?:      number;
  perfRadius?:  number;
}

/**
 * Frame mode (default):
 *   Overlay on top of an image. The even-odd rule cuts the stamp shape out of
 *   the filled frame, revealing the image through the perforated opening.
 *
 * Stroke mode (strokeColor provided):
 *   Just the perforated outline — used as the camera viewfinder guide.
 */
export default function StampBorder({
  size,
  shape       = 'square',
  frameColor  = '#ffffff',
  strokeColor,
  strokeWidth = 2,
  margin,
  perfRadius,
}: Props) {
  const m = margin    ?? size * 0.10;
  const r = perfRadius ?? Math.max(4, size * 0.055);

  const stampPath  = buildShapePath(shape, m, m, size - m, size - m, r);
  const outerRect  = `M 0 0 H ${size} V ${size} H 0 Z`;

  if (strokeColor) {
    return (
      <Svg width={size} height={size}>
        <Path d={stampPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size}>
      <Path
        d={`${outerRect} ${stampPath}`}
        fill={frameColor}
        fillRule="evenodd"
      />
    </Svg>
  );
}
