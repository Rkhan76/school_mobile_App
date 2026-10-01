import { Stack } from 'expo-router';
import { AdmissionsScreen } from '../src/features/admissions';

export default function AdmissionsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AdmissionsScreen />
    </>
  );
}
