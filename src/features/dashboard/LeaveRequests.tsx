import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, themed } from '../../theme/tokens';
import { SectionHeader } from './SectionHeader';
import type { LeaveRequest } from './mockData';

interface Props {
  leaves: LeaveRequest[];
  pendingCount: number;
  onReviewAll?: () => void;
  onApprove?: (id: string) => void;
}

export function LeaveRequests({ leaves, pendingCount, onReviewAll, onApprove }: Props) {
  return (
    <View>
      <SectionHeader title="Leave Requests" pill={`${pendingCount} Pending`} action="Review All" onActionPress={onReviewAll} />
      <Card style={styles.card}>
        {leaves.map((l, i) => (
          <View key={l.id} style={[styles.row, i > 0 && styles.divider]}>
            <Avatar name={l.name} size={40} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{l.name}</Text>
              <Text style={styles.role} numberOfLines={1}>{l.role} • {l.days}d leave</Text>
            </View>
            <Badge
              label={l.status}
              tone={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}
            />
            {l.status === 'Pending' ? (
              <Pressable style={styles.check} onPress={() => onApprove?.(l.id)} accessibilityLabel="Approve leave">
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { padding: 4, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  info: { flex: 1 },
  name: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  role: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  check: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
}));
