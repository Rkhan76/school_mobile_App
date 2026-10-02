import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import type { LeaveApplication, LeaveStatus } from './types';

const STATUS_TONE: Record<LeaveStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

/** `YYYY-MM-DD` (or any ISO datetime) → `DD MMM YYYY`. Falls back to the raw value if unparseable. */
export function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Props = {
  item: LeaveApplication;
  canDecide: boolean;
  onPress: (item: LeaveApplication) => void;
  onApprove: (item: LeaveApplication) => void;
  onReject: (item: LeaveApplication) => void;
};

function LeaveRequestCardBase({ item, canDecide, onPress, onApprove, onReject }: Props) {
  const showActions = item.status === 'PENDING' && canDecide;

  return (
    <Pressable onPress={() => onPress(item)} accessibilityLabel={`View leave request from ${item.applicantName}`}>
      <Card style={styles.card}>
        <View style={styles.top}>
          <Avatar name={item.applicantName} size={40} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.applicantName}</Text>
            <Text style={styles.role} numberOfLines={1}>{item.applicantRole}</Text>
          </View>
          <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="pricetag-outline" size={14} color={colors.textHint} />
          <Text style={styles.metaText} numberOfLines={1}>{item.leaveTypeName ?? item.leaveTypeId}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textHint} />
          <Text style={styles.metaText}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
        </View>

        {showActions ? (
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.reject]}
              onPress={() => onReject(item)}
              accessibilityLabel="Reject leave request"
            >
              <Ionicons name="close" size={16} color={colors.danger} />
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.approve]}
              onPress={() => onApprove(item)}
              accessibilityLabel="Approve leave request"
            >
              <Ionicons name="checkmark" size={16} color={colors.white} />
              <Text style={styles.approveText}>Approve</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

export const LeaveRequestCard = memo(LeaveRequestCardBase);

const styles = StyleSheet.create({
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  role: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  btn: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.pill },
  approve: { backgroundColor: colors.primary },
  approveText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  reject: { backgroundColor: colors.dangerBg },
  rejectText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.danger },
});
