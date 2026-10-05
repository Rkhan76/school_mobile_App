import { useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, themed } from '../../theme/tokens';
import { STATUS_META } from './parts';
import type { AttendanceStatus } from './mockAttendance';
import type { RosterApi } from './useRoster';

type Props = {
  order: AttendanceStatus[];
  counts: Record<AttendanceStatus | 'NONE', number>;
  dirty: boolean;
  saving: boolean;
  disabled?: boolean;
  onSave: () => void;
};

/** Sticky bottom bar: live status counts plus the Save button. */
export function SaveBar({ order, counts, dirty, saving, disabled, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const off = !dirty || saving || disabled;
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      <View style={styles.chips}>
        {order.map((s) => {
          const m = STATUS_META[s];
          return (
            <View key={s} style={[styles.chip, { backgroundColor: m.bg }]}>
              <Text style={[styles.chipText, { color: m.fg }]} numberOfLines={1}>{m.label} {counts[s]}</Text>
            </View>
          );
        })}
        {counts.NONE > 0 ? (
          <View style={[styles.chip, { backgroundColor: colors.neutralBg }]}>
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>Unmarked {counts.NONE}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onSave}
        disabled={off}
        style={[styles.save, off && styles.saveOff]}
        accessibilityRole="button"
        accessibilityState={{ disabled: off }}
      >
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save attendance</Text>}
      </Pressable>
    </View>
  );
}

/** Returns a handler that saves, offering Overwrite when the date was already saved (409). */
export function useSaveFlow<T extends { id: string; status: AttendanceStatus | null; remarks: string }>(
  roster: RosterApi<T>,
  label: string,
): () => void {
  const { save } = roster;
  return useCallback(() => {
    const done = () => Alert.alert('Attendance saved', `${label} attendance was saved successfully.`);
    void save(false).then((res) => {
      if (res === 'saved') {
        done();
        return;
      }
      Alert.alert('Attendance already saved for this date', 'Do you want to overwrite the existing attendance?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Overwrite',
          style: 'destructive',
          onPress: () => {
            void save(true).then(done);
          },
        },
      ]);
    });
  }, [save, label]);
}

const styles = themed(() => StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, gap: 10,
    backgroundColor: colors.cardSolid, borderTopWidth: 1, borderTopColor: colors.border, ...shadow.card,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  save: { height: 48, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveOff: { backgroundColor: colors.textHint, opacity: 0.6 },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.white },
}));
