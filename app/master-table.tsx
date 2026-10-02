import { Stack } from 'expo-router';
import { MasterTableScreen } from '../src/features/master-table';

export default function MasterTableRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MasterTableScreen />
    </>
  );
}
