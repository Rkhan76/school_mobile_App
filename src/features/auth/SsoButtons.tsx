import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme/tokens';

type Item = { label: string; icon: keyof typeof Ionicons.glyphMap; tint: string };

const ITEMS: Item[] = [
  { label: 'MFA / Security Key', icon: 'lock-closed-outline', tint: colors.textSecondary },
  { label: 'District SSO', icon: 'shield-checkmark-outline', tint: colors.primary },
];

export function SsoButtons() {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <Text style={styles.caption}>ENTERPRISE SINGLE SIGN-ON</Text>
      <View style={styles.row}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
            onPress={() => Alert.alert(item.label, 'Coming soon')}
            accessibilityRole="button"
          >
            <Ionicons name={item.icon} size={18} color={item.tint} />
            <Text style={styles.btnText} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  line: { height: 1, backgroundColor: colors.border },
  caption: {
    textAlign: 'center',
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.textHint,
  },
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  pressed: { opacity: 0.7 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
});
