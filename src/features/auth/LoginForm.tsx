import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../theme/tokens';
import { ErrorBanner } from './ErrorBanner';
import { FormField } from './FormField';
import { useSession } from './session';
import { SCHOOL_INSTANCE, emailError, fakeSignIn, isValidEmail } from './validation';

export function LoginForm() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  // Dev-only prefill of the dummy credentials; stripped from production builds.
  const [email, setEmail] = useState(__DEV__ ? 'admin@verdant.test' : '');
  const [password, setPassword] = useState(__DEV__ ? 'admin123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const valid = isValidEmail(email) && password.length > 0;
  const disabled = !valid || loading;

  const submit = async () => {
    if (disabled) return;
    setFailed(false);
    setLoading(true);
    const ok = await fakeSignIn(email, password);
    setLoading(false);
    if (ok) {
      signIn('Admin');
      router.replace('/(tabs)');
    } else {
      setFailed(true);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.heading}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to access your administrative workspace</Text>
      </View>

      {failed ? <ErrorBanner onDismiss={() => setFailed(false)} /> : null}

      <FormField
        label="SCHOOL INSTANCE"
        icon="business-outline"
        value={SCHOOL_INSTANCE}
        readOnlyField
        right={<Ionicons name="checkmark-circle" size={20} color={colors.success} />}
      />

      <FormField
        label="ADMINISTRATIVE EMAIL"
        icon="mail-outline"
        placeholder="admin@school.edu"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        error={emailError(email)}
        right={
          email.length > 0 ? (
            <Pressable onPress={() => setEmail('')} hitSlop={10} accessibilityLabel="Clear email">
              <Ionicons name="close-circle" size={20} color={colors.textHint} />
            </Pressable>
          ) : null
        }
      />

      <FormField
        label="PASSWORD"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        right={
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={10}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        }
      />

      <View style={styles.optionsRow}>
        <Pressable
          style={styles.remember}
          onPress={() => setRemember((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
        >
          <View style={[styles.checkbox, remember && styles.checkboxOn]}>
            {remember ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>
        <Pressable onPress={() => Alert.alert('Forgot password?', 'Coming soon')} hitSlop={8}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={submit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: loading }}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
          pressed && !disabled && { opacity: 0.9 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.buttonText}>Sign In to Admin Portal</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  heading: { gap: 6 },
  title: { fontFamily: fonts.headingExtra, fontSize: 26, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#c5d6d3',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  rememberText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  link: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.55, elevation: 0, shadowOpacity: 0 },
  buttonText: { fontFamily: fonts.heading, fontSize: 16, color: colors.white },
});
