import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { ChartCard } from './charts';
import { formatValue } from './format';
import type { KpiFormat, ReportKpi, ReportResponse, ReportTable } from './types';

function DeltaChip({ kpi }: { kpi: ReportKpi }) {
  if (kpi.delta === undefined) return null;
  const dir = kpi.deltaDirection ?? (kpi.delta > 0 ? 'up' : kpi.delta < 0 ? 'down' : 'flat');
  const good = dir === 'flat' ? null : (dir === 'up') !== !!kpi.lowerIsBetter;
  const fg = good === null ? colors.textSecondary : good ? colors.success : colors.danger;
  const bg = good === null ? '#eef2f1' : good ? colors.successBg : colors.dangerBg;
  const icon = dir === 'up' ? 'arrow-up' : dir === 'down' ? 'arrow-down' : 'remove';
  const unit = kpi.format === 'percent' ? ' pp' : '%';
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={11} color={fg} />
      <Text style={[styles.chipText, { color: fg }]}>{Math.abs(kpi.delta).toFixed(1)}{unit}</Text>
    </View>
  );
}

function KpiGrid({ kpis }: { kpis: ReportKpi[] }) {
  return (
    <View style={styles.grid}>
      {kpis.map((k, i) => (
        <Card key={k.key ?? `${k.label}-${i}`} style={styles.kpi}>
          <Text style={styles.kpiLabel} numberOfLines={1}>{k.label}</Text>
          <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{formatValue(k.value, k.format)}</Text>
          <DeltaChip kpi={k} />
        </Card>
      ))}
    </View>
  );
}

function Insights({ items }: { items: string[] }) {
  return (
    <Card style={{ gap: 8, padding: 14 }}>
      {items.map((t) => (
        <View key={t} style={styles.insight}>
          <Ionicons name="trending-up" size={16} color={colors.primary} style={{ marginTop: 1 }} />
          <Text style={styles.insightText}>{t}</Text>
        </View>
      ))}
    </Card>
  );
}

function cell(v: string | number | undefined, f?: KpiFormat): string {
  if (v === undefined) return '';
  return formatValue(v, f ?? 'text');
}

/** Up to 4 columns: compact table. More: one card per row with label/value pairs. */
function DataTable({ table }: { table: ReportTable }) {
  const { columns, rows } = table;
  if (columns.length <= 4) {
    return (
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={[styles.tr, styles.th]}>
          {columns.map((c, i) => (
            <Text key={c.key} style={[styles.thText, i === 0 ? { flex: 1.2 } : { flex: 1 }, c.align === 'right' && styles.right]} numberOfLines={1}>{c.label}</Text>
          ))}
        </View>
        {rows.map((r, ri) => (
          <View key={ri} style={[styles.tr, ri > 0 && styles.trBorder]}>
            {columns.map((c, i) => (
              <Text key={c.key} style={[styles.td, i === 0 ? { flex: 1.2, fontFamily: fonts.bodyMedium } : { flex: 1 }, c.align === 'right' && styles.right]} numberOfLines={1}>{cell(r[c.key], c.format)}</Text>
            ))}
          </View>
        ))}
      </Card>
    );
  }
  const [head, ...rest] = columns;
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r, ri) => (
        <Card key={ri} style={{ padding: 12, gap: 8 }}>
          <Text style={styles.rowTitle}>{cell(r[head.key], head.format)}</Text>
          <View style={styles.pairs}>
            {rest.map((c) => (
              <View key={c.key} style={styles.pair}>
                <Text style={styles.pairLabel} numberOfLines={1}>{c.label}</Text>
                <Text style={styles.pairValue} numberOfLines={1}>{cell(r[c.key], c.format)}</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}

export function isEmptyReport(d: ReportResponse): boolean {
  return d.kpis.length === 0 && d.charts.length === 0 && !d.table?.rows.length;
}

/** Generic renderer for any ReportResponse. */
export function ReportView({ data }: { data: ReportResponse }) {
  const unit: KpiFormat = data.table?.columns.find((c) => c.format && c.format !== 'text')?.format ?? data.kpis[0]?.format ?? 'number';
  const fmt = (v: number): string => formatValue(v, unit);
  return (
    <View style={{ gap: 12 }}>
      {data.kpis.length > 0 ? <KpiGrid kpis={data.kpis} /> : null}
      {data.insights && data.insights.length > 0 ? <Insights items={data.insights} /> : null}
      {data.charts.map((c) => <ChartCard key={c.title} chart={c} formatValue={fmt} />)}
      {data.table ? <DataTable table={data.table} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '48.5%', flexGrow: 1, padding: 14, gap: 4, borderRadius: radius.lg },
  kpiLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  kpiValue: { fontFamily: fonts.headingExtra, fontSize: 24, color: colors.text },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill, marginTop: 2 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  insight: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  insightText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 19 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 6 },
  th: { backgroundColor: colors.mintSoft },
  trBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  thText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  td: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  right: { textAlign: 'right' },
  rowTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  pairs: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  pair: { width: '50%' },
  pairLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  pairValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
});
