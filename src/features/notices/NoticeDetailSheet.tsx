import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { ApiError } from '../../lib/apiClient';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { AudiencePill } from './AudiencePill';
import { downloadAndShareNoticePdf } from './pdf';
import { deriveStatus, formatDate, type Notice } from './types';

type Props = { notice: Notice | null; onClose: () => void; canDownloadPdf: boolean };

const STATUS_TONE = { Active: 'success', Expired: 'danger', Scheduled: 'warning' } as const;

/** Bottom sheet with the full notice text. */
export function NoticeDetailSheet({ notice, onClose, canDownloadPdf }: Props) {
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState(false);

  const onDownloadPdf = async () => {
    if (!notice || downloading) return;
    setDownloading(true);
    try {
      await downloadAndShareNoticePdf(notice.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not download the notice PDF.';
      Alert.alert('Download failed', message);
    } finally {
      setDownloading(false);
    }
  };

  const status = notice ? deriveStatus(notice.publishedAt, notice.expiresAt) : 'Active';

  return (
    <Modal visible={notice !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {notice && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.grab} />
            <View style={styles.titleRow}>
              {notice.isPinned && <Ionicons name="pin" size={18} color={colors.primary} />}
              <Text style={styles.title}>{notice.title}</Text>
            </View>
            <View style={styles.badges}>
              <AudiencePill audience={notice.targetAudience} />
              <Badge label={status} tone={STATUS_TONE[status]} />
            </View>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.content}>{notice.content}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  Published: <Text style={styles.metaVal}>{notice.publishedAt ? formatDate(notice.publishedAt) : '—'}</Text>
                </Text>
                <Text style={styles.metaText}>
                  Expires: <Text style={styles.metaVal}>{notice.expiresAt ? formatDate(notice.expiresAt) : 'Never'}</Text>
                </Text>
                <Text style={styles.metaText}>Created by: <Text style={styles.metaVal}>{notice.createdBy?.fullName ?? '—'}</Text></Text>
              </View>
            </ScrollView>
            {canDownloadPdf && (
              <Pressable style={[styles.pdfBtn, downloading && styles.pdfBtnDisabled]} onPress={onDownloadPdf} disabled={downloading}>
                {downloading ? (
                  <ActivityIndicator size="small" color={colors.primaryDeep} />
                ) : (
                  <Ionicons name="share-outline" size={18} color={colors.primaryDeep} />
                )}
                <Text style={styles.pdfBtnText}>{downloading ? 'Preparing PDF…' : 'Download / Share PDF'}</Text>
              </Pressable>
            )}
            <Pressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
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
  pdfBtn: {
    flexDirection: 'row', gap: 8, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border, marginTop: 10,
  },
  pdfBtnDisabled: { opacity: 0.7 },
  pdfBtnText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  close: { height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint, marginTop: 4 },
  closeText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
}));
