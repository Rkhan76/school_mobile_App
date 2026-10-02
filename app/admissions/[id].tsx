import { useLocalSearchParams } from 'expo-router';
import { AdmissionDetailScreen } from '../../src/features/admissions/detail/AdmissionDetailScreen';

export default function AdmissionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AdmissionDetailScreen id={id} />;
}
