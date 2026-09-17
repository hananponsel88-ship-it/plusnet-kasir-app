import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { AppButton, AnimatedModal } from './UI';
import { formatRupiah } from '../utils/format';

export function CheckoutModal({ visible, cartItems, total, onClose, onConfirmPayment }) {
  const [method, setMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');

  const quickNominals = [total, 20000, 50000, 100000];
  const paid = method === 'cash' ? Number(cashAmount) || 0 : total;
  const change = paid - total;

  const handlePay = () => {
    if (method === 'cash' && paid < total) {
      Alert.alert('Uang Kurang', 'Nominal pembayaran tunai kurang dari total belanja.');
      return;
    }
    onConfirmPayment(method);
    setCashAmount('');
  };

  return (
    <AnimatedModal visible={visible} onClose={onClose} align="bottom">
      <View style={styles.sheetContainer}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pembayaran</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Total Display */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Tagihan</Text>
            <Text style={styles.totalAmount}>{formatRupiah(total)}</Text>
          </View>

          {/* Payment Method Options */}
          <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
          <View style={styles.methodGrid}>
            {[
              { id: 'cash', label: 'Tunai', icon: 'cash-outline' },
              { id: 'qris', label: 'QRIS', icon: 'qr-code-outline' },
              { id: 'transfer', label: 'Transfer', icon: 'card-outline' },
            ].map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodCard, method === m.id && styles.methodCardActive]}
                onPress={() => setMethod(m.id)}
              >
                <Ionicons
                  name={m.icon}
                  size={20}
                  color={method === m.id ? colors.primary : colors.secondary}
                />
                <Text style={[styles.methodText, method === m.id && styles.methodTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cash Calculator Input */}
          {method === 'cash' && (
            <View style={styles.cashSection}>
              <Text style={styles.sectionLabel}>Nominal Uang Diterima</Text>
              <TextInput
                style={styles.cashInput}
                keyboardType="numeric"
                placeholder="0"
                value={cashAmount}
                onChangeText={setCashAmount}
              />

              <View style={styles.quickNominalRow}>
                {quickNominals.map((nom, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickChip}
                    onPress={() => setCashAmount(String(nom))}
                  >
                    <Text style={styles.quickChipText}>{formatRupiah(nom)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {paid >= total && (
                <View style={styles.changeBox}>
                  <Text style={styles.changeLabel}>Kembalian</Text>
                  <Text style={styles.changeValue}>{formatRupiah(change)}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          <AppButton title="Selesaikan Transaksi" icon="checkmark-circle-outline" onPress={handlePay} />
        </View>
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
  sheetContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
  },
  totalBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.bodySm,
    color: colors.secondary,
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.primary,
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  methodCard: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceContainerLow,
    gap: 4,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  methodText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.secondary,
  },
  methodTextActive: {
    color: colors.primary,
    fontFamily: 'Manrope_800ExtraBold',
  },
  cashSection: {
    marginTop: spacing.xs,
  },
  cashInput: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    textAlign: 'center',
  },
  quickNominalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  quickChipText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.onSurface,
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
  },
  changeLabel: {
    fontFamily: 'Manrope_600SemiBold',
    color: colors.secondary,
  },
  changeValue: {
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.primary,
    fontSize: 16,
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