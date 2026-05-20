import React, { useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  Dimensions, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImageManipulator from 'expo-image-manipulator';
import { RootStackParamList } from '../navigation';
import { buildStampPath } from '../components/StampBorder';
import { Colors, Radii } from '../theme';

// ─── Screen dimensions ────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');

// ─── Stamp outline formats ────────────────────────────────────────────────────
// Three formats the user can cycle through with the format button.
type Format = 'square' | 'landscape' | 'portrait';
const FORMATS: Format[] = ['square', 'landscape', 'portrait'];
const FORMAT_LABELS: Record<Format, string> = {
  square:    '⬛',
  landscape: '▬',
  portrait:  '▮',
};
const FORMAT_DIMS: Record<Format, { w: number; h: number }> = {
  square:    { w: SW * 0.72, h: SW * 0.72 },
  landscape: { w: SW * 0.82, h: SW * 0.52 },
  portrait:  { w: SW * 0.55, h: SW * 0.78 },
};

// Vertical offset from the top of the screen to the stamp outline
const STAMP_TOP = 110;

// Perforation radius for the viewfinder outline
const PERF_R = 9;

type Nav = StackNavigationProp<RootStackParamList, 'Tabs'>;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef  = useRef<CameraView>(null);
  const navigation = useNavigation<Nav>();

  const [shooting,      setShooting]      = useState(false);
  const [formatIndex,   setFormatIndex]   = useState(0);     // current format
  const shutterAnim = useRef(new Animated.Value(1)).current;  // for shutter feedback

  const format = FORMATS[formatIndex];
  const { w: stampW, h: stampH } = FORMAT_DIMS[format];
  const stampX = (SW - stampW) / 2;
  const stampY = STAMP_TOP;

  // Rebuild the SVG paths whenever the format changes
  const stampPath  = buildStampPath(stampX, stampY, stampX + stampW, stampY + stampH, PERF_R);
  const fullScreen = `M 0 0 H ${SW} V ${SH} H 0 Z`;

  // Cycle through the three available formats
  function cycleFormat() {
    setFormatIndex(i => (i + 1) % FORMATS.length);
  }

  // Animate the shutter button on press for tactile feedback
  function animateShutter() {
    Animated.sequence([
      Animated.timing(shutterAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
  }

  async function takePicture() {
    if (!cameraRef.current || shooting) return;
    setShooting(true);
    animateShutter();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo) return;

      // Scale from screen coordinates to actual photo pixels
      const scaleX = photo.width  / SW;
      const scaleY = photo.height / SH;

      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{
          crop: {
            originX: stampX * scaleX,
            originY: stampY * scaleY,
            width:   stampW * scaleX,
            height:  stampH * scaleY,
          },
        }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );

      navigation.navigate('SaveStamp', { imageUri: cropped.uri });
    } finally {
      setShooting(false);
    }
  }

  // ── Permission gate ─────────────────────────────────────────────────────────
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to create stamps.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Camera UI ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Single SVG: dark mask outside stamp + perforated outline */}
      <Svg style={StyleSheet.absoluteFill} width={SW} height={SH}>
        <Path
          d={`${fullScreen} ${stampPath}`}
          fill={Colors.overlay}
          fillRule="evenodd"
        />
        <Path d={stampPath} fill="none" stroke="white" strokeWidth={2.5} />
      </Svg>

      {/* Bottom controls: format button (left) + shutter button (center) */}
      <View style={styles.controls}>
        {/* Format cycle button – smaller, sits left of the shutter */}
        <TouchableOpacity style={styles.formatBtn} onPress={cycleFormat}>
          <Text style={styles.formatLabel}>{FORMAT_LABELS[format]}</Text>
          <Text style={styles.formatText}>{format}</Text>
        </TouchableOpacity>

        {/* Shutter button */}
        <Animated.View style={{ transform: [{ scale: shutterAnim }] }}>
          <TouchableOpacity
            style={[styles.shootBtn, shooting && styles.shootBtnDisabled]}
            onPress={takePicture}
            disabled={shooting}
          >
            <View style={styles.shootInner} />
          </TouchableOpacity>
        </Animated.View>

        {/* Placeholder spacer to keep shutter visually centered */}
        <View style={styles.formatBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.cream },
  permText:  { fontSize: 16, textAlign: 'center', marginBottom: 16, color: Colors.ink },
  controls: {
    position: 'absolute', bottom: 48,
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  formatBtn: {
    width: 60, height: 60,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  formatLabel: { fontSize: 18 },
  formatText:  { fontSize: 9, color: '#fff', marginTop: 2, textTransform: 'capitalize' },
  shootBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  shootBtnDisabled: { opacity: 0.5 },
  shootInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#fff',
    borderWidth: 3, borderColor: Colors.border,
  },
  btn:     { backgroundColor: Colors.moonstone, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radii.md },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
