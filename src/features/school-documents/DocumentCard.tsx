import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { SchoolDocument } from './types';
import { fileTypeOf, formatBytes, formatDate, isExpired } from './utils';

type Props = {
  item: SchoolDocument;
  categoryName: string;
  canEdit: boolean;
  canDelete: boolean;
  onDownload: (d: SchoolDocument) => void;
  onVersions: (d: SchoolDocument) => void;
  onEdit: (d: SchoolDocument) => void;
  onDelete: (d: SchoolDocument) => void;
};

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.metaCol}>
      <Text style={styles.metaLabel}>{label}</Text>
      {children}
    </View>
  );
}

function DocumentCardBase({ item, categoryName, canEdit, canDelete, onDownload, onVersions, onEdit, onDelete }: Props) {
  const expired = isExpired(item.expiryDate);
  const fileType = item.fileFormat?.toUpperCase() ?? fileTypeOf(item.fileName);
  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>v{item.version}</Text>
        </View>
        {item.confidentiality === 'CLASSIFIED' ? (
          <View style={styles.classified}>
            <Ionicons name="lock-closed-outline" size={11} color={colors.danger} />
            <Text style={styles.classifiedText}>Classified</Text>
          </View>
        ) : null}
      </View>
      {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}

      <View style={styles.metaGrid}>
        <Meta label="CATEGORY"><Text style={styles.metaValue} numberOfLines={2}>{categoryName}</Text></Meta>
        <Meta label="FILE">
          <Text style={styles.metaMono} numberOfLines={1}>{item.fileName}</Text>
          <Text style={styles.metaSub}>{fileType} · {formatBytes(item.fileBytes)}</Text>
        </Meta>
        <Meta label="EXPIRY">
          <Text style={[styles.metaValue, expired && styles.expired]}>
            {item.expiryDate ? formatDate(item.expiryDate) : '—'}
          </Text>
          {expired ? <Text style={styles.expiredTag}>Expired</Text> : null}
        </Meta>
        <Meta label="UPLOADED">
          <Text style={styles.metaValue} numberOfLines={1}>{item.uploadedByName ?? '—'}</Text>
          <Text style={styles.metaSub}>{formatDate(item.createdAt.slice(0, 10))}</Text>
        </Meta>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onDownload(item)} accessibilityLabel={`Download ${item.title}`}>
          <Ionicons name="download-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.actionText}>Download</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => onVersions(item)} accessibilityLabel={`Versions of ${item.title}`}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.actionText}>Versions</Text>
        </Pressable>
        {canEdit ? (
          <Pressable style={styles.action} onPress={() => onEdit(item)} accessibilityLabel={`Edit ${item.title}`}>
            <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
        ) : null}
        {canDelete ? (
          <Pressable style={[styles.action, styles.delete]} onPress={() => onDelete(item)} accessibilityLabel={`Delete ${item.title}`}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export const DocumentCard = memo(DocumentCardBase);

const styles = themed(() => StyleSheet.create({
  card: { gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, flexShrink: 1 },
  versionPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.mint },
  versionText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  classified: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill, backgroundColor: colors.dangerBg,
  },
  classifiedText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.danger },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 8 },
  metaCol: { width: '48%', gap: 1 },
  metaLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textHint },
  metaValue: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  metaMono: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  metaSub: { fontFamily: fonts.mono, fontSize: 11, color: colors.textHint },
  expired: { color: colors.danger },
  expiredTag: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.danger },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  action: {
    height: 36, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  delete: { borderColor: colors.dangerBorder, backgroundColor: colors.dangerBg },
}));
