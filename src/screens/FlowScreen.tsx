import React, { useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { getStamps } from '../db/database';
import { Stamp } from '../types';
import StampImage from '../components/StampImage';
import { Colors, Typography } from '../theme';
import { useState } from 'react';

type Nav = StackNavigationProp<RootStackParamList>;

const SW        = Dimensions.get('window').width;
const STAMP_SZ  = SW * 0.42;   // stamps are ~42% of screen width
const ROW_H     = STAMP_SZ * 0.68; // vertical step between stamps (overlap)

/**
 * Seeded pseudo-random value in [0, 1) based on a numeric seed.
 * Using sin() so the value is deterministic per stamp id.
 */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Computes a stable layout for one stamp:
 *  - horizontal offset: random within the scrollable area
 *  - rotation: –15° to +15°
 */
function stampLayout(stamp: Stamp): { left: number; rotation: number } {
  const maxLeft = SW - STAMP_SZ - 16;
  return {
    left:     16 + seeded(stamp.id) * maxLeft,
    rotation: seeded(stamp.id * 7 + 3) * 30 - 15,
  };
}

export default function FlowScreen() {
  const navigation = useNavigation<Nav>();
  const [stamps, setStamps] = useState<Stamp[]>([]);

  // Stamps are ordered newest-first; reversed here so oldest is at the bottom
  // (chronological pile: latest stamps land on top)
  useFocusEffect(useCallback(() => {
    setStamps(getStamps()); // getStamps already returns DESC by date
  }, []));

  // Total scroll height – each stamp gets ROW_H vertical space plus a bottom pad
  const totalHeight = stamps.length * ROW_H + STAMP_SZ + 80;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flow</Text>

      {stamps.length === 0 && (
        <Text style={styles.empty}>Your stamps will flow here once you create some!</Text>
      )}

      <ScrollView
        contentContainerStyle={{ height: totalHeight }}
        showsVerticalScrollIndicator={false}
      >
        {/* Render stamps in reverse (oldest at bottom, newest on top visually) */}
        {[...stamps].reverse().map((stamp, i) => {
          const { left, rotation } = stampLayout(stamp);
          const top = i * ROW_H + 60; // 60px top padding

          return (
            <TouchableOpacity
              key={stamp.id}
              style={[styles.stamp, { top, left }]}
              onPress={() => navigation.navigate('StampDetail', { stampId: stamp.id })}
              activeOpacity={0.85}
            >
              <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
                <StampImage uri={stamp.imageUri} size={STAMP_SZ} frameColor={Colors.vanilla} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  title: {
    ...Typography.title,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4,
  },
  empty: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 80, paddingHorizontal: 32,
  },
  stamp: {
    position: 'absolute',
    // Soft shadow so overlapping stamps look layered
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
});
