import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import { AudiencePill } from './AudiencePill';
import { formatDate, type Notice } from './mockNotices';

type Props = {
  item: Notice;
  onView: (n: Notice) => void;
  onShare: (n: Notice) => void;
  onEdit: (n: Notice) => void;
  onDelete: (n: Notice) => void;
};

type IconName = keyof typeof Ionicons.glyphMap;

function ActionBtn({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.action} onPress={onPress} accessibilityLabel={label} hitSlop={4}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.textSecondary} />
    </Pressable>
  );
}

function NoticeCardBase({ item, onView, onShare, onEdit, onDelete }: Props) {
  return (
    <Card style={styles.card}>
      <Pressable onPress={() => onView(item)} style={styles.body}>
        <View style={styles.titleRow}>
          {item.pinned && <Ionicons name="pin" size={16} color={colors.primary} style={styles.pin} />}
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>
        <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
        <View style={styles.badges}>
          <AudiencePill audience={item.audience} />
          <Badge label={item.status} tone={item.status === 'Active' ? 'success' : 'danger'} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>Published: <Text style={styles.metaVal}>{formatDate(item.publishedAt)}</Text></Text>
          <Text style={styles.metaText}>Expires: <Text style={styles.metaVal}>{item.expiresAt ? formatDate(item.expiresAt) : 'Never'}</Text></Text>
          <Text style={styles.metaText}>By: <Text style={styles.metaVal}>{item.createdBy}</Text></Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <ActionBtn icon="eye-outline" label="View notice" onPress={() => onView(item)} />
        <ActionBtn icon="share-outline" label="Share or print notice" onPress={() => onShare(item)} />
        <ActionBtn icon="create-outline" label="Edit notice" onPress={() => onEdit(item)} />
        <ActionBtn icon="trash-outline" label="Delete notice" onPress={() => onDelete(item)} danger />
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
