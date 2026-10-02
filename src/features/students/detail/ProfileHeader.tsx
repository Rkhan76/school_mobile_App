import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Card } from '../../../components/ui/Card';
import { colors, fonts, radius } from '../../../theme/tokens';
import type { StudentDetail } from './studentDetail';

/** Sub-bar: back + "Directory", edit, status pill, kebab. */
export function SubBar({ status }: { status?: string }) {
  const router = useRouter();
  const active = status === 'ACTIVE';
  return (
    <View style={styles.subBar}>
      <Pressable
        style={styles.back}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={20} color={colors.primaryDeep} />
        <Text style={styles.backText}>Directory</Text>
      </Pressable>
      <View style={styles.subRight}>
        <Pressable style={styles.circle} onPress={() => Alert.alert('Edit', 'Editing coming soon')} accessibilityLabel="Edit student">
          <Ionicons name="pencil" size={16} color={colors.primaryDeep} />
        </Pressable>
        {status ? (
          <View style={[styles.status, !active && { backgroundColor: colors.dangerBg }]}>
            <View style={[styles.dot, { backgroundColor: active ? colors.primaryDeep : colors.danger }]} />
            <Text style={[styles.statusText, !active && { color: colors.danger }]}>{status}</Text>
          </View>
        ) : null}
        <Pressable style={styles.circle} onPress={() => Alert.alert('More', 'More actions coming soon')} accessibilityLabel="More actions">
          <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function ProfileHeader({ s }: { s: StudentDetail }) {
  // No clipboard package installed yet; show the address so it can be long-press copied.
  const copy = () => Alert.alert('Email', s.email);
  const blood = s.bloodGroup.replace('+', '').replace('-', '') + (s.bloodGroup.endsWith('-') ? ' NEG' : ' POS');
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View>
          <Avatar name={s.fullName} size={64} />
          {s.verified && (
            <View style={styles.tick}>
              <Ionicons name="checkmark" size={11} color={colors.white} />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{s.fullName}</Text>
            <View style={styles.blood}>
              <Text style={styles.bloodText}>{blood}</Text>
            </View>
          </View>
          <View style={styles.pills}>
            <Text style={styles.pill}>{s.admissionNumber}</Text>
            <Text style={styles.pill}>Roll #{s.rollNumber}</Text>
          </View>
          <View style={styles.classRow}>
            <Ionicons name="school-outline" size={14} color={colors.primaryDeep} />
            <Text style={styles.classText}>Class {s.class} • Sec {s.section}</Text>
            <Text style={styles.year}>• {s.year}</Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.rowText} numberOfLines={1}>{s.email}</Text>
        <Pressable onPress={copy} hitSlop={8} accessibilityLabel="Copy email">
          <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.row}>
        <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.rowText, { fontFamily: fonts.bodySemi }]}>{s.phone}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{s.phoneTag}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  subBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  backText: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.primaryDeep },
  subRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.mint },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.5, color: colors.primaryDeep },
  card: { gap: 12 },
  top: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  tick: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primaryDeep, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.headingExtra, fontSize: 22, color: colors.text },
  blood: { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  bloodText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.danger, letterSpacing: 0.4 },
  pills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: { fontFamily: fonts.monoMedium, fontSize: 10.5, color: colors.primaryDeep, backgroundColor: colors.mint, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  classText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text },
  year: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: radius.md, paddingHorizontal: 12, height: 44 },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.text },
  tag: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
});
