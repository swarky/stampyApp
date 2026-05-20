// ─── Design tokens ────────────────────────────────────────────────────────────
// Pulled from the UI references: Vanilla + Moonstone palette, kawaii/cozy feel.

export const Colors = {
  // Primary palette
  vanilla:    '#FFEBAF',   // warm yellow – backgrounds, accents
  moonstone:  '#4C9DB0',   // teal-blue   – primary interactive color
  cream:      '#FDFAF0',   // off-white   – screen backgrounds
  // Text
  ink:        '#3D2B1F',   // dark brown  – primary text
  muted:      '#9B8B7E',   // warm grey   – secondary text, placeholders
  // Surfaces
  card:       '#FFFFFF',
  border:     '#E8E0D0',
  // Feedback
  danger:     '#E05C5C',
  // Overlay
  overlay:    'rgba(61, 43, 31, 0.55)',
};

export const Radii = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  soft: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const Typography = {
  title:    { fontSize: 26, fontWeight: '700' as const, color: Colors.ink },
  heading:  { fontSize: 18, fontWeight: '700' as const, color: Colors.ink },
  body:     { fontSize: 15, fontWeight: '400' as const, color: Colors.ink },
  label:    { fontSize: 13, fontWeight: '600' as const, color: Colors.muted },
  small:    { fontSize: 11, fontWeight: '400' as const, color: Colors.muted },
};
