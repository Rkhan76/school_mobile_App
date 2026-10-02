import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import type { DocumentCategory } from './mockSchoolDocuments';

type Props = {
  categories: DocumentCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

/** Horizontally scrollable category chips with counts and a trailing "+" chip. */
export function CategoryChips({ categories, selectedId, onSelect, onAdd }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((c) => {
        const on = c.id === selectedId;
        return (
          <Pressable key={c.id || '__all'} onPress={() => onSelect(c.id)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.text, on && styles.textOn]}>{c.name}</Text>
            <View style={[styles.count, on && styles.countOn]}>
              <Text style={[styles.countText, on && styles.countTextOn]}>{c.count}</Text>
            </View>
          </Pressable>
        );
      })}
      <Pressable onPress={onAdd} style={styles.addChip} accessibilityLabel="Add category">
        <Ionicons name="add" size={18} color={colors.primaryDeep} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  chip: {
    height: 38, paddingLeft: 14, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  textOn: { color: colors.white },
  count: {
    minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  countTextOn: { color: colors.white },
  addChip: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.border,
  },
});
