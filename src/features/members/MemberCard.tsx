import { memo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import type { SchoolUser } from './types';

type Props = {
  member: SchoolUser;
  canAssignRole: boolean;
  canResendInvite: boolean;
  canResetPassword: boolean;
  canResetPasswordPlaintext: boolean;
  canToggleBlock: boolean;
  onAssign: (m: SchoolUser) => void;
  onResendInvite: (m: SchoolUser) => void;
  onResetPassword: (m: SchoolUser) => void;
  onToggleBlock: (m: SchoolUser) => void;
};

const STATUS_TONE: Record<SchoolUser['status'], 'success' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'danger',
};

function MemberCardBase({
  member,
  canAssignRole,
  canResendInvite,
  canResetPassword,
  canResetPasswordPlaintext,
  canToggleBlock,
  onAssign,
  onResendInvite,
  onResetPassword,
  onToggleBlock,
}: Props) {
  const name = `${member.firstName} ${member.lastName}`.trim();
  const hasEmail = !!member.email;
  const showResendInvite = canResendInvite && hasEmail;
  const showResetPassword = hasEmail ? canResetPassword : canResetPasswordPlaintext;

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Avatar name={name || member.id} size={44} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.email} numberOfLines={1}>{member.email ?? 'No email on file'}</Text>
        </View>
        {canToggleBlock ? (
          <Switch
            value={member.status === 'ACTIVE'}
            onValueChange={() => onToggleBlock(member)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            accessibilityLabel={member.status === 'ACTIVE' ? 'Block member' : 'Unblock member'}
          />
        ) : null}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="call-outline" size={14} color={colors.textHint} />
          <Text style={styles.metaText}>{member.phone ?? 'No phone'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textHint} />
          <Text style={styles.metaText}>Joined {new Date(member.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.badges}>
        <Badge label={member.roleName ?? member.role} tone="primary" />
        <Badge label={member.status} tone={STATUS_TONE[member.status]} />
      </View>

      {canAssignRole || showResendInvite || showResetPassword ? (
        <View style={styles.actions}>
          {canAssignRole ? (
            <Pressable style={styles.action} onPress={() => onAssign(member)} accessibilityLabel={`Assign role to ${name}`}>
              <Ionicons name="person-add-outline" size={16} color={colors.primaryDeep} />
              <Text style={styles.actionText}>Assign role</Text>
            </Pressable>
          ) : null}
          {showResendInvite ? (
            <Pressable style={styles.action} onPress={() => onResendInvite(member)} accessibilityLabel={`Resend invite to ${name}`}>
              <Ionicons name="mail-outline" size={16} color={colors.primaryDeep} />
              <Text style={styles.actionText}>Resend invite</Text>
            </Pressable>
          ) : null}
          {showResetPassword ? (
            <Pressable style={styles.action} onPress={() => onResetPassword(member)} accessibilityLabel={`Reset password for ${name}`}>
              <Ionicons name="key-outline" size={16} color={colors.primaryDeep} />
              <Text style={styles.actionText}>Reset password</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export const MemberCard = memo(MemberCardBase);

const styles = StyleSheet.create({
  card: { gap: 10, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  email: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  badges: { flexDirection: 'row', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: {
    flexGrow: 1, minWidth: '30%', height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
});
