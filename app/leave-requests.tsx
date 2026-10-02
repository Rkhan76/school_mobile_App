import { Stack } from 'expo-router';
import { LeaveRequestsScreen } from '../src/features/leave-requests/LeaveRequestsScreen';

export default function LeaveRequestsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LeaveRequestsScreen />
    </>
  );
}
