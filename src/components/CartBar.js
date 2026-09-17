import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../utils/format';

export default function CartBar({ onPay, style }) {
  const { total, count } = useCart();

  if (count === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.gradientDark?.start || '#1A1E29', colors.gradientDark?.end || '#0F1218']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBar}
      >
        <View style={styles.leftInfo}>
          <View style={styles.iconWrapper}>
            <Ionicons name="basket-outline" size={22} color={colors.primary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.itemCountText}>{count} Barang di Keranjang</Text>
            <Text style={styles.totalPriceText}>{formatRupiah(total)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={onPay} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.gradient?.start || '#00B86B', colors.gradient?.end || '#008F53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payGradient}
          >
            <Text style={styles.payText}>Bayar Fast</Text>
            <Ionicons name="flash" size={16} color={colors.onPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.sheet,
  },
  gradientBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.xl,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 184, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
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
    color: '#FFFFFF',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  payText: {
    color: colors.onPrimary,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
  },
});