import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { AppButton, AnimatedModal } from './UI';
import { formatRupiah } from '../utils/format';

function hapticLight() {
  try {
    const Haptics = require('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
}
function hapticSuccess() {
  try {
    const Haptics = require('expo-haptics');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {}
}
function hapticError() {
  try {
    const Haptics = require('expo-haptics');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  } catch {}
}
function hapticWarn() {
  try {
    const Haptics = require('expo-haptics');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  } catch {}
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', icon: 'cash-outline' },
  { id: 'qris', label: 'QRIS', icon: 'qr-code-outline' },
  { id: 'transfer', label: 'Transfer', icon: 'card-outline' },
];

const QUICK_NOMINALS = [20000, 50000, 100000];

// Checkout berbasis RN Modal — TANPA BottomSheet, TANPA Reanimated.
// visible langsung mengontrol Modal, jadi tidak ada present()/dismiss() yang bisa no-op.
export function CheckoutModal({ visible, cartItems, total, onClose, onConfirmPayment }) {
  const insets = useSafeAreaInsets();
  const notifiedRef = useRef(false);

  const [method, setMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payError, setPayError] = useState(null);

  const paid = method === 'cash' ? Number(cashAmount) || 0 : total;
  const change = Math.max(0, paid - total);

  const notify = useCallback(
    (afterPay) => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;
      onClose?.(afterPay);
    },
    [onClose]
  );

  useEffect(() => {
    if (visible) {
      notifiedRef.current = false;
      setSuccess(false);
      setPayError(null);
      setSubmitting(false);
      // Auto-isi Uang Pas supaya Bayar Fast = 1 tap langsung "Selesaikan".
      setCashAmount(total ? String(total) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handlePay = useCallback(async () => {
    if (submitting || success) return;
    if (method === 'cash' && paid < total) {
      Alert.alert('Uang Kurang', 'Nominal pembayaran tunai kurang dari total belanja.');
      hapticWarn();
      return;
    }
    setSubmitting(true);
    setPayError(null);
    hapticLight();
    try {
      Keyboard.dismiss();
      await onConfirmPayment(method);
      setSuccess(true);
      hapticSuccess();
      setTimeout(() => {
        setSubmitting(false);
        notify(true);
      }, 650);
    } catch (e) {
      setSubmitting(false);
      setPayError(e?.message || 'Transaksi gagal, coba lagi.');
      hapticError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, paid, total, onConfirmPayment, notify, submitting, success]);

  return (
    <AnimatedModal visible={visible} onClose={() => !submitting && notify(false)} align="bottom">
      <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Pembayaran</Text>
            <TouchableOpacity
              onPress={() => notify(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Total Tagihan */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Tagihan</Text>
            <Text style={styles.totalAmount}>{formatRupiah(total)}</Text>
          </View>

          {/* Metode Pembayaran */}
          <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((m) => {
              const isActive = method === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodCard, isActive && styles.methodCardActive]}
                  onPress={() => setMethod(m.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={m.icon}
                    size={19}
                    color={isActive ? colors.primary : colors.secondary}
                  />
                  <Text style={[styles.methodText, isActive && styles.methodTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Nominal Tunai */}
          {method === 'cash' && (
            <View style={styles.cashSection}>
              <View style={styles.inputRow}>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputPrefix}>Rp</Text>
                  <TextInput
                    style={styles.cashInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.outlineVariant}
                    value={cashAmount}
                    onChangeText={(t) => setCashAmount(t.replace(/[^0-9]/g, ''))}
                    editable={!submitting && !success}
                  />
                </View>
              </View>
              <Text style={[styles.sectionLabel, styles.nominalHint]}>Nominal Uang Diterima</Text>
              <View style={styles.quickRow}>
                <TouchableOpacity
                  style={[styles.quickChip, styles.quickChipPas]}
                  onPress={() => setCashAmount(String(total))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickChipText, styles.quickChipTextPas]}>Uang Pas</Text>
                </TouchableOpacity>
                {QUICK_NOMINALS.map((nom) => (
                  <TouchableOpacity
                    key={nom}
                    style={styles.quickChip}
                    onPress={() => setCashAmount(String(nom))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickChipText}>{formatRupiah(nom)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Kembalian */}
          {method === 'cash' && paid >= total && (
            <View style={styles.changeBox}>
              <Text style={styles.changeLabel}>Kembalian</Text>
              <Text style={styles.changeValue}>{formatRupiah(change)}</Text>
            </View>
          )}

          {payError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{payError}</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <AppButton
              title={submitting ? 'Memproses...' : 'Selesaikan Transaksi'}
              icon={submitting ? undefined : 'checkmark-circle-outline'}
              onPress={handlePay}
              disabled={submitting}
              loading={submitting}
            />
          </View>
        </ScrollView>

        {/* Pop-up sukses */}
        {success && (
          <View style={[StyleSheet.absoluteFill, styles.successOverlay]}>
            <View style={styles.successCircle}>
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="checkmark" size={52} color={colors.onPrimary} />
            </View>
            <Text style={styles.successTitle}>Transaksi Berhasil!</Text>
            <Text style={styles.successSub}>Pembayaran telah diterima. Menyiapkan struk...</Text>
          </View>
        )}
      </View>
    </AnimatedModal>
  );
}

export function ReceiptModal({ receipt, storeName, onClose }) {
  if (!receipt) return null;

  return (
    <AnimatedModal visible={!!receipt} onClose={onClose} align="bottom">
      <View style={[styles.sheetContainer, { maxHeight: '90%' }]}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptPaper}>
          <Text style={styles.receiptStore}>{storeName}</Text>
          <Text style={styles.receiptMeta}>No: {receipt.code}</Text>
          <Text style={styles.receiptMeta}>
            {new Date(receipt.created_at).toLocaleString('id-ID')}
          </Text>

          <View style={styles.divider} />

          {receipt.items.map((item, index) => (
            <View key={index} style={styles.receiptItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptItemName}>{item.product_name}</Text>
                <Text style={styles.receiptItemQty}>
                  {item.quantity} x {formatRupiah(item.unit_price)}
                </Text>
              </View>
              <Text style={styles.receiptItemSub}>{formatRupiah(item.subtotal)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.receiptTotalRow}>
            <Text style={styles.receiptTotalLabel}>TOTAL</Text>
            <Text style={styles.receiptTotalValue}>{formatRupiah(receipt.total)}</Text>
          </View>

          <Text style={styles.receiptFooterNote}>-- Terima Kasih --</Text>
        </ScrollView>

        <View style={styles.modalFooter}>
          <AppButton title="Tutup" variant="outline" onPress={onClose} />
        </View>
      </View>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheetContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '85%',
  },
  sheetBg: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  sheetStyle: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
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
  handleStyle: {
    paddingTop: spacing.sm,
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
  },
  totalBox: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    ...typography.bodySm,
    color: colors.secondary,
  },
  totalAmount: {
    fontSize: 26,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.primary,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: colors.onSurface,
    marginBottom: 6,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  methodCard: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceContainerLow,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  methodText: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: colors.secondary,
  },
  methodTextActive: {
    color: colors.primary,
    fontFamily: 'Manrope_800ExtraBold',
  },
  cashSection: {
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
  },
  inputPrefix: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.primary,
    marginRight: 4,
  },
  cashInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.onSurface,
    textAlign: 'right',
    padding: 0,
  },
  nominalHint: {
    marginBottom: 6,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  quickChipText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: colors.onSurface,
  },
  quickChipPas: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  quickChipTextPas: {
    color: colors.primary,
    fontFamily: 'Manrope_800ExtraBold',
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 107, 0.4)',
  },
  changeLabel: {
    fontFamily: 'Manrope_700Bold',
    color: colors.onPrimaryContainer,
  },
  changeValue: {
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.primary,
    fontSize: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.xs,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    flex: 1,
  },
  footer: {
    marginTop: spacing.sm,
  },
  successOverlay: {
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.btn,
  },
  successTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    textAlign: 'center',
  },
  successSub: {
    ...typography.bodyMd,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalFooter: {
    marginTop: spacing.md,
  },
  receiptPaper: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  receiptStore: {
    fontSize: 16,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.onSurface,
  },
  receiptMeta: {
    fontSize: 11,
    color: colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    width: '100%',
    marginVertical: spacing.sm,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  receiptItemName: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: colors.onSurface,
  },
  receiptItemQty: {
    fontSize: 10,
    color: colors.secondary,
  },
  receiptItemSub: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: colors.onSurface,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  receiptTotalLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
  },
  receiptTotalValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: colors.primary,
  },
  receiptFooterNote: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: spacing.md,
  },
});