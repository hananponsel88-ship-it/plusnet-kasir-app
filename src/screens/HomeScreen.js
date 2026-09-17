import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedModal } from '../components/UI';

const colors = {
  primary: '#00B86B',
  primarySoft: '#E6F8F0',
  secondary: '#64748B',
  accent: '#3B82F6',
  accentSoft: '#EFF6FF',
  surfaceContainerLowest: '#F8FAFC',
  surfaceContainerLow: '#F1F5F9',
  onSurface: '#0F172A',
  onSurfaceVariant: '#475569',
  outlineVariant: '#E2E8F0',
  error: '#EF4444',
  warnBg: '#FEF3C7',
  warnText: '#D97706',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
  gradientDark: { start: '#0F172A', end: '#1E293B' },
};

const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };
const spacing = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };

const shadow = {
  card: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  sheet: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 16 },
};

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // State untuk Bottom Sheet
  const [activeSheet, setActiveSheet] = useState(null); // 'omzet' | 'transaksi' | 'stok' | 'keuntungan'

  // Data Dummy Dashboard
  const [todayOmset] = useState(350000);
  const [todayCount] = useState(8);
  const [lowStockCount] = useState(2);
  const [profitBulan] = useState(1800000);
  const [profitMinggu] = useState(550000);
  const [profitHari] = useState(120000);

  const [omsetPeriode, setOmsetPeriode] = useState('bulan');
  const [trendMode, setTrendMode] = useState('Harian');

  const mockTransactions = [
    { id: 'TRX-1092', time: '14:20', items: '2x Kopi Milk, 1x Roti Bakar', total: 65000, method: 'QRIS' },
    { id: 'TRX-1091', time: '13:10', items: '1x Teh Tarik Boba', total: 18000, method: 'Tunai' },
    { id: 'TRX-1090', time: '11:45', items: '3x Kopi Milk Espresso', total: 72000, method: 'QRIS' },
    { id: 'TRX-1089', time: '10:15', items: '1x Indomie Double + Telur', total: 22000, method: 'Tunai' },
  ];

  const mockLowStockItems = [
    { name: 'Kopi Milk Espresso (Beans)', qty: 3, unit: 'pck', min: 10 },
    { name: 'Susu UHT Full Cream 1L', qty: 2, unit: 'pck', min: 8 },
  ];

  const loadDashboardData = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  // Render Isi Bottom Sheet
  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'omzet':
        return (
          <View>
            <Text style={styles.sheetSubTitle}>Rincian Pendapatan Hari Ini</Text>
            <Text style={styles.sheetBigValue}>{formatRupiah(todayOmset)}</Text>

            <View style={styles.sheetGrid}>
              <View style={styles.gridBox}>
                <Ionicons name="qr-code-outline" size={20} color={colors.accent} />
                <Text style={styles.gridLabel}>QRIS / Non-Tunai</Text>
                <Text style={styles.gridValue}>Rp 210.000</Text>
              </View>
              <View style={styles.gridBox}>
                <Ionicons name="cash-outline" size={20} color={colors.primary} />
                <Text style={styles.gridLabel}>Tunai (Cash)</Text>
                <Text style={styles.gridValue}>Rp 140.000</Text>
              </View>
            </View>

            <View style={styles.infoBanner}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.infoBannerText}>
                Pendapatan hari ini naik <Text style={{ fontWeight: '700' }}>+12%</Text> dibanding jam yang sama kemarin.
              </Text>
            </View>
          </View>
        );

      case 'transaksi':
        return (
          <View>
            <View style={styles.sheetHeaderFlex}>
              <Text style={styles.sheetSubTitle}>8 Transaksi Hari Ini</Text>
              <Text style={styles.badgeTextCount}>Realtime</Text>
            </View>

            <View style={{ marginTop: spacing.sm, gap: 10 }}>
              {mockTransactions.map((item) => (
                <View key={item.id} style={styles.trxRow}>
                  <View style={styles.trxIcon}>
                    <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trxId}>{item.id} • {item.time}</Text>
                    <Text style={styles.trxItems} numberOfLines={1}>{item.items}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.trxTotal}>{formatRupiah(item.total)}</Text>
                    <Text style={styles.trxMethod}>{item.method}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'stok':
        return (
          <View>
            <View style={styles.sheetHeaderFlex}>
              <Text style={styles.sheetSubTitle}>Barang Menipis Hari Ini</Text>
              <View style={styles.alertBadgeMini}>
                <Text style={styles.alertBadgeMiniText}>{lowStockCount} Kritis</Text>
              </View>
            </View>

            <View style={{ marginTop: spacing.sm, gap: 10 }}>
              {mockLowStockItems.map((item, idx) => (
                <View key={idx} style={styles.stockRow}>
                  <View style={styles.stockWarnIcon}>
                    <Ionicons name="warning" size={18} color={colors.warnText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName}>{item.name}</Text>
                    <Text style={styles.stockSub}>Batas Min: {item.min} {item.unit}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.stockQty}>{item.qty} {item.unit}</Text>
                    <Text style={styles.stockWarnText}>Restock Now</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.sheetPrimaryBtn}
              onPress={() => {
                setActiveSheet(null);
                navigation?.navigate('Inventory');
              }}
            >
              <Text style={styles.sheetPrimaryBtnText}>Buka Manajemen Stok</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        );

      case 'keuntungan':
        return (
          <View>
            <Text style={styles.sheetSubTitle}>Estimasi Laba Kotor</Text>
            <Text style={styles.sheetBigValue}>{formatRupiah(profitBulan)}</Text>

            <View style={styles.profitBreakdownCard}>
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Laba Hari Ini</Text>
                <Text style={styles.profitVal}>{formatRupiah(profitHari)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Laba Minggu Ini</Text>
                <Text style={styles.profitVal}>{formatRupiah(profitMinggu)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.profitRow}>
                <Text style={styles.profitLabel}>Estimasi Laba Bulan Ini</Text>
                <Text style={[styles.profitVal, { color: colors.primary, fontWeight: '700' }]}>
                  {formatRupiah(profitBulan)}
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.md,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor={colors.primary} />
        }
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetingText}>Selamat Datang 🚀</Text>
            <Text style={styles.storeNameText}>PlusNet Malang</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation?.navigate('Pengaturan')}
          >
            <LinearGradient colors={['#00B86B', '#009255']} style={styles.profileGradient}>
              <Ionicons name="person" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero Card Omset */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={[colors.gradientDark.start, colors.gradientDark.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="trending-up" size={14} color={colors.primary} />
                <Text style={styles.heroBadgeText}>
                  Penjualan {omsetPeriode === 'bulan' ? 'Bulan Ini' : 'Minggu Ini'}
                </Text>
              </View>
              <View style={styles.heroSegmented}>
                {['bulan', 'minggu'].map((key) => {
                  const active = omsetPeriode === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.heroSegBtn, active && styles.heroSegBtnActive]}
                      onPress={() => setOmsetPeriode(key)}
                    >
                      <Text style={[styles.heroSegText, active && styles.heroSegTextActive]}>
                        {key === 'bulan' ? 'Bulan' : 'Minggu'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.heroOmsetLabel}>Total Omset</Text>
            <Text style={styles.heroOmsetVal}>
              {formatRupiah(omsetPeriode === 'bulan' ? 4200000 : 1300000)}
            </Text>
            <Text style={styles.heroTxCount}>
              {omsetPeriode === 'bulan' ? '128' : '34'} transaksi tercatat
            </Text>

            <View style={styles.heroFooter}>
              <View style={styles.onlineBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.onlineText}>Realtime Sync</Text>
              </View>
              <TouchableOpacity
                style={styles.quickKasirBtn}
                onPress={() => navigation?.navigate('Kasir')}
                activeOpacity={0.85}
              >
                <Text style={styles.quickKasirText}>Buka Kasir</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Alert Banner Stok Menipis */}
        {lowStockCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => setActiveSheet('stok')}
            activeOpacity={0.9}
          >
            <View style={styles.alertIconBg}>
              <Ionicons name="warning-outline" size={20} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Peringatan Stok Menipis!</Text>
              <Text style={styles.alertSub}>{lowStockCount} produk perlu segera ditambah.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </TouchableOpacity>
        )}

        {/* Grid Ringkasan Interaktif */}
        <Text style={styles.sectionTitle}>Ringkasan Hari Ini</Text>
        
        <View style={styles.statsGrid}>
          {/* Card 1: Omzet Hari ini */}
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => setActiveSheet('omzet')}
            activeOpacity={0.8}
          >
            <View style={[styles.statCard, shadow.card]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="wallet-outline" size={18} color={colors.accent} />
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Omzet Hari ini</Text>
              <Text style={styles.statValue}>{formatRupiah(todayOmset)}</Text>
              <Text style={styles.statSub}>Klik untuk detail & QRIS</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Transaksi Hari Ini */}
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => setActiveSheet('transaksi')}
            activeOpacity={0.8}
          >
            <View style={[styles.statCard, shadow.card]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Transaksi Hari</Text>
              <Text style={styles.statValue}>{todayCount}</Text>
              <Text style={styles.statSub}>Lihat riwayat pesanan</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Stok Menipis */}
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => setActiveSheet('stok')}
            activeOpacity={0.8}
          >
            <View style={[styles.statCard, shadow.card]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.warnBg }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.warnText} />
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Stok Menipis</Text>
              <Text style={[styles.statValue, { color: colors.warnText }]}>{lowStockCount}</Text>
              <Text style={[styles.statSub, { color: colors.warnText }]}>Perlu restock segera</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Keuntungan */}
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => setActiveSheet('keuntungan')}
            activeOpacity={0.8}
          >
            <View style={[styles.statCard, shadow.card]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.dangerBg }]}>
                  <Ionicons name="trending-up-outline" size={18} color={colors.dangerText} />
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
              </View>
              <Text style={styles.statLabel}>Keuntungan Bulan Ini</Text>
              <Text style={styles.statValue}>{formatRupiah(profitBulan)}</Text>
              <Text style={styles.statSub}>Cek rincian laba</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Trend Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Trend Penjualan</Text>
          <View style={styles.segmented}>
            {['Harian', 'Bulanan'].map((m) => {
              const active = trendMode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.segBtn, active && styles.segBtnActive]}
                  onPress={() => setTrendMode(m)}
                >
                  <Text style={[styles.segText, active && styles.segTextActive]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.chartCard, shadow.card]}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTotalLabel}>Total estimasi minggu ini</Text>
            <Text style={styles.chartTotalValue}>{formatRupiah(1300000)}</Text>
          </View>
          <View style={styles.chartMockArea}>
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={[styles.chartBar, { height: `${30 + (i * 10) % 60}%` }]} />
                <Text style={styles.chartXText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Global Bottom Sheet Modal */}
      <AnimatedModal
        visible={!!activeSheet}
        onClose={() => setActiveSheet(null)}
        align="bottom"
      >
        <TouchableOpacity activeOpacity={1} style={styles.bottomSheetContainer}>
          <View style={styles.sheetHandleBar} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {activeSheet === 'omzet' && 'Omzet Hari Ini'}
                {activeSheet === 'transaksi' && 'Riwayat Transaksi'}
                {activeSheet === 'stok' && 'Peringatan Stok'}
                {activeSheet === 'keuntungan' && 'Analisis Keuntungan'}
              </Text>
              <TouchableOpacity onPress={() => setActiveSheet(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {renderSheetContent()}
          </TouchableOpacity>
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greetingText: { fontSize: 12, color: colors.secondary, fontWeight: '600' },
  storeNameText: { fontSize: 20, color: colors.onSurface, fontWeight: '700' },
  profileBtn: { width: 40, height: 40, borderRadius: radius.full, overflow: 'hidden' },
  profileGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  
  heroCardContainer: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.md },
  heroCard: { padding: spacing.lg },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  heroBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  heroSegmented: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.full, padding: 2 },
  heroSegBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  heroSegBtnActive: { backgroundColor: colors.primary },
  heroSegText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  heroSegTextActive: { color: '#FFF' },
  heroOmsetLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  heroOmsetVal: { color: '#FFF', fontSize: 28, fontWeight: '700', marginVertical: 2 },
  heroTxCount: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  onlineText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  quickKasirBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  quickKasirText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  alertBanner: { backgroundColor: '#FEF2F2', borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.error, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  alertIconBg: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { color: colors.error, fontWeight: '700', fontSize: 13 },
  alertSub: { color: colors.secondary, fontSize: 11 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.onSurface, marginBottom: spacing.sm, marginTop: spacing.xs },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  cardWrapper: { width: '48.5%' },
  statCard: { backgroundColor: '#FFF', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.outlineVariant },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  iconBox: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: colors.secondary, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginVertical: 2 },
  statSub: { fontSize: 10, color: colors.onSurfaceVariant },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, borderRadius: radius.full, padding: 3 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { fontSize: 11, fontWeight: '700', color: colors.secondary },
  segTextActive: { color: '#FFF' },

  chartCard: { backgroundColor: '#FFF', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.outlineVariant },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chartTotalLabel: { fontSize: 11, color: colors.secondary },
  chartTotalValue: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  chartMockArea: { flexDirection: 'row', height: 90, alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBar: { width: 12, backgroundColor: colors.primary, borderRadius: radius.full },
  chartXText: { fontSize: 10, color: colors.secondary, marginTop: 6 },

  bottomSheetContainer: { backgroundColor: '#FFF', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl + 10, ...shadow.sheet },
  sheetHandleBar: { width: 36, height: 4, backgroundColor: colors.outlineVariant, borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  closeBtn: { padding: 4, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.full },
  sheetSubTitle: { fontSize: 12, color: colors.secondary, fontWeight: '600' },
  sheetBigValue: { fontSize: 26, fontWeight: '700', color: colors.primary, marginVertical: 4 },
  
  sheetGrid: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  gridBox: { flex: 1, backgroundColor: colors.surfaceContainerLow, padding: spacing.md, borderRadius: radius.md, gap: 4 },
  gridLabel: { fontSize: 11, color: colors.secondary },
  gridValue: { fontSize: 14, fontWeight: '700', color: colors.onSurface },

  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primarySoft, padding: spacing.md, borderRadius: radius.md },
  infoBannerText: { flex: 1, fontSize: 11, color: colors.onSurface },

  sheetHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeTextCount: { fontSize: 10, color: colors.primary, fontWeight: '700', backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },

  trxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  trxIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  trxId: { fontSize: 12, fontWeight: '700', color: colors.onSurface },
  trxItems: { fontSize: 11, color: colors.secondary, width: 140 },
  trxTotal: { fontSize: 12, fontWeight: '700', color: colors.primary },
  trxMethod: { fontSize: 10, color: colors.secondary },

  stockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  stockWarnIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.warnBg, alignItems: 'center', justifyContent: 'center' },
  stockName: { fontSize: 12, fontWeight: '700', color: colors.onSurface },
  stockSub: { fontSize: 10, color: colors.secondary },
  stockQty: { fontSize: 13, fontWeight: '700', color: colors.warnText },
  stockWarnText: { fontSize: 9, color: colors.error, fontWeight: '700' },
  alertBadgeMini: { backgroundColor: colors.dangerBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  alertBadgeMiniText: { color: colors.error, fontSize: 10, fontWeight: '700' },

  sheetPrimaryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: radius.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  sheetPrimaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  profitBreakdownCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  profitLabel: { fontSize: 12, color: colors.secondary, fontWeight: '600' },
  profitVal: { fontSize: 13, fontWeight: '700', color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: 4 },
});