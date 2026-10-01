import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import type { SubjectSyllabus } from './mockSyllabus';

type Props = {
  item: SubjectSyllabus;
  expanded: boolean;
  /** chapter ids marked complete (passed so memo re-renders on change) */
  doneIds: ReadonlySet<string>;
  onToggleExpand: (id: string) => void;
  onToggleChapter: (chapterId: string) => void;
  onEdit: (subject: SubjectSyllabus) => void;
};

function SubjectAccordionBase({ item, expanded, doneIds, onToggleExpand, onToggleChapter, onEdit }: Props) {
  const n = item.chapters.length;
  const doneCount = item.chapters.filter((c) => doneIds.has(c.id)).length;
  return (
    <Card style={styles.card}>
      <Pressable
        style={styles.head}
        onPress={() => onToggleExpand(item.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${item.name}, ${n} chapters`}
      >
        <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={18} color={colors.textSecondary} />
        <View style={styles.iconBox}>
          <Ionicons name="book-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.meta}>
            {n} chapter{n === 1 ? '' : 's'}{n > 0 ? ` · ${doneCount}/${n} done` : ''}
          </Text>
        </View>
        <Pressable style={styles.editBtn} onPress={() => onEdit(item)} hitSlop={6} accessibilityLabel={`Edit plan for ${item.name}`}>
          <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.editText}>Edit plan</Text>
        </Pressable>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {n === 0 ? <Text style={styles.empty}>No chapters planned yet.</Text> : null}
          {item.chapters.map((c, i) => {
            const done = doneIds.has(c.id);
            return (
              <Pressable
                key={c.id}
                style={styles.chapter}
                onPress={() => onToggleChapter(c.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={c.title}
              >
                <View style={[styles.check, done && styles.checkOn]}>
                  {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                </View>
                <Text style={styles.chNum}>{i + 1}</Text>
                <Text style={[styles.chTitle, done && styles.chDone]} numberOfLines={2}>{c.title}</Text>
                <Text style={styles.topics}>{c.topics} topic{c.topics === 1 ? '' : 's'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

export const SubjectAccordion = memo(SubjectAccordionBase);

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: {
    width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  name: { fontFamily: fonts.headingSemi, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  editBtn: {
    height: 32, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  editText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  body: { marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, paddingVertical: 10 },
  chapter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  check: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.textHint,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chNum: { width: 16, fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textHint },
  chTitle: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  chDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  topics: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
});
