import { Stack } from 'expo-router';
import { NoticesScreen } from '../src/features/notices';

export default function NoticesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NoticesScreen />
    </>
  );
}
