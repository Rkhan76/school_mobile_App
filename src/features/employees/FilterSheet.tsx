import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { Gender } from './types';

// GET /teachers and GET /non-teaching-staff only support `search` server-side —
// no subject/class/status filter exists on either endpoint per the API doc.
// Gender is therefore applied client-side, over whatever pages have already
// been loaded (not the full server-side result set).
export interface EmployeeFilters { gender?: Gender }

type Props = { visible: boolean; title: string; value: EmployeeFilters; onApply: (f: EmployeeFilters) => void; onClose: () => void };

const GENDERS: readonly Gender[] = ['Male', 'Female'];

export function FilterSheet({ visible, title, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<EmployeeFilters>(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>Applies only to the results already loaded on screen.</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.group}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chips}>
              {GENDERS.map((g) => {
                const on = draft.gender === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setDraft((d) => ({ ...d, gender: on ? undefined : g }))}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => { setDraft({}); onApply({}); onClose(); }}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.apply]} onPress={() => { onApply(draft); onClose(); }}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: { backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, maxHeight: '80%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 4 },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  group: { marginTop: 12 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.white },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep, fontSize: 14 },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white, fontSize: 14 },
}));
