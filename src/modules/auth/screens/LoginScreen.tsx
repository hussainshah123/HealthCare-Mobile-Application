import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandMark, Button, Input, Screen } from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import type { AuthStackParamList } from '../AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e) {
      setError(getErrorMessage(e, 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} style={styles.content}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <BrandMark size={64} />
        <Text style={styles.logo}>MediGo</Text>
        <Text style={styles.sub}>Sign in to continue</Text>
      </View>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="Your password"
        onSubmitEditing={submit}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Sign in" onPress={submit} loading={loading} />
      <Button
        title="New here? Create an account"
        variant="ghost"
        onPress={() => navigation.navigate('Register')}
        style={styles.link}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { marginBottom: spacing.xxl },
  logo: {
    ...typography.h1,
    color: colors.primaryDark,
    fontSize: 34,
    marginTop: spacing.lg,
  },
  sub: { ...typography.caption, marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md },
  link: { marginTop: spacing.md },
});
