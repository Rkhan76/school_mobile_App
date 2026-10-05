import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { colors, fonts, themed } from '../../../theme/tokens';
import { ErrorState } from '../../employees/ListStates';
import { useSectionSubjects } from '../hooks';
import type { ClassSection } from '../types';

export function SubjectsTab({ section }: { section: ClassSection }) {
  const { data, isLoading, error, refetch } = useSectionSubjects(section.id, section.academicYearId);

  if (isLoading) {
    return (
      <View style={styles.skelWrap}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} style={styles.skel} />
        ))}
      </View>
    );
  }
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (data.length === 0) {
    return (
      <Card style={styles.empty}>
        <Ionicons name="book-outline" size={32} color={colors.textHint} />
        <Text style={styles.emptyText}>No subjects assigned to this section</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.list}>
      {data.map((s) => (
        <View key={s.id} style={styles.row}>
          <View style={styles.icon}>
            <Ionicons name="book-outline" size={17} color={colors.primaryDeep} />
          </View>
          <View style={styles.mid}>
            <Text style={styles.title} numberOfLines={1}>
              {s.subject.name}
              {s.subject.subjectCode ? ` (${s.subject.subjectCode})` : ''}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>{s.teacher?.fullName ?? 'Unassigned'}</Text>
          </View>
          {s.isOptional ? <Text style={styles.chip}>Optional</Text> : null}
        </View>
      ))}
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  list: { gap: 14, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  chip: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.primaryDeep, backgroundColor: colors.mint, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  skelWrap: { gap: 10 },
  skel: { height: 56, backgroundColor: colors.mint },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
}));
