import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius, shadow, themed } from '../../theme/tokens';
import { STAFF_STATUSES, type AttendanceStatus, type StaffMember } from './mockAttendance';
import { StatusControl } from './parts';
import { STUDENT_STATUSES, type StudentRecord } from './types';

type Common = {
  onStatus: (id: string, s: AttendanceStatus | null) => void;
  onRemarks: (id: string, v: string) => void;
};

function RemarksRow({ id, value, open, onRemarks, disabled }: { id: string; value: string; open: boolean; onRemarks: Common['onRemarks']; disabled?: boolean }) {
  if (!open) return null;
  return (
    <TextInput
      value={value}
      onChangeText={(v) => onRemarks(id, v)}
      placeholder="Write remarks..."
      placeholderTextColor={colors.textHint}
      style={styles.remarks}
      maxLength={200}
      editable={!disabled}
    />
  );
}

function CardActions({ hasRemarks, open, onToggle, onHistory }: { hasRemarks: boolean; open: boolean; onToggle: () => void; onHistory: () => void }) {
  return (
    <View style={styles.actions}>
      <Pressable onPress={onToggle} hitSlop={8} accessibilityLabel="Toggle remarks" style={styles.iconBtn}>
        <Ionicons name={open ? 'chatbubble' : 'chatbubble-outline'} size={17} color={hasRemarks ? colors.primary : colors.textHint} />
      </Pressable>
      <Pressable onPress={onHistory} hitSlop={8} accessibilityLabel="View history" style={styles.iconBtn}>
        <Ionicons name="time-outline" size={19} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const CATEGORY_TONE: Record<string, 'primary' | 'warning' | 'neutral' | 'success'> = {
  Teaching: 'primary',
  Admin: 'warning',
  Support: 'neutral',
  Transport: 'success',
};

export const StaffCard = memo(function StaffCard({
  item, onStatus, onRemarks, onHistory,
}: Common & { item: StaffMember; onHistory: (m: StaffMember) => void }) {
  const [open, setOpen] = useState(item.remarks.length > 0);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Avatar name={item.name} size={40} />
        <View style={styles.titles}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>{item.empCode} · {item.role}</Text>
        </View>
        <Badge label={item.category} tone={CATEGORY_TONE[item.category]} />
        <CardActions hasRemarks={item.remarks.length > 0} open={open} onToggle={() => setOpen((o) => !o)} onHistory={() => onHistory(item)} />
      </View>
      <StatusControl value={item.status} options={STAFF_STATUSES} onChange={(s) => onStatus(item.id, s)} />
      <RemarksRow id={item.id} value={item.remarks} open={open} onRemarks={onRemarks} />
    </View>
  );
});

export const StudentCard = memo(function StudentCard({
  item, onStatus, onRemarks, onHistory, disabled,
}: Common & { item: StudentRecord; onHistory: (m: StudentRecord) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(item.remarks.length > 0);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.roll}>
          <Text style={styles.rollText}>{item.rollNo}</Text>
        </View>
        <Avatar name={item.name} size={38} />
        <View style={styles.titles}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.mono} numberOfLines={1}>{item.admissionNo}</Text>
        </View>
        <CardActions hasRemarks={item.remarks.length > 0} open={open} onToggle={() => setOpen((o) => !o)} onHistory={() => onHistory(item)} />
      </View>
      <StatusControl value={item.status} options={STUDENT_STATUSES} onChange={(s) => onStatus(item.id, s)} disabled={disabled} />
      <RemarksRow id={item.id} value={item.remarks} open={open} onRemarks={onRemarks} disabled={disabled} />
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  card: {
    backgroundColor: colors.cardSolid, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 12, gap: 10, ...shadow.card,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titles: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  mono: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  roll: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  rollText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  remarks: {
    height: 40, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.mintSoft, fontFamily: fonts.body, fontSize: 13, color: colors.text,
  },
}));
