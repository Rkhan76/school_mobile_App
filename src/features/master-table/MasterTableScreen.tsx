import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CONFIGS } from './config';
import { MasterTab } from './MasterTab';
import { MasterTabChips } from './MasterTabChips';
import type { TabKey } from './types';

export function MasterTableScreen() {
  const [tab, setTab] = useState<TabKey>('academicYears');
  const chips = <View style={styles.chips}><MasterTabChips active={tab} onChange={setTab} /></View>;

  let body;
  switch (tab) {
    case 'academicYears': body = <MasterTab key={tab} config={CONFIGS.academicYears} header={chips} />; break;
    case 'examTypes': body = <MasterTab key={tab} config={CONFIGS.examTypes} header={chips} />; break;
    case 'feeTypes': body = <MasterTab key={tab} config={CONFIGS.feeTypes} header={chips} />; break;
    case 'leaveTypes': body = <MasterTab key={tab} config={CONFIGS.leaveTypes} header={chips} />; break;
    case 'periods': body = <MasterTab key={tab} config={CONFIGS.periods} header={chips} />; break;
    case 'documentCategories': body = <MasterTab key={tab} config={CONFIGS.documentCategories} header={chips} />; break;
  }

  return (
    <ScreenBackground>
      <ScreenHeader title="Master Table" subtitle="Manage school master data" back />
      {body}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  chips: { paddingTop: 2 },
});
