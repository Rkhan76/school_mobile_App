import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function BrandHeader() {
  return (
    <View style={styles.center}>
      <View style={styles.logo}>
        <View style={styles.ring}>
          <View style={styles.dot} />
        </View>
      </View>
      <Text style={styles.title}>Aethen</Text>
      <Text style={styles.subtitle}>School Management ERP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 6 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primaryDeep },
  title: { fontFamily: fonts.headingExtra, fontSize: 34, color: colors.text },
  subtitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary },
});
