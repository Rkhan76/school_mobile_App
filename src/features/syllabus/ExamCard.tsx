import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { ExamSyllabusItem } from './types';
import { examStatusLabel, formatDate } from './utils';

type Props = { item: ExamSyllabusItem; onEdit?: (exam: ExamSyllabusItem) => void };

function ExamCardBase({ item, onEdit }: Props) {
  const completed = item.daysRemaining < 0;
  const classLabel = item.section ? `${item.class.name} - ${item.section.name}` : item.class.name;
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.status, completed ? styles.statusDone : styles.statusUp]}>
          <Text style={[styles.statusText, { color: completed ? colors.warning : colors.blue }]}>
            {examStatusLabel(item.daysRemaining)}
          </Text>
        </View>
      </View>
      <View style={styles.typePill}>
        <Text style={styles.typeText}>{item.examType.name}</Text>
      </View>
      <Text style={styles.meta}>
        {item.subject.name} · {classLabel} · {item.maxMarks} marks · {formatDate(item.examDate)}
      </Text>

      <Text style={styles.section}>SYLLABUS</Text>
      {item.chapters.length === 0 ? <Text style={styles.empty}>No syllabus added yet.</Text> : null}
      {item.chapters.map((c, i) => (
        <View key={c.id} style={styles.chapter}>
          <Text style={styles.chNum}>{i + 1}</Text>
          <Text style={styles.chTitle} numberOfLines={2}>{c.title}</Text>
          <Text style={styles.topics}>{c.topics.length} topic{c.topics.length === 1 ? '' : 's'}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textHint} />
        </View>
      ))}

      {onEdit ? (
        <Pressable style={styles.editBtn} onPress={() => onEdit(item)} accessibilityLabel={`Edit syllabus for ${item.title}`}>
          <Ionicons name="pencil-outline" size={15} color={colors.primaryDeep} />
          <Text style={styles.editText}>Edit syllabus</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export const ExamCard = memo(ExamCardBase);

const styles = themed(() => StyleSheet.create({
  card: { gap: 8 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusDone: { backgroundColor: colors.warningBg },
  statusUp: { backgroundColor: '#dbeafe' },
  statusText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  typePill: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  typeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  section: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary, marginTop: 6 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  chapter: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: radius.sm, backgroundColor: colors.mintSoft,
  },
  chNum: { width: 16, fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  chTitle: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  topics: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  editBtn: {
    marginTop: 4, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  editText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
}));
