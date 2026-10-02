import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import { FooterButtons, FullModal } from './parts';

type Props = { visible: boolean; onClose: () => void };

/**
 * There is no "create account" endpoint for this module — a portal account
 * (school_user) is only ever created as a side effect of adding a Student,
 * Teacher, or Non-teaching-staff profile (see MOBILE_API_DOCS §3/§4/§5). This
 * replaces the old mock "add member" form with a short explainer instead.
 */
export function AddMemberModal({ visible, onClose }: Props) {
  return (
    <FullModal
      visible={visible}
      title="Add member"
      onClose={onClose}
      footer={<FooterButtons cancelLabel="Close" saveLabel="Got it" onCancel={onClose} onSave={onClose} />}
    >
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="information-circle-outline" size={40} color={colors.primaryDeep} />
        </View>
        <Text style={styles.title}>Accounts are created automatically</Text>
        <Text style={styles.body}>
          There's no standalone "add member" action here — a portal account is created
          automatically whenever you add a Student, Teacher, or Non-teaching Staff member.
          Go to those sections to create one; it will then show up in this list.
        </Text>
      </View>
    </FullModal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  iconWrap: {
    width: 72, height: 72, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mintSoft, marginBottom: 6,
  },
  title: { fontFamily: fonts.heading, fontSize: 17, color: colors.text, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
