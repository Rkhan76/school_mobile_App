import { Stack } from 'expo-router';
import { CertificatesScreen } from '../src/features/certificates';

export default function CertificatesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CertificatesScreen />
    </>
  );
}
