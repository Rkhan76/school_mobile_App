import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';

interface Props {
  title: string;
  pill?: string;
  action?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, pill, action, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {pill ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{pill}</Text>
          </View>
        ) : null}
      </View>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.action}>{action} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  pill: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
  action: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primary },
}));
