import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow } from '../../theme/tokens';
import { listStamp } from './format';
import type { UIChatGroup } from './types';

type Props = { group: UIChatGroup; onPress: (id: string) => void };

export const GroupAvatar = memo(function GroupAvatar({ name, size = 46 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
});

function GroupRowImpl({ group, onPress }: Props) {
  const preview = group.lastMessage || group.description || 'No description';
  const hasUnread = group.unread > 0;
  return (
    <Pressable
      onPress={() => onPress(group.id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${group.unread} unread`}
    >
      <GroupAvatar name={group.name} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>{listStamp(group.lastAt)}</Text>
        </View>
        <View style={styles.bottom}>
          <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>{preview}</Text>
          {hasUnread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{group.unread > 99 ? '99+' : group.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const GroupRow = memo(GroupRowImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: colors.cardSolid, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  pressed: { backgroundColor: colors.mintSoft },
  avatar: { backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, color: colors.primaryDeep },
  body: { flex: 1, gap: 3 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  timeUnread: { color: colors.primary, fontFamily: fonts.bodySemi },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  previewUnread: { color: colors.text, fontFamily: fonts.bodyMedium },
  badge: {
    minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white },
});
