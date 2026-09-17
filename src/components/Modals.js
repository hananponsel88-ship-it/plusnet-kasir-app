import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { AppButton, AnimatedModal } from './UI';

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
}) {
  const isDanger = variant === 'danger';
  const iconName = isDanger
    ? 'alert-circle'
    : variant === 'warning'
    ? 'warning'
    : 'information-circle';

  const iconColor = isDanger
    ? colors.error
    : variant === 'warning'
    ? colors.warnText
    : colors.primary;

  const iconBg = isDanger
    ? colors.dangerBg
    : variant === 'warning'
    ? colors.warnBg
    : colors.successBg;

  return (
    <AnimatedModal visible={visible} onClose={onClose} align="center">
      <View style={styles.modalCard}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={32} color={iconColor} />
        </View>

        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.actionRow}>
          <AppButton
            title={cancelText}
            onPress={onClose}
            filled={false}
            disabled={loading}
            style={styles.btnFlex}
          />
          <AppButton
            title={confirmText}
            onPress={onConfirm}
            variant={variant}
            loading={loading}
            style={styles.btnFlex}
          />
        </View>
      </View>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.sheet,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  btnFlex: {
    flex: 1,
  },
});