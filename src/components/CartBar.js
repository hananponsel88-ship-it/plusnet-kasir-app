import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, shadow } from '../theme';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../utils/format';

export default function CartBar({ onPay, onOpenCart, style }) {
  const { total, count } = useCart();

  // Pop micro-animation pada badge setiap kali jumlah barang bertambah.
  const badgeScale = useSharedValue(1);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current && prevCount.current >= 0) {
      badgeScale.value = withSequence(
        withSpring(1.5, { damping: 7, stiffness: 320 }),
        withSpring(0.85, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 11, stiffness: 220 })
      );
    }
    prevCount.current = count;
  }, [count, badgeScale]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  // Press-scale + haptic ringan untuk tombol Bayar Fast.
  const payScale = useSharedValue(1);
  const payBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: payScale.value }],
  }));

  const payPressIn = useCallback(() => {
    payScale.value = withSpring(0.94, { damping: 20, stiffness: 400 });
  }, [payScale]);

  const payPressOut = useCallback(() => {
    payScale.value = withSpring(1, { damping: 14, stiffness: 260 });
  }, [payScale]);

  const handlePay = useCallback(() => {
    if (count === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPay?.();
  }, [onPay, count]);

  const handleOpenCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpenCart?.();
  }, [onOpenCart]);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(17).stiffness(150)}
      exiting={FadeOutDown.springify().damping(17).stiffness(150)}
      style={[styles.container, style]}
      pointerEvents="auto"
    >
      <LinearGradient
        colors={[colors.gradientDark.start, colors.gradientDark.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bar}
      >
        <Pressable
          style={styles.tapArea}
          onPress={handleOpenCart}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Lihat keranjang"
          android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="basket" size={21} color={colors.primaryContainer} />
            <Animated.View style={[styles.badge, badgeStyle]}>
              <Text style={styles.badgeText}>{count}</Text>
            </Animated.View>
          </View>
          <View>
            <Text style={styles.itemCountText}>{count} Barang di Keranjang</Text>
            <Text style={styles.totalPriceText}>{formatRupiah(total)}</Text>
          </View>
        </Pressable>

        {/* Tombol Bayar Fast: Pressable polos di lapisan terluar supaya
            jalur sentuh tidak melewati Animated.View (lebih andal di Android),
            animasi scale hanya sebagai visual di dalam. */}
        <Pressable
          onPressIn={payPressIn}
          onPressOut={payPressOut}
          onPress={handlePay}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Bayar cepat"
          android_ripple={{ color: 'rgba(255,255,255,0.16)', borderless: false }}
          style={({ pressed }) => [styles.payButton, pressed && styles.payButtonPressed]}
        >
          <Animated.View style={[styles.payClip, payBtnStyle]}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.payGradient}
            >
              <Text style={styles.payText}>Bayar Fast</Text>
              <Ionicons name="flash" size={15} color={colors.onPrimary} />
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    // Pastikan bar selalu di atas daftar produk (urutan sentuh Android ikut elevation/zIndex).
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
    ...shadow.btn,
  },
  payButtonPressed: {
    opacity: 0.92,
  },
  payClip: {
    borderRadius: radius.lg,
    overflow: 'hidden',
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