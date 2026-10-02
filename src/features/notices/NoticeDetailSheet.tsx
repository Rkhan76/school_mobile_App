import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius } from '../../theme/tokens';
import { AudiencePill } from './AudiencePill';
import { formatDate, type Notice } from './mockNotices';

type Props = { notice: Notice | null; onClose: () => void };

/** Bottom sheet with the full notice text. */
export function NoticeDetailSheet({ notice, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={notice !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {notice && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.grab} />
            <View style={styles.titleRow}>
              {notice.pinned && <Ionicons name="pin" size={18} color={colors.primary} />}
              <Text style={styles.title}>{notice.title}</Text>
            </View>
            <View style={styles.badges}>
              <AudiencePill audience={notice.audience} />
              <Badge label={notice.status} tone={notice.status === 'Active' ? 'success' : 'danger'} />
            </View>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.content}>{notice.content}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>Published: <Text style={styles.metaVal}>{formatDate(notice.publishedAt)}</Text></Text>
                <Text style={styles.metaText}>Expires: <Text style={styles.metaVal}>{notice.expiresAt ? formatDate(notice.expiresAt) : 'Never'}</Text></Text>
                <Text style={styles.metaText}>Created by: <Text style={styles.metaVal}>{notice.createdBy}</Text></Text>
              </View>
            </ScrollView>
            <Pressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, gap: 10, maxHeight: '80%',
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 19, color: colors.text },
  badges: { flexDirection: 'row', gap: 8 },
  scroll: { flexGrow: 0 },
  content: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.text, marginTop: 4 },
  meta: { marginTop: 14, gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  metaText: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint },
  metaVal: { fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  close: { height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint, marginTop: 4 },
  closeText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
});
