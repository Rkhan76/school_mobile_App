import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, themed } from '../../theme/tokens';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterCount?: number;
};

/** Search field with an optional Filter button (used by every list screen). */
export function SearchBar({ value, onChangeText, placeholder = 'Search', onFilterPress, filterCount }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Ionicons name="search-outline" size={18} color={colors.textHint} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textHint}
          style={styles.input}
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textHint} />
          </Pressable>
        )}
      </View>
      {onFilterPress && (
        <Pressable style={styles.filter} onPress={onFilterPress} accessibilityLabel="Filters">
          <Ionicons name="options-outline" size={18} color={colors.primaryDeep} />
          <Text style={styles.filterText}>Filter{filterCount ? ` (${filterCount})` : ''}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.cardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, padding: 0 },
  filter: {
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
  },
  filterText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
}));
