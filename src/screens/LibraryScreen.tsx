import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import {
  getStamps, getCategories, addCategory, updateCategory, deleteCategory,
  getFavouriteIds, toggleFavourite,
} from '../db/database';
import { Stamp, Category } from '../types';
import StampImage from '../components/StampImage';
import { Colors, Radii, Shadows, Typography } from '../theme';

type Nav      = StackNavigationProp<RootStackParamList>;
type ViewMode = 'stamps' | 'favourites' | 'categories';

const THUMB_SIZE = Math.floor((Dimensions.get('window').width - 32) / 3);

export default function LibraryScreen() {
  const navigation = useNavigation<Nav>();

  const [mode,        setMode]        = useState<ViewMode>('stamps');
  const [stamps,      setStamps]      = useState<Stamp[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [favIds,      setFavIds]      = useState<Set<number>>(new Set());
  const [editMode,    setEditMode]    = useState(false);
  const [editingName, setEditingName] = useState<Record<number, string>>({});

  // Reload data every time this tab comes into focus
  useFocusEffect(useCallback(() => {
    setStamps(getStamps());
    setCategories(getCategories());
    setFavIds(getFavouriteIds());
  }, []));

  function refresh() {
    setStamps(getStamps());
    setCategories(getCategories());
    setFavIds(getFavouriteIds());
  }

  function handleToggleFav(stampId: number) {
    const next = !favIds.has(stampId);
    toggleFavourite(stampId, next);
    setFavIds(prev => {
      const updated = new Set(prev);
      if (next) updated.add(stampId); else updated.delete(stampId);
      return updated;
    });
  }

  function handleAddCategory() {
    Alert.prompt('New Category', 'Enter a name:', name => {
      if (name?.trim()) { addCategory(name.trim()); refresh(); }
    });
  }

  function handleDeleteCategory(cat: Category) {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Stamps in this category will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteCategory(cat.id); refresh(); } },
      ],
    );
  }

  function handleRenameCategory(id: number) {
    const newName = editingName[id];
    if (newName?.trim()) { updateCategory(id, newName.trim()); refresh(); }
  }

  const displayedStamps =
    mode === 'favourites' ? stamps.filter(s => favIds.has(s.id)) : stamps;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Settings gear – top-left */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Library</Text>

        {/* Toggle: Stamps | ⭐ Favourites | Categories */}
        <View style={styles.toggle}>
          {([
            { key: 'stamps',     label: 'Stamps'  },
            { key: 'favourites', label: '★'       },
            { key: 'categories', label: 'Sets'    },
          ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.toggleBtn, mode === key && styles.toggleActive]}
              onPress={() => { setMode(key); setEditMode(false); }}
            >
              <Text style={[styles.toggleText, mode === key && styles.toggleTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Stamp / Favourites grid ── */}
      {(mode === 'stamps' || mode === 'favourites') && (
        <FlatList
          data={displayedStamps}
          keyExtractor={s => String(s.id)}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {mode === 'favourites'
                ? 'No favourites yet — tap ★ on a stamp to save it here.'
                : 'No stamps yet — take your first one!'}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.stampCell}
              onPress={() => navigation.navigate('StampDetail', { stampId: item.id })}
              onLongPress={() => handleToggleFav(item.id)}
            >
              <View>
                <StampImage
                  uri={item.imageUri}
                  size={THUMB_SIZE}
                  filter={item.filter}
                  shape={item.shape}
                />
                {favIds.has(item.id) && (
                  <View style={styles.favBadge}>
                    <Text style={styles.favBadgeIcon}>★</Text>
                  </View>
                )}
              </View>
              <Text style={styles.stampName} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Category list ── */}
      {mode === 'categories' && (
        <View style={{ flex: 1 }}>
          {/* Toolbar: Add + Edit */}
          <View style={styles.catToolbar}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={handleAddCategory}>
              <Text style={styles.toolbarBtnText}>+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => setEditMode(e => !e)}>
              <Text style={styles.toolbarBtnText}>{editMode ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={c => String(c.id)}
            ListEmptyComponent={<Text style={styles.empty}>No categories yet.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.catRow}
                onPress={() => !editMode && navigation.navigate('CategoryDetail', {
                  categoryId:   item.id,
                  categoryName: item.name,
                })}
                disabled={editMode}
              >
                {editMode ? (
                  <TextInput
                    style={styles.catInput}
                    value={editingName[item.id] ?? item.name}
                    onChangeText={t => setEditingName(prev => ({ ...prev, [item.id]: t }))}
                    onFocus={() => setEditingName(prev => ({ ...prev, [item.id]: item.name }))}
                    onEndEditing={() => handleRenameCategory(item.id)}
                    onSubmitEditing={() => handleRenameCategory(item.id)}
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={styles.catName}>{item.name}</Text>
                )}

                {editMode && (
                  <TouchableOpacity onPress={() => handleDeleteCategory(item)} style={styles.trashBtn}>
                    <Text style={styles.trashIcon}>🗑️</Text>
                  </TouchableOpacity>
                )}

                {!editMode && (
                  <Text style={styles.catChevron}>›</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.cream,
  },
  settingsBtn: { position: 'absolute', top: 58, left: 16, padding: 4 },
  settingsIcon: { fontSize: 22 },
  title: { ...Typography.title, textAlign: 'center', marginBottom: 12 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: Radii.md,
    padding: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 7,
    alignItems: 'center', borderRadius: Radii.sm,
  },
  toggleActive: {
    backgroundColor: Colors.card,
    ...Shadows.soft,
  },
  toggleText:       { color: Colors.muted, fontWeight: '500' },
  toggleTextActive: { color: Colors.ink,   fontWeight: '700' },
  grid: { padding: 8 },
  stampCell: { width: THUMB_SIZE, margin: 4, alignItems: 'center' },
  stampName: { ...Typography.small, marginTop: 4, textAlign: 'center' },
  favBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  favBadgeIcon: { fontSize: 11, color: '#FFDD55' },
  empty:     { textAlign: 'center', marginTop: 60, ...Typography.body, color: Colors.muted },
  catToolbar: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  toolbarBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.vanilla,
    borderRadius: Radii.md,
    ...Shadows.soft,
  },
  toolbarBtnText: { fontWeight: '600', color: Colors.ink },
  catRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
    marginHorizontal: 16, marginVertical: 4,
    borderRadius: Radii.md,
    ...Shadows.soft,
  },
  catName:    { flex: 1, fontSize: 16, color: Colors.ink, fontWeight: '500' },
  catInput:   { flex: 1, fontSize: 16, color: Colors.ink, borderBottomWidth: 1, borderBottomColor: Colors.moonstone, paddingVertical: 2 },
  catChevron: { color: Colors.muted, fontSize: 20 },
  trashBtn:   { paddingLeft: 12 },
  trashIcon:  { fontSize: 18 },
});
