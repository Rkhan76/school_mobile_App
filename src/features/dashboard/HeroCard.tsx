import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { formatHeroDate, greetingFor } from './format';
import type { HeroData } from './mockData';

interface Props {
  hero: HeroData;
  userName: string;
}

export function HeroCard({ hero, userName }: Props) {
  const now = new Date();
  return (
    <LinearGradient
      colors={[colors.primaryDeep, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.date} numberOfLines={1}>{formatHeroDate(now)}</Text>
        </View>
        <View style={styles.live}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Sync</Text>
        </View>
      </View>

      <View style={styles.mid}>
        <View style={styles.midText}>
          <Text style={styles.greet} numberOfLines={2}>{greetingFor(now)}, {userName} 👋</Text>
          <Text style={styles.subtitle}>{hero.institution} • {hero.subtitle}</Text>
        </View>
        <View style={styles.avatarRing}>
          <Avatar name={userName} size={48} />
        </View>
      </View>

      <View style={styles.subRow}>
        <View style={styles.subCard}>
          <Ionicons name="people" size={20} color={colors.white} />
          <View>
            <Text style={styles.subValue}>{hero.studentsPresent}/{hero.studentsTotal}</Text>
            <Text style={styles.subLabel}>Students Present</Text>
          </View>
        </View>
        <View style={styles.subCard}>
          <Ionicons name="document-text" size={20} color={colors.white} />
          <View>
            <Text style={styles.subValue}>{hero.pendingLeaves}</Text>
            <Text style={styles.subLabel}>Pending Leaves</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { borderRadius: radius.xl, padding: 16, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  date: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.6, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  live: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  liveText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.white },
  mid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  midText: { flex: 1 },
  greet: { fontFamily: fonts.headingExtra, fontSize: 24, lineHeight: 30, color: colors.white },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  avatarRing: { borderRadius: 30, padding: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  subRow: { flexDirection: 'row', gap: 10 },
  subCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  subValue: { fontFamily: fonts.heading, fontSize: 18, color: colors.white },
  subLabel: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
}));
