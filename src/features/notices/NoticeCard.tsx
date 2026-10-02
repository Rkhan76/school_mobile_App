import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import { AudiencePill } from './AudiencePill';
import { deriveStatus, formatDate, type Notice } from './types';

type Props = {
  item: Notice;
  onView: (n: Notice) => void;
  onSharePdf: (n: Notice) => void;
  onEdit: (n: Notice) => void;
  onDelete: (n: Notice) => void;
  canUpdate: boolean;
  canDelete: boolean;
  canDownloadPdf: boolean;
};

type IconName = keyof typeof Ionicons.glyphMap;

function ActionBtn({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.action} onPress={onPress} accessibilityLabel={label} hitSlop={4}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.textSecondary} />
    </Pressable>
  );
}

const STATUS_TONE: Record<ReturnType<typeof deriveStatus>, 'success' | 'danger' | 'warning'> = {
  Active: 'success',
  Expired: 'danger',
  Scheduled: 'warning',
};

function NoticeCardBase({ item, onView, onSharePdf, onEdit, onDelete, canUpdate, canDelete, canDownloadPdf }: Props) {
  const status = deriveStatus(item.publishedAt, item.expiresAt);
  return (
    <Card style={styles.card}>
      <Pressable onPress={() => onView(item)} style={styles.body}>
        <View style={styles.titleRow}>
          {item.isPinned && <Ionicons name="pin" size={16} color={colors.primary} style={styles.pin} />}
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>
        <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
        <View style={styles.badges}>
          <AudiencePill audience={item.targetAudience} />
          <Badge label={status} tone={STATUS_TONE[status]} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Published: <Text style={styles.metaVal}>{item.publishedAt ? formatDate(item.publishedAt) : '—'}</Text>
          </Text>
          <Text style={styles.metaText}>
            Expires: <Text style={styles.metaVal}>{item.expiresAt ? formatDate(item.expiresAt) : 'Never'}</Text>
          </Text>
          <Text style={styles.metaText}>By: <Text style={styles.metaVal}>{item.createdBy?.fullName ?? '—'}</Text></Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <ActionBtn icon="eye-outline" label="View notice" onPress={() => onView(item)} />
        {canDownloadPdf && (
          <ActionBtn icon="share-outline" label="Download or share PDF" onPress={() => onSharePdf(item)} />
        )}
        {canUpdate && <ActionBtn icon="create-outline" label="Edit notice" onPress={() => onEdit(item)} />}
        {canDelete && <ActionBtn icon="trash-outline" label="Delete notice" onPress={() => onDelete(item)} danger />}
      </View>
    </Card>
  );
}

export const NoticeCard = memo(NoticeCardBase);

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  body: { padding: 16, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  pin: { marginTop: 2 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  content: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  badges: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  meta: { gap: 2 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  metaVal: { fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  actions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.mintSoft,
  },
  action: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
});
