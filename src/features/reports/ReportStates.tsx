import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import type { ReportError } from './types';

function Bone({ style }: { style: object }) {
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[styles.bone, style, { opacity: o }]} />;
}

export function ReportSkeleton() {
  return (
    <View style={{ gap: 12 }} accessibilityLabel="Loading report">
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} style={styles.kpi}>
            <Bone style={{ width: '50%', height: 10 }} />
            <Bone style={{ width: '70%', height: 24 }} />
          </Card>
        ))}
      </View>
      <Card style={{ gap: 10 }}>
        <Bone style={{ width: '40%', height: 12 }} />
        <Bone style={{ width: '100%', height: 180, borderRadius: radius.md }} />
      </Card>
      <Card style={{ gap: 10 }}>
        {[0, 1, 2, 3].map((i) => <Bone key={i} style={{ width: '100%', height: 14 }} />)}
      </Card>
    </View>
  );
}

function Notice({ icon, tint, title, message, action, onAction }: {
  icon: keyof typeof Ionicons.glyphMap; tint: string; title: string; message: string; action?: string; onAction?: () => void;
}) {
  return (
    <Card style={styles.notice}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={30} color={tint} />
      </View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeMsg}>{message}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.btn} accessibilityRole="button">
          <Ionicons name="refresh" size={16} color={colors.white} />
          <Text style={styles.btnText}>{action}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function EmptyState() {
  return <Notice icon="bar-chart-outline" tint={colors.textHint} title="No data" message="Nothing to report for the selected filters. Try widening the date range or clearing the class filter." />;
}

export function ErrorState({ error, onRetry }: { error: ReportError; onRetry: () => void }) {
  if (error.status === 403) {
    return <Notice icon="lock-closed-outline" tint={colors.warning} title="No permission" message="You do not have access to this report. Ask an administrator to grant the reports permission." />;
  }
  if (error.status === 429) {
    return <Notice icon="time-outline" tint={colors.orange} title="Slow down" message="Too many report requests. Wait a few seconds and try again." action="Retry" onAction={onRetry} />;
  }
  return <Notice icon="alert-circle-outline" tint={colors.danger} title="Could not load report" message={error.message} action="Retry" onAction={onRetry} />;
}

const styles = StyleSheet.create({
  bone: { backgroundColor: '#dcebe8', borderRadius: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '48.5%', flexGrow: 1, gap: 10, padding: 14 },
  notice: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  noticeTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  noticeMsg: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 8, lineHeight: 19 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, height: 42, paddingHorizontal: 20, borderRadius: radius.pill, backgroundColor: colors.primaryDeep },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
});
