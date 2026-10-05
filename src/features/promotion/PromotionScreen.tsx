import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius, shadow, themed } from '../../theme/tokens';
import { Checkbox } from './Checkbox';
import { PromotionStudentCard } from './PromotionStudentCard';
import { ResultModal } from './ResultModal';
import { SelectField } from './SelectField';
import { SkipReasonModal } from './SkipReasonModal';
import {
  CAN_SKIP_CLASS, CLASSES, DECISIONS, FROM_YEARS, SECTIONS, TO_YEARS,
  buildPromotionChunks, defaultTarget, initialRow, submitPromotion, toOutcome, usePromotionStudents,
  type Decision, type PromoteItem, type PromotionResult, type PromotionRow,
} from './mockPromotion';

const BULK_DECISIONS = DECISIONS.filter((d) => CAN_SKIP_CLASS || d.value !== 'skip');

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export function PromotionScreen() {
  const insets = useSafeAreaInsets();
  const [fromYear, setFromYear] = useState<string | undefined>('2026-2027');
  const [classId, setClassId] = useState<string | undefined>('c10');
  const [sectionId, setSectionId] = useState<string | undefined>('A');
  const [toYear, setToYear] = useState<string | undefined>();
  const [rows, setRows] = useState<Record<string, PromotionRow>>({});
  const [deselected, setDeselected] = useState<ReadonlySet<string>>(new Set());
  const [skipFor, setSkipFor] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<PromotionResult | null>(null);

  const { students, isLoading } = usePromotionStudents(classId, sectionId);

  const rowOf = useCallback(
    (id: string): PromotionRow => rows[id] ?? initialRow(classId ?? ''),
    [rows, classId],
  );
  const selectedIds = useMemo(() => students.filter((s) => !deselected.has(s.id)).map((s) => s.id), [students, deselected]);
  const allSelected = students.length > 0 && selectedIds.length === students.length;

  const resetSelection = () => { setRows({}); setDeselected(new Set()); };

  const toggle = useCallback((id: string) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = () => setDeselected(allSelected ? new Set(students.map((s) => s.id)) : new Set());

  const applyDecision = useCallback((ids: string[], decision: Decision, reason?: string) => {
    if (!classId) return;
    setRows((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        next[id] = { decision, targetClassId: defaultTarget(decision, classId), reason: decision === 'skip' ? reason : undefined };
      }
      return next;
    });
  }, [classId]);

  const requestDecision = useCallback((ids: string[], decision: Decision) => {
    if (decision === 'skip') setSkipFor(ids);
    else applyDecision(ids, decision);
  }, [applyDecision]);

  const onDecision = useCallback((id: string, d: Decision) => requestDecision([id], d), [requestDecision]);
  const onTarget = useCallback((id: string, target: string) => {
    setRows((prev) => ({ ...prev, [id]: { ...(prev[id] ?? initialRow(classId ?? '')), targetClassId: target } }));
  }, [classId]);

  const canApply = !!toYear && selectedIds.length > 0 && !submitting;

  const apply = async () => {
    if (!toYear) return;
    const items: PromoteItem[] = selectedIds.map((id) => {
      const r = rowOf(id);
      return {
        studentId: id,
        outcome: toOutcome(r.decision),
        ...(needsTargetClass(r) ? { targetClassId: r.targetClassId } : {}),
        ...(r.reason ? { reason: r.reason } : {}),
      };
    });
    const chunks = buildPromotionChunks(items);
    setSubmitting({ done: 0, total: chunks.length });
    try {
      const res = await submitPromotion(chunks, toYear, (done, total) => setSubmitting({ done, total }));
      setResult(res);
    } finally {
      setSubmitting(null);
    }
  };

  const hasClass = !!classId && !!sectionId;

  const header = (
    <View style={styles.headerWrap}>
      <Card style={styles.filters}>
        <View style={styles.filterRow}>
          <SelectField label="From year" title="From year" placeholder="Select year" value={fromYear} options={FROM_YEARS} onChange={setFromYear} />
          <SelectField
            label="Class" title="Class" placeholder="Select class" value={classId} options={CLASSES}
            onChange={(v) => { setClassId(v); resetSelection(); }}
          />
        </View>
        <View style={styles.filterRow}>
          <SelectField
            label="Section" title="Section" placeholder="Select section" value={sectionId} options={SECTIONS}
            onChange={(v) => { setSectionId(v); resetSelection(); }}
          />
          <SelectField label="Promote to year" title="Promote to year" placeholder="Target year" value={toYear} options={TO_YEARS} onChange={setToYear} />
        </View>
      </Card>

      {hasClass && !isLoading && students.length > 0 ? (
        <Card style={styles.bulk}>
          <View style={styles.selectRow}>
            <Checkbox checked={allSelected} onPress={toggleAll} label="Select all" />
            <Text style={styles.selectAll}>Select all</Text>
            <Text style={styles.count}>{selectedIds.length} of {students.length} selected</Text>
          </View>
          <Text style={styles.setLabel}>Set selected to</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {BULK_DECISIONS.map((d) => (
              <Pressable
                key={d.value}
                style={[styles.chip, selectedIds.length === 0 && styles.chipOff]}
                disabled={selectedIds.length === 0}
                onPress={() => requestDecision(selectedIds, d.value)}
              >
                <Text style={styles.chipText}>{d.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Card>
      ) : null}

      {hasClass && isLoading ? (
        <View style={styles.skeletons}>{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</View>
      ) : null}
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Student Promotion"
        subtitle={hasClass && !isLoading ? `${students.length} students` : 'End-of-year decisions'}
        back
      />
      <FlatList
        data={hasClass && !isLoading ? students : []}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <PromotionStudentCard
              student={item}
              row={rowOf(item.id)}
              selected={!deselected.has(item.id)}
              onToggle={toggle}
              onDecision={onDecision}
              onTarget={onTarget}
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Ionicons name={hasClass ? 'people-outline' : 'school-outline'} size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>{hasClass ? 'No students found' : 'Select class and section'}</Text>
              <Text style={styles.emptySub}>
                {hasClass ? 'This class has no active students.' : 'Choose a class and section to load students.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 110, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />

      {hasClass && !isLoading && students.length > 0 ? (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
          {!toYear ? <Text style={styles.hint}>Choose a target year to continue</Text> : null}
          <Pressable
            style={[styles.applyBtn, !canApply && styles.applyOff]}
            disabled={!canApply}
            onPress={apply}
            accessibilityRole="button"
          >
            {submitting ? (
              <>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.applyText}>Processing {submitting.done}/{submitting.total}</Text>
              </>
            ) : (
              <>
                <Ionicons name="school-outline" size={18} color={colors.white} />
                <Text style={styles.applyText}>
                  Apply to {selectedIds.length} student{selectedIds.length === 1 ? '' : 's'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      <SkipReasonModal
        visible={skipFor !== null}
        count={skipFor?.length ?? 0}
        onClose={() => setSkipFor(null)}
        onSubmit={(reason) => {
          if (skipFor) applyDecision(skipFor, 'skip', reason);
          setSkipFor(null);
        }}
      />
      <ResultModal result={result} students={students} onClose={() => setResult(null)} />
    </ScreenBackground>
  );
}

function needsTargetClass(r: PromotionRow): boolean {
  return r.decision === 'promote' || r.decision === 'repeat' || r.decision === 'skip';
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 2 },
  filters: { padding: 12, gap: 10, borderRadius: radius.lg },
  filterRow: { flexDirection: 'row', gap: 10 },
  bulk: { padding: 12, gap: 8, borderRadius: radius.lg },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectAll: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  count: { flex: 1, textAlign: 'right', fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  setLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary, textTransform: 'uppercase' },
  chips: { gap: 8, paddingRight: 4 },
  chip: {
    height: 34, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
  },
  chipOff: { opacity: 0.45 },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primaryDeep },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 10 },
  skeleton: { height: 120, borderRadius: radius.lg, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, gap: 6,
    backgroundColor: colors.cardSolid, borderTopWidth: 1, borderTopColor: colors.border,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.card,
  },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.warning, textAlign: 'center' },
  applyBtn: {
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  applyOff: { opacity: 0.45 },
  applyText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.white },
}));
