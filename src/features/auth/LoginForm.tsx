import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, themed } from '../../theme/tokens';
import { ErrorBanner } from './ErrorBanner';
import { FormField } from './FormField';
import { SchoolPickerSheet } from './SchoolPickerSheet';
import { useSession } from './session';
import { emailError, isValidEmail } from './validation';

export function LoginForm() {
  const router = useRouter();
  const { login, loading, error, pendingSchools, clearPendingSchools, clearError, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const valid = isValidEmail(email) && password.length > 0;
  const disabled = !valid || loading;

  useEffect(() => {
    if (status === 'authed') {
      router.replace('/(tabs)');
    }
  }, [status, router]);

  const submit = async () => {
    if (disabled) return;
    await login(email, password);
  };

  return (
    <View style={styles.form}>
      <View style={styles.heading}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to access your administrative workspace</Text>
      </View>

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      <FormField
        label="ADMINISTRATIVE EMAIL"
        icon="mail-outline"
        placeholder="admin@school.edu"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        importantForAutofill="yes"
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
        importantForAutofill="yes"
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

      <SchoolPickerSheet
        visible={!!pendingSchools}
        schools={pendingSchools ?? []}
        loading={loading}
        onClose={clearPendingSchools}
        onSelect={(schoolId) => login(email, password, schoolId)}
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
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
    backgroundColor: colors.cardSolid,
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
}));
