import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, shadow } from '../theme';

export default function CustomToast({ visible, message, type = 'success', onDismiss }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: insets.top + spacing.xs,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (onDismiss) onDismiss();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isSuccess = type === 'success';

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        { transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.toastContainer, isSuccess ? styles.successBorder : styles.errorBorder]}>
        <Ionicons
          name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color={isSuccess ? colors.primary : colors.error}
        />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 8,
    borderWidth: 1,
    ...shadow.card,
  },
  successBorder: {
    borderColor: 'rgba(0, 184, 107, 0.4)',
  },
  errorBorder: {
    borderColor: 'rgba(255, 77, 77, 0.4)',
  },
  toastText: {
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
});