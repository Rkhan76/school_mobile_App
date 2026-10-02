import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { formatDate, type Admission, type AdmissionStatus } from './mockAdmissions';

type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';
const STATUS: Record<AdmissionStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  enrolled: { label: 'Enrolled', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

type Props = {
  item: Admission;
  selected: boolean;
  selectionMode: boolean;
  onPress: (item: Admission) => void;
  onLongPress: (item: Admission) => void;
  onApprove: (item: Admission) => void;
  onReject: (item: Admission) => void;
  onView: (item: Admission) => void;
  onEdit: (item: Admission) => void;
  onDelete: (item: Admission) => void;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Action({ icon, label, color, bg, onPress }: { icon: IconName; label: string; color: string; bg: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.action, { backgroundColor: bg }]} onPress={onPress} accessibilityLabel={label} hitSlop={4}>
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}

function AdmissionCardBase({ item, selected, selectionMode, onPress, onLongPress, onApprove, onReject, onView, onEdit, onDelete }: Props) {
  const st = STATUS[item.status];
  const pending = item.status === 'pending';
  return (
    <Pressable onPress={() => onPress(item)} onLongPress={() => onLongPress(item)} delayLongPress={350}>
      <Card style={[styles.card, selected && styles.selected]}>
        <View style={styles.top}>
          {selectionMode ? (
            <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={selected ? colors.primary : colors.textHint} />
          ) : null}
          <Avatar name={item.fullName} size={44} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>
          <Badge label={st.label} tone={st.tone} />
        </View>
        <View style={styles.meta}>
          <View style={styles.appNo}>
            <Text style={styles.appNoText}>{item.applicationNumber}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.className}, {item.sectionName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatDate(item.appliedOn)}</Text>
          </View>
        </View>
        {!selectionMode && (
          <View style={styles.actions}>
            {pending && <Action icon="checkmark-circle-outline" label="Approve" color={colors.success} bg={colors.successBg} onPress={() => onApprove(item)} />}
            {pending && <Action icon="close-circle-outline" label="Reject" color={colors.danger} bg={colors.dangerBg} onPress={() => onReject(item)} />}
            <View style={styles.spacer} />
            <Action icon="eye-outline" label="View" color={colors.primaryDeep} bg={colors.mint} onPress={() => onView(item)} />
            <Action icon="create-outline" label="Edit" color={colors.blue} bg="#dbeafe" onPress={() => onEdit(item)} />
            <Action icon="trash-outline" label="Delete" color={colors.danger} bg={colors.dangerBg} onPress={() => onDelete(item)} />
          </View>
        )}
      </Card>
    </Pressable>
  );
}

export const AdmissionCard = memo(AdmissionCardBase);

const styles = StyleSheet.create({
  card: { gap: 12, padding: 14 },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  email: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  appNo: { backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  appNoText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  spacer: { flex: 1 },
  action: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
