import { useLocalSearchParams } from 'expo-router';
import { StudentDetailScreen } from '../../src/features/students/detail/StudentDetailScreen';

export default function StudentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StudentDetailScreen id={id} />;
}
