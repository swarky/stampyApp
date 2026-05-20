import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { getCalendarEntries, getStampById } from '../db/database';
import { Stamp } from '../types';
import StampImage from '../components/StampImage';
import { Colors, Typography, Radii, Shadows } from '../theme';

type Nav = StackNavigationProp<RootStackParamList>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const WEEK_DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }

/**
 * Seeded rotation for a calendar stamp – derived from the date string so it's
 * stable across re-renders. Range: –10° to +10°.
 */
function calendarRotation(dateStr: string): number {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);
  const x = Math.sin(seed) * 10000;
  return ((x - Math.floor(x)) * 20) - 10;
}

const SW        = Dimensions.get('window').width;
const CELL_W    = Math.floor((SW - 32) / 7);
const STAMP_SZ  = CELL_W - 6;

export default function CalendarScreen() {
  const navigation = useNavigation<Nav>();
  const today      = new Date();
  const todayStr   = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [entries, setEntries] = useState<Record<string, Stamp>>({});

  // Reload calendar entries whenever the screen comes into focus
  useFocusEffect(useCallback(() => {
    const map: Record<string, Stamp> = {};
    for (const e of getCalendarEntries()) {
      const s = getStampById(e.stampId);
      if (s) map[e.date] = s;
    }
    setEntries(map);
  }, []));

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    // Do not navigate past the current month
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function handleDayPress(dateStr: string) {
    if (dateStr > todayStr) return; // future dates are locked

    if (entries[dateStr]) {
      // Day already has a stamp → open it
      navigation.navigate('StampDetail', { stampId: entries[dateStr].id });
    } else {
      // Empty day → let user pick a stamp from the library
      navigation.navigate('StampPicker', { forDate: dateStr });
    }
  }

  // Build the grid cells (null = empty leading slots)
  const numDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstWeekday(year, month)).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>

        {/* Month navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Weekday row */}
        <View style={styles.weekRow}>
          {WEEK_DAYS.map(d => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>
      </View>

      {/* ── Day grid ── */}
      <ScrollView contentContainerStyle={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.cell} />;

          const dateStr  = `${year}-${pad(month + 1)}-${pad(day)}`;
          const isFuture = dateStr > todayStr;
          const isToday  = dateStr === todayStr;
          const stamp    = entries[dateStr];
          const rot      = calendarRotation(dateStr);

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.cell, isFuture && styles.cellFuture]}
              onPress={() => handleDayPress(dateStr)}
              disabled={isFuture}
            >
              <Text style={[styles.dayNum, isToday && styles.todayNum]}>{day}</Text>

              {stamp ? (
                // Stamp rotated for the patchwork / DIY feeling
                <View style={{ transform: [{ rotate: `${rot}deg` }] }}>
                  <StampImage uri={stamp.imageUri} size={STAMP_SZ} />
                </View>
              ) : (
                <View style={styles.emptyDot} />
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
  header: {
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8,
    backgroundColor: Colors.cream,
  },
  title:      { ...Typography.title, marginBottom: 12 },
  navRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn:     { padding: 8 },
  navArrow:   { fontSize: 28, color: Colors.moonstone },
  monthLabel: { ...Typography.heading },
  weekRow:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  weekDay:    { width: CELL_W, textAlign: 'center', ...Typography.small, fontWeight: '600' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  cell:       { width: CELL_W, height: CELL_W + 14, alignItems: 'center', paddingTop: 4 },
  cellFuture: { opacity: 0.25 },
  dayNum:     { ...Typography.small, marginBottom: 2 },
  todayNum:   { color: Colors.moonstone, fontWeight: '700' },
  emptyDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.border, marginTop: 6 },
});
