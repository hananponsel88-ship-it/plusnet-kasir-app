import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { formatRupiah } from '../utils/format';
import { supabase } from '../utils/supabase';
import { BackButton, AnimatedModal } from '../components/UI';

export default function RiwayatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchHistory = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (e) {
      Alert.alert('Gagal Memuat', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchHistory);
    return unsubscribe;
  }, [navigation]);

  const filteredTransactions = transactions.filter((tx) => {
    const idStr = String(tx.id || '').toLowerCase();
    const methodStr = String(tx.payment_method || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return idStr.includes(searchLower) || methodStr.includes(searchLower);
  });

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Expo Go: ganti cetak fisik jadi bagikan struk via WhatsApp (tanpa native module).
  const handleShareTxWA = async (tx) => {
    if (!tx) return;
    const itemLines = (tx.items || []).map(
      (prod) =>
        `${prod.name}\n${prod.quantity} x ${formatRupiah(prod.price)} = ${formatRupiah(
          (prod.quantity || 1) * (prod.price || 0)
        )}`
    );
    const message = [
      `*PLUSNET POS DIGITAL*`,
      `Struk Transaksi #${tx.id}`,
      `${formatDate(tx.created_at)}`,
      `------------------------------`,
      ...itemLines,
      `------------------------------`,
      `*Total: ${formatRupiah(tx.total)}*`,
      `Metode: ${tx.payment_method || 'CASH'}`,
    ].join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('WhatsApp', 'Tidak dapat membuka WhatsApp di perangkat ini.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('WhatsApp', 'Gagal membuka WhatsApp.');
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.headerRow}>
          <BackButton />
          <View>
            <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
            <Text style={styles.headerSubtitle}>Pantau & bagikan struk via WhatsApp</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ID transaksi atau metode pembayaran..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchHistory} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.txCard}
            onPress={() => setSelectedTx(item)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={styles.txIdBadge}>
                <Ionicons name="receipt-outline" size={14} color={colors.primary} />
                <Text style={styles.txIdText}>#{item.id}</Text>
              </View>
              <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
              <View>
                <Text style={styles.totalLabel}>Total Pembayaran</Text>
                <Text style={styles.totalValue}>{formatRupiah(item.total)}</Text>
              </View>

              <View style={styles.methodBadge}>
                <Ionicons
                  name={item.payment_method === 'QRIS' ? 'qr-code-outline' : 'cash-outline'}
                  size={14}
                  color="#3B82F6"
                />
                <Text style={styles.methodText}>{item.payment_method || 'CASH'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modern Receipt Modal Pop-up */}
      <AnimatedModal visible={!!selectedTx} onClose={() => setSelectedTx(null)} align="bottom">
        <View style={[styles.receiptBox, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptIconWrapper}>
                <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
              </View>
              <Text style={styles.receiptStoreName}>PLUSNET POS DIGITAL</Text>
              <Text style={styles.receiptTxId}>Struk Transaksi #{selectedTx?.id}</Text>
              <Text style={styles.receiptTime}>{formatDate(selectedTx?.created_at)}</Text>
            </View>

            <View style={styles.dashedLine} />

            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {selectedTx?.items?.map((prod, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{prod.name}</Text>
                    <Text style={styles.itemSub}>
                      {prod.quantity} x {formatRupiah(prod.price)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatRupiah((prod.quantity || 1) * (prod.price || 0))}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dashedLine} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Ringkasan</Text>
              <Text style={styles.summaryValue}>{formatRupiah(selectedTx?.total)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Metode Bayar</Text>
              <Text style={styles.summarySubValue}>{selectedTx?.payment_method || 'CASH'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedTx(null)}
                >
                  <Text style={styles.closeBtnText}>Tutup</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.printBtn}
                  onPress={() => handleShareTxWA(selectedTx)}
                >
                  <LinearGradient
                    colors={[colors.gradient?.start || '#00B86B', colors.gradient?.end || '#008F53']}
                    style={styles.printGradient}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
                    <Text style={styles.printBtnText}>Bagikan WA</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
          </View>
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
  },
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.secondary,
    fontFamily: 'Manrope_500Medium',
    marginBottom: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
    gap: 8,
    marginTop: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.onSurface,
    fontSize: 13,
  },
  txCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 184, 107, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  txIdText: { color: colors.primary, fontSize: 11, fontFamily: 'Manrope_800ExtraBold' },
  txDate: { fontSize: 11, color: colors.secondary, fontFamily: 'Manrope_600SemiBold' },
  cardDivider: { height: 1, backgroundColor: colors.hairline, marginVertical: spacing.sm },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 10, color: colors.secondary, fontFamily: 'Manrope_500Medium' },
  totalValue: { fontSize: 16, fontFamily: 'Manrope_800ExtraBold', color: colors.onSurface },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  methodText: { color: '#3B82F6', fontSize: 11, fontFamily: 'Manrope_700Bold' },

  // Receipt Modal Styles
  receiptBox: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  receiptHeader: { alignItems: 'center', marginBottom: spacing.xs },
  receiptIconWrapper: { marginBottom: 4 },
  receiptStoreName: { fontFamily: 'Manrope_800ExtraBold', fontSize: 16, color: colors.onSurface },
  receiptTxId: { fontFamily: 'Manrope_700Bold', fontSize: 12, color: colors.secondary, marginTop: 2 },
  receiptTime: { fontSize: 11, color: colors.secondary },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    marginVertical: spacing.sm,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4 },
  itemName: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: colors.onSurface },
  itemSub: { fontSize: 11, color: colors.secondary },
  itemTotal: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: colors.onSurface },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 2 },
  summaryLabel: { fontSize: 12, color: colors.secondary, fontFamily: 'Manrope_600SemiBold' },
  summaryValue: { fontSize: 16, color: colors.primary, fontFamily: 'Manrope_800ExtraBold' },
  summarySubValue: { fontSize: 13, color: colors.onSurface, fontFamily: 'Manrope_700Bold' },
  modalActionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  closeBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontFamily: 'Manrope_700Bold', color: colors.onSurface },
  printBtn: { flex: 1.5, height: 44, borderRadius: radius.md, overflow: 'hidden' },
  printGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  printBtnText: { fontFamily: 'Manrope_800ExtraBold', color: '#FFF' },
});