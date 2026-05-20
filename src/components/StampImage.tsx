import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import StampBorder from './StampBorder';

interface Props {
  uri: string;
  size: number;
  frameColor?: string;
}

/**
 * Renders a square image with a perforated stamp border overlaid on top.
 * The border uses even-odd fill to cut out the stamp shape, revealing the image.
 */
export default function StampImage({ uri, size, frameColor = '#ffffff' }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      <View style={StyleSheet.absoluteFill}>
        <StampBorder size={size} frameColor={frameColor} />
      </View>
    </View>
  );
}
