import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import { formatDate } from '../../../lib/date';
import type { AcademicClass } from '../types';

interface Props {
  item: AcademicClass;
  onOpen: (id: string) => void;
  onEdit: (item: AcademicClass) => void;
  onDelete: (item: AcademicClass) => void;
  canEdit: boolean;
  canDelete: boolean;
}

function ClassCardBase({ item, onOpen, onEdit, onDelete, canEdit, canDelete }: Props) {
  return (
    <Card style={styles.card}>
      <Pressable onPress={() => onOpen(item.id)} accessibilityRole="button" accessibilityLabel={`Open ${item.name}`}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Badge label={`${item.sections.length} ${item.sections.length === 1 ? 'section' : 'sections'}`} tone="primary" />
        </View>
        <View style={styles.chips}>
          {item.sections.length === 0 ? (
            <Text style={styles.muted}>No sections</Text>
          ) : (
            item.sections.map((s) => (
              <View key={s.id} style={styles.chip}>
                <Text style={styles.chipText}>{s.name}</Text>
              </View>
            ))
          )}
        </View>
        <Text style={styles.desc} numberOfLines={2}>{item.description || '-'}</Text>
        <View style={styles.date}>
          <Ionicons name="calendar-outline" size={13} color={colors.textHint} />
          <Text style={styles.dateText}>Created {formatDate(item.createdAt)}</Text>
        </View>
      </Pressable>
      {canEdit || canDelete ? (
        <View style={styles.actions}>
          {canEdit ? (
            <Pressable style={styles.iconBtn} onPress={() => onEdit(item)} accessibilityLabel={`Edit ${item.name}`}>
              <Ionicons name="create-outline" size={18} color={colors.blue} />
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable style={[styles.iconBtn, styles.danger]} onPress={() => onDelete(item)} accessibilityLabel={`Delete ${item.name}`}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export const ClassCard = memo(ClassCardBase);

const styles = themed(() => StyleSheet.create({
  card: { padding: 14, gap: 10, borderRadius: radius.xl },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { minWidth: 26, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: colors.mint, alignItems: 'center' },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  muted: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 10 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  dateText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  actions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mintSoft },
  danger: { backgroundColor: colors.dangerBg },
}));
