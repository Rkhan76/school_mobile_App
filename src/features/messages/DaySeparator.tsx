import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';

export function DaySeparator({ label }: { label: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.mint },
  text: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
}));
