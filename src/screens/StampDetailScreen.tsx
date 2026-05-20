import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { getStampById, getCategories, updateStamp, deleteStamp, isFavourite, toggleFavourite } from '../db/database';
import { Stamp, Category } from '../types';
import StampImage from '../components/StampImage';
import { Colors, Radii, Shadows, Typography } from '../theme';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

type Route = RouteProp<RootStackParamList, 'StampDetail'>;
type Nav   = StackNavigationProp<RootStackParamList, 'StampDetail'>;

/** Stable rotation derived from stamp id so it never changes between renders. */
function stampRotation(id: number): number {
  const x = Math.sin(id * 127.1) * 10000;
  return ((x - Math.floor(x)) * 16) - 8; // –8° to +8°
}

export default function StampDetailScreen() {
  const route      = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { stampId } = route.params;

  const stampRef = useRef<View>(null);

  const [stamp,              setStamp]              = useState<Stamp | null>(null);
  const [categories,         setCategories]         = useState<Category[]>([]);
  const [name,               setName]               = useState('');
  const [note,               setNote]               = useState('');
  const [categoryId,         setCategoryId]         = useState<number | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [dirty,              setDirty]              = useState(false);
  const [fav,                setFav]                = useState(false);
  const [sharing,            setSharing]            = useState(false);

  useEffect(() => {
    const s = getStampById(stampId);
    if (s) {
      setStamp(s);
      setName(s.name);
      setNote(s.note);
      setCategoryId(s.categoryId);
    }
    setCategories(getCategories());
    setFav(isFavourite(stampId));
  }, [stampId]);

  function save() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    updateStamp(stampId, name.trim(), note, categoryId);
    setDirty(false);
    navigation.goBack();
  }

  function handleToggleFav() {
    const next = !fav;
    toggleFavourite(stampId, next);
    setFav(next);
  }

  async function handleShare() {
    if (!stampRef.current || sharing) return;
    try {
      setSharing(true);
      const uri = await captureRef(stampRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: name });
    } catch (e) {
      Alert.alert('Share failed', 'Could not capture stamp image.');
    } finally {
      setSharing(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete stamp?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => { deleteStamp(stampId); navigation.goBack(); },
        },
      ],
    );
  }

  const catName = categoryId == null
    ? 'None'
    : categories.find(c => c.id === categoryId)?.name ?? 'None';

  if (!stamp) return <View style={styles.container} />;

  const rotation = stampRotation(stamp.id);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ── Top row: name + favourite star ── */}
        <View style={styles.nameRow}>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={t => { setName(t); setDirty(true); }}
            maxLength={80}
            placeholder="Stamp name"
            placeholderTextColor={Colors.muted}
          />
          <TouchableOpacity style={styles.favBtn} onPress={handleToggleFav}>
            <Text style={styles.favIcon}>{fav ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tilted stamp image ── */}
        <View style={styles.stampArea}>
          <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
            <StampImage
              ref={stampRef}
              uri={stamp.imageUri}
              size={260}
              frameColor={Colors.vanilla}
              filter={stamp.filter}
              shape={stamp.shape}
            />
          </View>
        </View>

        <Text style={styles.date}>{stamp.date}</Text>

        {/* ── Share button ── */}
        <TouchableOpacity
          style={[styles.shareBtn, sharing && { opacity: 0.5 }]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Text style={styles.shareBtnText}>
            {sharing ? 'Preparing…' : '↑  Share stamp'}
          </Text>
        </TouchableOpacity>

        {/* ── Note ── */}
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={t => { if (t.length <= 500) { setNote(t); setDirty(true); } }}
          multiline
          placeholder="No note yet…"
          placeholderTextColor={Colors.muted}
        />
        <Text style={styles.charCount}>{note.length} / 500</Text>

        {/* ── Category ── */}
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.categoryBtn}
          onPress={() => { setShowCategoryPicker(p => !p); setDirty(true); }}
        >
          <Text style={styles.categoryBtnText}>{catName}</Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>
        {showCategoryPicker && (
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropItem} onPress={() => { setCategoryId(null); setShowCategoryPicker(false); }}>
              <Text style={styles.dropText}>None</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.dropItem}
                onPress={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
              >
                <Text style={styles.dropText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Save – only shown when there are unsaved changes */}
        {dirty && (
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Text style={styles.deleteBtnText}>🗑  Delete stamp</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20, alignItems: 'center',
    backgroundColor: Colors.cream, flexGrow: 1,
  },
  nameRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  nameInput: {
    flex: 1,
    fontSize: 22, fontWeight: '700', color: Colors.ink,
    textAlign: 'center',
    paddingVertical: 8,
  },
  favBtn: { padding: 8 },
  favIcon: { fontSize: 26, color: Colors.vanilla === '#FFEBAF' ? '#F5A623' : Colors.moonstone },
  stampArea: {
    width: '100%', height: 300,
    justifyContent: 'center', alignItems: 'center',
    marginVertical: 8,
  },
  date: { ...Typography.small, marginBottom: 12 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 28,
    borderRadius: Radii.xl,
    backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.moonstone,
    marginBottom: 8,
    ...Shadows.soft,
  },
  shareBtnText: { color: Colors.moonstone, fontSize: 15, fontWeight: '600' },
  label: { ...Typography.label, alignSelf: 'flex-start', marginTop: 16, marginBottom: 4 },
  input: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md, padding: 12,
    fontSize: 15, color: Colors.ink,
    ...Shadows.soft,
  },
  noteInput:       { height: 100, textAlignVertical: 'top' },
  charCount:       { alignSelf: 'flex-end', ...Typography.small, marginTop: 4 },
  categoryBtn: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...Shadows.soft,
  },
  categoryBtnText: { fontSize: 15, color: Colors.ink },
  chevron:         { color: Colors.muted },
  dropdown: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md, marginTop: 4, overflow: 'hidden',
    ...Shadows.soft,
  },
  dropItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropText: { fontSize: 15, color: Colors.ink },
  saveBtn: {
    marginTop: 24,
    backgroundColor: Colors.moonstone,
    borderRadius: Radii.xl,
    paddingVertical: 14, paddingHorizontal: 40,
    ...Shadows.card,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    marginTop: 16, marginBottom: 8,
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: Radii.xl,
    borderWidth: 1, borderColor: Colors.danger,
  },
  deleteBtnText: { color: Colors.danger, fontSize: 15, fontWeight: '600' },
});
