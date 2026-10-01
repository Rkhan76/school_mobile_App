import { useLocalSearchParams } from 'expo-router';
import { ClassDetailScreen } from '../../src/features/classes/detail/ClassDetailScreen';

export default function ClassDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ClassDetailScreen id={id} />;
}
