import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import { CONFIGS, TAB_ORDER } from './config';
import type { TabKey } from './types';

export function MasterTabChips({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {TAB_ORDER.map((k) => {
        const on = k === active;
        const c = CONFIGS[k];
        return (
          <Pressable key={k} onPress={() => onChange(k)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Ionicons name={c.icon} size={15} color={on ? colors.white : colors.text} />
            <Text style={[styles.text, on && { color: colors.white }]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
});
