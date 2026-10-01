import { Stack } from 'expo-router';
import { SchoolDocumentsScreen } from '../src/features/school-documents';

export default function SchoolDocumentsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SchoolDocumentsScreen />
    </>
  );
}
