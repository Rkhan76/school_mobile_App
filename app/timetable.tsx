import { Stack } from 'expo-router';
import { TimetableScreen } from '../src/features/timetable';

export default function TimetableRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TimetableScreen />
    </>
  );
}
