import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import { compact, niceScale } from './format';
import { SERIES_COLORS } from './mockReports';
import type { ChartSeries, ReportChart } from './types';

const H = 200;
const M = { l: 38, r: 10, t: 10, b: 26 };

const colorOf = (s: ChartSeries, i: number): string => s.color ?? SERIES_COLORS[i % SERIES_COLORS.length];

function Legend({ items }: { items: { name: string; color: string; value?: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((it) => (
        <View key={it.name} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: it.color }]} />
          <Text style={styles.legendText}>{it.name}{it.value ? `  ${it.value}` : ''}</Text>
        </View>
      ))}
    </View>
  );
}

/** Shared axes / grid for cartesian charts. Children get plot geometry. */
function Axes({ width, top, step, cats, xAt, children }: {
  width: number; top: number; step: number; cats: string[]; xAt: (i: number) => number; children: React.ReactNode;
}) {
  const plotW = width - M.l - M.r;
  const plotH = H - M.t - M.b;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const stride = Math.max(1, Math.ceil(cats.length / Math.max(2, Math.floor(plotW / 54))));
  return (
    <Svg width={width} height={H}>
      {ticks.map((v) => {
        const y = M.t + plotH * (1 - v / top);
        return (
          <G key={v}>
            <Line x1={M.l} x2={width - M.r} y1={y} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray={v === 0 ? undefined : '3,4'} />
            <SvgText x={M.l - 6} y={y + 3.5} fontSize={10} fill={colors.textHint} textAnchor="end" fontFamily={fonts.body}>{compact(v)}</SvgText>
          </G>
        );
      })}
      {cats.map((c, i) => (i % stride === 0 ? (
        <SvgText key={`${c}-${i}`} x={xAt(i)} y={H - 8} fontSize={10} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.body}>{c}</SvgText>
      ) : null))}
      {children}
    </Svg>
  );
}

function maxOf(series: ChartSeries[], stacked: boolean): number {
  const n = Math.max(0, ...series.map((s) => s.data.length));
  let m = 0;
  for (let i = 0; i < n; i++) {
    if (stacked) m = Math.max(m, series.reduce((a, s) => a + (s.data[i] ?? 0), 0));
    else series.forEach((s) => { m = Math.max(m, s.data[i] ?? 0); });
  }
  return m;
}

function LineArea({ chart, width, area }: { chart: ReportChart; width: number; area: boolean }) {
  const { top, step } = niceScale(maxOf(chart.series, false));
  const plotW = width - M.l - M.r;
  const plotH = H - M.t - M.b;
  const n = chart.categories.length;
  const xAt = (i: number): number => (n <= 1 ? M.l + plotW / 2 : M.l + (plotW * i) / (n - 1));
  const yAt = (v: number): number => M.t + plotH * (1 - v / top);
  return (
    <Axes width={width} top={top} step={step} cats={chart.categories} xAt={xAt}>
      {chart.series.map((s, si) => {
        const c = colorOf(s, si);
        const pts = s.data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
        if (pts.length === 0) return null;
        let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
          const mx = (pts[i - 1].x + pts[i].x) / 2;
          d += ` C${mx.toFixed(1)} ${pts[i - 1].y.toFixed(1)} ${mx.toFixed(1)} ${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
        }
        const base = M.t + plotH;
        return (
          <G key={s.name}>
            {area ? <Path d={`${d} L${pts[pts.length - 1].x.toFixed(1)} ${base} L${pts[0].x.toFixed(1)} ${base} Z`} fill={c} fillOpacity={0.16} /> : null}
            <Path d={d} stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {n <= 14 ? pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={colors.cardSolid} stroke={c} strokeWidth={1.5} />) : null}
          </G>
        );
      })}
    </Axes>
  );
}

function Bars({ chart, width, stacked }: { chart: ReportChart; width: number; stacked: boolean }) {
  const { top, step } = niceScale(maxOf(chart.series, stacked));
  const plotW = width - M.l - M.r;
  const plotH = H - M.t - M.b;
  const n = chart.categories.length;
  const groupW = plotW / Math.max(1, n);
  const xAt = (i: number): number => M.l + groupW * (i + 0.5);
  const k = stacked ? 1 : chart.series.length;
  const barW = Math.min(28, (groupW * 0.7) / k);
  const hOf = (v: number): number => (plotH * v) / top;
  return (
    <Axes width={width} top={top} step={step} cats={chart.categories} xAt={xAt}>
      {chart.categories.map((_, ci) => {
        let acc = 0;
        return (
          <G key={ci}>
            {chart.series.map((s, si) => {
              const v = s.data[ci] ?? 0;
              const h = hOf(v);
              const x = stacked ? xAt(ci) - barW / 2 : xAt(ci) - (barW * k) / 2 + barW * si;
              const y = M.t + plotH - h - (stacked ? hOf(acc) : 0);
              acc += v;
              if (h <= 0) return null;
              return <Rect key={s.name} x={x + (stacked ? 0 : 1)} y={y} width={Math.max(1, barW - (stacked ? 0 : 2))} height={h} rx={3} fill={colorOf(s, si)} />;
            })}
          </G>
        );
      })}
    </Axes>
  );
}

function HBars({ chart, format }: { chart: ReportChart; format: (v: number) => string }) {
  const s = chart.series[0];
  if (!s) return null;
  const max = Math.max(1, ...s.data);
  const c = colorOf(s, 0);
  return (
    <View style={{ gap: 10 }}>
      {chart.categories.map((cat, i) => {
        const v = s.data[i] ?? 0;
        return (
          <View key={`${cat}-${i}`}>
            <View style={styles.hRow}>
              <Text style={styles.hLabel} numberOfLines={1}>{cat}</Text>
              <Text style={styles.hValue}>{format(v)}</Text>
            </View>
            <View style={styles.hTrack}>
              <View style={[styles.hFill, { width: `${Math.max(1.5, (v / max) * 100)}%`, backgroundColor: c }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Donut({ chart, format }: { chart: ReportChart; format: (v: number) => string }) {
  const size = 170;
  const r = 62;
  const stroke = 26;
  const circ = 2 * Math.PI * r;
  const total = chart.series.reduce((a, s) => a + (s.data[0] ?? 0), 0);
  let offset = 0;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
          {total > 0 ? chart.series.map((s, i) => {
            const len = ((s.data[0] ?? 0) / total) * circ;
            const el = (
              <Circle
                key={s.name} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colorOf(s, i)} strokeWidth={stroke}
                strokeDasharray={`${Math.max(0, len - 1.5)} ${circ - Math.max(0, len - 1.5)}`} strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          }) : null}
        </G>
        <SvgText x={size / 2} y={size / 2 - 2} fontSize={20} fontWeight="700" fill={colors.text} textAnchor="middle" fontFamily={fonts.heading}>{compact(total)}</SvgText>
        <SvgText x={size / 2} y={size / 2 + 14} fontSize={10} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.body}>Total</SvgText>
      </Svg>
      <Legend items={chart.series.map((s, i) => ({ name: s.name, color: colorOf(s, i), value: `${format(s.data[0] ?? 0)} (${total ? Math.round(((s.data[0] ?? 0) / total) * 100) : 0}%)` }))} />
    </View>
  );
}

export function ChartCard({ chart, formatValue }: { chart: ReportChart; formatValue: (v: number) => string }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent): void => setWidth(Math.floor(e.nativeEvent.layout.width));
  const cartesian = chart.type === 'line' || chart.type === 'area' || chart.type === 'bar' || chart.type === 'stackedBar';
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{chart.title}</Text>
      <View onLayout={onLayout}>
        {width > 0 && cartesian ? (
          <>
            {chart.type === 'line' || chart.type === 'area'
              ? <LineArea chart={chart} width={width} area={chart.type === 'area'} />
              : <Bars chart={chart} width={width} stacked={chart.type === 'stackedBar'} />}
            <Legend items={chart.series.map((s, i) => ({ name: s.name, color: colorOf(s, i) }))} />
          </>
        ) : null}
        {chart.type === 'hbar' ? <HBars chart={chart} format={formatValue} /> : null}
        {chart.type === 'donut' ? <Donut chart={chart} format={formatValue} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  title: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  hLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  hValue: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  hTrack: { height: 10, borderRadius: 5, backgroundColor: colors.mintSoft, overflow: 'hidden' },
  hFill: { height: 10, borderRadius: 5 },
});
