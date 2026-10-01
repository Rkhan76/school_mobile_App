import { Stack } from 'expo-router';
import { LedgersScreen } from '../src/features/ledgers';

export default function LedgersRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LedgersScreen />
    </>
  );
}
