import { Stack } from 'expo-router';
import { AuditLogsScreen } from '../src/features/audit-logs';

export default function AuditLogsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuditLogsScreen />
    </>
  );
}
