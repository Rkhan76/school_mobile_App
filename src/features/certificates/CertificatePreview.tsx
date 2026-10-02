import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { shareCertificate, verificationUrl } from './certificateExport';
import { RECIPIENT_TYPE_LABEL, formatDate, type Certificate } from './types';

type Props = { certificate: Certificate | null; onClose: () => void };

const GOLD = '#b8893b';

function body(c: Certificate): string {
  if (c.description?.trim()) return c.description.trim();
  const who = RECIPIENT_TYPE_LABEL[c.recipientType].toLowerCase();
  return `has been awarded this ${c.title} in recognition of their standing as a ${who} of the school, and is hereby certified as per the records of the institution.`;
}

/** Full-screen formal certificate preview, rendered from the real Certificate shape, with Share / Download. */
export function CertificatePreview({ certificate: c, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState<'share' | 'download' | null>(null);

  const doExport = async (kind: 'share' | 'download') => {
    if (!c || exporting) return;
    setExporting(kind);
    try {
      await shareCertificate(c);
    } catch (err) {
      Alert.alert(
        kind === 'share' ? 'Share failed' : 'Download failed',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <Modal visible={c !== null} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close preview">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>Certificate preview</Text>
        </View>
        {c && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.outer}>
              <View style={styles.inner}>
                {c.schoolLogo ? (
                  <Image source={{ uri: c.schoolLogo }} style={styles.logo} resizeMode="contain" />
                ) : (
                  <Ionicons name="ribbon-outline" size={36} color={GOLD} />
                )}
                <Text style={styles.school}>{c.schoolName}</Text>
                {c.schoolAddress ? <Text style={styles.tagline}>{c.schoolAddress}</Text> : null}
                {c.schoolPhone || c.schoolEmail ? (
                  <Text style={styles.tagline}>{[c.schoolPhone, c.schoolEmail].filter(Boolean).join('  ·  ')}</Text>
                ) : null}
                <View style={styles.rule} />
                <Text style={styles.certTitle}>{c.title}</Text>
                <Text style={styles.certify}>This is to certify that</Text>
                <Text style={styles.recipient}>{c.recipientName}</Text>
                <Text style={styles.sub}>{RECIPIENT_TYPE_LABEL[c.recipientType]}</Text>
                <Text style={styles.text}>{body(c)}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Reference No.</Text>
                    <Text style={styles.metaMono}>{c.referenceNo}</Text>
                  </View>
                  <View style={[styles.metaCol, styles.right]}>
                    <Text style={styles.metaLabel}>Issue date</Text>
                    <Text style={styles.metaVal}>{formatDate(c.issueDate)}</Text>
                  </View>
                </View>

                <View style={styles.sign}>
                  <View style={styles.signLine} />
                  <Text style={styles.signLabel}>
                    {[c.signatoryName, c.signatoryTitle].filter(Boolean).join(', ') || 'Principal'}
                  </Text>
                </View>

                {c.status === 'REVOKED' && (
                  <View style={styles.stamp}>
                    <Text style={styles.stampText}>REVOKED</Text>
                  </View>
                )}

                <View style={styles.verifyBox}>
                  <Text style={styles.verifyLabel}>Verify this certificate at</Text>
                  <Text style={styles.verifyLink} selectable numberOfLines={2}>
                    {verificationUrl(c)}
                  </Text>
                </View>
              </View>
            </View>
            {c.status === 'REVOKED' && (
              <Text style={styles.revokedNote}>
                Revoked{c.revokedAt ? ` on ${formatDate(c.revokedAt)}` : ''}{c.revokeReason ? `: ${c.revokeReason}` : ''}
              </Text>
            )}
          </ScrollView>
        )}
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.share, !!exporting && styles.off]} disabled={!!exporting} onPress={() => doExport('share')}>
            {exporting === 'share' ? (
              <ActivityIndicator color={colors.primaryDeep} />
            ) : (
              <>
                <Ionicons name="share-outline" size={18} color={colors.primaryDeep} />
                <Text style={styles.shareText}>Share</Text>
              </>
            )}
          </Pressable>
          <Pressable style={[styles.btn, styles.download, !!exporting && styles.off]} disabled={!!exporting} onPress={() => doExport('download')}>
            {exporting === 'download' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.white} />
                <Text style={styles.downloadText}>Download</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  scroll: { padding: 16, gap: 12 },
  outer: { borderWidth: 3, borderColor: GOLD, backgroundColor: '#fffdf7', padding: 6, borderRadius: 6 },
  inner: {
    borderWidth: 1, borderColor: GOLD, paddingVertical: 28, paddingHorizontal: 18, alignItems: 'center', gap: 8, overflow: 'hidden',
  },
  logo: { width: 56, height: 56 },
  school: { fontFamily: fonts.headingExtra, fontSize: 24, color: colors.primaryDeep, textAlign: 'center' },
  tagline: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  rule: { width: 80, height: 2, backgroundColor: GOLD, marginVertical: 6 },
  certTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.text, textAlign: 'center' },
  certify: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 10 },
  recipient: { fontFamily: fonts.headingExtra, fontSize: 26, color: colors.primaryDeep, textAlign: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  text: { fontFamily: fonts.body, fontSize: 13, lineHeight: 21, color: colors.text, textAlign: 'center', marginTop: 6 },
  metaRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', marginTop: 20 },
  metaCol: { gap: 2 },
  right: { alignItems: 'flex-end' },
  metaLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textHint, textTransform: 'uppercase' },
  metaMono: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  metaVal: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  sign: { alignSelf: 'flex-end', alignItems: 'center', marginTop: 28, width: 160 },
  signLine: { height: 1, alignSelf: 'stretch', backgroundColor: colors.text },
  signLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  stamp: {
    position: 'absolute', top: '45%', alignSelf: 'center', borderWidth: 4, borderColor: colors.danger,
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8, transform: [{ rotate: '-20deg' }], opacity: 0.6,
  },
  stampText: { fontFamily: fonts.headingExtra, fontSize: 32, color: colors.danger, letterSpacing: 4 },
  verifyBox: { marginTop: 20, alignItems: 'center', gap: 2, alignSelf: 'stretch' },
  verifyLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textHint, textTransform: 'uppercase' },
  verifyLink: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep, textAlign: 'center' },
  revokedNote: { fontFamily: fonts.body, fontSize: 12, color: colors.danger, textAlign: 'center' },
  actions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid,
  },
  btn: { flex: 1, height: 46, flexDirection: 'row', gap: 6, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  share: { backgroundColor: colors.mint },
  shareText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  download: { backgroundColor: colors.primary },
  downloadText: { fontFamily: fonts.bodySemi, color: colors.white },
  off: { opacity: 0.6 },
});
