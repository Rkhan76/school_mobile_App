import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { SubjectWithAssignments } from './types';

type Props = {
  item: SubjectWithAssignments;
  canManage: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (s: SubjectWithAssignments) => void;
  onManage: (s: SubjectWithAssignments) => void;
  onEdit: (s: SubjectWithAssignments) => void;
  onDelete: (s: SubjectWithAssignments) => void;
};

function SubjectCardBase({ item, canManage, canEdit, canDelete, onView, onManage, onEdit, onDelete }: Props) {
  const shown = item.assignments.slice(0, 2);
  const extra = item.assignments.length - shown.length;
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={styles.code}>
          <Text style={styles.codeText}>{item.subjectCode}</Text>
        </View>
      </View>
      <Text style={[styles.desc, !item.description && styles.descEmpty]} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>
      <View style={styles.chips}>
        {item.assignments.length === 0 ? (
          <Text style={styles.none}>Not assigned</Text>
        ) : (
          <>
            {shown.map((a) => (
              <View key={a.id} style={styles.chip}>
                <Text style={styles.chipText}>{a.section.class.name} · {a.section.name}</Text>
              </View>
            ))}
            {extra > 0 ? <Text style={styles.more}>+{extra}</Text> : null}
          </>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={() => onView(item)} accessibilityLabel={`View ${item.name}`}>
          <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
        </Pressable>
        {canManage ? (
          <Pressable style={styles.manage} onPress={() => onManage(item)} accessibilityLabel={`Manage ${item.name}`}>
            <Ionicons name="bookmarks-outline" size={14} color={colors.orange} />
            <Text style={styles.manageText}>Manage</Text>
          </Pressable>
        ) : null}
        <View style={styles.spacer} />
        {canEdit ? (
          <Pressable style={styles.iconBtn} onPress={() => onEdit(item)} accessibilityLabel={`Edit ${item.name}`}>
            <Ionicons name="create-outline" size={18} color={colors.primaryDeep} />
          </Pressable>
        ) : null}
        {canDelete ? (
          <Pressable style={[styles.iconBtn, styles.del]} onPress={() => onDelete(item)} accessibilityLabel={`Delete ${item.name}`}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export const SubjectCard = memo(SubjectCardBase);

const styles = themed(() => StyleSheet.create({
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  code: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: '#dbeafe' },
  codeText: { fontFamily: fonts.monoMedium, fontSize: 12, color: '#1d4ed8' },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  descEmpty: { fontStyle: 'italic', color: colors.textHint },
  chips: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.border },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
  more: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  none: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  spacer: { flex: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mintSoft },
  del: { backgroundColor: colors.dangerBg },
  manage: {
    height: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, backgroundColor: '#fff1e6', borderWidth: 1, borderColor: '#fed7aa',
  },
  manageText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.orange },
}));
