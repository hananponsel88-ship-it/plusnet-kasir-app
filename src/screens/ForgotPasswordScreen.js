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
import { AppButton, AppInput, BackButton } from '../components/UI';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Gagal', 'Masukkan alamat email Anda.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Gagal', error.message);
      return;
    }
    setSent(true);
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
        <BackButton style={styles.backBtn} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-reset" size={24} color={colors.primary} />
            </View>
            <Text style={styles.title}>Lupa Password</Text>
            <Text style={styles.subtitle}>
              Masukkan email Anda untuk menerima link reset password.
            </Text>
          </View>

          {sent ? (
            <View style={styles.success}>
              <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
              <Text style={styles.successTitle}>Link Terkirim!</Text>
              <Text style={styles.successDesc}>
                Silakan periksa kotak masuk email Anda untuk instruksi selanjutnya.
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.successLink}>
                <Text style={styles.successLinkText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <AppInput
                label="Alamat Email"
                icon="mail-outline"
                placeholder="admin@plusnet.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <View style={{ marginTop: spacing.sm }}>
                <AppButton
                  title="Kirim Link Reset"
                  icon="arrow-forward"
                  loading={loading}
                  onPress={handleReset}
                />
              </View>
            </View>
          )}
        </View>
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
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,184,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  form: { gap: spacing.sm },
  success: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  successTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
  },
  successDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  successLink: { marginTop: spacing.md },
  successLinkText: {
    color: colors.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
});