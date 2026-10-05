import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { DocumentCategory } from './types';

type Props = {
  categories: DocumentCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/**
 * Horizontally scrollable category chips with counts. There's no documented
 * create-category endpoint (the doc only exposes read + upload-time categoryId
 * for `/school-documents/categories`), so there's no "+" add-category affordance
 * here — categories come entirely from the server's auto-seeded 7 defaults.
 */
export function CategoryChips({ categories, selectedId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((c) => {
        const on = c.id === selectedId;
        return (
          <Pressable key={c.id || '__all'} onPress={() => onSelect(c.id)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.text, on && styles.textOn]}>{c.name}</Text>
            <View style={[styles.count, on && styles.countOn]}>
              <Text style={[styles.countText, on && styles.countTextOn]}>{c.documentCount}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
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
}));
