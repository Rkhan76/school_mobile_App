import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { formatRange } from './dateUtils';
import { STATUS_TONE } from './EventCard';
import { useEventMedia } from './useEvents';
import type { EventMedia, EventMediaResourceType, MediaAsset, SchoolEvent } from './types';

type Props = {
  event: SchoolEvent | null;
  onClose: () => void;
  onEdit: (e: SchoolEvent) => void;
  onDelete: (e: SchoolEvent) => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.primaryDeep} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

function inferImageMime(uri: string): string {
  const clean = uri.split('?')[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  if (ext === 'png') return 'image/png';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function toMediaAsset(
  asset: ImagePicker.ImagePickerAsset
): { asset: MediaAsset; resourceType: EventMediaResourceType } {
  const isVideo = asset.type === 'video';
  const ext = (asset.uri.split('?')[0].split('.').pop() || (isVideo ? 'mp4' : 'jpg')).toLowerCase();
  const name = asset.fileName ?? `${isVideo ? 'video' : 'photo'}_${Date.now()}.${ext}`;
  const type = asset.mimeType ?? (isVideo ? 'video/mp4' : inferImageMime(asset.uri));
  return { asset: { uri: asset.uri, name, type }, resourceType: isVideo ? 'video' : 'image' };
}

function MediaThumb({
  item, canRemove, onRemove,
}: { item: EventMedia; canRemove: boolean; onRemove: () => void }) {
  return (
    <View style={styles.media}>
      {item.resourceType === 'image' ? (
        <Image source={{ uri: item.streamingUrl }} style={styles.mediaImage} />
      ) : (
        <View style={[styles.mediaImage, styles.mediaVideo]}>
          <Ionicons name="videocam" size={26} color={colors.textSecondary} />
          <Text style={styles.mediaText}>Video</Text>
        </View>
      )}
      {canRemove ? (
        <Pressable style={styles.mediaRemove} onPress={onRemove} hitSlop={8} accessibilityLabel="Remove media">
          <Ionicons name="close-circle" size={20} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EventDetailSheet({ event, onClose, onEdit, onDelete, canEdit = true, canDelete = true }: Props) {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canAddMedia = permissions.includes('event.media.create');
  const canRemoveMedia = permissions.includes('event.media.delete');
  const { media, isLoading: mediaLoading, isUploading, upload, remove: removeMedia } = useEventMedia(
    event?.id ?? null
  );

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.6,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const { asset, resourceType } = toMediaAsset(result.assets[0]);
    upload(asset, resourceType);
  };

  const onRemoveMedia = (m: EventMedia) => {
    Alert.alert('Remove media', 'Remove this item from the event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMedia(m.id) },
    ]);
  };

  return (
    <Modal visible={!!event} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      {event ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.tags}>
              <Badge label={event.status} tone={STATUS_TONE[event.status]} />
              <Badge label={event.targetAudience} tone="neutral" />
              {event.isHoliday ? <Badge label="Holiday" tone="danger" /> : null}
            </View>
            <Text style={styles.title}>{event.title}</Text>
            <Row icon="time-outline" text={formatRange(event.startDate, event.endDate)} />
            {event.location ? <Row icon="location-outline" text={event.location} /> : null}
            {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

            <View style={styles.sectionHead}>
              <Text style={styles.section}>MEDIA</Text>
              {canAddMedia ? (
                <Pressable style={styles.addMedia} onPress={pickMedia} disabled={isUploading} hitSlop={6}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.primaryDeep} />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={16} color={colors.primaryDeep} />
                      <Text style={styles.addMediaText}>Add photo/video</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
            {mediaLoading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} style={styles.mediaLoading} />
            ) : media.length === 0 ? (
              <View style={styles.media}>
                <Ionicons name="image-outline" size={28} color={colors.textHint} />
                <Text style={styles.mediaText}>No media</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                {media.map((m) => (
                  <MediaThumb key={m.id} item={m} canRemove={canRemoveMedia} onRemove={() => onRemoveMedia(m)} />
                ))}
              </ScrollView>
            )}
          </ScrollView>
          {canEdit || canDelete ? (
            <View style={styles.actions}>
              {canDelete ? (
                <Pressable style={[styles.btn, styles.del]} onPress={() => onDelete(event)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  <Text style={styles.delText}>Delete</Text>
                </Pressable>
              ) : null}
              {canEdit ? (
                <Pressable style={[styles.btn, styles.edit]} onPress={() => onEdit(event)}>
                  <Ionicons name="create-outline" size={18} color={colors.white} />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
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
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  section: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary, letterSpacing: 0.5 },
  addMedia: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addMediaText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  mediaLoading: { alignSelf: 'flex-start' },
  gallery: { gap: 10 },
  media: {
    width: 120, height: 90, borderRadius: radius.md, backgroundColor: colors.mintSoft,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  mediaImage: { width: 120, height: 90, borderRadius: radius.md },
  mediaVideo: {
    backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  mediaRemove: {
    position: 'absolute', top: -6, right: -6, backgroundColor: colors.cardSolid, borderRadius: 10,
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
