import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { formatShort } from './dateUtils';
import type { AttendanceStatus } from './mockAttendance';

/** Richer than mockAttendance's HistoryEntry: carries the saved row's id so a
 * same-day entry can offer a correction affordance (student history only —
 * staff history entries simply omit `id` and behave exactly as before). */
export type HistoryEntry = { date: string; status: AttendanceStatus | null; id?: string };

const CORRECTION_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

/* ------------------------------ status meta ------------------------------ */

export const STATUS_META = themed<Record<AttendanceStatus, { label: string; fg: string; bg: string }>>(() => ({
  PRESENT: { label: 'Present', fg: colors.success, bg: colors.successBg },
  ABSENT: { label: 'Absent', fg: colors.danger, bg: colors.dangerBg },
  LATE: { label: 'Late', fg: colors.warning, bg: colors.warningBg },
  EXCUSED: { label: 'Excused', fg: colors.purple, bg: '#f3e8ff' },
  LEAVE: { label: 'Leave', fg: colors.purple, bg: '#f3e8ff' },
}));

export function countStatuses(rows: { status: AttendanceStatus | null }[]): Record<AttendanceStatus | 'NONE', number> {
  const out: Record<AttendanceStatus | 'NONE', number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, LEAVE: 0, NONE: 0 };
  rows.forEach((r) => {
    out[r.status ?? 'NONE'] += 1;
  });
  return out;
}

/* ------------------------------ status control ------------------------------ */

type ControlProps = {
  value: AttendanceStatus | null;
  options: AttendanceStatus[];
  onChange: (s: AttendanceStatus | null) => void;
  disabled?: boolean;
};

/** Segmented status buttons; tapping the active one clears it. */
export const StatusControl = memo(function StatusControl({ value, options, onChange, disabled }: ControlProps) {
  return (
    <View style={[styles.segRow, disabled && { opacity: 0.5 }]}>
      {options.map((o) => {
        const m = STATUS_META[o];
        const on = value === o;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(on ? null : o)}
            disabled={disabled}
            style={[styles.seg, { borderColor: on ? m.fg : colors.border, backgroundColor: on ? m.fg : colors.cardSolid }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled }}
            accessibilityLabel={m.label}
          >
            <View style={[styles.dot, { backgroundColor: on ? colors.white : m.fg }]} />
            <Text style={[styles.segText, { color: on ? colors.white : colors.text }]} numberOfLines={1}>{m.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

export function StatusPill({ status }: { status: AttendanceStatus | null }) {
  if (!status) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.neutralBg }]}>
        <Text style={[styles.pillText, { color: colors.textSecondary }]}>Holiday</Text>
      </View>
    );
  }
  const m = STATUS_META[status];
  return (
    <View style={[styles.pill, { backgroundColor: m.bg }]}>
      <Text style={[styles.pillText, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

/* ------------------------------ buttons ------------------------------ */

type BtnProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
};

export function ActionButton({ label, icon, onPress, tone = 'ghost', disabled }: BtnProps) {
  const fg = tone === 'primary' ? colors.white : tone === 'danger' ? colors.danger : colors.primaryDeep;
  const bg = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.dangerBg : colors.cardSolid;
  const border = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.dangerBorder : colors.border;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: bg, borderColor: border }, disabled && { opacity: 0.5 }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={15} color={fg} />
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------ pickers ------------------------------ */

type PickerProps = {
  label: string;
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
};

export function PickerField({ label, value, placeholder, disabled, onPress }: PickerProps) {
  return (
    <View style={styles.pickWrap}>
      <Text style={styles.pickLabel}>{label}</Text>
      <Pressable
        style={[styles.pickField, disabled && { opacity: 0.55 }]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
      >
        <Text style={[styles.pickText, !value && { color: colors.textHint, fontFamily: fonts.body }]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textHint} />
      </Pressable>
    </View>
  );
}

export type Option = { value: string; label: string };

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {children}
      </View>
    </Modal>
  );
}

type OptionSheetProps = {
  visible: boolean;
  title: string;
  options: Option[];
  value: string | null;
  onSelect: (v: string) => void;
  onClose: () => void;
};

export function OptionSheet({ visible, title, options, value, onSelect, onClose }: OptionSheetProps) {
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <ScrollView style={{ flexGrow: 0 }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable key={o.value} onPress={() => onSelect(o.value)} style={[styles.optRow, active && { backgroundColor: colors.mintSoft }]}>
              <Text style={[styles.optText, active && { fontFamily: fonts.bodySemi, color: colors.primaryDeep }]}>{o.label}</Text>
              {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

/* ------------------------------ history sheet ------------------------------ */

type HistoryProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  entries: HistoryEntry[];
  onClose: () => void;
  /** Shows a loading state instead of the list (e.g. while fetching real history). */
  loading?: boolean;
  /** Only entries dated exactly this (ISO) day may be corrected — matches the
   * backend's same-day-only correction window. Omit to disable correction entirely. */
  correctableDate?: string | null;
  /** Present only when the viewer holds the correction permission. */
  onCorrect?: (entry: HistoryEntry, update: { status: AttendanceStatus; reason: string }) => Promise<void> | void;
};

export function HistorySheet({ visible, title, subtitle, entries, onClose, loading, correctableDate, onCorrect }: HistoryProps) {
  const counted = entries.filter((e) => e.status);
  const good = counted.filter((e) => e.status === 'PRESENT' || e.status === 'LATE').length;
  const pct = counted.length ? Math.round((good / counted.length) * 100) : 0;
  const [editing, setEditing] = useState<HistoryEntry | null>(null);
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setEditing(null);
      setReason('');
      setSubmitting(false);
    }
  }, [visible]);

  const startEdit = (e: HistoryEntry) => {
    setEditing(e);
    setPendingStatus(e.status);
    setReason('');
  };

  const submit = async () => {
    if (!editing || !onCorrect || reason.trim().length < 3 || !pendingStatus) return;
    setSubmitting(true);
    try {
      await onCorrect(editing, { status: pendingStatus, reason: reason.trim() });
      setEditing(null);
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <Text style={styles.histSub}>{subtitle}</Text>
      <View style={styles.histSummary}>
        <Text style={styles.histPct}>{pct}%</Text>
        <Text style={styles.histCaption}>attendance over the last {entries.length} working days</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : (
        <ScrollView style={{ flexGrow: 0 }}>
          {entries.map((e) => {
            const canCorrect = !!onCorrect && !!e.id && !!correctableDate && e.date === correctableDate;
            const isEditing = !!editing && editing.id === e.id && editing.date === e.date;
            return (
              <View key={e.date}>
                <View style={styles.histRow}>
                  <Text style={styles.histDate}>{formatShort(e.date)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <StatusPill status={e.status} />
                    {canCorrect ? (
                      <Pressable onPress={() => (isEditing ? setEditing(null) : startEdit(e))} hitSlop={8} accessibilityLabel="Correct this entry">
                        <Ionicons name={isEditing ? 'close' : 'create-outline'} size={17} color={colors.primaryDeep} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                {isEditing ? (
                  <View style={styles.correctBox}>
                    <StatusControl value={pendingStatus} options={CORRECTION_STATUSES} onChange={setPendingStatus} />
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Reason for correction (min 3 characters)..."
                      placeholderTextColor={colors.textHint}
                      style={styles.correctReason}
                      maxLength={200}
                    />
                    <Pressable
                      onPress={submit}
                      disabled={submitting || reason.trim().length < 3 || !pendingStatus}
                      style={[styles.correctSave, (submitting || reason.trim().length < 3 || !pendingStatus) && { opacity: 0.5 }]}
                      accessibilityRole="button"
                    >
                      {submitting ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.correctSaveText}>Save correction</Text>}
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

/* ------------------------------ states ------------------------------ */

function Bone({ style }: { style: object }) {
  const op = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ backgroundColor: colors.border, opacity: op }, style]} />;
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.skelCard}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Bone style={{ width: 40, height: 40, borderRadius: 20 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <Bone style={{ width: '55%', height: 12, borderRadius: 6 }} />
              <Bone style={{ width: '35%', height: 10, borderRadius: 5 }} />
            </View>
          </View>
          <Bone style={{ height: 34, borderRadius: radius.md }} />
        </View>
      ))}
    </View>
  );
}

export function EmptyState({ icon, title, hint }: { icon: keyof typeof Ionicons.glyphMap; title: string; hint: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyHint}>{hint}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  segRow: { flexDirection: 'row', gap: 6 },
  seg: {
    flex: 1, height: 36, borderRadius: radius.pill, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  segText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  btn: {
    height: 38, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  pickWrap: { flex: 1, minWidth: 0, gap: 4 },
  pickLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary },
  pickField: {
    height: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  pickText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '75%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 4 },
  optRow: {
    height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderRadius: radius.md,
  },
  optText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  histSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  histSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.mintSoft, marginBottom: 6,
  },
  histPct: { fontFamily: fonts.headingExtra, fontSize: 22, color: colors.primaryDeep },
  histCaption: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  histRow: {
    height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  histDate: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  correctBox: { gap: 8, paddingVertical: 10, paddingHorizontal: 2 },
  correctReason: {
    height: 40, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.mintSoft, fontFamily: fonts.body, fontSize: 13, color: colors.text,
  },
  correctSave: {
    height: 40, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  correctSaveText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  skelCard: {
    backgroundColor: colors.cardSolid, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 12,
  },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptyHint: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
}));
