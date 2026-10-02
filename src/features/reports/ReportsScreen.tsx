import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ScreenBackground } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius } from '../../theme/tokens';
import { exportReport } from './api';
import { activeFilterCount, FilterSheet } from './FilterSheet';
import { isEmptyReport, ReportView } from './ReportView';
import { EmptyState, ErrorState, ReportSkeleton } from './ReportStates';
import { DOMAINS, findDomain, findReport } from './registry';
import { DEFAULT_FILTERS, ReportError, type DomainKey, type MockMode, type ReportFilters } from './types';
import { useReport } from './useReport';

const MOCK_CYCLE: MockMode[] = ['none', 'empty', 'error', 'forbidden', 'ratelimit'];

function Chip({ label, on, onPress, small }: { label: string; on: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.chip, small && styles.chipSmall, on && styles.chipOn]}>
      <Text style={[styles.chipText, small && { fontSize: 12 }, on && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function ReportsScreen() {
  const [domain, setDomain] = useState<DomainKey>('admissions');
  const [reportKey, setReportKey] = useState<string>(DOMAINS[0].reports[0].key);
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [info, setInfo] = useState(false);
  const [mock, setMock] = useState<MockMode>('none');
  const [exporting, setExporting] = useState<'Excel' | 'PDF' | null>(null);

  const dom = findDomain(domain);
  const report = findReport(domain, reportKey);
  const { data, isLoading, error, refetch } = useReport(domain, report.key, filters, mock);
  const count = activeFilterCount(filters, report.caps);

  const pickDomain = (k: DomainKey): void => {
    setDomain(k);
    setReportKey(findDomain(k).reports[0].key);
    setFilters(DEFAULT_FILTERS);
    setInfo(false);
  };
  const pickReport = (k: string): void => {
    setReportKey(k);
    setFilters(DEFAULT_FILTERS);
    setInfo(false);
  };

  const exportAs = async (label: 'Excel' | 'PDF'): Promise<void> => {
    if (exporting) return;
    setExporting(label);
    try {
      const format = label === 'Excel' ? 'xlsx' : 'pdf';
      const { blob, fileName, mimeType } = await exportReport(domain, report.key, filters, format);
      const file = new File(Paths.cache, fileName);
      if (file.exists) file.delete();
      file.write(new Uint8Array(blob));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: fileName });
      } else {
        Alert.alert('Report saved', `Saved to ${file.uri}`);
      }
    } catch (err) {
      const message = err instanceof ReportError && err.code === 'FEATURE_NOT_IN_PLAN'
        ? 'Exporting reports is not included in your school’s current plan. Ask an administrator to upgrade.'
        : err instanceof Error ? err.message : 'Could not export the report. Please try again.';
      Alert.alert('Export failed', message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Reports"
        subtitle={mock !== 'none' ? `Mock: ${mock}` : undefined}
        back
        right={__DEV__ ? (
          <Pressable
            onPress={() => setMock((m) => MOCK_CYCLE[(MOCK_CYCLE.indexOf(m) + 1) % MOCK_CYCLE.length])}
            onLongPress={() => setMock('none')}
            style={styles.dev}
            accessibilityLabel="Cycle mock response state"
          >
            <Ionicons name="flask-outline" size={18} color={mock === 'none' ? colors.textHint : colors.warning} />
          </Pressable>
        ) : null}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll} contentContainerStyle={styles.row}>
        {DOMAINS.map((d) => <Chip key={d.key} label={d.label} on={d.key === domain} onPress={() => pickDomain(d.key)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll} contentContainerStyle={styles.row}>
        {dom.reports.map((r) => <Chip small key={r.key} label={r.title} on={r.key === report.key} onPress={() => pickReport(r.key)} />)}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle} numberOfLines={2}>{report.title}</Text>
            <Pressable onPress={() => setInfo((v) => !v)} style={styles.infoLink} accessibilityRole="button">
              <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>How is this calculated?</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setSheet(true)} style={styles.filterBtn} accessibilityRole="button" accessibilityLabel="Filters">
            <Ionicons name="options-outline" size={18} color={colors.primaryDeep} />
            <Text style={styles.filterText}>Filters</Text>
            {count > 0 ? <View style={styles.count}><Text style={styles.countText}>{count}</Text></View> : null}
          </Pressable>
        </View>

        {info ? (
          <Card style={styles.infoCard}>
            <Text style={styles.infoBody}>{data?.description ?? report.description}</Text>
          </Card>
        ) : null}

        <View style={styles.exports}>
          {(['Excel', 'PDF'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => exportAs(t)}
              disabled={exporting !== null}
              style={[styles.exportBtn, exporting !== null && exporting !== t && { opacity: 0.5 }]}
              accessibilityRole="button"
            >
              {exporting === t
                ? <ActivityIndicator size="small" color={colors.textSecondary} />
                : <Ionicons name={t === 'Excel' ? 'document-text-outline' : 'document-outline'} size={16} color={colors.text} />}
              <Text style={styles.exportText}>{t}</Text>
              {exporting === t ? null : <Ionicons name="download-outline" size={15} color={colors.textSecondary} />}
            </Pressable>
          ))}
        </View>

        {isLoading ? <ReportSkeleton />
          : error ? <ErrorState error={error} onRetry={refetch} />
          : data && !isEmptyReport(data) ? <ReportView data={data} />
          : <EmptyState />}
      </ScrollView>

      <FilterSheet visible={sheet} caps={report.caps} value={filters} onApply={setFilters} onClose={() => setSheet(false)} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  rowScroll: { flexGrow: 0, marginBottom: 8 },
  row: { gap: 8, paddingHorizontal: 16 },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  chipSmall: { height: 32, paddingHorizontal: 12, backgroundColor: colors.mintSoft },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  dev: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 40, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reportTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  infoLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-start' },
  infoText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, textDecorationLine: 'underline' },
  infoCard: { padding: 12, backgroundColor: colors.mintSoft },
  infoBody: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 19 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  filterText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  count: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDeep },
  countText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white },
  exports: { flexDirection: 'row', gap: 10 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  exportText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
});
