import { Stack } from 'expo-router';
import { AttendanceScreen } from '../src/features/attendance';

export default function AttendanceRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AttendanceScreen />
    </>
  );
}
