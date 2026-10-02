import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';

type Props<T extends string> = { options: readonly T[]; value: T; onChange: (v: T) => void };

export function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.mint, borderRadius: radius.lg, padding: 4 },
  item: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  itemActive: { backgroundColor: colors.primary },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  textActive: { color: colors.white },
});
