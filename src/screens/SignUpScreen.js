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
import { AppScreen } from '../components/UI';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('PlusNet');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Gagal', 'Semua field wajib diisi.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Gagal', 'Password minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Gagal', 'Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, store_name: storeName } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Gagal Daftar', error.message);
      return;
    }

    if (data?.session) {
      Alert.alert('Berhasil', 'Akun berhasil dibuat. Selamat datang!');
    } else {
      Alert.alert(
        'Cek Email',
        'Link konfirmasi telah dikirim ke email Anda. Silakan verifikasi lalu masuk.'
      );
      navigation.goBack();
    }
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="storefront" size={40} color={colors.primary} />
            <Text style={styles.title}>Buat Akun Baru</Text>
            <Text style={styles.subtitle}>Daftar untuk mulai kasir PlusNet</Text>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Nama Lengkap"
              icon="person-outline"
              placeholder="Nama Anda"
              value={name}
              onChangeText={setName}
            />
            <AppInput
              label="Nama Toko"
              icon="storefront-outline"
              placeholder="PlusNet"
              value={storeName}
              onChangeText={setStoreName}
            />
            <AppInput
              label="Email"
              icon="mail-outline"
              placeholder="admin@plusnet.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="Password"
              icon="lock-closed-outline"
              placeholder="Minimal 6 karakter"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <AppInput
              label="Konfirmasi Password"
              icon="shield-checkmark-outline"
              placeholder="Ulangi password"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
            <View style={{ marginTop: spacing.sm }}>
              <AppButton title="Daftar" loading={loading} onPress={handleSignUp} />
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Sudah punya akun?{' '}
          <Text
            style={styles.footerLink}
            onPress={() => navigation.navigate('Login')}
          >
            Masuk
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
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.md },
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
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    marginTop: spacing.sm,
  },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  form: { gap: spacing.sm },
  footer: {
    ...typography.bodyMd,
    color: colors.secondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  footerLink: { color: colors.primary, fontFamily: 'Manrope_700Bold' },
});