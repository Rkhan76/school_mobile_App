import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme/tokens';

export function LoginFooter() {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.ssl}>
          <Ionicons name="shield-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.sslText}>256-Bit SSL Encrypted</Text>
        </View>
        <Text style={styles.version}>Aethen v2.4</Text>
      </View>
      <Text style={styles.links}>{'Help & Support  ·  Privacy Policy  ·  Terms'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, alignItems: 'center' },
  row: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
  ssl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sslText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  version: { fontFamily: fonts.mono, fontSize: 11, color: colors.textHint },
  links: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
});
