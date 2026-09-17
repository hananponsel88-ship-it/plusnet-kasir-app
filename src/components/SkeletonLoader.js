import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function SkeletonItem({ width = '100%', height = 20, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, opacity },
        style,
      ]}
    />
  );
}

export function ProductListSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <SkeletonItem height={48} width={48} style={{ borderRadius: radius.md }} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonItem height={16} width="70%" />
            <SkeletonItem height={12} width="40%" />
          </View>
          <SkeletonItem height={24} width={60} style={{ borderRadius: radius.full }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.sm,
  },
  skeletonContainer: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});