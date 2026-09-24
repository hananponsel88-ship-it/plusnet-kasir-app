import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { colors, radius, spacing, typography } from '../theme';
import { formatRupiah, formatDate, formatTime } from '../utils/format';
import { AppButton, BackButton } from '../components/UI';

export default function DetailStrukScreen({ route, navigation }) {
  const { transaction } = route.params || {};
  const [trx, setTrx] = useState(transaction);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (trx?.transaction_items) {
      setDetail(trx);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .eq('id', trx.id)
        .single();
      if (!error) setDetail(data);
    })();
  }, [trx]);

  if (!detail) return null;

  const items = detail.transaction_items || [];
  const subTotal = Number(detail.subtotal || items.reduce((s, it) => s + Number(it.subtotal || 0), 0));
  const tax = Number(detail.tax || Math.round(subTotal * 0.11));
  const total = Number(detail.total || subTotal + tax);

  // Expo Go: ganti print fisik jadi share via WhatsApp (tanpa native module).
  const buildStrukMessage = () => {
    const lines = [
      `*PLUSNET POS DIGITAL*`,
      `ID: ${detail.code || 'TRX-' + String(detail.id).slice(0, 4)}`,
      `${formatDate(detail.created_at)} ${formatTime(detail.created_at)}`,
      `Status: ${detail.status === 'pending' ? 'Pending' : 'Lunas'}`,
      `------------------------------`,
      ...items.map(
        (it) => `${it.product_name}\n${it.quantity} x ${formatRupiah(it.unit_price)} = ${formatRupiah(it.subtotal)}`
      ),
      `------------------------------`,
      `Subtotal: ${formatRupiah(subTotal)}`,
      `Pajak (${detail.tax_rate ?? 11}%): ${formatRupiah(tax)}`,
      `*Grand Total: ${formatRupiah(total)}*`,
      `Terima kasih telah berbelanja!`,
    ];
    return lines.join('\n');
  };

  const handleShareWA = async () => {
    const url = `https://wa.me/?text=${encodeURIComponent(buildStrukMessage())}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('WhatsApp', 'Tidak dapat membuka WhatsApp di perangkat ini.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('WhatsApp', 'Gagal membuka WhatsApp.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <BackButton />
          <View style={styles.headInfo}>
            <Text style={styles.title}>Detail Struk</Text>
            <Text style={styles.subtitle}>ID: {detail.code || 'TRX-' + detail.id.slice(0, 4)}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatDate(detail.created_at)}</Text>
          <Text style={styles.metaText}>{formatTime(detail.created_at)}</Text>
          <Text style={styles.metaText}>Status: {detail.status === 'pending' ? 'Pending' : 'Lunas'}</Text>
        </View>

        <View style={styles.items}>
          {items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.product_name}</Text>
                <Text style={styles.itemQty}>
                  {it.quantity} x {formatRupiah(it.unit_price)}
                </Text>
              </View>
              <Text style={styles.itemSub}>{formatRupiah(it.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <TotalRow label="Subtotal" value={formatRupiah(subTotal)} />
          <TotalRow label={`Pajak (${detail.tax_rate ?? 11}%)`} value={formatRupiah(tax)} />
          <View style={styles.divider} />
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>{formatRupiah(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* Mode Expo Go: tombol print fisik dinonaktifkan, ganti share WhatsApp */}
        <AppButton
          title="Bagikan via WhatsApp"
          variant="primary"
          icon="chatbubble-ellipses-outline"
          style={{ flex: 1 }}
          onPress={handleShareWA}
        />
      </View>
    </View>
  );
}

function TotalRow({ label, value }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalText}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 30 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headInfo: { flex: 1 },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
  },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  meta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  metaText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  items: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(22,29,24,0.05)',
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  itemName: { ...typography.bodyMd, color: colors.onSurface, fontFamily: 'Manrope_600SemiBold' },
  itemQty: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  itemSub: { ...typography.bodyMd, color: colors.onSurface, fontFamily: 'Manrope_700Bold' },
  totals: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  totalValue: { ...typography.bodyMd, color: colors.onSurface },
  divider: { borderTopWidth: 1, borderTopColor: colors.outlineVariant, marginVertical: spacing.sm },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between' },
  grandLabel: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
  },
  grandValue: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
});