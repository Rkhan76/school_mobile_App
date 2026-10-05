import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, themed } from '../../theme/tokens';
import { ActionPill } from './ActionPill';
import { formatDateTime, type AuditLog } from './types';

type Props = { item: AuditLog; serial: number; onView: (l: AuditLog) => void };

function AuditLogCardBase({ item, serial, onView }: Props) {
  return (
    <Pressable onPress={() => onView(item)} accessibilityRole="button" accessibilityLabel={`Audit log ${serial}, ${item.action}`}>
      <Card style={styles.card}>
        <View style={styles.top}>
          <View style={styles.serial}><Text style={styles.serialText}>{serial}</Text></View>
          <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
          <Pressable style={styles.eye} onPress={() => onView(item)} hitSlop={8} accessibilityLabel="View details">
            <Ionicons name="eye-outline" size={20} color={colors.primaryDeep} />
          </Pressable>
        </View>
        <ActionPill action={item.action} />
        <View style={styles.bottom}>
          <View style={styles.col}>
            <Text style={styles.label}>ENTITY TYPE</Text>
            <Text style={styles.value} numberOfLines={1}>{item.entityType}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>USER</Text>
            <Text style={styles.value} numberOfLines={1}>{item.userName ?? 'Unknown user'}</Text>
            <Text style={styles.role}>
              {item.userType}
              {item.impersonatedByName ? ` · via ${item.impersonatedByName}` : ''}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const AuditLogCard = memo(AuditLogCardBase);

const styles = themed(() => StyleSheet.create({
  card: { gap: 10, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serial: { minWidth: 28, height: 28, paddingHorizontal: 6, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  serialText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  date: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  eye: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  bottom: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.6, color: colors.textHint },
  value: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  role: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
}));
