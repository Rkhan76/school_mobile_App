import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';

/** Teal monospace pill for an audit action code. */
export function ActionPill({ action }: { action: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text} numberOfLines={1}>{action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.mint },
  text: { fontFamily: fonts.monoMedium, fontSize: 11.5, color: colors.primaryDeep },
});
