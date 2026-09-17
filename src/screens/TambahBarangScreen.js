import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { formatRupiah } from '../utils/format';
import { addProduct, updateProduct } from '../services/api';
import { BackButton, AnimatedModal } from '../components/UI';

const CATEGORIES = ['ATK', 'Camilan', 'Elektronik',];

export default function TambahBarangScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const editProduct = route.params?.editProduct;
  const isEdit = !!editProduct;

  const [name, setName] = useState(editProduct?.name || '');
  const [sku, setSku] = useState(editProduct?.sku || '');
  const [hargaPack, setHargaPack] = useState(editProduct?.harga_pack ? String(editProduct.harga_pack) : '');
  const [stokPack, setStokPack] = useState(editProduct?.stok_pack ? String(editProduct.stok_pack) : '');
  const [hargaBiji, setHargaBiji] = useState(editProduct?.harga_biji ? String(editProduct.harga_biji) : '');
  const [stokBiji, setStokBiji] = useState(editProduct?.stok_biji ? String(editProduct.stok_biji) : '');
  const [category, setCategory] = useState(editProduct?.category || 'Makanan');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama produk tidak boleh kosong.');
      return false;
    }
    if (!hargaPack && !hargaBiji) {
      Alert.alert('Perhatian', 'Isi minimal salah satu: Harga/Pack atau Harga/Biji.');
      return false;
    }
    if ((hargaPack && isNaN(Number(hargaPack))) || (hargaBiji && isNaN(Number(hargaBiji)))) {
      Alert.alert('Perhatian', 'Harga harus berupa angka valid.');
      return false;
    }
    return true;
  };

  const openConfirm = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleSave = async () => {
    const payload = {
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      category,
      harga_pack: Number(hargaPack) || 0,
      stok_pack: Number(stokPack) || 0,
      harga_biji: Number(hargaBiji) || 0,
      stok_biji: Number(stokBiji) || 0,
    };
    try {
      setLoading(true);
      if (isEdit) {
        await updateProduct(editProduct.id, payload);
      } else {
        await addProduct(payload);
      }
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (e) {
      Alert.alert('Gagal Menyimpan', e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalStok = (Number(stokPack) || 0) + (Number(stokBiji) || 0);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <BackButton />
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Produk' : 'Tambah Produk'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        >
          <Text style={styles.sectionTitle}>Pratinjau Tampilan Card</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName} numberOfLines={1}>{name || 'Nama Produk Anda'}</Text>
                <Text style={styles.previewSku}>SKU: {sku || 'SKU-AUTO'}</Text>
              </View>
              <View style={styles.previewCategoryBadge}>
                <Text style={styles.previewCategoryText}>{category}</Text>
              </View>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewGrid}>
              <View style={styles.previewCell}>
                <Text style={styles.previewLabel}>Stok</Text>
                <Text style={styles.previewValueBold}>{stokPack || 0}</Text>
              </View>
              <View style={styles.previewCell}>
                <Text style={styles.previewLabel}>Harga/Pack</Text>
                <Text style={styles.previewValueAccent}>{formatRupiah(Number(hargaPack) || 0)}</Text>
              </View>
              <View style={styles.previewCell}>
                <Text style={styles.previewLabel}>Stok</Text>
                <Text style={styles.previewValueBold}>{stokBiji || 0}</Text>
              </View>
              <View style={styles.previewCell}>
                <Text style={styles.previewLabel}>Harga/Biji</Text>
                <Text style={styles.previewValueAccent}>{formatRupiah(Number(hargaBiji) || 0)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Produk *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cube-outline" size={17} color={colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Buku Tulis Sinar Dunia"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kode Barcode / SKU</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="barcode-outline" size={17} color={colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="Scan barcode atau isi manual..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={sku}
                  onChangeText={setSku}
                />
              </View>
            </View>

            <Text style={styles.groupTitle}>Satuan Pack</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Harga/Pack (Rp)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>Rp</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType="numeric"
                    value={hargaPack}
                    onChangeText={setHargaPack}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Stok Pack</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="layers-outline" size={17} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType="numeric"
                    value={stokPack}
                    onChangeText={setStokPack}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.groupTitle}>Satuan Biji</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Harga/Biji (Rp)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>Rp</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType="numeric"
                    value={hargaBiji}
                    onChangeText={setHargaBiji}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Stok Biji</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="layers-outline" size={17} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType="numeric"
                    value={stokBiji}
                    onChangeText={setStokBiji}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kategori Produk</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={15}
                        color={isSelected ? colors.primary : colors.onSurfaceVariant}
                      />
                      <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={openConfirm} activeOpacity={0.85}>
            <Ionicons name="checkmark-done" size={18} color={colors.onPrimary} />
            <Text style={styles.saveBtnText}>{isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Konfirmasi sebelum simpan */}
      <AnimatedModal
        visible={showConfirm}
        onClose={() => !loading && setShowConfirm(false)}
        align="center"
      >
        <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="save-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>{isEdit ? 'Simpan perubahan?' : 'Tambahkan produk ini?'}</Text>
            <Text style={styles.confirmBody}>
              {name} &bull; Stok total {totalStok} &bull; Kategori {category}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmBtnGhost}
                onPress={() => setShowConfirm(false)}
                disabled={loading}
              >
                <Text style={styles.confirmBtnGhostText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtnPrimary, loading && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.confirmBtnPrimaryText}>{loading ? 'Menyimpan...' : 'Ya, Simpan'}</Text>
              </TouchableOpacity>
            </View>
        </View>
      </AnimatedModal>

      {/* Sukses - lalu balik ke daftar Stok */}
      <AnimatedModal visible={showSuccess} onClose={() => {}} align="center">
        <View style={styles.confirmCard}>
            <View style={[styles.confirmIconWrap, { backgroundColor: 'rgba(0,184,107,0.12)' }]}>
              <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>{isEdit ? 'Perubahan Tersimpan' : 'Produk Ditambahkan'}</Text>
            <Text style={styles.confirmBody}>"{name}" berhasil disimpan ke daftar stok.</Text>
            <TouchableOpacity
              style={[styles.confirmBtnPrimary, { width: '100%' }]}
              onPress={() => {
                setShowSuccess(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.confirmBtnPrimaryText}>Kembali ke Daftar Stok</Text>
            </TouchableOpacity>
        </View>
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceDim },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  headerTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 17, color: colors.onSurface },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  previewName: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onSurface, flexShrink: 1, marginRight: spacing.sm },
  previewSku: { fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  previewCategoryBadge: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  previewCategoryText: { fontSize: 10, fontFamily: 'Manrope_700Bold', color: colors.onSurfaceVariant },
  previewDivider: { height: 1, backgroundColor: colors.hairline, marginVertical: spacing.sm },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  previewCell: { width: '50%', gap: 2 },
  previewLabel: { fontSize: 10, color: colors.onSurfaceVariant, fontFamily: 'Manrope_600SemiBold' },
  previewValueBold: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: colors.onSurface },
  previewValueAccent: { fontSize: 14, fontFamily: 'Manrope_800ExtraBold', color: colors.onSurface },
  formContainer: { gap: spacing.md },
  groupTitle: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: -4 },
  inputGroup: { gap: 6 },
  label: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: colors.onSurface },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 10,
  },
  input: { flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface },
  currencyPrefix: { fontFamily: 'Manrope_800ExtraBold', color: colors.onSurfaceVariant, fontSize: 14 },
  row: { flexDirection: 'row', gap: spacing.md },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    padding: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  categoryCardActive: { borderColor: colors.primary },
  categoryText: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: colors.onSurfaceVariant },
  categoryTextActive: { color: colors.onSurface, fontFamily: 'Manrope_700Bold' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  saveBtnText: { color: colors.onPrimary, fontFamily: 'Manrope_800ExtraBold', fontSize: 15 },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  confirmTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 16, color: colors.onSurface, marginBottom: 6, textAlign: 'center' },
  confirmBody: { fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.lg },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  confirmBtnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  confirmBtnGhostText: { fontFamily: 'Manrope_700Bold', color: colors.onSurfaceVariant, fontSize: 13 },
  confirmBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmBtnPrimaryText: { fontFamily: 'Manrope_700Bold', color: colors.onPrimary, fontSize: 13 },
});