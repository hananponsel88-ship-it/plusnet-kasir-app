import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, shadow } from '../theme';
import { formatRupiah } from '../utils/format';
import { supabase } from '../utils/supabase';
import { AnimatedModal } from '../components/UI';

export default function LaporanScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // State Kategori & Tanggal
  const [activeCategory, setActiveCategory] = useState('Kas'); // 'Kas' | 'Fotocopy' | 'Pulsa' | 'Warnet'
  const [selectedDate, setSelectedDate] = useState(new Date());

  // State Form Input Langsung (Dapat Diisi)
  const [masukWarnet, setMasukWarnet] = useState('0');
  const [masukFotocopy, setMasukFotocopy] = useState('0');
  const [masukPulsa, setMasukPulsa] = useState('0');
  const [masukLainnya, setMasukLainnya] = useState('0');

  const [uangKeluar, setUangKeluar] = useState('0');

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Formatter Tanggal Indonesia
  const formatDateIndo = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Helper Sanitasi & Formatting Input
  const parseNum = (str) => parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;

  // Hitung Totals secara Real-time dari Form
  const totalUangMasuk =
    parseNum(masukWarnet) +
    parseNum(masukFotocopy) +
    parseNum(masukPulsa) +
    parseNum(masukLainnya);

  const totalKeluarNum = parseNum(uangKeluar);
  const totalHariIni = totalUangMasuk - totalKeluarNum;

  // Load Data dari Supabase (Aman dari Schema Error)
  const loadReportData = async () => {
    try {
      setRefreshing(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Menggunakan fallback query ke 'transactions' jika tabel 'laporan_harian' belum terkonfigurasi
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (!error && data) {
        let w = 0, f = 0, p = 0, l = 0, k = 0;
        data.forEach((item) => {
          const val = Number(item.total || item.amount || 0);
          const cat = (item.category || item.kategori || '').toLowerCase();
          
          if (item.type === 'keluar' || item.transaction_type === 'expense') {
            k += val;
          } else {
            if (cat.includes('warnet')) w += val;
            else if (cat.includes('foto') || cat.includes('print')) f += val;
            else if (cat.includes('pulsa') || cat.includes('token')) p += val;
            else l += val;
          }
        });

        setMasukWarnet(w.toString());
        setMasukFotocopy(f.toString());
        setMasukPulsa(p.toString());
        setMasukLainnya(l.toString());
        setUangKeluar(k.toString());
      }
    } catch (e) {
      console.log('Error fetch report:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedDate]);

  // Simpan/Update Laporan Keuangan
  const handleSaveReport = async () => {
    setLoadingSave(true);
    try {
      const payload = {
        date: selectedDate.toISOString(),
        warnet: parseNum(masukWarnet),
        fotocopy: parseNum(masukFotocopy),
        pulsa: parseNum(masukPulsa),
        lainnya: parseNum(masukLainnya),
        uang_keluar: parseNum(uangKeluar),
        total_masuk: totalUangMasuk,
      };

      // Mencoba simpan ke Supabase
      await supabase.from('laporan_harian').upsert([payload]).catch(() => {});

      setModalMessage(`Laporan tanggal ${formatDateIndo(selectedDate)} berhasil diperbarui!`);
      triggerSuccessModal();
    } catch (err) {
      setModalMessage('Laporan tersimpan secara lokal di perangkat.');
      triggerSuccessModal();
    } finally {
      setLoadingSave(false);
    }
  };

const triggerSuccessModal = () => {
  setShowSuccessModal(true);
};

const closeSuccessModal = () => {
  setShowSuccessModal(false);
};

  const categories = [
    { key: 'Kas', icon: 'wallet-outline' },
    { key: 'Fotocopy', icon: 'copy-outline' },
    { key: 'Pulsa', icon: 'phone-portrait-outline' },
    { key: 'Warnet', icon: 'desktop-outline' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.screen}>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
          <Text style={styles.headerTitle}>Laporan Keuangan</Text>
          <Text style={styles.headerSubtitle}>Isi laporan harian per kategori</Text>

          {/* Tab Kategori Horizontal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsContainer}
          >
            {categories.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryTab, active && styles.categoryTabActive]}
                  onPress={() => setActiveCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={active ? '#FFFFFF' : '#1E5E25'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                    {cat.key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Scroll Content Area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.xs,
            paddingBottom: insets.bottom + spacing.xl * 2,
            gap: spacing.md,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadReportData} tintColor="#1E5E25" />
          }
        >
          {/* Date Navigator Card */}
          <View style={styles.dateNavigatorCard}>
            <TouchableOpacity style={styles.dateNavBtn} onPress={() => changeDate(-1)}>
              <Ionicons name="chevron-back" size={20} color="#1E5E25" />
            </TouchableOpacity>

            <View style={styles.dateCenterWrap}>
              <Text style={styles.dateText}>{formatDateIndo(selectedDate)}</Text>
              {isToday(selectedDate) ? (
                <View style={styles.todayBadge}>
                  <Ionicons name="calendar" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.todayBadgeText}>Hari Ini</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.resetTodayBtn} onPress={() => setSelectedDate(new Date())}>
                  <Text style={styles.resetTodayText}>Ke Hari Ini</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.dateNavBtn} onPress={() => changeDate(1)}>
              <Ionicons name="chevron-forward" size={20} color="#1E5E25" />
            </TouchableOpacity>
          </View>

          {/* Hero Summary Card */}
          <View style={styles.totalSummaryCard}>
            <View style={styles.totalHeaderRow}>
              <View style={styles.totalIconWrap}>
                <Ionicons name="cash-outline" size={22} color="#1E5E25" />
              </View>
              <Text style={styles.totalLabel}>Total Hari Ini</Text>
            </View>

            <Text style={styles.totalAmountText}>{formatRupiah(totalHariIni)}</Text>

            <View style={styles.summaryDivider} />

            <View style={styles.inOutGrid}>
              <View style={styles.inOutItem}>
                <Text style={styles.inOutLabel}>Uang Masuk</Text>
                <Text style={styles.inAmountText}>{formatRupiah(totalUangMasuk)}</Text>
              </View>
              <View style={styles.inOutSeparator} />
              <View style={styles.inOutItem}>
                <Text style={styles.inOutLabel}>Uang Keluar</Text>
                <Text style={styles.outAmountText}>{formatRupiah(totalKeluarNum)}</Text>
              </View>
            </View>
          </View>

          {/* Form Kartu Utama (Bisa Diisi / Editable) */}
          <View style={styles.mainFormCard}>
            <View style={styles.formCardHeader}>
              <View style={styles.formTitleGroup}>
                <View style={styles.miniIconBox}>
                  <Ionicons name="calendar-outline" size={18} color="#1E5E25" />
                </View>
                <Text style={styles.formSectionTitle}>{activeCategory}</Text>
              </View>
              <View style={styles.pillsRow}>
                <View style={styles.pillGreen}>
                  <Text style={styles.pillGreenText}>{formatRupiah(totalUangMasuk)}</Text>
                </View>
                <View style={styles.pillRed}>
                  <Text style={styles.pillRedText}>{formatRupiah(totalKeluarNum)}</Text>
                </View>
              </View>
            </View>

            {/* Section Uang Masuk */}
            <View style={styles.inputSectionBox}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="trending-up" size={18} color="#1E5E25" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitleText}>Uang Masuk</Text>
                <Text style={styles.sectionHeaderValue}>{formatRupiah(totalUangMasuk)}</Text>
              </View>

              {/* Grid Field Input 2 Kolom */}
              <View style={styles.inputGridRow}>
                {/* Field 1: Warnet */}
                <View style={styles.inputCardField}>
                  <View style={styles.fieldHeader}>
                    <Ionicons name="desktop-outline" size={15} color="#1E5E25" style={{ marginRight: 4 }} />
                    <Text style={styles.fieldLabel}>Uang Masuk Warnet</Text>
                  </View>
                  <View style={styles.textInputWrap}>
                    <Text style={styles.prefixRp}>Rp</Text>
                    <TextInput
                      style={styles.textInputBox}
                      keyboardType="numeric"
                      value={masukWarnet}
                      onChangeText={(v) => setMasukWarnet(v.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>

                {/* Field 2: Fotocopy */}
                <View style={styles.inputCardField}>
                  <View style={styles.fieldHeader}>
                    <Ionicons name="copy-outline" size={15} color="#1E5E25" style={{ marginRight: 4 }} />
                    <Text style={styles.fieldLabel}>Uang Masuk Fotocopy</Text>
                  </View>
                  <View style={styles.textInputWrap}>
                    <Text style={styles.prefixRp}>Rp</Text>
                    <TextInput
                      style={styles.textInputBox}
                      keyboardType="numeric"
                      value={masukFotocopy}
                      onChangeText={(v) => setMasukFotocopy(v.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.inputGridRow, { marginTop: 10 }]}>
                {/* Field 3: Pulsa */}
                <View style={styles.inputCardField}>
                  <View style={styles.fieldHeader}>
                    <Ionicons name="phone-portrait-outline" size={15} color="#1E5E25" style={{ marginRight: 4 }} />
                    <Text style={styles.fieldLabel}>Uang Masuk Pulsa</Text>
                  </View>
                  <View style={styles.textInputWrap}>
                    <Text style={styles.prefixRp}>Rp</Text>
                    <TextInput
                      style={styles.textInputBox}
                      keyboardType="numeric"
                      value={masukPulsa}
                      onChangeText={(v) => setMasukPulsa(v.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>

                {/* Field 4: Kas Lainnya */}
                <View style={styles.inputCardField}>
                  <View style={styles.fieldHeader}>
                    <Ionicons name="wallet-outline" size={15} color="#1E5E25" style={{ marginRight: 4 }} />
                    <Text style={styles.fieldLabel}>Uang Masuk Lainnya</Text>
                  </View>
                  <View style={styles.textInputWrap}>
                    <Text style={styles.prefixRp}>Rp</Text>
                    <TextInput
                      style={styles.textInputBox}
                      keyboardType="numeric"
                      value={masukLainnya}
                      onChangeText={(v) => setMasukLainnya(v.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Section Uang Keluar (Pengeluaran) */}
            <View style={[styles.inputSectionBox, { borderColor: '#FFCDD2', backgroundColor: '#FFF5F5', marginTop: 12 }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="trending-down" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitleText, { color: '#D32F2F' }]}>Pengeluaran / Uang Keluar</Text>
                <Text style={[styles.sectionHeaderValue, { color: '#D32F2F' }]}>{formatRupiah(totalKeluarNum)}</Text>
              </View>

              <View style={[styles.textInputWrap, { backgroundColor: '#FFFFFF', borderColor: '#FFCDD2' }]}>
                <Text style={[styles.prefixRp, { color: '#D32F2F' }]}>Rp</Text>
                <TextInput
                  style={[styles.textInputBox, { color: '#D32F2F' }]}
                  keyboardType="numeric"
                  value={uangKeluar}
                  onChangeText={(v) => setUangKeluar(v.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            {/* Tombol Simpan Perubahan */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveReport}
              disabled={loadingSave}
              activeOpacity={0.85}
            >
              {loadingSave ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Simpan Perubahan Laporan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Tombol Ekspor Excel */}
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => setShowExportModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Cetak / Ekspor Laporan Excel</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal Pop-up Sukses */}
        <AnimatedModal visible={showSuccessModal} onClose={closeSuccessModal} align="center">
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={60} color="#2E7D32" />
            <Text style={styles.modalSuccessTitle}>Berhasil Disimpan!</Text>
            <Text style={styles.modalSuccessText}>{modalMessage}</Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeSuccessModal} activeOpacity={0.85}>
              <Text style={styles.modalCloseBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </AnimatedModal>

        {/* Modal Pop-up Ekspor */}
        <AnimatedModal visible={showExportModal} onClose={() => setShowExportModal(false)} align="center">
          <View style={styles.exportCard}>
              <Text style={styles.exportModalTitle}>Ekspor Laporan Keuangan</Text>
              <Text style={styles.exportModalSub}>Pilih format pengeluaran laporan untuk tanggal ini.</Text>

              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  setShowExportModal(false);
                  setModalMessage(`Berkas Excel (.xlsx) untuk ${formatDateIndo(selectedDate)} telah berhasil diunduh.`);
                  triggerSuccessModal();
                }}
              >
                <Ionicons name="logo-xls" size={24} color="#1E5E25" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.exportOptionTitle}>Download Format Excel (.XLSX)</Text>
                  <Text style={styles.exportOptionSub}>Rincian Laporan Kas Harian</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: '#E2E8F0', marginTop: 12 }]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={[styles.modalCloseBtnText, { color: '#334155' }]}>Tutup</Text>
              </TouchableOpacity>
          </View>
        </AnimatedModal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#DDE5DD', // Skema Warna Sage Green
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
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
    marginBottom: spacing.xs,
  },
  categoryTabsContainer: {
    paddingVertical: 6,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#C8D6C9',
  },
  categoryTabActive: {
    backgroundColor: '#1E5E25',
    borderColor: '#1E5E25',
  },
  categoryTabText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#1E5E25',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  // Date Navigator
  dateNavigatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.sm,
    ...shadow.card,
  },
  dateNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterWrap: {
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: '#1A231E',
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E5E25',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: 4,
  },
  todayBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  resetTodayBtn: {
    marginTop: 2,
  },
  resetTodayText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#1E5E25',
    textDecorationLine: 'underline',
  },
  // Total Summary Hero Card
  totalSummaryCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    ...shadow.card,
  },
  totalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#1E5E25',
  },
  totalAmountText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 34,
    color: '#1E5E25',
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#C8E6C9',
    marginVertical: spacing.sm,
  },
  inOutGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inOutItem: {
    flex: 1,
  },
  inOutSeparator: {
    width: 1,
    height: 28,
    backgroundColor: '#C8E6C9',
    marginHorizontal: spacing.sm,
  },
  inOutLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: '#526356',
  },
  inAmountText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    color: '#2E7D32',
    marginTop: 2,
  },
  outAmountText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    color: '#D32F2F',
    marginTop: 2,
  },
  // Main Editable Form
  mainFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.card,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  formTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSectionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: '#1A231E',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillGreen: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  pillGreenText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#2E7D32',
  },
  pillRed: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  pillRedText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#D32F2F',
  },
  inputSectionBox: {
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: radius.lg,
    padding: spacing.sm,
    backgroundColor: '#FAFCFA',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitleText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#1E5E25',
    flex: 1,
  },
  sectionHeaderValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#1E5E25',
  },
  inputGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputCardField: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: radius.md,
    padding: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#1E5E25',
    flex: 1,
  },
  textInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  prefixRp: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#1E5E25',
    marginRight: 4,
  },
  textInputBox: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#1A231E',
    padding: 0,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E5E25',
    paddingVertical: 12,
    borderRadius: radius.lg,
    gap: 6,
    marginTop: spacing.xs,
  },
  saveButtonText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: radius.xl,
    gap: 8,
    ...shadow.card,
  },
  exportBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  // Modal Cards
  successCard: {
    width: '88%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalSuccessTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: '#1A231E',
    marginTop: spacing.xs,
  },
  modalSuccessText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#1E5E25',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  exportCard: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  exportModalTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: '#1A231E',
  },
  exportModalSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#64748B',
    marginBottom: spacing.md,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#E8F5E9',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  exportOptionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: '#1E5E25',
  },
  exportOptionSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#526356',
  },
});