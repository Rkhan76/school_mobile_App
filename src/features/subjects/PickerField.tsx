import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../theme/tokens';

type Props = {
  label: string;
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
};

/** Select-like field that opens a bottom sheet. */
export function PickerField({ label, value, placeholder, disabled, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.field, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
      >
        <Text style={[styles.text, !value && styles.placeholder]} numberOfLines={1}>{value ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textHint} />
      </Pressable>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, gap: 4 },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary },
  field: {
    height: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  disabled: { opacity: 0.55, backgroundColor: colors.mintSoft },
  text: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  placeholder: { color: colors.textHint, fontFamily: fonts.body },
}));
