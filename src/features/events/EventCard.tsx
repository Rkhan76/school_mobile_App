import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { formatRange } from './dateUtils';
import type { EventStatus, SchoolEvent } from './types';

export const STATUS_TONE: Record<EventStatus, 'primary' | 'success' | 'neutral' | 'danger'> = {
  UPCOMING: 'primary',
  ONGOING: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

type Props = {
  item: SchoolEvent;
  onPress: (e: SchoolEvent) => void;
  onEdit: (e: SchoolEvent) => void;
  onDelete: (e: SchoolEvent) => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

function EventCardBase({ item, onPress, onEdit, onDelete, canEdit = true, canDelete = true }: Props) {
  return (
    <Pressable onPress={() => onPress(item)} accessibilityLabel={`Open ${item.title}`}>
      <Card style={[styles.card, item.isHoliday && styles.holiday]}>
        <View style={styles.top}>
          <View style={[styles.stripe, { backgroundColor: item.isHoliday ? colors.danger : colors.blue }]} />
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{formatRange(item.startDate, item.endDate)}</Text>
            </View>
            {item.location ? (
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.bottom}>
          <View style={styles.tags}>
            <Badge label={item.status} tone={STATUS_TONE[item.status]} />
            <View style={styles.pill}>
              <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.pillText}>{item.targetAudience}</Text>
            </View>
            {item.isHoliday ? (
              <View style={styles.holidayTag}>
                <Ionicons name="sunny-outline" size={12} color={colors.danger} />
                <Text style={styles.holidayText}>Holiday</Text>
              </View>
            ) : null}
          </View>
          {canEdit || canDelete ? (
            <View style={styles.actions}>
              {canEdit ? (
                <Pressable style={styles.act} onPress={() => onEdit(item)} hitSlop={6} accessibilityLabel="Edit event">
                  <Ionicons name="create-outline" size={18} color={colors.primaryDeep} />
                </Pressable>
              ) : null}
              {canDelete ? (
                <Pressable style={styles.act} onPress={() => onDelete(item)} hitSlop={6} accessibilityLabel="Delete event">
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export const EventCard = memo(EventCardBase);

const styles = StyleSheet.create({
  card: { gap: 12 },
  holiday: { backgroundColor: '#fff7f7', borderColor: colors.dangerBorder },
  top: { flexDirection: 'row', gap: 12 },
  stripe: { width: 4, borderRadius: 2 },
  body: { flex: 1, gap: 6 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tags: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, backgroundColor: '#eef2f1',
  },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  holidayTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, backgroundColor: colors.dangerBg,
  },
  holidayText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.danger },
  actions: { flexDirection: 'row', gap: 6 },
  act: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mintSoft,
  },
});
