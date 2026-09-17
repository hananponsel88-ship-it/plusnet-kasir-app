import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { AppButton, AppInput } from '../components/UI';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Gagal', 'Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Gagal Masuk', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="storefront" size={40} color={colors.primary} />
            <Text style={styles.title}>PlusNet Kasir</Text>
            <Text style={styles.subtitle}>Silakan masuk ke akun Anda</Text>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Email"
              icon="person-outline"
              placeholder="admin@plusnet.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="Password"
              icon="lock-closed-outline"
              placeholder="Masukkan password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              }
            />
            <View style={{ marginTop: spacing.sm }}>
              <AppButton title="Masuk" loading={loading} onPress={handleLogin} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.linkRow}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.linkText}>Lupa Password?</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Belum punya akun?{' '}
          <Text
            style={styles.footerLink}
            onPress={() => navigation.navigate('SignUp')}
          >
            Daftar Sekarang
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    marginTop: spacing.sm,
  },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  form: { gap: spacing.sm },
  eyeBtn: { paddingHorizontal: spacing.md },
  linkRow: { alignItems: 'center', marginTop: spacing.md },
  linkText: {
    ...typography.bodyMd,
    color: colors.secondary,
    fontFamily: 'Manrope_600SemiBold',
  },
  footer: {
    ...typography.bodyMd,
    color: colors.secondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  footerLink: { color: colors.primary, fontFamily: 'Manrope_700Bold' },
});