import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { BrandHeader, TopBar } from './BrandHeader';
import { LoginFooter } from './LoginFooter';
import { LoginForm } from './LoginForm';
import { SsoButtons } from './SsoButtons';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <TopBar />
          <BrandHeader />
          <LoginForm />
          <SsoButtons />
          <LoginFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 28 },
});
