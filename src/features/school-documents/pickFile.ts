import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { FilePart } from './types';

/** Server-side max per the doc. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const DOC_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function inferExtension(uri: string): string {
  const clean = uri.split('?')[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  return match ? match[1].toLowerCase() : 'jpg';
}

function mimeFromExtension(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function tooLarge(bytes?: number): boolean {
  if (bytes !== undefined && bytes > MAX_FILE_BYTES) {
    Alert.alert('File too large', 'Choose a file under 25 MB.');
    return true;
  }
  return false;
}

async function pickFromCamera(): Promise<FilePart | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow camera access to attach a photo.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (tooLarge(asset.fileSize)) return null;
  const ext = inferExtension(asset.fileName ?? asset.uri);
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo_${Date.now()}.${ext}`,
    type: asset.mimeType ?? mimeFromExtension(ext),
  };
}

async function pickFromLibrary(): Promise<FilePart | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to attach a photo.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (tooLarge(asset.fileSize)) return null;
  const ext = inferExtension(asset.fileName ?? asset.uri);
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo_${Date.now()}.${ext}`,
    type: asset.mimeType ?? mimeFromExtension(ext),
  };
}

async function pickDocumentFile(): Promise<FilePart | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...DOC_MIME_TYPES, ...IMAGE_MIME_TYPES],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (tooLarge(asset.size)) return null;
  return { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' };
}

/**
 * Lets the user attach a file for a school document: a photo (camera or library)
 * or any of the supported document formats (pdf/doc/docx/xls/xlsx/images), per the
 * 25MB limit documented for `/school-documents/upload`.
 */
export function pickSchoolDocumentFile(onPicked: (file: FilePart) => void): void {
  const run = async (source: 'camera' | 'library' | 'document') => {
    const part =
      source === 'camera' ? await pickFromCamera() : source === 'library' ? await pickFromLibrary() : await pickDocumentFile();
    if (part) onPicked(part);
  };

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Take Photo', 'Choose Photo', 'Choose Document', 'Cancel'], cancelButtonIndex: 3 },
      (index) => {
        if (index === 0) run('camera');
        else if (index === 1) run('library');
        else if (index === 2) run('document');
      }
    );
  } else {
    Alert.alert('Attach file', 'Choose a source', [
      { text: 'Take Photo', onPress: () => run('camera') },
      { text: 'Choose Photo', onPress: () => run('library') },
      { text: 'Choose Document', onPress: () => run('document') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
}
