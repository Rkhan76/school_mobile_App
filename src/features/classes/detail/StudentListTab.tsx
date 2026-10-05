import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Card } from '../../../components/ui/Card';
import { colors, fonts, themed } from '../../../theme/tokens';
import { ErrorState } from '../../employees/ListStates';
import type { StudentListItem } from '../../students/types';
import { useSectionStudents } from '../hooks';
import type { ClassSection } from '../types';

function StudentRow({ s, index, onPress }: { s: StudentListItem; index: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${s.fullName}`}>
      <Card style={styles.row}>
        <View style={styles.sl}>
          <Text style={styles.slText}>{index + 1}</Text>
        </View>
        <Avatar name={s.fullName} size={38} />
        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>{s.fullName}</Text>
          <Text style={styles.adm} numberOfLines={1}>{s.admissionNumber}</Text>
        </View>
        <View style={styles.roll}>
          <Text style={styles.rollLabel}>ROLL NO</Text>
          <Text style={styles.rollValue}>{s.rollNumber ?? '-'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textHint} />
      </Card>
    </Pressable>
  );
}

export function StudentListTab({ classId, section }: { classId: string; section: ClassSection }) {
  const router = useRouter();
  const { rows, total, isLoading, isLoadingMore, error, hasMore, loadMore, refetch } = useSectionStudents({
    classId,
    sectionId: section.id,
    academicYearId: section.academicYearId,
  });

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} style={styles.skel} />
        ))}
      </View>
    );
  }
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <View style={styles.wrap}>
      {rows.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="people-outline" size={32} color={colors.textHint} />
          <Text style={styles.emptyText}>No students in this section</Text>
        </Card>
      ) : (
        rows.map((s, i) => (
          <StudentRow key={s.id} s={s} index={i} onPress={() => router.push({ pathname: '/student/[id]', params: { id: s.id } })} />
        ))
      )}
      {hasMore ? (
        <Pressable style={styles.more} onPress={loadMore} disabled={isLoadingMore} accessibilityRole="button">
          {isLoadingMore ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.moreText}>Load more</Text>}
        </Pressable>
      ) : null}
      <Text style={styles.footer}>
        {rows.length === 0 ? 'Showing 0 entries' : `Showing ${rows.length} of ${total} entries`}
      </Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18 },
  sl: { width: 24, alignItems: 'center' },
  slText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  mid: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.text },
  adm: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSecondary },
  roll: { alignItems: 'center', minWidth: 44 },
  rollLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 0.6, color: colors.textHint },
  rollValue: { fontFamily: fonts.heading, fontSize: 15, color: colors.primaryDeep },
  skel: { height: 60, backgroundColor: colors.mint },
  more: { alignSelf: 'center', height: 38, paddingHorizontal: 20, borderRadius: 19, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  footer: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
}));
