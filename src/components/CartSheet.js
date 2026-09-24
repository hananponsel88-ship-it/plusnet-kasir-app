import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { useCart } from '../context/CartContext';
import { AppButton, EmptyState, AnimatedModal } from './UI';
import { formatRupiah } from '../utils/format';

// CartSheet berbasis RN Modal (AnimatedModal) — TANPA @gorhom/bottom-sheet,
// TANPA Reanimated. Dijamin kebuka walau worklets/babel bermasalah.
// API ref tetap sama: present() / dismiss() supaya KasirScreen tidak perlu diubah.
const CartSheet = forwardRef(function CartSheet({ onCheckout }, ref) {
  const insets = useSafeAreaInsets();
  const { cartItems, total, count, changeQty, clearCart } = useCart();
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => setVisible(true),
    dismiss: () => setVisible(false),
  }));

  useEffect(() => {
    if (count === 0) setVisible(false);
  }, [count]);

  const handleBayar = useCallback(() => {
    if (cartItems.length === 0) return;
    setVisible(false);
    // Langsung teruskan — KasirScreen yang menampilkan CheckoutModal.
    // Timeout kecil supaya modal cart sempat turun (tidak tumpuk animasi).
    setTimeout(() => onCheckout?.(), 80);
  }, [cartItems.length, onCheckout]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <Text numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>
            {formatRupiah(item.price)} / {item.unit_label}
          </Text>
        </View>

        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => changeQty(item.key, -1)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="remove" size={14} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.stepValue}>{item.qty}</Text>
          <TouchableOpacity
            style={[styles.stepBtn, styles.stepBtnAdd]}
            onPress={() => changeQty(item.key, 1)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="add" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemSubtotal}>{formatRupiah(item.subtotal)}</Text>
      </View>
    ),
    [changeQty]
  );

  return (
    <AnimatedModal visible={visible} onClose={() => setVisible(false)} align="bottom">
      <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Keranjang</Text>
            <Text style={styles.subtitle}>
              {count} Barang Dipilih • {formatRupiah(total)}
            </Text>
          </View>
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
              <Ionicons name="trash-bin-outline" size={15} color={colors.error} />
              <Text style={styles.clearText}>Kosongkan</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          ListEmptyComponent={<EmptyState title="Keranjang Masih Kosong" subtitle="Tap produk untuk mulai menambahkan." icon="cart-outline" />}
        />

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Ringkasan</Text>
            <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
          </View>

          <View style={styles.actionsRow}>
            <AppButton
              title="Struk"
              variant="outline"
              icon="receipt-outline"
              onPress={() =>
                Alert.alert('Informasi Struk', 'Struk otomatis dapat dicetak setelah transaksi selesai.')
              }
              style={styles.flexBtn}
            />
            <AppButton
              title="WhatsApp"
              variant="outline"
              icon="logo-whatsapp"
              onPress={() =>
                Alert.alert('WhatsApp', 'Nota digital dapat dikirim langsung ke WA pelanggan.')
              }
              style={styles.flexBtn}
            />
          </View>

          <AppButton
            title="Bayar"
            icon="arrow-forward-outline"
            onPress={handleBayar}
            disabled={cartItems.length === 0}
            loading={false}
          />
        </View>
      </View>
    </AnimatedModal>
  );
});

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    paddingTop: spacing.sm,
    maxHeight: '82%',
    minHeight: '48%',
    ...shadow.sheet,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondary,
    fontSize: 11,
    marginTop: 1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  clearText: {
    color: colors.error,
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
  },
  list: { maxHeight: 320 },
  listContent: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  itemInfo: { flex: 1 },
  itemName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  itemMeta: {
    ...typography.bodySm,
    color: colors.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  stepper: {
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
    minWidth: 22,
    textAlign: 'center',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: colors.onSurface,
  },
  itemSubtotal: {
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    minWidth: 66,
    textAlign: 'right',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.sm,
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
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  flexBtn: { flex: 1 },
});

export default CartSheet;
