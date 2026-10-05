import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, themed } from '../../theme/tokens';

const palette = [colors.primary, colors.blue, colors.indigo, colors.purple, colors.orange];

/** Initials avatar (photos come with the API later). */
export function Avatar({ name: rawName, size = 40 }: { name?: string | null; size?: number }) {
  // The API can return a null name (e.g. an applicant with no full name yet); show a placeholder instead of crashing.
  const name = rawName ?? '';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const bg = palette[name.length % palette.length];
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontFamily: fonts.heading },
}));
