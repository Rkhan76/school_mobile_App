import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { colors, fonts, radius } from '../../../theme/tokens';
import type { StudentGuardian } from './studentDetail';
import { SectionCard } from './ui';

export function callGuardian(g: StudentGuardian) {
  Linking.openURL(`tel:${g.phone}`).catch(() => Alert.alert('Unable to call', g.phone));
}

export function whatsappGuardian(g: StudentGuardian) {
  const digits = g.phone.replace(/\D/g, '');
  Linking.openURL(`https://wa.me/${digits}`).catch(() => Alert.alert('WhatsApp unavailable', g.phone));
}

/** Guardian profile block; `full` adds the card chrome and the Call / WhatsApp buttons. */
export function GuardianCard({ g, title = 'Primary Guardian' }: { g: StudentGuardian; title?: string }) {
  const nick = g.relation === 'Father' ? 'Dad' : g.relation === 'Mother' ? 'Mom' : g.name.split(' ')[0];
  return (
    <SectionCard icon="people-outline" title={title} right={<Badge label={g.relation} tone="neutral" />}>
      <View style={styles.profile}>
        <Avatar name={g.name} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{g.name}</Text>
          <Text style={styles.occ}>{g.occupation}</Text>
          <Text style={styles.email} numberOfLines={1}>{g.email}</Text>
        </View>
      </View>
      <View style={styles.btns}>
        <Pressable style={[styles.btn, { backgroundColor: colors.mintSoft }]} onPress={() => callGuardian(g)}>
          <Ionicons name="call-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.btnText}>Call {nick}</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: '#b8ece4' }]} onPress={() => whatsappGuardian(g)}>
          <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.btnText}>WhatsApp</Text>
        </Pressable>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  name: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  occ: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textSecondary },
  email: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.primaryDeep },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 44, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.primaryDeep },
});
