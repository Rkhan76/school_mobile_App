import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { StructureFormModal } from './StructureFormModal';
import { Button, EmptyState, SkeletonCard, TextField } from './parts';
import { formatINR, structureTotal, useFeeStructures, type FeeStructure } from './mockFees';

const TAB_BAR_SPACE = 120;

type Section = 'structures' | 'types';

export function StructuresTab({ top }: { top: ReactElement }) {
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('structures');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeErr, setTypeErr] = useState('');
  const { structures, feeTypes, isLoading, refetch, addStructure, updateStructure, removeStructure, addFeeType, removeFeeType } =
    useFeeStructures();

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);

  const onRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);

  const confirmDelete = (s: FeeStructure) => {
    Alert.alert('Delete fee structure', `Delete the ${s.className} structure? Students assigned to it will become unassigned.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeStructure(s.id) },
    ]);
  };

  const submitType = () => {
    const err = addFeeType(typeName);
    setTypeErr(err ?? '');
    if (!err) setTypeName('');
  };

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.header}>
      {top}
      <View style={styles.seg}>
        {([['structures', 'Structures'], ['types', 'Fee Types']] as const).map(([k, label]) => {
          const on = section === k;
          return (
            <Pressable key={k} style={[styles.segBtn, on && styles.segOn]} onPress={() => setSection(k)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Text style={[styles.segText, on && { color: colors.white }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {section === 'structures' ? (
        <Button label="Add fee structure" icon="add" onPress={() => { setEditing(null); setFormOpen(true); }} />
      ) : (
        <Card style={{ gap: 10, padding: 14 }}>
          <TextField
            label="New fee type" value={typeName} placeholder="e.g. Library" error={typeErr}
            onChangeText={(t) => { setTypeName(t); setTypeErr(''); }} onSubmitEditing={submitType}
          />
          <Button label="Add fee type" icon="add" variant="soft" onPress={submitType} />
        </Card>
      )}
    </View>
  );

  const common = {
    ListHeaderComponent: header,
    ItemSeparatorComponent: Separator,
    refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />,
    contentContainerStyle: { paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE + insets.bottom },
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
  };

  return (
    <>
      {section === 'structures' ? (
        <FlatList<FeeStructure>
          {...common}
          data={showSkeleton ? [] : structures}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <StructureCard
              structure={item}
              onEdit={() => { setEditing(item); setFormOpen(true); }}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ListEmptyComponent={
            showSkeleton ? (
              <View style={{ gap: 12 }}>{[0, 1, 2].map((k) => <SkeletonCard key={k} height={170} />)}</View>
            ) : (
              <EmptyState icon="layers-outline" title="No fee structures" sub="Add a structure for a class to get started." />
            )
          }
        />
      ) : (
        <FlatList
          {...common}
          data={showSkeleton ? [] : feeTypes}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <View style={styles.type}>
              <Ionicons name="pricetag-outline" size={18} color={colors.primaryDeep} />
              <Text style={styles.typeName}>{item.name}</Text>
              <Pressable
                hitSlop={8} accessibilityLabel={`Delete ${item.name}`}
                onPress={() => {
                  Alert.alert('Delete fee type', `Delete ${item.name}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete', style: 'destructive',
                      onPress: () => { const err = removeFeeType(item.id); if (err) Alert.alert('Cannot delete', err); },
                    },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={19} color={colors.danger} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            showSkeleton ? <SkeletonCard height={60} /> : <EmptyState icon="pricetags-outline" title="No fee types" />
          }
        />
      )}

      <StructureFormModal
        visible={formOpen} structure={editing} structures={structures} feeTypes={feeTypes}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) updateStructure(editing.id, input);
          else addStructure(input);
          setFormOpen(false);
        }}
      />
    </>
  );
}

function StructureCard({ structure: s, onEdit, onDelete }: { structure: FeeStructure; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card style={{ gap: 10, padding: 14 }}>
      <View style={styles.cardTop}>
        <Text style={styles.cls}>{s.className}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} onPress={onEdit} accessibilityLabel={`Edit ${s.className}`}>
            <Ionicons name="create-outline" size={18} color={colors.primaryDeep} />
          </Pressable>
          <Pressable style={[styles.iconBtn, { backgroundColor: colors.dangerBg }]} onPress={onDelete} accessibilityLabel={`Delete ${s.className}`}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        {s.heads.map((h) => (
          <View key={h.id} style={styles.headRow}>
            <Text style={styles.headName}>{h.name}</Text>
            <Text style={styles.headAmt}>{formatINR(h.amount)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatINR(structureTotal(s))}</Text>
      </View>
    </Card>
  );
}

function Separator() {
  return <View style={{ height: 12 }} />;
}

const styles = themed(() => StyleSheet.create({
  header: { gap: 12, marginBottom: 14 },
  seg: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  segOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cls: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  headRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headName: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  headAmt: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  totalValue: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.primaryDeep },
  type: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 14, borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  typeName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
}));
