import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import type { DocumentVersion, SchoolDocument } from './types';
import { formatBytes, formatDate } from './utils';

type Props = {
  document: SchoolDocument | null;
  versions: DocumentVersion[];
  isLoading: boolean;
  /**
   * There's no "restore an old version as current" endpoint — uploading a NEW
   * version is the only way to change what's current. This instead opens the
   * upload-new-version flow pre-filled from the chosen old version's metadata.
   */
  onUseAsNewVersion: (d: SchoolDocument, v: DocumentVersion) => void;
  onDownloadCurrent: (d: SchoolDocument) => void;
  onClose: () => void;
};

/** Bottom sheet listing every version of a document (newest first). */
export function VersionsSheet({ document: doc, versions, isLoading, onUseAsNewVersion, onDownloadCurrent, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const sorted = [...versions].sort((a, b) => b.version - a.version);
  return (
    <Modal visible={doc !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Versions</Text>
        {doc ? <Text style={styles.sub} numberOfLines={1}>{doc.title}</Text> : null}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {doc && sorted.map((v) => {
              const current = v.version === doc.version;
              return (
                <View key={v.version} style={styles.row}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>v{v.version}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.file} numberOfLines={1}>{v.fileName}</Text>
                    <Text style={styles.meta}>
                      {formatBytes(v.fileBytes)} · {formatDate(v.createdAt.slice(0, 10))}{current ? ' · Current' : ''}
                    </Text>
                  </View>
                  {!current ? (
                    <Pressable
                      style={styles.btn}
                      onPress={() => onUseAsNewVersion(doc, v)}
                      accessibilityLabel={`Use v${v.version} as a new version`}
                    >
                      <Ionicons name="refresh-outline" size={16} color={colors.primaryDeep} />
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.btn}
                      onPress={() => onDownloadCurrent(doc)}
                      accessibilityLabel="Download current version"
                    >
                      <Ionicons name="download-outline" size={16} color={colors.primaryDeep} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '75%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  loading: { paddingVertical: 24 },
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.mint },
  pillText: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  info: { flex: 1, minWidth: 0 },
  file: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  btn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
  },
});
