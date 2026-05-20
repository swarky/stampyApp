import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { getStamps, setCalendarEntry } from '../db/database';
import { Stamp } from '../types';
import StampImage from '../components/StampImage';
import { Colors, Radii, Shadows, Typography } from '../theme';

type Route = RouteProp<RootStackParamList, 'StampPicker'>;
type Nav   = StackNavigationProp<RootStackParamList, 'StampPicker'>;

const THUMB_SIZE = Math.floor((Dimensions.get('window').width - 32) / 3);

/**
 * Full-screen stamp picker used when the user taps an empty calendar day.
 * Tapping a stamp selects it (shows an outline highlight + checkmark in header).
 * Confirming places the stamp on the target date and returns to Calendar.
 */
export default function StampPickerScreen() {
  const route      = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { forDate } = route.params;

  const [stamps,   setStamps]   = useState<Stamp[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setStamps(getStamps());

    // Add a confirm (✓) button to the header once a stamp is selected
    navigation.setOptions({
      headerRight: () => selected != null ? (
        <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
          <Text style={styles.confirmText}>✓</Text>
        </TouchableOpacity>
      ) : null,
    });
  }, [selected]);

  function confirm() {
    if (selected == null) return;
    setCalendarEntry(forDate, selected);
    // Go all the way back to the Calendar tab
    navigation.navigate('Tabs');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Select a stamp for {forDate}</Text>

      <FlatList
        data={stamps}
        keyExtractor={s => String(s.id)}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <Text style={styles.empty}>No stamps yet — create one first!</Text>
        }
        renderItem={({ item }) => {
          const isSelected = item.id === selected;
          return (
            <TouchableOpacity
              style={[styles.cell, isSelected && styles.cellSelected]}
              onPress={() => setSelected(item.id)}
            >
              <StampImage
                uri={item.imageUri}
                size={THUMB_SIZE}
                frameColor={isSelected ? Colors.moonstone : '#ffffff'}
              />
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Confirm button at the bottom (also available in header) */}
      {selected != null && (
        <TouchableOpacity style={styles.bottomConfirm} onPress={confirm}>
          <Text style={styles.bottomConfirmText}>Place on {forDate}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  subtitle:  { ...Typography.label, textAlign: 'center', paddingTop: 12, paddingBottom: 4 },
  grid:      { padding: 8, paddingBottom: 100 },
  cell:      { width: THUMB_SIZE, margin: 4, alignItems: 'center' },
  cellSelected: {
    backgroundColor: Colors.vanilla,
    borderRadius: Radii.md,
    ...Shadows.card,
  },
  checkmark: {
    position: 'absolute', top: 4, right: 4,
    color: Colors.moonstone, fontWeight: '700', fontSize: 16,
  },
  name:          { ...Typography.small, marginTop: 4, textAlign: 'center' },
  empty:         { textAlign: 'center', marginTop: 60, ...Typography.body, color: Colors.muted },
  confirmBtn:    { marginRight: 12, padding: 4 },
  confirmText:   { fontSize: 20, color: Colors.moonstone, fontWeight: '700' },
  bottomConfirm: {
    position: 'absolute', bottom: 32, left: 32, right: 32,
    backgroundColor: Colors.moonstone,
    borderRadius: Radii.xl, paddingVertical: 16,
    alignItems: 'center',
    ...Shadows.card,
  },
  bottomConfirmText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
