import { memo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { isoToDisplay, type Member } from './mockMembers';

type Props = {
  member: Member;
  roleName: string;
  onAssign: (m: Member) => void;
  onPermissions: (m: Member) => void;
  onToggle: (m: Member, active: boolean) => void;
};

function MemberCardBase({ member, roleName, onAssign, onPermissions, onToggle }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Avatar name={member.name} size={44} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{member.email}</Text>
        </View>
        <Switch
          value={member.active}
          onValueChange={(v) => onToggle(member, v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          accessibilityLabel={member.active ? 'Disable member' : 'Enable member'}
        />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="call-outline" size={14} color={colors.textHint} />
          <Text style={styles.metaText}>{member.phone}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textHint} />
          <Text style={styles.metaText}>Joined {isoToDisplay(member.joinedAt)}</Text>
        </View>
      </View>

      <View style={styles.badges}>
        <Badge label={roleName} tone="primary" />
        <Badge label={member.active ? 'Active' : 'Inactive'} tone={member.active ? 'success' : 'neutral'} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onAssign(member)} accessibilityLabel={`Assign role to ${member.name}`}>
          <Ionicons name="person-add-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.actionText}>Assign role</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => onPermissions(member)} accessibilityLabel={`Permissions of ${member.name}`}>
          <Ionicons name="key-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.actionText}>Permissions</Text>
        </Pressable>
      </View>
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
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
});
