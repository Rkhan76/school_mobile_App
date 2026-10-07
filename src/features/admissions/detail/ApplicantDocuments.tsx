import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { DateInput } from '../../../components/ui/DateInput';
import { showToast } from '../../../components/ui/Toast';
import { ApiError } from '../../../lib/apiClient';
import { parseDisplayDate } from '../../../lib/date';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import { getDownloadLink, getEntityChecklist, uploadOnBehalf } from '../../documents/api';
import type { ChecklistItem, ChecklistItemStatus, ChecklistResponse } from '../../documents/types';
import { pickSchoolDocumentFile } from '../../school-documents/pickFile';

const STATUS: Record<ChecklistItemStatus, { label: string; tone: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  APPROVED: { label: 'Approved', tone: 'success' },
  PENDING: { label: 'Pending review', tone: 'warning' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  EXPIRED: { label: 'Expired', tone: 'danger' },
  MISSING: { label: 'Missing', tone: 'neutral' },
};

/** Server limits for an applicant upload: 10 MB; pdf, jpeg, png or webp. */
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** Aadhar / TC / birth certificate etc. are uploaded against the applicant after the admission exists. */
export function ApplicantDocuments({ admissionId, canView, canUpload }: { admissionId: string; canView: boolean; canUpload: boolean }) {
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  /** A document type that needs an expiry date, waiting for the admin to enter it before picking the file. */
  const [expiryFor, setExpiryFor] = useState<ChecklistItem | null>(null);
  const [expiry, setExpiry] = useState('');

  const load = useCallback(async () => {
    try {
      setChecklist(await getEntityChecklist('APPLICANT', admissionId));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load documents.');
    } finally {
      setLoading(false);
    }
  }, [admissionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = (item: ChecklistItem, expiryDate?: string) => {
    pickSchoolDocumentFile(
      async (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          Alert.alert('Unsupported file', 'Upload a PDF, JPEG, PNG or WebP file.');
          return;
        }
        setUploadingId(item.documentTypeId);
        try {
          await uploadOnBehalf({ entityType: 'APPLICANT', entityId: admissionId, documentTypeId: item.documentTypeId, expiryDate }, file);
          showToast(`${item.documentTypeName} uploaded`);
          await load();
        } catch (err) {
          Alert.alert('Upload failed', err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
        } finally {
          setUploadingId(null);
        }
      },
      { maxBytes: MAX_BYTES, pdfAndImagesOnly: true }
    );
  };

  /** The API returns a short-lived signed link (about 5 minutes), so it is fetched on every tap and never cached. */
  const view = async (item: ChecklistItem) => {
    if (!item.documentId) return;
    setViewingId(item.documentId);
    try {
      const { url } = await getDownloadLink(item.documentId);
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Could not open document', err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setViewingId(null);
    }
  };

  const startUpload = (item: ChecklistItem) => {
    if (item.hasExpiry) {
      setExpiry('');
      setExpiryFor(item);
    } else {
      upload(item);
    }
  };

  const confirmExpiry = () => {
    const iso = parseDisplayDate(expiry);
    if (!iso || iso < new Date().toISOString().slice(0, 10)) {
      Alert.alert('Invalid expiry date', 'Enter a date that is today or later (dd/mm/yyyy).');
      return;
    }
    const item = expiryFor;
    setExpiryFor(null);
    if (item) upload(item, iso);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="document-text-outline" size={16} color={colors.primaryDeep} />
        <Text style={styles.title}>Verified Documents</Text>
        {checklist ? <Text style={styles.count}>{checklist.mandatoryComplete}/{checklist.mandatoryTotal} mandatory</Text> : null}
      </View>
      <Text style={styles.hint}>Once enrolled, documents move to the student profile.</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.list}>
          {checklist?.items.map((item) => {
            const st = STATUS[item.status];
            const busy = uploadingId === item.documentTypeId;
            return (
              <View key={item.documentTypeId} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>{item.documentTypeName}</Text>
                  <Text style={styles.sub}>{item.isMandatory ? 'Mandatory' : 'Optional'}</Text>
                  {item.status === 'REJECTED' && item.rejectReason ? <Text style={styles.error}>{item.rejectReason}</Text> : null}
                </View>
                <Badge label={st.label} tone={st.tone} />
                {canView && item.documentId ? (
                  <Pressable style={styles.uploadBtn} onPress={() => view(item)} disabled={viewingId === item.documentId} accessibilityLabel={`View ${item.documentTypeName}`}>
                    {viewingId === item.documentId ? <ActivityIndicator size="small" color={colors.primaryDeep} /> : <Ionicons name="eye-outline" size={18} color={colors.primaryDeep} />}
                  </Pressable>
                ) : null}
                {canUpload ? (
                <Pressable
                  style={[styles.uploadBtn, !!uploadingId && styles.uploadBtnDisabled]}
                  disabled={!!uploadingId}
                  onPress={() => startUpload(item)}
                  accessibilityLabel={`Upload ${item.documentTypeName}`}
                >
                  {busy ? <ActivityIndicator size="small" color={colors.primaryDeep} /> : <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryDeep} />}
                </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={!!expiryFor} transparent animationType="fade" onRequestClose={() => setExpiryFor(null)}>
        <Pressable style={styles.backdrop} onPress={() => setExpiryFor(null)} />
        <View style={styles.dialog}>
          <Text style={styles.title}>{expiryFor?.documentTypeName} expiry</Text>
          <Text style={styles.hint}>This document type needs an expiry date.</Text>
          <DateInput value={expiry} onChangeText={setExpiry} placeholder="dd/mm/yyyy" minimumDate={new Date()} />
          <View style={styles.dialogActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setExpiryFor(null)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable style={styles.okBtn} onPress={confirmExpiry}><Text style={styles.okText}>Choose file</Text></Pressable>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  count: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  rowText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textHint },
  error: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  uploadBtn: { width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid, alignItems: 'center', justifyContent: 'center' },
  uploadBtnDisabled: { opacity: 0.5 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,51,48,0.45)' },
  dialog: { position: 'absolute', left: 20, right: 20, top: '30%', backgroundColor: colors.cardSolid, borderRadius: radius.lg, padding: 18, gap: 12 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { height: 42, paddingHorizontal: 16, borderRadius: radius.md, justifyContent: 'center' },
  cancelText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textSecondary },
  okBtn: { height: 42, paddingHorizontal: 18, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center' },
  okText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
}));
