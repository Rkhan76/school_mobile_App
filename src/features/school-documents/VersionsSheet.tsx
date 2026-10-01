import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { formatDate, type DocumentVersion, type SchoolDocument } from './mockSchoolDocuments';

type Props = {
  document: SchoolDocument | null;
  onRestore: (d: SchoolDocument, v: DocumentVersion) => void;
  onDownload: (d: SchoolDocument, v: DocumentVersion) => void;
  onClose: () => void;
};

/** Bottom sheet listing every version of a document (newest first). */
export function VersionsSheet({ document: doc, onRestore, onDownload, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const versions = doc ? [...doc.versions].sort((a, b) => b.version - a.version) : [];
  return (
    <Modal visible={doc !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Versions</Text>
        {doc ? <Text style={styles.sub} numberOfLines={1}>{doc.title}</Text> : null}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {doc && versions.map((v) => {
            const current = v.version === doc.version;
            return (
              <View key={v.version} style={styles.row}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>v{v.version}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.file} numberOfLines={1}>{v.fileName}</Text>
                  <Text style={styles.meta}>
                    {v.sizeLabel} · {formatDate(v.uploadedAt)}{current ? ' · Current' : ''}
                  </Text>
                </View>
                {!current ? (
                  <Pressable style={styles.btn} onPress={() => onRestore(doc, v)} accessibilityLabel={`Restore v${v.version}`}>
                    <Ionicons name="refresh-outline" size={16} color={colors.primaryDeep} />
                  </Pressable>
                ) : null}
                <Pressable style={styles.btn} onPress={() => onDownload(doc, v)} accessibilityLabel={`Download v${v.version}`}>
                  <Ionicons name="download-outline" size={16} color={colors.primaryDeep} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
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
