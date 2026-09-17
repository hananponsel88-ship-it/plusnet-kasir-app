import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, typography, shadow } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==========================================
// 1. APP BUTTON
// ==========================================
export const AppButton = memo(function AppButton({
  title,
  onPress,
  variant = 'primary',
  filled: filledProp,
  disabled,
  loading,
  style,
  icon,
  iconColor,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const filled = filledProp ?? (variant === 'primary' || variant === 'accent');
  const isPrimaryFill = filled && variant === 'primary';
  const isDangerFill = filled && variant === 'danger';
  const isAccentFill = filled && variant === 'accent';

  const textColor =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'accent'
      ? colors.onAccent
      : variant === 'danger'
      ? filled
        ? colors.onError
        : colors.error
      : colors.primary;

  const pressIn = () => {
    setPressed(true);
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
      bounciness: 2,
    }).start();
  };

  const pressOut = () => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const gradientColors = isDangerFill
    ? [colors.gradientDanger.start, colors.gradientDanger.end]
    : isAccentFill
    ? [colors.gradientAccent.start, colors.gradientAccent.end]
    : isPrimaryFill
    ? pressed
      ? ['#0A6B5E', '#1B9E4B']
      : ['#0E8F7E', '#22C55E']
    : pressed
    ? [colors.gradientPressed.start, colors.gradientPressed.end]
    : [colors.gradient.start, colors.gradient.end];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[
        styles.btn,
        filled && styles.btnPrimary,
        !filled && {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: textColor,
        },
        { transform: [{ scale }] },
        disabled && { opacity: 0.6 },
        style,
      ]}
    >
      {filled && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={isPrimaryFill ? { x: 1, y: 0 } : { x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {loading ? (
        <ActivityIndicator size="small" color={filled ? colors.onPrimary : textColor} />
      ) : (
        <View style={styles.btnRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={iconColor || textColor}
            />
          )}
          <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

// ==========================================
// 2. APP INPUT
// ==========================================
export const AppInput = memo(function AppInput({
  label,
  icon,
  secureTextEntry,
  rightElement,
  containerStyle,
  style,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.outline}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={colors.outlineVariant}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement}
      </View>
    </View>
  );
});

// ==========================================
// 3. APP SCREEN
// ==========================================
export const AppScreen = memo(function AppScreen({ children, style }) {
  return <View style={[styles.screen, style]}>{children}</View>;
});

// ==========================================
// 4. APP CARD
// ==========================================
export function AppCard({ children, style, elevated, variant }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isDark = variant === 'dark';
  const isAccent = variant === 'accent';
  const gradientColors = isDark
    ? [colors.gradientDark.start, colors.gradientDark.end]
    : isAccent
    ? [colors.gradientAccent.start, colors.gradientAccent.end]
    : null;

  return (
    <Animated.View
      style={[
        styles.card,
        elevated && shadow.cardElevated,
        (isDark || isAccent) && { borderWidth: 0 },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        style,
      ]}
    >
      {gradientColors && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </Animated.View>
  );
}

// ==========================================
// 5. BADGE
// ==========================================
export const Badge = memo(function Badge({ label, tone = 'success', style }) {
  const tones = {
    success: { bg: colors.successBg, text: colors.successText },
    warn: { bg: colors.warnBg, text: colors.warnText },
    danger: { bg: colors.dangerBg, text: colors.dangerText },
    pending: { bg: colors.secondaryContainer, text: colors.onSecondaryContainer },
    primary: { bg: colors.primaryContainer, text: colors.onPrimaryContainer },
    accent: { bg: colors.accentSoft, text: colors.onAccent },
  };
  const t = tones[tone] || tones.success;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.badgeText, { color: t.text }]}>{label}</Text>
    </View>
  );
});

// ==========================================
// 6. EMPTY STATE
// ==========================================
export const EmptyState = memo(function EmptyState({ title, subtitle, icon = 'file-tray-outline' }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.outlineVariant} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
});

// ==========================================
// 7. SECTION HEADER
// ==========================================
export const SectionHeader = memo(function SectionHeader({ title, subtitle, right, accent }) {
  return (
    <View style={styles.sectionHeader}>
      {accent && <View style={styles.sectionAccentBar} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
});

// ==========================================
// 8. BACK BUTTON
// ==========================================
export const BackButton = memo(function BackButton({ onPress, color, size, style }) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Kembali"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.backBtn, style]}
    >
      <Ionicons name="arrow-back" size={size || 22} color={color || colors.primary} />
    </Pressable>
  );
});

// ==========================================
// 9. ANIMATED MODAL / BOTTOM SHEET
// ==========================================
export function AnimatedModal({
  visible,
  onClose,
  align = 'center', // 'center' | 'bottom'
  children,
  style,
  overlayStyle,
  backdropStyle,
}) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.setValue(0);
      const anim =
        align === 'bottom'
          ? Animated.spring(progress, {
              toValue: 1,
              useNativeDriver: true,
              friction: 7,
              tension: 110,
            })
          : Animated.spring(progress, {
              toValue: 1,
              useNativeDriver: true,
              friction: 8,
              tension: 130,
            });
      anim.start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  const isBottom = align === 'bottom';
  const translateFrom = isBottom ? 60 : 24;
  const scaleFrom = isBottom ? 1 : 0.92;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => onClose && onClose()}
    >
      <TouchableWithoutFeedback onPress={() => onClose && onClose()}>
        <View
          style={[
            styles.animatedModalRoot,
            isBottom
              ? styles.animatedModalRootBottom
              : styles.animatedModalRootCenter,
            overlayStyle,
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.animatedModalBackdrop,
              { opacity: progress },
              backdropStyle,
            ]}
          />

          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                isBottom
                  ? styles.animatedModalContentBottom
                  : styles.animatedModalContentCenter,
                {
                  opacity: progress,
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [translateFrom, 0],
                      }),
                    },
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [scaleFrom, 1],
                      }),
                    },
                  ],
                },
                style,
              ]}
            >
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  btn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  btnPrimary: {
    ...shadow.btn,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { fontSize: 16, fontWeight: '700', fontFamily: 'Manrope_700Bold' },
  field: { marginBottom: spacing.md },
  label: { ...typography.labelMd, color: colors.onSurface, marginBottom: spacing.sm, fontFamily: 'Manrope_600SemiBold' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 48,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceContainerLowest,
  },
  inputIcon: { marginLeft: spacing.md },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.onSurface,
    fontFamily: 'Manrope_500Medium',
  },
  inputWithIcon: { paddingLeft: spacing.sm },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { ...typography.labelMd, fontWeight: '700', fontFamily: 'Manrope_700Bold' },
  empty: { alignItems: 'center', padding: spacing.lg * 2, gap: 8 },
  emptyTitle: { ...typography.headlineSm, color: colors.onSurface, fontFamily: 'Manrope_700Bold' },
  emptySub: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionAccentBar: {
    width: 4,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface, fontFamily: 'Manrope_700Bold' },
  sectionSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedModalRoot: { flex: 1, backgroundColor: 'transparent' },
  animatedModalRootBottom: { justifyContent: 'flex-end' },
  animatedModalRootCenter: { alignItems: 'center', justifyContent: 'center' },
  animatedModalBackdrop: {
    backgroundColor: 'rgba(10, 15, 12, 0.5)',
  },
  animatedModalContentBottom: { width: '100%' },
  animatedModalContentCenter: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
});