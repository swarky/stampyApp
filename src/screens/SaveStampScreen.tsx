import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { addStamp, getCategories, setCalendarEntry, getCalendarEntry } from '../db/database';
import { Category } from '../types';
import { File, Paths } from 'expo-file-system';
import StampImage from '../components/StampImage';
import { Colors, Radii, Shadows, Typography } from '../theme';

type Route = RouteProp<RootStackParamList, 'SaveStamp'>;
type Nav   = StackNavigationProp<RootStackParamList, 'SaveStamp'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format today as "Apr 22, 2026 – 14:35" for the default stamp name. */
function defaultStampName(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' – '
    + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Stable small rotation for the stamp preview: seeded from current time. */
function previewRotation(): number {
  return ((Date.now() % 200) / 200) * 16 - 8; // –8° to +8°
}

export default function SaveStampScreen() {
  const route      = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { imageUri } = route.params;

  const [name,               setName]               = useState(defaultStampName);
  const [note,               setNote]               = useState('');
  const [categories,         setCategories]         = useState<Category[]>([]);
  const [selectedCategory,   setSelectedCategory]   = useState<number | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Fixed tilt angle for this session (feels like you just "picked up" the stamp)
  const [rotation] = useState(previewRotation);

  useEffect(() => {
    setCategories(getCategories());
  }, []);

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please give your stamp a name.');
      return;
    }

    // Copy the cropped temp image to permanent document storage
    const filename = `stamp_${Date.now()}.jpg`;
    const destFile = new File(Paths.document, filename);
    new File(imageUri).copy(destFile);

    const today   = new Date().toISOString().split('T')[0];
    const stampId = addStamp({
      imageUri:   destFile.uri,
      name:       name.trim(),
      note,
      date:       today,
      categoryId: selectedCategory,
    });

    // Auto-assign to today's calendar slot if none exists yet
    if (!getCalendarEntry(today)) {
      setCalendarEntry(today, stampId);
    }

    navigation.navigate('Tabs');
  }

  const selectedCatName = categories.find(c => c.id === selectedCategory)?.name ?? 'None';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tilted stamp preview – the stamp "arrives" from the camera already rotated */}
        <View style={styles.previewArea}>
          <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
            <StampImage uri={imageUri} size={220} frameColor={Colors.vanilla} />
          </View>
        </View>

        {/* ── Stamp metadata form ── */}
        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={80}
            returnKeyType="next"
          />

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.categoryBtn}
            onPress={() => setShowCategoryPicker(p => !p)}
          >
            <Text style={styles.categoryBtnText}>{selectedCatName}</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropItem}
                onPress={() => { setSelectedCategory(null); setShowCategoryPicker(false); }}
              >
                <Text style={styles.dropText}>None</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.dropItem}
                  onPress={() => { setSelectedCategory(cat.id); setShowCategoryPicker(false); }}
                >
                  <Text style={styles.dropText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={t => t.length <= 500 && setNote(t)}
            placeholder="Optional note… (500 chars max)"
            placeholderTextColor={Colors.muted}
            multiline
          />
          <Text style={styles.charCount}>{note.length} / 500</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save Stamp</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.cream,
    flexGrow: 1,
  },
  // Extra room for the stamp to breathe with its rotation
  previewArea: {
    width: '100%', height: 260,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  form: { width: '100%' },
  label: {
    ...Typography.label,
    marginTop: 16, marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: 12,
    fontSize: 15, color: Colors.ink,
    ...Shadows.soft,
  },
  noteInput:  { height: 100, textAlignVertical: 'top' },
  charCount:  { alignSelf: 'flex-end', ...Typography.small, marginTop: 4 },
  categoryBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...Shadows.soft,
  },
  categoryBtnText: { fontSize: 15, color: Colors.ink },
  chevron:         { color: Colors.muted },
  dropdown: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md,
    marginTop: 4,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  dropItem: {
    padding: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dropText: { fontSize: 15, color: Colors.ink },
  saveBtn: {
    marginTop: 28,
    backgroundColor: Colors.moonstone,
    borderRadius: Radii.xl,
    paddingVertical: 16, paddingHorizontal: 48,
    ...Shadows.card,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
