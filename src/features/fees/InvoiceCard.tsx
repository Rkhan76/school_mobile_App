import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { formatDate, formatINR, isOverdue, statusTone, type Invoice } from './mockFees';

type Props = { invoice: Invoice; onPress: (id: string) => void };

function Amount({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.amt}>
      <Text style={styles.amtLabel}>{label}</Text>
      <Text style={[styles.amtValue, color ? { color } : null]} numberOfLines={1}>{formatINR(value)}</Text>
    </View>
  );
}

function InvoiceCardBase({ invoice: i, onPress }: Props) {
  const late = isOverdue(i);
  return (
    <Pressable onPress={() => onPress(i.id)} accessibilityRole="button" accessibilityLabel={`Invoice ${i.invoiceNo}`}>
      <Card style={{ gap: 12, padding: 14 }}>
        <View style={styles.top}>
          <Text style={styles.no}>{i.invoiceNo}</Text>
          <Badge label={i.status} tone={statusTone(i.status)} />
        </View>
        <View style={styles.student}>
          <Avatar name={i.studentName} size={42} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{i.studentName}</Text>
            <Text style={styles.sub} numberOfLines={1}>{i.className} · {i.period}</Text>
          </View>
        </View>
        <View style={styles.dueRow}>
          <Text style={styles.sub}>Due date</Text>
          <Text style={[styles.due, late && { color: colors.danger }]}>{formatDate(i.dueDate)}</Text>
        </View>
        <View style={styles.amounts}>
          <Amount label="Total" value={i.total} />
          <Amount label="Paid" value={i.paid} color={colors.success} />
          <Amount label="Outstanding" value={i.outstanding} color={i.outstanding > 0 ? colors.danger : colors.textSecondary} />
        </View>
      </Card>
    </Pressable>
  );
}

export const InvoiceCard = memo(InvoiceCardBase);

const styles = themed(() => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  no: { fontFamily: fonts.monoMedium, fontSize: 14, color: colors.primaryDeep },
  student: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  dueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  due: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  amounts: { flexDirection: 'row', gap: 8, backgroundColor: colors.mintSoft, borderRadius: radius.md, padding: 10 },
  amt: { flex: 1, minWidth: 0, gap: 2 },
  amtLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textSecondary },
  amtValue: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
}));
