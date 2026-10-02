import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { colors, fonts, radius } from '../../../theme/tokens';
import type { StudentDocument } from './studentDetail';
import { SectionCard } from './ui';

export function DocumentRow({ d }: { d: StudentDocument }) {
  return (
    <View style={styles.row}>
      <Ionicons name={d.icon} size={18} color={colors.primaryDeep} />
      <Text style={styles.name} numberOfLines={1}>{d.name}</Text>
      <Badge label={d.verified ? 'Verified' : 'Pending'} tone={d.verified ? 'primary' : 'warning'} />
    </View>
  );
}

export function DocumentsCard({ docs, title = 'Mandatory Documents' }: { docs: StudentDocument[]; title?: string }) {
  const verified = docs.filter((d) => d.verified).length;
  return (
    <SectionCard icon="shield-checkmark-outline" title={title} right={<Text style={styles.count}>{verified} of {docs.length}</Text>}>
      <View style={{ gap: 8 }}>
        {docs.map((d) => <DocumentRow key={d.id} d={d} />)}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  count: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: radius.md, paddingHorizontal: 12, height: 46 },
  name: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
});
