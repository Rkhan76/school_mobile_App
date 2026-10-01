import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius } from '../../theme/tokens';
import { STATUS_TONE } from './EventCard';
import { formatRange, type SchoolEvent } from './mockEvents';

type Props = {
  event: SchoolEvent | null;
  onClose: () => void;
  onEdit: (e: SchoolEvent) => void;
  onDelete: (e: SchoolEvent) => void;
};

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.primaryDeep} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

export function EventDetailSheet({ event, onClose, onEdit, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!event} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      {event ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.tags}>
              <Badge label={event.status} tone={STATUS_TONE[event.status]} />
              <Badge label={event.audience} tone="neutral" />
              {event.isHoliday ? <Badge label="Holiday" tone="danger" /> : null}
            </View>
            <Text style={styles.title}>{event.title}</Text>
            <Row icon="time-outline" text={formatRange(event.startDate, event.endDate)} />
            {event.location ? <Row icon="location-outline" text={event.location} /> : null}
            {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

            <Text style={styles.section}>MEDIA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.media}>
                  <Ionicons name="image-outline" size={28} color={colors.textHint} />
                  <Text style={styles.mediaText}>No media</Text>
                </View>
              ))}
            </ScrollView>
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.del]} onPress={() => onDelete(event)}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.delText}>Delete</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.edit]} onPress={() => onEdit(event)}>
              <Ionicons name="create-outline" size={18} color={colors.white} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  content: { gap: 10, paddingBottom: 12 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  rowText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  desc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  section: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary, letterSpacing: 0.5, marginTop: 8 },
  gallery: { gap: 10 },
  media: {
    width: 120, height: 90, borderRadius: radius.md, backgroundColor: colors.mintSoft,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  mediaText: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  del: { backgroundColor: colors.dangerBg },
  delText: { fontFamily: fonts.bodySemi, color: colors.danger },
  edit: { backgroundColor: colors.primary },
  editText: { fontFamily: fonts.bodySemi, color: colors.white },
});
