import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { colors, radius, spacing, typography } from '../theme';
import { AppButton, Badge, BackButton } from '../components/UI';
import { formatRupiah, formatRupiahShort, formatDate } from '../utils/format';
import { deleteProduct, fetchStockMovements } from '../services/api';

export default function DetailProdukScreen({ route, navigation }) {
  const product = route.params?.product;
  const [moves, setMoves] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [movement, sold] = await Promise.all([
          fetchStockMovements(product.id),
          supabase
            .from('transaction_items')
            .select('product_name, quantity, unit_label, created_at, unit_price, subtotal')
            .eq('product_name', product.name)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);
        if (!mounted) return;
        setMoves(movement || []);
        setSales(sold.data || []);
      } catch (e) {
        Alert.alert('Gagal', e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [product.id]);

  const handleDelete = () => {
    Alert.alert('Hapus barang ini?', 'Tindakan ini tidak dapat dibatalkan. Data stok dan riwayat penjualan produk ini akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            Alert.alert('Berhasil', 'Produk berhasil dihapus.');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Gagal', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  }

  const stock = Number(product.stock_pack || 0) + Number(product.stock_unit || 0);

  return (
    <View style={styles.screen}>
      <View style={styles.topbar}>
        <BackButton />
        <Text style={styles.topTitle}>Detail Produk</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.thumb}>
            <Text style={styles.thumbBig}>{product.name[0]}</Text>
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.pillRow}>
            <Badge label={product.category || 'Lainnya'} tone="primary" />
            <Badge label={stock === 0 ? 'Habis' : stock <= (product.low_stock_threshold ?? 5) ? 'Stok Menipis' : 'Tersedia'} tone={stock === 0 ? 'danger' : 'success'} />
          </View>
          {product.barcode ? (
            <View style={styles.barcodeRow}>
              <Ionicons name="barcode-outline" size={15} color={colors.onSurfaceVariant} />
              <Text style={styles.barcodeText}>Barcode: {product.barcode}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceGrid}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Harga per Biji</Text>
            <Text style={styles.priceValue}>{formatRupiah(product.price_per_unit)}</Text>
          </View>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Harga per Pack</Text>
            <Text style={styles.priceValue}>{formatRupiah(product.price_per_pack)}</Text>
          </View>
        </View>

        <View style={styles.stockCard}>
          <Text style={styles.cardTitle}>Informasi Stok</Text>
          <View style={styles.stockGrid}>
            <View style={styles.stockBox}>
              <Text style={styles.stockLabel}>Stok Pack</Text>
              <Text style={styles.stockValue}>{product.stock_pack ?? 0}</Text>
            </View>
            <View style={styles.stockBox}>
              <Text style={styles.stockLabel}>Stok Biji</Text>
              <Text style={styles.stockValue}>{product.stock_unit ?? 0}</Text>
            </View>
          </View>
          <View style={styles.conversion}>
            <Ionicons name="swap-horizontal" size={16} color={colors.secondary} />
            <Text style={styles.conversionText}>Stok total: {stock} item</Text>
          </View>
        </View>

        <View style={styles.salesCard}>
          <View style={styles.salesHeader}>
            <View>
              <Text style={styles.cardTitle}>Penjualan Terakhir</Text>
              <Text style={styles.salesSub}>Riwayat produk terjual</Text>
            </View>
            <View style={styles.salesChip}>
              <Ionicons name="trending-up" size={14} color={colors.primary} />
              <Text style={styles.salesChipText}>{sales.length} transaksi</Text>
            </View>
          </View>
          {sales.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada riwayat penjualan.</Text>
          ) : (
            sales.map((s, i) => (
              <View key={i} style={styles.saleRow}>
                <Text style={styles.saleQty}>
                  {s.quantity} {s.unit_label}
                </Text>
                <Text style={styles.saleDate}>{formatDate(s.created_at)}</Text>
                <Text style={styles.saleAmount}>{formatRupiahShort(s.subtotal)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.movementCard}>
          <Text style={styles.cardTitle}>Rekap Stok</Text>
          {moves.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada pergerakan stok.</Text>
          ) : (
            moves.map((m, i) => (
              <View key={i} style={styles.moveRow}>
                <Ionicons
                  name={m.type === 'in' ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={16}
                  color={m.type === 'in' ? colors.primary : colors.error}
                />
                <Text style={[styles.moveText, { color: m.type === 'in' ? colors.primary : colors.error }]}>
                  {m.type === 'in' ? `Masuk: +${m.quantity} ${m.unit_type}` : `Keluar: -${m.quantity} ${m.unit_type}`}
                </Text>
                <Text style={styles.moveDate}>{formatDate(m.created_at)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.actions}>
          <AppButton
            title="Hapus"
            variant="outline"
            danger
            icon="trash-outline"
            onPress={handleDelete}
            style={{ flex: 1 }}
          />
          <AppButton
            title="Edit"
            icon="create-outline"
            onPress={() => Alert.alert('Edit', `Edit produk: ${product.name}`)}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22,29,24,0.05)',
    backgroundColor: colors.surface,
  },
  iconBtn: { padding: spacing.sm },
  topTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
  },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  thumb: {
    width: 128,
    height: 128,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBig: { fontSize: 52, color: colors.surfaceContainerHighest, fontFamily: 'Manrope_800ExtraBold' },
  name: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  barcodeText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontFamily: 'Manrope_600SemiBold',
  },
  priceGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  priceCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(22,29,24,0.05)',
  },
  priceLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  priceValue: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    marginTop: 4,
  },
  stockCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(22,29,24,0.05)',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  stockBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  stockLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  stockValue: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    marginTop: 4,
  },
  conversion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  conversionText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  salesCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(22,29,24,0.05)',
    marginBottom: spacing.md,
  },
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  salesSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  salesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,184,107,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  salesChipText: { ...typography.bodySm, color: colors.primary, fontFamily: 'Manrope_700Bold' },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  saleQty: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
  saleDate: { ...typography.bodySm, color: colors.onSurfaceVariant },
  saleAmount: { ...typography.bodyMd, color: colors.onSurface, fontFamily: 'Manrope_700Bold' },
  movementCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(22,29,24,0.05)',
    marginBottom: spacing.lg,
  },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  moveText: { ...typography.bodyMd, fontFamily: 'Manrope_600SemiBold', flex: 1 },
  moveDate: { ...typography.bodySm, color: colors.onSurfaceVariant },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, paddingVertical: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
});