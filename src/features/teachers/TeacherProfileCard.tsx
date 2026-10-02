import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import type { TeacherDetail } from './teacherDetail';

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function TeacherProfileCard({ t }: { t: TeacherDetail }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // TODO: wire to expo-clipboard once the package is added (currently visual feedback only).
  const onCopy = () => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Avatar name={t.fullName} size={72} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{t.fullName}</Text>
          <View style={styles.pills}>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{t.staffId}</Text>
            </View>
            <View style={styles.subjectPill}>
              <Text style={styles.subjectText}>{t.subject}</Text>
            </View>
          </View>
          {t.isClassTeacher ? (
            <View style={styles.roleRow}>
              <Ionicons name="school-outline" size={14} color={colors.primaryDeep} />
              <Text style={styles.roleText} numberOfLines={1}>
                Class Teacher {'•'} Class {t.className} {'•'} Sec {t.section}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.contactRow}>
        <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.contactText} numberOfLines={1}>{t.email}</Text>
        <Pressable onPress={onCopy} hitSlop={8} accessibilityLabel="Copy email">
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={18}
            color={copied ? colors.success : colors.primaryDeep}
          />
        </Pressable>
      </View>
      <View style={styles.contactRow}>
        <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.contactText} numberOfLines={1}>{t.phone}</Text>
        <Pressable
          style={styles.callChip}
          onPress={() => void Linking.openURL(telUrl(t.phone))}
          accessibilityLabel="Call teacher"
        >
          <Text style={styles.callChipText}>Call</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  top: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  info: { flex: 1, gap: 6 },
  name: { fontFamily: fonts.headingExtra, fontSize: 22, color: colors.text },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  codePill: { backgroundColor: colors.mint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  codeText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  subjectPill: { backgroundColor: colors.cardSolid, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 3 },
  subjectText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
  },
  contactText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  callChip: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  callChipText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
});
