import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { formatLong, TODAY_ISO } from './dateUtils';

export type DateCtl = {
  text: string;
  error: string | null;
  /** date the roster is currently loaded for (ISO) */
  loaded: string;
  onChangeText: (t: string) => void;
  onLoad: () => void;
  onShift: (days: number) => void;
  onToday: () => void;
};

type Props = { ctl: DateCtl; actions?: ReactNode };

/** Date field with prev/next arrows, Today, Load, caption and the tab's quick actions. */
export function DateBar({ ctl, actions }: Props) {
  const atToday = ctl.loaded >= TODAY_ISO;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable style={styles.arrow} onPress={() => ctl.onShift(-1)} accessibilityLabel="Previous day">
          <Ionicons name="chevron-back" size={18} color={colors.primaryDeep} />
        </Pressable>
        <View style={[styles.field, ctl.error ? styles.fieldError : null]}>
          <Ionicons name="calendar-outline" size={16} color={colors.textHint} />
          <TextInput
            value={ctl.text}
            onChangeText={ctl.onChangeText}
            placeholder="dd/mm/yyyy"
            placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={styles.input}
            onSubmitEditing={ctl.onLoad}
            returnKeyType="done"
          />
        </View>
        <Pressable
          style={[styles.arrow, atToday && { opacity: 0.4 }]}
          onPress={() => ctl.onShift(1)}
          disabled={atToday}
          accessibilityLabel="Next day"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDeep} />
        </Pressable>
      </View>
      {ctl.error ? <Text style={styles.error}>{ctl.error}</Text> : null}
      <View style={styles.row}>
        <Pressable style={styles.load} onPress={ctl.onLoad} accessibilityRole="button">
          <Text style={styles.loadText}>Load</Text>
        </Pressable>
        <Pressable style={styles.today} onPress={ctl.onToday} accessibilityRole="button">
          <Ionicons name="today-outline" size={15} color={colors.primaryDeep} />
          <Text style={styles.todayText}>Today</Text>
        </Pressable>
        {actions}
      </View>
      <Text style={styles.caption}>
        Showing attendance for <Text style={styles.captionBold}>{formatLong(ctl.loaded)}</Text>
      </Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  arrow: {
    width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  field: {
    flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, padding: 0 },
  error: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  load: {
    height: 38, paddingHorizontal: 22, borderRadius: radius.pill, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  loadText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  today: {
    height: 38, paddingHorizontal: 12, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.mint,
  },
  todayText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  caption: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  captionBold: { fontFamily: fonts.bodySemi, color: colors.text },
}));
