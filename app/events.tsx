import { Stack } from 'expo-router';
import { EventsScreen } from '../src/features/events';

export default function EventsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EventsScreen />
    </>
  );
}
