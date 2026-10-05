import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { formatDateLong } from './types';
import type { ExamSchedule } from './types';

type Props = {
  item: ExamSchedule;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (e: ExamSchedule) => void;
  onDelete: (e: ExamSchedule) => void;
};

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={colors.textHint} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function ExamCardBase({ item, canEdit, canDelete, onEdit, onDelete }: Props) {
  const done = item.status === 'completed';
  const tone = done ? colors.warning : colors.success;
  const toneBg = done ? colors.warningBg : colors.successBg;
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.status, { backgroundColor: toneBg }]}>
          <Text style={[styles.statusText, { color: tone }]}>● {done ? 'Completed' : 'Upcoming'}</Text>
        </View>
      </View>
      <View style={styles.typeRow}>
        <View style={styles.typePill}><Text style={styles.typeText}>{item.examType}</Text></View>
        <Text style={styles.year}>{item.academicYear}</Text>
      </View>
      <View style={styles.metaWrap}>
        <Meta icon="school-outline" text={`${item.className} - ${item.sectionName}`} />
        <Meta icon="book-outline" text={item.subject} />
        <Meta icon="ribbon-outline" text={`${item.maxMarks} (pass ${item.passingMarks}) marks`} />
        <Meta icon="time-outline" text={`${item.durationMinutes} min`} />
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Exam date</Text>
        <Text style={styles.dateValue}>{formatDateLong(item.examDate)}</Text>
      </View>
      {canEdit || canDelete ? (
        <View style={styles.actions}>
          {canEdit ? (
            <Pressable style={styles.btn} onPress={() => onEdit(item)} accessibilityLabel={`Edit ${item.title}`}>
              <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.btnText}>Edit</Text>
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable style={[styles.btn, styles.del]} onPress={() => onDelete(item)} accessibilityLabel={`Delete ${item.title}`}>
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export const ExamCard = memo(ExamCardBase);

const styles = themed(() => StyleSheet.create({
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: '#dbeafe' },
  typeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: '#1d4ed8' },
  year: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  dateValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: {
    height: 36, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  del: { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
}));
