import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { getStampsByCategory } from '../db/database';
import { Stamp } from '../types';
import StampImage from '../components/StampImage';
import { Colors, Typography } from '../theme';

type Route = RouteProp<RootStackParamList, 'CategoryDetail'>;
type Nav   = StackNavigationProp<RootStackParamList>;

const THUMB_SIZE = Math.floor((Dimensions.get('window').width - 32) / 3);

// ─── Stamps filtered by category ──────────────────────────────────────────────
// Accessed by tapping a category row in the Library → Category view.
export default function CategoryDetailScreen() {
  const route      = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { categoryId } = route.params;

  const [stamps, setStamps] = useState<Stamp[]>([]);

  useEffect(() => {
    setStamps(getStampsByCategory(categoryId));
  }, [categoryId]);

  return (
    <View style={styles.container}>
      <FlatList
        data={stamps}
        keyExtractor={s => String(s.id)}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <Text style={styles.empty}>No stamps in this category yet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cell}
            onPress={() => navigation.navigate('StampDetail', { stampId: item.id })}
          >
            <StampImage uri={item.imageUri} size={THUMB_SIZE} />
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  grid:      { padding: 8 },
  cell:      { width: THUMB_SIZE, margin: 4, alignItems: 'center' },
  name:      { ...Typography.small, marginTop: 4, textAlign: 'center' },
  empty:     { textAlign: 'center', marginTop: 60, ...Typography.body, color: Colors.muted },
});
