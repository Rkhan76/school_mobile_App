import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { RECIPIENT_TYPE_LABEL, formatDate, type Certificate } from './types';

type Props = {
  item: Certificate;
  canRevoke: boolean;
  onView: (c: Certificate) => void;
  onRevoke: (c: Certificate) => void;
};

function CertificateCardBase({ item, canRevoke, onView, onRevoke }: Props) {
  const revoked = item.status === 'REVOKED';
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.refPill}>
          <Text style={styles.refText}>{item.referenceNo}</Text>
        </View>
        <Badge label={revoked ? 'Revoked' : 'Active'} tone={revoked ? 'danger' : 'success'} />
      </View>

      <View style={styles.person}>
        <Avatar name={item.recipientName} size={40} />
        <View style={styles.personText}>
          <Text style={styles.name} numberOfLines={1}>{item.recipientName}</Text>
          <Text style={styles.sub}>{RECIPIENT_TYPE_LABEL[item.recipientType]}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.textHint} />
        <Text style={styles.sub}>Issued {formatDate(item.issueDate)}</Text>
      </View>

      {revoked && (
        <View style={styles.revokedBox}>
          <Text style={styles.revokedTitle}>
            Revoked{item.revokedAt ? ` on ${formatDate(item.revokedAt)}` : ''}
          </Text>
          {item.revokeReason ? <Text style={styles.revokedReason}>{item.revokeReason}</Text> : null}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.view]} onPress={() => onView(item)} accessibilityLabel="View certificate">
          <Ionicons name="eye-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.viewText}>View</Text>
        </Pressable>
        {canRevoke ? (
          <Pressable
            style={[styles.btn, styles.revoke, revoked && styles.off]}
            disabled={revoked}
            onPress={() => onRevoke(item)}
            accessibilityLabel="Revoke certificate"
          >
            <Ionicons name="shield-outline" size={16} color={colors.danger} />
            <Text style={styles.revokeText}>Revoke</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export const CertificateCard = memo(CertificateCardBase);

const styles = StyleSheet.create({
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refPill: { backgroundColor: colors.mint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  refText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personText: { flex: 1 },
  name: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revokedBox: {
    padding: 10, borderRadius: radius.md, backgroundColor: colors.dangerBg,
    borderWidth: 1, borderColor: colors.dangerBorder, gap: 2,
  },
  revokedTitle: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.danger },
  revokedReason: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  btn: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.pill },
  view: { backgroundColor: colors.mint },
  viewText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  revoke: { backgroundColor: colors.dangerBg },
  revokeText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.danger },
  off: { opacity: 0.4 },
});
