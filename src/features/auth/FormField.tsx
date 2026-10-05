import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow, themed } from '../../theme/tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
  error?: string | null;
  readOnlyField?: boolean;
};

export function FormField({ label, icon, right, error, readOnlyField, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <Ionicons name={icon} size={20} color={colors.textHint} />
        <TextInput
          {...inputProps}
          editable={!readOnlyField}
          placeholderTextColor={colors.textHint}
          style={[styles.input, readOnlyField ? styles.mono : null]}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textSecondary,
  },
  box: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.cardSolid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  boxError: { borderColor: colors.dangerBorder },
  input: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text, padding: 0 },
  mono: { fontFamily: fonts.mono, fontSize: 14 },
  error: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
}));
