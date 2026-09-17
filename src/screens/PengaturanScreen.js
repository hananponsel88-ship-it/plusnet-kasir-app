import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, shadow } from '../theme';
import { ConfirmModal } from '../components/Modals';
import { AnimatedModal } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

// ==========================================
// MODAL BOTTOM SHEET INTERAKTIF
// ==========================================
function SheetModal({ visible, onClose, children }) {
  return (
    <AnimatedModal visible={visible} onClose={onClose} align="bottom">
      <KeyboardAvoidingView
        style={{ width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </AnimatedModal>
  );
}

// ==========================================
// SUCCESS MODAL ANIMATED
// ==========================================
function SuccessModal({ visible, title, message, onClose }) {
  return (
    <AnimatedModal visible={visible} onClose={onClose} align="center">
      <View style={styles.successCard}>
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>{title}</Text>
        {message ? <Text style={styles.successMessage}>{message}</Text> : null}
        <TouchableOpacity style={styles.successBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.successBtnText}>Selesai</Text>
        </TouchableOpacity>
      </View>
    </AnimatedModal>
  );
}

// ==========================================
// MAIN PENGATURAN SCREEN
// ==========================================
export default function PengaturanScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // ---- State Profil Toko ----
  const [storeName, setStoreName] = useState('PlusNet');
  const [storeLoading, setStoreLoading] = useState(true);
  const [email, setEmail] = useState('');

  // ---- State Kategori Bisnis ----
  const [categories, setCategories] = useState(['atk', 'print', 'fotokopi', 'warnet', 'jajan']);

  // ---- State Preferensi Nota & Tema ----
  const [autoSendWA, setAutoSendWA] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('Standar');
  const [themeMode, setThemeMode] = useState('Terang'); // 'Terang' | 'Gelap'

  // ---- State Modals ----
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeDraft, setStoreDraft] = useState('');
  const [savingStore, setSavingStore] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passNew, setPassNew] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ---- Load data Supabase ----
  useEffect(() => {
    setEmail(user?.email || 'plusnet.malang@gmail.com');
    (async () => {
      if (!user?.id) {
        setStoreLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('store_name, categories')
        .eq('id', user.id)
        .maybeSingle();
      
      setStoreLoading(false);
      if (!error && data) {
        if (data.store_name) {
          setStoreName(data.store_name);
          setStoreDraft(data.store_name);
        }
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    })();
  }, [user]);

  // ---- List Kategori Bisnis ----
  const KATEGORI_LIST = [
    { key: 'atk', label: 'ATK', icon: 'create-outline' },
    { key: 'print', label: 'Print', icon: 'print-outline' },
    { key: 'fotokopi', label: 'Fotokopi', icon: 'copy-outline' },
    { key: 'warnet', label: 'Warnet', icon: 'desktop-outline' },
    { key: 'jajan', label: 'Jajan & Minuman', icon: 'fast-food-outline' },
  ];

  const toggleCategory = async (key) => {
    const next = categories.includes(key)
      ? categories.filter((c) => c !== key)
      : [...categories, key];
    
    setCategories(next);

    if (user?.id) {
      const { error } = await supabase
        .from('profiles')
        .update({ categories: next })
        .eq('id', user.id);

      if (error) {
        // Rollback jika gagal
        setCategories((prev) =>
          prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
        );
        Alert.alert('Gagal Menyimpan', 'Kategori tidak dapat tersimpan ke server.');
      }
    }
  };

  // ---- Simpan Nama Toko ----
  const saveStore = async () => {
    const name = (storeDraft || '').trim();
    if (!name) return;
    setSavingStore(true);
    
    if (user?.id) {
      const { error } = await supabase
        .from('profiles')
        .update({ store_name: name })
        .eq('id', user.id);
      
      setSavingStore(false);
      if (error) {
        Alert.alert('Gagal Menyimpan', 'Periksa koneksi Anda lalu coba lagi.');
        return;
      }
    } else {
      setSavingStore(false);
    }

    setStoreName(name);
    setShowStoreModal(false);
    setSuccessMsg('Profil toko berhasil diperbarui.');
    setShowSuccess(true);
  };

  // ---- Simpan Password ----
  const savePassword = async () => {
    const np = passNew.trim();
    if (np.length < 6) {
      Alert.alert('Kata Sandi Lemah', 'Gunakan minimal 6 karakter.');
      return;
    }
    if (np !== passConfirm.trim()) {
      Alert.alert('Tidak Cocok', 'Konfirmasi kata sandi tidak sesuai.');
      return;
    }

    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: np });
    setSavingPass(false);

    if (error) {
      Alert.alert('Gagal Mengganti', error.message || 'Terjadi kesalahan.');
      return;
    }

    setPassNew('');
    setPassConfirm('');
    setShowPasswordModal(false);
    setSuccessMsg('Kata sandi akun berhasil diperbarui.');
    setShowSuccess(true);
  };

  // ---- Logout ----
  const confirmLogout = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setLoggingOut(false);
    if (error) {
      Alert.alert('Gagal Keluar', error.message || 'Terjadi kesalahan.');
      setShowLogoutConfirm(false);
      return;
    }
    setShowLogoutConfirm(false);
  };

  return (
    <View style={styles.screen}>
      {/* Header Utama */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <Text style={styles.headerSubtitle}>Kelola preferensi dan profil bisnis Anda.</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom + spacing.xl * 2,
          gap: spacing.lg,
        }}
      >
        {/* SECTION 1: PROFIL TOKO */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>PROFIL TOKO</Text>
          <View style={styles.card}>
            {/* Header Pengguna */}
            <View style={styles.profileHeaderRow}>
              <View style={styles.storeAvatarBox}>
                <Ionicons name="storefront" size={26} color={colors.primary} />
              </View>
              <View style={styles.profileHeaderInfo}>
                <Text style={styles.userNameText}>Pengguna</Text>
                <TouchableOpacity onPress={() => { setStoreDraft(storeName); setShowStoreModal(true); }}>
                  <Text style={styles.editProfileLink}>Ubah Profil</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Item: Nama Toko */}
            <TouchableOpacity
              style={styles.cardRow}
              activeOpacity={0.7}
              onPress={() => { setStoreDraft(storeName); setShowStoreModal(true); }}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="storefront-outline" size={20} color={colors.onSurface} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Nama Toko</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValueText}>{storeLoading ? 'Memuat…' : storeName}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Item: Email */}
            <View style={styles.cardRow}>
              <View style={styles.rowLeft}>
                <Ionicons name="mail-outline" size={20} color={colors.onSurface} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Email</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValueText} numberOfLines={1}>{email}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 2: KATEGORI BISNIS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>KATEGORI BISNIS</Text>
          <View style={styles.card}>
            {KATEGORI_LIST.map((kat, idx) => {
              const isSelected = categories.includes(kat.key);
              return (
                <React.Fragment key={kat.key}>
                  {idx > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.cardRow}
                    activeOpacity={0.8}
                    onPress={() => toggleCategory(kat.key)}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons name={kat.icon} size={20} color={colors.onSurface} style={styles.rowIcon} />
                      <Text style={styles.rowLabel}>{kat.label}</Text>
                    </View>
                    <Switch
                      value={isSelected}
                      onValueChange={() => toggleCategory(kat.key)}
                      trackColor={{ false: '#E2E8F0', true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: PREFERENSI NOTA */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>PREFERENSI NOTA</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.rowLeft}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.onSurface} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Kirim Otomatis ke WhatsApp</Text>
              </View>
              <Switch
                value={autoSendWA}
                onValueChange={setAutoSendWA}
                trackColor={{ false: '#E2E8F0', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.cardRow}
              activeOpacity={0.7}
              onPress={() => {
                const next = selectedTemplate === 'Standar' ? 'Ringkas' : 'Standar';
                setSelectedTemplate(next);
              }}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="receipt-outline" size={20} color={colors.onSurface} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Template Nota</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValueText}>{selectedTemplate}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4: TEMA APLIKASI */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>TEMA APLIKASI</Text>
          <View style={styles.cardPadding}>
            <View style={styles.themeSelectorContainer}>
              <TouchableOpacity
                style={[styles.themeOptionBtn, themeMode === 'Terang' && styles.themeOptionActive]}
                onPress={() => setThemeMode('Terang')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="sunny-outline"
                  size={18}
                  color={themeMode === 'Terang' ? colors.onSurface : colors.secondary}
                />
                <Text style={[styles.themeOptionText, themeMode === 'Terang' && styles.themeOptionTextActive]}>
                  Terang
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.themeOptionBtn, themeMode === 'Gelap' && styles.themeOptionActive]}
                onPress={() => setThemeMode('Gelap')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={themeMode === 'Gelap' ? colors.onSurface : colors.secondary}
                />
                <Text style={[styles.themeOptionText, themeMode === 'Gelap' && styles.themeOptionTextActive]}>
                  Gelap
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 5: VERSI & AKUN */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>VERSI</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardRow}
              activeOpacity={0.7}
              onPress={() => {
                setSuccessMsg('PlusNet Kasir v1.0.0\nSistem POS Andal & Terintegrasi Cloud.');
                setShowSuccess(true);
              }}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="information-circle-outline" size={20} color={colors.onSurface} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Versi Aplikasi</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValueText}>1.0.0</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.cardRow}
              activeOpacity={0.7}
              onPress={() => setShowPasswordModal(true)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="person-outline" size={20} color={colors.onSurface} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Akun & Keamanan</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValueText} numberOfLines={1}>{email}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* TOMBOL KELUAR */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutConfirm(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutButtonText}>Keluar</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ---- MODAL UBAH PROFIL TOKO ---- */}
      <SheetModal visible={showStoreModal} onClose={() => setShowStoreModal(false)}>
        <Text style={styles.sheetTitle}>Ubah Profil Toko</Text>
        <Text style={styles.sheetSubtitle}>Nama toko ini akan ditampilkan pada nota cetak dan WhatsApp.</Text>
        
        <Text style={styles.inputLabel}>Nama Toko</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="storefront-outline" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            value={storeDraft}
            onChangeText={setStoreDraft}
            placeholder="Masukkan Nama Toko"
            placeholderTextColor={colors.outlineVariant}
          />
        </View>

        <View style={styles.sheetActionRow}>
          <TouchableOpacity
            style={[styles.sheetBtn, styles.sheetBtnSecondary]}
            onPress={() => setShowStoreModal(false)}
          >
            <Text style={styles.sheetBtnSecondaryText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sheetBtn, styles.sheetBtnPrimary]}
            onPress={saveStore}
            disabled={savingStore}
          >
            <Text style={styles.sheetBtnPrimaryText}>{savingStore ? 'Menyimpan...' : 'Simpan'}</Text>
          </TouchableOpacity>
        </View>
      </SheetModal>

      {/* ---- MODAL GANTI PASS ---- */}
      <SheetModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
        <Text style={styles.sheetTitle}>Ganti Kata Sandi</Text>
        <Text style={styles.sheetSubtitle}>Perbarui kata sandi akun untuk menjaga keamanan transaksi.</Text>

        <Text style={styles.inputLabel}>Kata Sandi Baru</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            value={passNew}
            onChangeText={setPassNew}
            placeholder="Minimal 6 karakter"
            secureTextEntry
            placeholderTextColor={colors.outlineVariant}
          />
        </View>

        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Konfirmasi Kata Sandi</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            value={passConfirm}
            onChangeText={setPassConfirm}
            placeholder="Ulangi kata sandi baru"
            secureTextEntry
            placeholderTextColor={colors.outlineVariant}
          />
        </View>

        <View style={styles.sheetActionRow}>
          <TouchableOpacity
            style={[styles.sheetBtn, styles.sheetBtnSecondary]}
            onPress={() => setShowPasswordModal(false)}
          >
            <Text style={styles.sheetBtnSecondaryText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sheetBtn, styles.sheetBtnPrimary]}
            onPress={savePassword}
            disabled={savingPass}
          >
            <Text style={styles.sheetBtnPrimaryText}>{savingPass ? 'Menyimpan...' : 'Simpan'}</Text>
          </TouchableOpacity>
        </View>
      </SheetModal>

      {/* ---- SUCCESS MODAL ---- */}
      <SuccessModal
        visible={showSuccess}
        title="Berhasil Tersimpan"
        message={successMsg}
        onClose={() => setShowSuccess(false)}
      />

      {/* ---- LOGOUT CONFIRM MODAL ---- */}
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Keluar Akun"
        message="Apakah Anda yakin ingin keluar dari akun kasir ini?"
        confirmText="Ya, Keluar"
        variant="danger"
        loading={loggingOut}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </View>
  );
}

// ==========================================
// STYLESHEET
// ==========================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#DDE5DD', // Tone background khas aplikasi kasir hijau muda lembut
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#DDE5DD',
  },
  headerTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    color: '#1A231E',
  },
  headerSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#526356',
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionHeaderTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#526356',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  cardPadding: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xs,
    ...shadow.card,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  storeAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: '#1A231E',
  },
  editProfileLink: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#2E7D32',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F1',
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#1A231E',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '50%',
  },
  rowValueText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#667085',
  },
  // Theme selector
  themeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F7F4',
    borderRadius: radius.lg,
    padding: 4,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 6,
  },
  themeOptionActive: {
    backgroundColor: '#FFFFFF',
    ...shadow.card,
  },
  themeOptionText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#667085',
  },
  themeOptionTextActive: {
    color: '#1A231E',
    fontFamily: 'Manrope_800ExtraBold',
  },
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#D32F2F',
    borderRadius: radius.xl,
    paddingVertical: 13,
    marginTop: spacing.xs,
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: '#D32F2F',
  },
  // Bottom Sheet Modal
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: '#1A231E',
  },
  sheetSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#667085',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#344054',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#1A231E',
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sheetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  sheetBtnSecondary: {
    backgroundColor: '#F2F4F7',
  },
  sheetBtnPrimary: {
    backgroundColor: colors.primary || '#2E7D32',
  },
  sheetBtnSecondaryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#344054',
  },
  sheetBtnPrimaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Success Card
  successCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  successIconWrap: {
    marginBottom: spacing.xs,
  },
  successTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: '#1A231E',
    textAlign: 'center',
  },
  successMessage: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: '#667085',
    textAlign: 'center',
    marginTop: 4,
  },
  successBtn: {
    marginTop: spacing.md,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary || '#2E7D32',
  },
  successBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});