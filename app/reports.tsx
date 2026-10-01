import { Stack } from 'expo-router';
import { ReportsScreen } from '../src/features/reports';

export default function ReportsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReportsScreen />
    </>
  );
}
