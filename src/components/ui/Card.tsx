import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, shadow, themed } from '../../theme/tokens';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = themed(() => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadow.card,
  },
}));
