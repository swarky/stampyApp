import React, { useRef, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  Dimensions, Animated, PanResponder,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImageManipulator from 'expo-image-manipulator';
import { RootStackParamList } from '../navigation';
import { buildShapePath } from '../components/StampBorder';
import { Colors, Radii } from '../theme';
import { StampFilter, StampShape } from '../types';

// ─── Screen dimensions ────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');

// ─── Filters ─────────────────────────────────────────────────────────────────
const FILTERS: StampFilter[]               = ['original', 'bw', 'fade'];
const FILTER_ICONS: Record<StampFilter, string> = {
  original: '🌈',
  bw:       '◑',
  fade:     '☁️',
};
const FILTER_LABELS: Record<StampFilter, string> = {
  original: 'Original',
  bw:       'B&W',
  fade:     'Fade',
};

// ─── Formats (shape + orientation) ───────────────────────────────────────────
// Each entry describes what the user sees and what crop to apply.
type FormatEntry = {
  shape:   StampShape;
  label:   string;
  icon:    string;
  w:       number;  // stamp outline width
  h:       number;  // stamp outline height
};

const FORMATS: FormatEntry[] = [
  { shape: 'square',    label: 'Square',    icon: '⬛', w: SW * 0.72, h: SW * 0.72 },
  { shape: 'landscape', label: 'Landscape', icon: '▬',  w: SW * 0.82, h: SW * 0.52 },
  { shape: 'portrait',  label: 'Portrait',  icon: '▮',  w: SW * 0.55, h: SW * 0.78 },
  { shape: 'diamond',   label: 'Diamond',   icon: '◇',  w: SW * 0.72, h: SW * 0.72 },
  { shape: 'triangle',  label: 'Triangle',  icon: '△',  w: SW * 0.72, h: SW * 0.72 },
];

const STAMP_TOP  = 110;  // vertical offset from screen top to stamp outline
const PERF_R     = 9;    // perforation radius for viewfinder outline
const SWIPE_DIST = 40;   // minimum horizontal swipe to change filter

type Nav = StackNavigationProp<RootStackParamList, 'Tabs'>;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef   = useRef<CameraView>(null);
  const navigation  = useNavigation<Nav>();

  const [shooting,     setShooting]     = useState(false);
  const [formatIndex,  setFormatIndex]  = useState(0);
  const [filterIndex,  setFilterIndex]  = useState(0);
  const shutterAnim = useRef(new Animated.Value(1)).current;

  const format = FORMATS[formatIndex];
  const filter = FILTERS[filterIndex];

  // SVG coordinates of the stamp outline
  const stampX = (SW - format.w) / 2;
  const stampY = STAMP_TOP;
  const stampPath  = buildShapePath(format.shape, stampX, stampY, stampX + format.w, stampY + format.h, PERF_R);
  const fullScreen = `M 0 0 H ${SW} V ${SH} H 0 Z`;

  // ── Swipe gesture to change filter ────────────────────────────────────────
  // Attaching to the camera overlay so the whole screen is swipeable.
  const swipeStart = useRef(0);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dx) > 8,
    onPanResponderGrant: (_, g) => { swipeStart.current = g.x0; },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -SWIPE_DIST) {
        // Swipe left → next filter
        setFilterIndex(i => (i + 1) % FILTERS.length);
      } else if (g.dx > SWIPE_DIST) {
        // Swipe right → previous filter
        setFilterIndex(i => (i - 1 + FILTERS.length) % FILTERS.length);
      }
    },
  })).current;

  // ── Shutter feedback animation ────────────────────────────────────────────
  function animateShutter() {
    Animated.sequence([
      Animated.timing(shutterAnim, { toValue: 0.82, duration: 80,  useNativeDriver: true }),
      Animated.timing(shutterAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
  }

  // ── Take picture ──────────────────────────────────────────────────────────
  async function takePicture() {
    if (!cameraRef.current || shooting) return;
    setShooting(true);
    animateShutter();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo) return;

      // Scale screen stamp coordinates to actual photo pixels
      const scaleX = photo.width  / SW;
      const scaleY = photo.height / SH;

      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{
          crop: {
            originX: stampX        * scaleX,
            originY: stampY        * scaleY,
            width:   format.w      * scaleX,
            height:  format.h      * scaleY,
          },
        }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );

      navigation.navigate('SaveStamp', {
        imageUri: cropped.uri,
        filter,
        shape: format.shape,
      });
    } finally {
      setShooting(false);
    }
  }

  // ── Permission gate ───────────────────────────────────────────────────────
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

  // ── Camera UI ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* SVG overlay: dark mask outside the stamp shape + perforated outline */}
      <Svg
        style={StyleSheet.absoluteFill}
        width={SW} height={SH}
        {...panResponder.panHandlers}
      >
        <Path
          d={`${fullScreen} ${stampPath}`}
          fill={Colors.overlay}
          fillRule="evenodd"
        />
        <Path d={stampPath} fill="none" stroke="white" strokeWidth={2.5} />
      </Svg>

      {/* ── Filter selector (above controls) ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f, i) => {
          const active = i === filterIndex;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterItem, active && styles.filterItemActive]}
              onPress={() => setFilterIndex(i)}
            >
              <Text style={[styles.filterIcon, active && styles.filterIconActive]}>
                {FILTER_ICONS[f]}
              </Text>
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Bottom controls: format button + shutter ── */}
      <View style={styles.controls}>
        {/* Format cycle button */}
        <TouchableOpacity
          style={styles.formatBtn}
          onPress={() => setFormatIndex(i => (i + 1) % FORMATS.length)}
        >
          <Text style={styles.formatIcon}>{format.icon}</Text>
          <Text style={styles.formatLabel}>{format.label}</Text>
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

        {/* Spacer to keep shutter visually centred */}
        <View style={styles.formatBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.cream },
  permText:  { fontSize: 16, textAlign: 'center', marginBottom: 16, color: Colors.ink },

  // Filter row
  filterRow: {
    position: 'absolute', bottom: 140,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  filterItem: {
    alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  filterItemActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  filterIcon:        { fontSize: 18 },
  filterIconActive:  { fontSize: 22 },
  filterLabel:       { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterLabelActive: { color: '#fff', fontWeight: '700' },

  // Bottom controls
  controls: {
    position: 'absolute', bottom: 48,
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  formatBtn: {
    width: 62, height: 62,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  formatIcon:  { fontSize: 20 },
  formatLabel: { fontSize: 9, color: '#fff', marginTop: 2 },
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
