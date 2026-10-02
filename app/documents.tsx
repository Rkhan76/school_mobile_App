import { Stack } from 'expo-router';
import { DocumentsScreen } from '../src/features/documents';

export default function DocumentsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DocumentsScreen />
    </>
  );
}
