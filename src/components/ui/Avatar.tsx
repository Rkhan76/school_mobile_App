import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

const palette = [colors.primary, colors.blue, colors.indigo, colors.purple, colors.orange];

/** Initials avatar (photos come with the API later). */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const bg = palette[name.length % palette.length];
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontFamily: fonts.heading },
});
