import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius, shadow } from '../../theme/tokens';
import { formatTime, subjectColor, type Period } from './types';

type Props = {
  period: Period;
  /** Subject; empty/undefined renders an empty (free) slot. */
  subject?: string;
  /** Secondary line: teacher name (class view) or class label (teacher view). */
  secondary?: string;
  room?: string;
  isNow?: boolean;
  /** Show avatar of `secondary` (class view). */
  showAvatar?: boolean;
  onPress?: () => void;
};

export function PeriodCard({ period, subject, secondary, room, isNow, showAvatar = true, onPress }: Props) {
  const filled = !!subject;
  const accent = filled ? subjectColor(subject) : colors.border;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, isNow && styles.cardNow]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${period.name}, ${filled ? subject : 'free'}`}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.left}>
        <Text style={styles.name}>{period.name}</Text>
        <Text style={styles.time}>{formatTime(period.startTime)}</Text>
        <Text style={styles.time}>{formatTime(period.endTime)}</Text>
      </View>
      <View style={styles.right}>
        {filled ? (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.subject} numberOfLines={1}>{subject}</Text>
              {isNow ? <Badge label="Now" tone="success" /> : null}
            </View>
            <View style={styles.teacherRow}>
              {showAvatar && secondary ? (
                <Avatar name={secondary} size={24} />
              ) : (
                <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              )}
              <Text style={styles.teacher} numberOfLines={1}>{secondary || 'No teacher assigned'}</Text>
            </View>
            {room ? (
              <View style={styles.roomRow}>
                <Ionicons name="location-outline" size={12} color={colors.textHint} />
                <Text style={styles.room}>{room}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.titleRow}>
            <Text style={styles.free}>{onPress ? 'Free - tap to assign' : 'Free period'}</Text>
            {isNow ? <Badge label="Now" tone="success" /> : null}
          </View>
        )}
      </View>
      {onPress ? <Ionicons name="create-outline" size={16} color={colors.textHint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingLeft: 18, overflow: 'hidden',
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  cardNow: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.mintSoft },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  left: { width: 76, gap: 1 },
  name: { fontFamily: fonts.heading, fontSize: 14, color: colors.text, marginBottom: 2 },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  right: { flex: 1, minWidth: 0, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subject: { flexShrink: 1, fontFamily: fonts.headingSemi, fontSize: 15, color: colors.text },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teacher: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textSecondary },
  roomRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  room: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  free: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint },
});
