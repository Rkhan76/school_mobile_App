import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../theme/tokens';
import type { StudentDetail } from './studentDetail';
import { LabelValue, SectionCard } from './ui';

export function IdentityCard({ s }: { s: StudentDetail }) {
  return (
    <SectionCard icon="person-circle-outline" title="Identity & Demographics">
      <View style={styles.row}>
        <LabelValue label="Date of Birth" value={`${s.dob} (${s.age} yrs)`} />
        <LabelValue label="Gender" value={s.gender} />
      </View>
      <View style={styles.row}>
        <LabelValue label="Category" value={s.category} />
        <LabelValue label="Sub-category" value={s.subcategory} />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={styles.label}>RESIDENTIAL ADDRESS</Text>
        <View style={styles.addr}>
          <Ionicons name="location-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.addrText}>{s.address}</Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.6, color: colors.textSecondary },
  addr: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addrText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text, lineHeight: 19 },
});
