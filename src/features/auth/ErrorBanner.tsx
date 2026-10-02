import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme/tokens';

export function ErrorBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={22} color={colors.danger} />
      <View style={styles.body}>
        <Text style={styles.title}>Authentication Failed</Text>
        <Text style={styles.text}>Invalid email or password. Please verify and try again.</Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={10} accessibilityLabel="Dismiss error">
        <Ionicons name="close" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.heading, fontSize: 14, color: '#991b1b' },
  text: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#b91c1c' },
});
