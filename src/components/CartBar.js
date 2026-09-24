import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadow } from '../theme';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../utils/format';

// CartBar polos (tanpa Reanimated) supaya sentuhan selalu masuk,
// bahkan jika worklets / babel plugin bermasalah.
export default function CartBar({ onPay, onOpenCart, onPayEmpty, style }) {
  const { total, count } = useCart();

  const handlePay = useCallback(() => {
    if (count === 0) {
      onPayEmpty?.();
      return;
    }
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    onPay?.();
  }, [onPay, onPayEmpty, count]);

  const handleOpenCart = useCallback(() => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    onOpenCart?.();
  }, [onOpenCart]);

  return (
    <View style={[styles.container, style]} pointerEvents="auto">
      <LinearGradient
        colors={[colors.gradientDark.start, colors.gradientDark.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bar}
      >
        <TouchableOpacity
          style={styles.tapArea}
          onPress={handleOpenCart}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Lihat keranjang"
          activeOpacity={0.8}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="basket" size={21} color={colors.primaryContainer} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.itemCountText}>{count} Barang di Keranjang</Text>
            <Text style={styles.totalPriceText}>{formatRupiah(total)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePay}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Bayar cepat"
          activeOpacity={0.85}
          style={styles.payButton}
        >
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payGradient}
          >
            <Text style={styles.payText}>Bayar Fast</Text>
            <Ionicons name="flash" size={15} color={colors.onPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    zIndex: 10,
    elevation: 16,
    ...shadow.sheet,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surfaceContainerLowest,
  },
  badgeText: {
    color: colors.onError,
    fontSize: 10,
    fontFamily: 'Manrope_800ExtraBold',
  },
  itemCountText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Manrope_600SemiBold',
  },
  totalPriceText: {
    fontSize: 16,
    color: colors.surfaceBright,
    fontFamily: 'Manrope_800ExtraBold',
  },
  payButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.btn,
  },
  payGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 6,
    minWidth: 116,
  },
  payText: {
    color: colors.onPrimary,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
  },
});
