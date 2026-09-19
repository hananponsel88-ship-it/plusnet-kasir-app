import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { useCart } from '../context/CartContext';
import { AppButton, EmptyState } from './UI';
import { formatRupiah } from '../utils/format';

const CartSheet = forwardRef(function CartSheet({ onCheckout }, ref) {
  const insets = useSafeAreaInsets();
  const { cartItems, total, count, changeQty, clearCart } = useCart();
  const sheetRef = useRef(null);

  const snapPoints = useMemo(() => ['48%', '82%'], []);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  useEffect(() => {
    if (count === 0) sheetRef.current?.dismiss();
  }, [count]);

  const handleBayar = useCallback(() => {
    if (cartItems.length === 0) return;
    onCheckout?.();
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
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      backgroundStyle={styles.sheetBg}
      handleStyle={styles.handleStyle}
      handleIndicatorStyle={styles.handleIndicator}
      style={styles.sheetStyle}
      enablePanDownToClose
    >
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

      <BottomSheetFlatList
        data={cartItems}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="Keranjang Masih Kosong" subtitle="Tap produk untuk mulai menambahkan." icon="cart-outline" />}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
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
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  sheetStyle: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.sheet,
  },
  handleStyle: {
    paddingTop: spacing.sm,
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
  listContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
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