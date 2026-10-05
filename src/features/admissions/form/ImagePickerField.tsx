import { useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, radius, shadow, themed } from '../../../theme/tokens';
import type { AdmissionFilePart } from '../types';

type Props = {
  label: string;
  /** A newly-picked part, a plain URL string (existing image in edit mode), or null for empty. */
  value: AdmissionFilePart | string | null;
  onChange: (part: AdmissionFilePart | null) => void;
};

function inferExtension(uri: string): string {
  const clean = uri.split('?')[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  return match ? match[1].toLowerCase() : 'jpg';
}

function mimeFromExtension(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function toFilePart(asset: ImagePicker.ImagePickerAsset): AdmissionFilePart {
  const ext = inferExtension(asset.fileName ?? asset.uri);
  const name = asset.fileName ?? `photo_${Date.now()}.${ext}`;
  const type = asset.mimeType ?? mimeFromExtension(ext);
  return { uri: asset.uri, name, type };
}

/** One reusable image slot: tap to take a photo or pick from the library, with preview + remove. */
export function ImagePickerField({ label, value, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  const previewUri = typeof value === 'string' ? value : (value?.uri ?? null);

  const openLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach this image.');
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.[0]) onChange(toFilePart(result.assets[0]));
    } finally {
      setBusy(false);
    }
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to capture this image.');
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!result.canceled && result.assets?.[0]) onChange(toFilePart(result.assets[0]));
    } finally {
      setBusy(false);
    }
  };

  const pick = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Take Photo', 'Choose from Library', 'Cancel'], cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) openCamera();
          if (index === 1) openLibrary();
        }
      );
    } else {
      Alert.alert(label, 'Choose image source', [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Library', onPress: openLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.slot} onPress={pick} disabled={busy} accessibilityRole="button">
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.thumb} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={20} color={colors.textHint} />
          </View>
        )}
        <Text style={styles.hint} numberOfLines={1}>
          {busy ? 'Opening…' : previewUri ? 'Tap to replace' : 'Tap to add photo'}
        </Text>
        {previewUri ? (
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            style={styles.remove}
            accessibilityLabel={`Remove ${label}`}
          >
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: 8, width: '47%' },
  label: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1, color: colors.textSecondary },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: colors.cardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  thumb: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.mint },
  placeholder: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textSecondary },
  remove: { padding: 2 },
}));
