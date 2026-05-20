import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radii, Shadows, Typography } from '../theme';

// ─── Settings screen ──────────────────────────────────────────────────────────
// Currently a placeholder – settings options can be added here over time.
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.sub}>Nothing to configure yet — more options coming soon!</Text>

      {/* Settings rows will go here */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    padding: 20,
  },
  title:   { ...Typography.title, marginBottom: 6 },
  sub:     { ...Typography.body, color: Colors.muted, marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionTitle: {
    ...Typography.label,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
  },
  row: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...Shadows.soft,
  },
  rowLabel: { ...Typography.body },
  rowValue: { ...Typography.body, color: Colors.muted },
});
