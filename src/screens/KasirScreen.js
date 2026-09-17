import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { AppButton, EmptyState, AnimatedModal } from '../components/UI';
import { CheckoutModal, ReceiptModal } from '../components/Payment';
import CartBar from '../components/CartBar';
import { formatRupiah, formatRupiahShort } from '../utils/format';
import { fetchProducts, createTransaction } from '../services/api';
import { useCart } from '../context/CartContext';

const CATEGORIES = ['Semua', 'ATK', 'Buku & Kertas', 'Aksesoris Komputer', 'Lainnya'];

export default function KasirScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const { cartItems, total, count, addToCart, changeQty, clearCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutDirect, setCheckoutDirect] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [storeName, setStoreName] = useState('PlusNet Kasir');

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('store_name')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.store_name) setStoreName(data.store_name);
    })();
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchProducts({ query, category: category === 'Semua' ? '' : category });
      setProducts(list);
    } catch (e) {
      setError(e.message);
    }
  }, [query, category]);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(load, 50);
      return () => clearTimeout(t);
    }, [load])
  );

  const openCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutDirect(false);
    setShowCheckout(true);
    setShowCart(false);
  };

  const openCheckoutFast = () => {
    if (cartItems.length === 0) return;
    setCheckoutDirect(true);
    setShowCheckout(true);
  };

  const tutupCheckout = () => {
    setShowCheckout(false);
    if (!checkoutDirect) setShowCart(true);
  };

  const handlePay = async (paymentMethod) => {
    if (cartItems.length === 0) return;
    const items = cartItems.map((c) => ({
      product_id: c.product_id,
      product_name: c.name,
      quantity: c.qty,
      unit_type: c.unit_type,
      unit_label: c.unit_label,
      unit_price: c.price,
      cost: c.cost,
      subtotal: c.subtotal,
      category: c.category || products.find((p) => p.id === c.product_id)?.category || 'Lainnya',
    }));
    const result = await createTransaction({
      subtotal: total,
      tax: 0,
      total,
      paymentMethod,
      items,
    });
    clearCart();
    setShowCart(false);
    setShowCheckout(false);
    setReceipt({
      code: result.code,
      subtotal: total,
      total,
      method: paymentMethod,
      items,
      created_at: result.created_at,
    });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topbar, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Ionicons name="storefront" size={17} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.brandTitle}>PlusNet Kasir</Text>
            <Text style={styles.brandSub}>Terminal Kasir Realtime</Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Realtime</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk atau SKU..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={16} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('ScanBarcode')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanGradient}
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.onPrimary} />
            <Text style={styles.scanText}>Scan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {CATEGORIES.map((c) => {
            const isActive = category === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setCategory(c)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.listContent, count > 0 && { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Produk Tidak Ditemukan"
            subtitle="Coba kata kunci lain atau tambah stok barang baru."
            icon="cube-outline"
          />
        }
        renderItem={({ item }) => <ProductCard product={item} onAdd={addToCart} />}
        style={{ flex: 1 }}
      />

      {count > 0 && (
        <CartBar
          onPay={openCheckoutFast}
          style={[styles.floatingCartBar, { bottom: insets.bottom > 0 ? insets.bottom + 12 : 20 }]}
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          count > 0 && [styles.fabRaised, { bottom: insets.bottom > 0 ? insets.bottom + 80 : 88 }],
        ]}
        onPress={() => setShowCart(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.gradientDark.start, colors.gradientDark.end]}
          style={styles.fabGradient}
        >
          <Ionicons name="cart" size={22} color={colors.surfaceBright} />
          {count > 0 && (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{count}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <AnimatedModal visible={showCart} onClose={() => setShowCart(false)} align="bottom">
        <View style={styles.cartSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.cartHeader}>
              <View>
                <Text style={styles.cartTitle}>Item Belanja</Text>
                <Text style={styles.cartSubTitle}>{count} Barang Dipilih</Text>
              </View>
              {cartItems.length > 0 && (
                <TouchableOpacity onPress={clearCart} style={styles.cartDeleteBtn}>
                  <Ionicons name="trash-bin-outline" size={16} color={colors.error} />
                  <Text style={styles.cartDeleteText}>Kosongkan</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.key}
              style={{ flex: 1 }}
              contentContainerStyle={styles.cartList}
              ListEmptyComponent={<EmptyState title="Keranjang Masih Kosong" icon="cart-outline" />}
              renderItem={({ item }) => (
                <View style={styles.cartItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemMeta}>
                      {formatRupiah(item.price)} / {item.unit_label}
                    </Text>
                  </View>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => changeQty(item.key, -1)}>
                      <Ionicons name="remove" size={14} color={colors.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.stepValue}>{item.qty}</Text>
                    <TouchableOpacity style={[styles.stepBtn, styles.stepBtnAdd]} onPress={() => changeQty(item.key, 1)}>
                      <Ionicons name="add" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemSub}>{formatRupiah(item.subtotal)}</Text>
                </View>
              )}
            />

            <View style={[styles.cartFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + spacing.xs : spacing.md }]}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Ringkasan</Text>
                <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
              </View>

              <View style={styles.actionsRow}>
                <AppButton
                  title="Struk"
                  variant="outline"
                  icon="receipt-outline"
                  onPress={() => Alert.alert('Informasi Struk', 'Struk otomatis dapat dicetak setelah transaksi selesai.')}
                  style={styles.flexBtn}
                />
                <AppButton
                  title="WhatsApp"
                  variant="outline"
                  icon="logo-whatsapp"
                  onPress={() => Alert.alert('WhatsApp', 'Nota digital dapat dikirim langsung ke WA pelanggan.')}
                  style={styles.flexBtn}
                />
              </View>

              <AppButton
                title="Lanjut Pembayaran"
                icon="arrow-forward-outline"
                onPress={openCheckout}
              />
            </View>
          </View>
      </AnimatedModal>

      <CheckoutModal
        visible={showCheckout}
        cartItems={cartItems}
        total={total}
        onClose={tutupCheckout}
        onConfirmPayment={handlePay}
      />

      <ReceiptModal
        receipt={receipt}
        storeName={storeName}
        onClose={() => setReceipt(null)}
      />
    </View>
  );
}

function ProductCard({ product, onAdd }) {
  const [unit, setUnit] = useState('unit');
  const price =
    unit === 'unit' ? Number(product.price_per_unit || 0) : Number(product.price_per_pack || 0);

  return (
    <View style={styles.productCard}>
      <View style={styles.productThumb}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImg}>
            <Text style={styles.thumbInitial}>{product.name ? product.name[0].toUpperCase() : 'P'}</Text>
          </View>
        )}
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText}>{product.category || 'Lainnya'}</Text>
        </View>
      </View>

      <View style={styles.productBody}>
        <Text numberOfLines={1} style={styles.productName}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceMain}>{formatRupiahShort(price)}</Text>
          <Text style={styles.priceUnitLabel}>/{unit === 'unit' ? 'biji' : 'pack'}</Text>
        </View>

        <View style={styles.productCtl}>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'unit' && styles.unitBtnActive]}
              onPress={() => setUnit('unit')}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitBtnText, unit === 'unit' && styles.unitBtnTextActive]}>Biji</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'pack' && styles.unitBtnActive]}
              onPress={() => setUnit('pack')}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitBtnText, unit === 'pack' && styles.unitBtnTextActive]}>Pack</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(product, unit)} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    lineHeight: 21,
  },
  brandSub: { ...typography.bodySm, color: colors.secondary, fontSize: 11 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  liveText: { color: colors.primary, fontSize: 10, fontFamily: 'Manrope_800ExtraBold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchBar: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.onSurface,
    fontFamily: 'Manrope_600SemiBold',
  },
  clearSearchBtn: { padding: 4 },
  scanButton: {
    height: 42,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.btn,
  },
  scanGradient: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 6,
  },
  scanText: {
    color: colors.onPrimary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  chipsWrapper: { marginVertical: spacing.xs },
  chipsScroll: { paddingHorizontal: spacing.md, gap: spacing.xs },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  chipTextActive: { color: colors.onPrimary, fontFamily: 'Manrope_700Bold' },
  errorText: {
    color: colors.error,
    paddingHorizontal: spacing.md,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  listContent: { padding: spacing.md, gap: spacing.sm },
  gridRow: { justifyContent: 'space-between', gap: spacing.sm },
  productCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    maxWidth: '48.5%',
    ...shadow.card,
  },
  productThumb: {
    height: 100,
    backgroundColor: colors.surfaceContainerLow,
    position: 'relative',
  },
  placeholderImg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: {
    fontSize: 32,
    color: colors.outlineVariant,
    fontFamily: 'Manrope_800ExtraBold',
  },
  thumbImage: { width: '100%', height: '100%' },
  catBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  catBadgeText: { color: colors.surfaceBright, fontSize: 9, fontFamily: 'Manrope_700Bold' },
  productBody: { padding: 10 },
  productName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 },
  priceMain: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
  },
  priceUnitLabel: { color: colors.secondary, fontSize: 10, fontFamily: 'Manrope_500Medium' },
  productCtl: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  unitToggle: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xs,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  unitBtn: { flex: 1, paddingVertical: 3, borderRadius: radius.xs, alignItems: 'center' },
  unitBtnActive: { backgroundColor: colors.surfaceContainerLowest, ...shadow.soft },
  unitBtnText: { fontSize: 10, color: colors.secondary, fontFamily: 'Manrope_600SemiBold' },
  unitBtnTextActive: { color: colors.onSurface, fontFamily: 'Manrope_800ExtraBold' },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.xs,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...shadow.sheet,
  },
  fabGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  fabRaised: { bottom: 80 },
  floatingCartBar: { position: 'absolute', left: spacing.md, right: spacing.md },
  fabBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surfaceContainerLowest,
  },
  fabBadgeText: { color: colors.onError, fontSize: 10, fontFamily: 'Manrope_800ExtraBold' },
  cartSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xs,
    maxHeight: '82%',
    minHeight: '50%',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  cartTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
  },
  cartSubTitle: { ...typography.bodySm, color: colors.secondary, fontSize: 11 },
  cartDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  cartDeleteText: { color: colors.error, fontSize: 12, fontFamily: 'Manrope_700Bold' },
  cartList: { gap: spacing.xs, paddingVertical: spacing.md },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cartItemName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  cartItemMeta: {
    ...typography.bodySm,
    color: colors.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 2,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnAdd: { backgroundColor: colors.primarySoft },
  stepValue: {
    minWidth: 20,
    textAlign: 'center',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: colors.onSurface,
  },
  cartItemSub: {
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    minWidth: 65,
    textAlign: 'right',
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    ...typography.bodyLg,
    color: colors.secondary,
    fontFamily: 'Manrope_600SemiBold',
  },
  totalValue: {
    ...typography.headlineMd,
    color: colors.primary,
    fontFamily: 'Manrope_800ExtraBold',
  },
  actionsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  flexBtn: { flex: 1 },
});