import { memo } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import type { StudentRow } from '../useStudents';

interface Props {
  student: StudentRow;
  onView: (id: string) => void;
  onToggleStatus: (id: string, active: boolean) => void;
  onToggleBlock: (id: string) => void;
  canToggleStatus: boolean;
  canToggleBlock: boolean;
  /** Card is shown in the blocked list: only Unblock is offered. */
  blocked?: boolean;
}

function InfoItem({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={13} color={colors.textHint} />
      <Text style={styles.infoText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function StudentCardBase({ student: s, onView, onToggleStatus, onToggleBlock, canToggleStatus, canToggleBlock, blocked }: Props) {
  const active = s.status === 'active';
  return (
    <Card style={styles.card}>
      <Pressable onPress={() => onView(s.id)} accessibilityRole="button" accessibilityLabel={`View ${s.fullName}`}>
        <View style={styles.top}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{s.admissionNumber}</Text>
          </View>
          {blocked ? (
            <Badge label="Blocked" tone="danger" />
          ) : (
            <Badge label={active ? 'Active' : 'Inactive'} tone={active ? 'success' : 'neutral'} />
          )}
        </View>
        <View style={styles.identity}>
          <Avatar name={s.fullName} size={46} />
          <View style={styles.names}>
            <Text style={styles.name} numberOfLines={1}>{s.fullName}</Text>
            <Text style={styles.email} numberOfLines={1}>Roll #{s.rollNumber ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.infoGrid}>
          <InfoItem icon="school-outline" text={`${s.class?.name ?? 'No class'} · Sec ${s.section?.name ?? '—'}`} />
        </View>
      </Pressable>
      {blocked ? (
        canToggleBlock ? (
          <View style={styles.actions}>
            <View style={styles.spacer} />
            <Pressable style={styles.unblock} onPress={() => onToggleBlock(s.id)} accessibilityLabel="Unblock student">
              <Ionicons name="lock-open-outline" size={16} color={colors.primaryDeep} />
              <Text style={styles.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        ) : null
      ) : (
      <View style={styles.actions}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => Alert.alert('Edit student', 'Editing is coming soon.')}
          accessibilityLabel="Edit student"
        >
          <Ionicons name="create-outline" size={18} color={colors.blue} />
        </Pressable>
        <View style={styles.spacer} />
        {canToggleStatus ? (
          <>
            <Text style={styles.switchLabel}>{active ? 'Active' : 'Inactive'}</Text>
            <Switch
              value={active}
              onValueChange={(v) => onToggleStatus(s.id, v)}
              trackColor={{ false: '#d5dedc', true: colors.primary }}
              thumbColor={colors.white}
            />
          </>
        ) : (
          <Text style={styles.switchLabel}>{active ? 'Active' : 'Inactive'}</Text>
        )}
        {canToggleBlock && (
          <Pressable style={[styles.iconBtn, styles.danger]} onPress={() => onToggleBlock(s.id)} accessibilityLabel="Block student">
            <Ionicons name="ban-outline" size={18} color={colors.danger} />
          </Pressable>
        )}
      </View>
      )}
    </Card>
  );
}

export const StudentCard = memo(StudentCardBase);

const styles = themed(() => StyleSheet.create({
  card: { padding: 14, gap: 12, borderRadius: radius.xl },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pill: { backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  pillText: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  names: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  email: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 12 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  actions: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  spacer: { flex: 1 },
  switchLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textSecondary },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mintSoft,
  },
  danger: { backgroundColor: colors.dangerBg },
  unblock: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14,
    borderRadius: radius.pill, backgroundColor: colors.mint,
  },
  unblockText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
}));
