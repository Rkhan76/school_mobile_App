import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { ChoiceSheet, type Choice } from './ChoiceSheet';
import { ScaleCard } from './ScaleCard';
import { ScaleEditorModal } from './ScaleEditorModal';
import { TEMPLATES, templateBands, useGradingScales, type GradingScale } from './mockGrading';
import { TryPercentage } from './TryPercentage';

type Sheet = 'scale' | 'template' | null;

export function GradingScalesScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, add, update, remove, makeDefault } = useGradingScales();
  const [refreshing, setRefreshing] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [tryId, setTryId] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GradingScale | null>(null);

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const tryScale = useMemo(
    () => data.find((s) => s.id === tryId) ?? data.find((s) => s.isDefault) ?? data[0] ?? null,
    [data, tryId],
  );

  const scaleChoices = useMemo<Choice[]>(() => data.map((s) => ({ value: s.id, label: s.name })), [data]);
  const templateChoices = useMemo<Choice[]>(
    () => TEMPLATES.map((t) => ({ value: t.key, label: t.name, hint: t.description })),
    [],
  );

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const openNew = useCallback(() => {
    setEditing(null); setEditorOpen(true);
  }, []);
  const onEdit = useCallback((s: GradingScale) => {
    setEditing(s); setEditorOpen(true);
  }, []);

  const pickTemplate = (key: string) => {
    setSheet(null);
    const t = TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    // Template creates a copy straight away (editable afterwards).
    add({ name: `${t.name} (copy)`, description: t.description, bands: templateBands(t) });
  };

  const onMakeDefault = useCallback((s: GradingScale) => makeDefault(s.id), [makeDefault]);
  const onDelete = useCallback((s: GradingScale) => {
    if (s.isDefault) return;
    Alert.alert('Delete scale', `Delete "${s.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(s.id) },
    ]);
  }, [remove]);

  const showSkeleton = isLoading && !refreshing && data.length === 0;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.row}>
        <Pressable style={styles.secondary} onPress={doRefresh}>
          <Ionicons name="refresh" size={16} color={colors.textSecondary} />
          <Text style={styles.secondaryText}>Refresh</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => setSheet('template')}>
          <Ionicons name="albums-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.secondaryText}>Start from template</Text>
        </Pressable>
      </View>
      {!showSkeleton ? <TryPercentage scale={tryScale} onPickScale={() => setSheet('scale')} /> : null}
      {showSkeleton ? (
        <View style={styles.skeletons}>
          <View style={[styles.skeleton, { height: 150 }]} />
          {[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Grading Scales"
        subtitle={isLoading && data.length === 0 ? undefined : `${data.length} scale${data.length === 1 ? '' : 's'}`}
        back
        right={
          <Pressable style={styles.newBtn} onPress={openNew} accessibilityLabel="New scale">
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.newText}>New Scale</Text>
          </Pressable>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <ScaleCard scale={item} onMakeDefault={onMakeDefault} onEdit={onEdit} onDelete={onDelete} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="options-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No grading scales yet</Text>
              <Text style={styles.emptySub}>Create one or start from a template.</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <ChoiceSheet
        visible={sheet === 'scale'}
        title="Select scale"
        options={scaleChoices}
        value={tryScale?.id}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setTryId(v); setSheet(null); }}
      />
      <ChoiceSheet
        visible={sheet === 'template'}
        title="Start from template"
        options={templateChoices}
        onClose={() => setSheet(null)}
        onSelect={pickTemplate}
      />
      <ScaleEditorModal
        visible={editorOpen}
        scale={editing}
        onClose={() => setEditorOpen(false)}
        onSubmit={(input) => {
          if (editing) update(editing.id, input);
          else add(input);
          setEditorOpen(false);
        }}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  secondary: {
    flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  secondaryText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 170, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  newBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  newText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
}));
