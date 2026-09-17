import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';
import { formatRupiah } from '../utils/format';
import { fetchProducts, deleteProduct } from '../services/api';
import { AnimatedModal } from '../components/UI';

export default function InventoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (e) {
      Alert.alert('Gagal', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const askDelete = (item) => setConfirmTarget(item);
  const batalDelete = () => (!deleting ? setConfirmTarget(null) : null);

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(confirmTarget.id);
      setConfirmTarget(null);
      loadData();
    } catch (e) {
      Alert.alert('Gagal Hapus', e.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (totalStock) => {
    if (totalStock <= 0) return { label: 'Habis', color: colors.error };
    if (totalStock < 10) return { label: 'Menipis', color: '#B45309' };
    return { label: 'Aman', color: colors.primary };
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>Manajemen Stok</Text>
            <Text style={styles.headerSubtitle}>{products.length} produk terdaftar</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('TambahBarang')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={17} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama produk atau SKU..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="cube-outline" size={30} color={colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>Belum ada produk</Text>
              <Text style={styles.emptySub}>Tekan "Tambah" untuk menambah produk pertama</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const stokPack = item.stok_pack ?? item.stock ?? 0;
          const hargaPack = item.harga_pack ?? item.price ?? 0;
          const stokBiji = item.stok_biji ?? 0;
          const hargaBiji = item.harga_biji ?? 0;
          const status = getStockStatus(Number(stokPack) + Number(stokBiji));
          return (
            <View style={styles.productCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productSku}>SKU: {item.sku || '-'}</Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <Text style={styles.footerLabel}>Stok</Text>
                  <Text style={styles.stockValue}>{stokPack}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.footerLabel}>Harga/Pack</Text>
                  <Text style={styles.priceValue}>{formatRupiah(hargaPack)}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.footerLabel}>Stok</Text>
                  <Text style={styles.stockValue}>{stokBiji}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.footerLabel}>Harga/Biji</Text>
                  <Text style={styles.priceValue}>{formatRupiah(hargaBiji)}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('TambahBarang', { editProduct: item })}
                >
                  <Ionicons name="create-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => askDelete(item)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Konfirmasi Hapus - custom sheet, gantikan Alert bawaan */}
      <AnimatedModal visible={!!confirmTarget} onClose={batalDelete} align="center">
        <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </View>
            <Text style={styles.confirmTitle}>Hapus Produk?</Text>
            <Text style={styles.confirmBody}>
              "{confirmTarget?.name}" akan dihapus permanen dan tidak bisa dikembalikan.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmBtnGhost}
                onPress={batalDelete}
                disabled={deleting}
              >
                <Text style={styles.confirmBtnGhostText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtnDanger, deleting && { opacity: 0.6 }]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                <Text style={styles.confirmBtnDangerText}>{deleting ? 'Menghapus...' : 'Hapus'}</Text>
              </TouchableOpacity>
            </View>
        </View>
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceDim },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.4,
  },
  headerSubtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  addBtnText: { color: colors.onPrimary, fontFamily: 'Manrope_700Bold', fontSize: 13 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.sm,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.onSurface,
    fontSize: 13,
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 6 },
  emptyTitle: { ...typography.bodyMd, color: colors.onSurface, fontFamily: 'Manrope_700Bold', marginTop: 4 },
  emptySub: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12 },
  productCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { ...typography.bodyLg, color: colors.onSurface, fontFamily: 'Manrope_700Bold', fontSize: 15, flexShrink: 1, marginRight: spacing.sm },
  productSku: { fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  cardDivider: { height: 1, backgroundColor: colors.hairline, marginVertical: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  statCell: { width: '50%', gap: 2 },
  footerLabel: { fontSize: 10, color: colors.onSurfaceVariant, fontFamily: 'Manrope_600SemiBold' },
  priceValue: { fontSize: 14, fontFamily: 'Manrope_800ExtraBold', color: colors.onSurface },
  stockValue: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: colors.onSurface },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  actionBtnText: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: colors.onSurfaceVariant },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  confirmTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    marginBottom: 6,
  },
  confirmBody: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  confirmBtnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  confirmBtnGhostText: { fontFamily: 'Manrope_700Bold', color: colors.onSurfaceVariant, fontSize: 13 },
  confirmBtnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  confirmBtnDangerText: { fontFamily: 'Manrope_700Bold', color: '#FFF', fontSize: 13 },
});