import { Redirect } from 'expo-router';
import { useSession } from '../src/features/auth/session';

export default function Index() {
  const isAuthed = useSession((s) => s.isAuthed);
  return <Redirect href={isAuthed ? '/(tabs)' : '/login'} />;
}
