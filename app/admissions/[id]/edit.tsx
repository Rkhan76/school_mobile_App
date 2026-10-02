import { Stack, useLocalSearchParams } from 'expo-router';
import { AdmissionFormScreen } from '../../../src/features/admissions/form/AdmissionFormScreen';

export default function EditAdmissionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AdmissionFormScreen mode="edit" admissionId={id!} />
    </>
  );
}
