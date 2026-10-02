import { Stack } from 'expo-router';
import { AdmissionFormScreen } from '../../src/features/admissions/form/AdmissionFormScreen';

export default function NewAdmissionRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AdmissionFormScreen mode="create" />
    </>
  );
}
