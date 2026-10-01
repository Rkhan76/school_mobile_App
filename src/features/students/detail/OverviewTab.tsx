import { View } from 'react-native';
import { CheckInCard } from './CheckInCard';
import { DocumentsCard } from './DocumentsCard';
import { FeeInvoiceCard } from './FeeInvoiceCard';
import { GuardianCard } from './GuardianCard';
import { IdentityCard } from './IdentityCard';
import type { StudentDetail } from './studentDetail';

export function OverviewTab({ s }: { s: StudentDetail }) {
  return (
    <View style={{ gap: 14 }}>
      <CheckInCard a={s.attendance} />
      <GuardianCard g={s.guardian} />
      <IdentityCard s={s} />
      <FeeInvoiceCard inv={s.fees.latestInvoice} />
      <DocumentsCard docs={s.documents} />
    </View>
  );
}
