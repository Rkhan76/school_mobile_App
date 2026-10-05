import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, themed } from '../../../theme/tokens';
import { formatINR, type IconName } from './ui';
import type { StudentDetail } from './studentDetail';

function Mini({ label, value, note, noteIcon, icon }: { label: string; value: string; note: string; noteIcon?: IconName; icon: IconName }) {
  return (
    <View style={styles.tile}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.icon}>
          <Ionicons name={icon} size={12} color={colors.primaryDeep} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.noteRow}>
        {noteIcon ? <Ionicons name={noteIcon} size={12} color={colors.primaryDeep} /> : null}
        <Text style={styles.note} numberOfLines={1}>{note}</Text>
      </View>
    </View>
  );
}

export function StatRow({ s }: { s: StudentDetail }) {
  const due = s.fees.totalDue;
  const statusLabel = s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : '—';
  return (
    <View style={styles.row}>
      <Mini label="ATTD." value={`${s.attendance.overallPct}%`} note="Optimal" icon="checkmark-done" />
      <Mini
        label="DUES"
        value={due === 0 ? '₹0 Due' : `${formatINR(due)} Due`}
        note={due === 0 ? 'Cleared' : 'Pending'}
        noteIcon={due === 0 ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        icon="cash-outline"
      />
      <Mini label="STATUS" value={statusLabel} note={s.category} icon="shield-checkmark-outline" />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minWidth: 0, backgroundColor: colors.cardSolid, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4, ...shadow.card },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.5, color: colors.textSecondary },
  icon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.primaryDeep },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  note: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textSecondary },
}));
