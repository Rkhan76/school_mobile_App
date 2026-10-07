import { File } from 'expo-file-system';

/**
 * Appends a local file to a FormData as a multipart file part.
 *
 * Expo's fetch (SDK 57) does not understand React Native's `{ uri, name, type }` part and fails with
 * "Unsupported FormDataPart implementation"; it needs a Blob-like object, which expo-file-system's `File` is.
 */
export function appendFile(form: FormData, field: string, file: { uri: string; name?: string }): void {
  form.append(field, new File(file.uri) as unknown as Blob, file.name);
}
