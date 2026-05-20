import React, { forwardRef } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Image as SvgImage, ClipPath, Defs } from 'react-native-svg';
import { buildShapePath } from './StampBorder';
import { StampFilter, StampShape } from '../types';

interface Props {
  uri:          string;
  size:         number;
  /** Colour of the perforated outline stroke. Defaults to white. */
  frameColor?:  string;
  filter?:      StampFilter;
  shape?:       StampShape;
  style?:       ViewStyle;
}

/**
 * Renders a stamp with:
 *  • Photo clipped to the stamp shape (SVG ClipPath) — no white rectangle leaks
 *  • Perforated outline drawn on top as a stroke
 *  • Optional B&W / fade CSS filter applied at the View level (RN 0.74+)
 *
 * The forwardRef lets parent components capture this view with
 * react-native-view-shot for sharing / exporting.
 */
const StampImage = forwardRef<View, Props>(function StampImage(
  { uri, size, frameColor = '#ffffff', filter = 'original', shape = 'square', style },
  ref,
) {
  // Build the same perforated path used by the camera viewfinder
  const m = size * 0.10;
  const r = Math.max(4, size * 0.055);
  const stampPath = buildShapePath(shape, m, m, size - m, size - m, r);

  // Map our filter names to CSS filter strings (applied to the outer View)
  const filterStyle = (() => {
    switch (filter) {
      case 'bw':   return 'grayscale(1)';
      case 'fade': return 'brightness(1.15) contrast(0.65) saturate(0.35)';
      default:     return undefined;
    }
  })();

  return (
    <View
      ref={ref}
      style={[
        { width: size, height: size },
        style,
        // @ts-ignore – RN 0.74+ supports the CSS filter property
        filterStyle ? { filter: filterStyle } : null,
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          {/* The ClipPath is scoped to this SVG — id collision is not an issue */}
          <ClipPath id="stampClip">
            <Path d={stampPath} />
          </ClipPath>
        </Defs>

        {/* Photo clipped to the exact stamp shape (perforations punch through) */}
        <SvgImage
          href={{ uri }}
          x={0} y={0}
          width={size} height={size}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#stampClip)"
        />

        {/* Perforated outline — drawn as a stroke so it sits on top */}
        <Path d={stampPath} fill="none" stroke={frameColor} strokeWidth={2.5} />
      </Svg>
    </View>
  );
});

export default StampImage;
