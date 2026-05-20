import React, { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { getStamps, getFavouriteIds } from '../db/database';
import { Stamp } from '../types';
import StampImage from '../components/StampImage';
import { Colors, Typography } from '../theme';

type Nav = StackNavigationProp<RootStackParamList>;

const SW        = Dimensions.get('window').width;
const STAMP_SZ  = SW * 0.42;
const ROW_H     = STAMP_SZ * 0.68;

/**
 * Seeded pseudo-random value in [0, 1) based on a numeric seed.
 */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Stable layout for one stamp: horizontal offset + rotation.
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
  const [stamps,  setStamps]  = useState<Stamp[]>([]);
  const [favIds,  setFavIds]  = useState<Set<number>>(new Set());

  useFocusEffect(useCallback(() => {
    const all  = getStamps(); // DESC by date
    const favs = getFavouriteIds();
    setStamps(all);
    setFavIds(favs);
  }, []));

  // ── Layout order ──────────────────────────────────────────────────────────
  // Favourites float to the top of the pile (rendered last = highest z-index).
  // Within each group the chronological DESC order is preserved.
  // We reverse() because we render bottom-to-top with ascending `top`.
  const nonFavs   = [...stamps].reverse().filter(s => !favIds.has(s.id));
  const favStamps = [...stamps].reverse().filter(s =>  favIds.has(s.id));
  const ordered   = [...nonFavs, ...favStamps]; // favourites land on top

  const favCount = favStamps.length;
  const totalHeight = ordered.length * ROW_H + STAMP_SZ + 80;

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
        {ordered.map((stamp, i) => {
          const { left, rotation } = stampLayout(stamp);
          const top = i * ROW_H + 60;
          const isFav = favIds.has(stamp.id);

          return (
            <TouchableOpacity
              key={stamp.id}
              style={[styles.stamp, { top, left }]}
              onPress={() => navigation.navigate('StampDetail', { stampId: stamp.id })}
              activeOpacity={0.85}
            >
              <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
                <StampImage
                  uri={stamp.imageUri}
                  size={STAMP_SZ}
                  frameColor={isFav ? Colors.vanilla : '#ffffff'}
                  filter={stamp.filter}
                  shape={stamp.shape}
                />
              </View>
              {/* Subtle ★ badge for favourites */}
              {isFav && (
                <View style={styles.favBadge}>
                  <Text style={styles.favIcon}>★</Text>
                </View>
              )}
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
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  favBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderRadius: 12,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  favIcon: { fontSize: 13, color: '#FFDD55' },
});
