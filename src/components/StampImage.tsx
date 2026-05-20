import React, { forwardRef } from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import StampBorder from './StampBorder';
import { StampFilter, StampShape } from '../types';

interface Props {
  uri:         string;
  size:        number;
  frameColor?: string;
  filter?:     StampFilter;
  shape?:      StampShape;
  style?:      ViewStyle;
}

/**
 * Renders a stamp image with:
 *   • The correct perforated border for its shape
 *   • A CSS filter applied (B&W or fade) using React Native's filter style
 *     property (available in RN 0.74+)
 *
 * The `forwardRef` allows parent components to capture this view with
 * react-native-view-shot for sharing/exporting.
 */
const StampImage = forwardRef<View, Props>(function StampImage(
  { uri, size, frameColor = '#ffffff', filter = 'original', shape = 'square', style },
  ref,
) {
  // Map our filter names to CSS filter strings
  const filterStyle = (() => {
    switch (filter) {
      case 'bw':   return 'grayscale(1)';
      case 'fade': return 'brightness(1.15) contrast(0.65) saturate(0.35)';
      default:     return undefined;
    }
  })();

  return (
    <View ref={ref} style={[{ width: size, height: size }, style]}>
      <Image
        source={{ uri }}
        style={[
          { width: size, height: size },
          // @ts-ignore – RN 0.74+ supports the CSS filter property
          filterStyle ? { filter: filterStyle } : null,
        ]}
        resizeMode="cover"
      />
      {/* Perforated frame overlay — covers everything outside the stamp shape */}
      <View style={StyleSheet.absoluteFill}>
        <StampBorder size={size} shape={shape} frameColor={frameColor} />
      </View>
    </View>
  );
});

export default StampImage;
