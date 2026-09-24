import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import { colors, radius, spacing } from '../theme';
import { formatRupiah } from '../utils/format';
import { useCart } from '../context/CartContext';
import { fetchProductByBarcode, createTransaction } from '../services/api';
import CartBar from '../components/CartBar';
import CartSheet from '../components/CartSheet';
import { CheckoutModal, ReceiptModal } from '../components/Payment';

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

export default function ScanBarcodeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { cartItems, total, addToCart, clearCart } = useCart();

  const [cameraActive, setCameraActive] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', text }
  const [lookingUp, setLookingUp] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [storeName, setStoreName] = useState('PlusNet Kasir');

  const lastScanRef = useRef(0);
  const fetchingRef = useRef(false);
  const toastTimerRef = useRef(null);
  const cartSheetRef = useRef(null);

  // Mount bersih tiap layar fokus, unmount tiap blur.
  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      setCameraError(null);
      setCameraReady(false);
      setShowSlowHint(false);
      return () => {
        setCameraActive(false);
        setTorchOn(false);
      };
    }, [])
  );

  // Kalau preview tak kunjung siap >7 detik, tampilkan panel bantuan + input manual.
  useEffect(() => {
    if (cameraReady || cameraError) return;
    const t = setTimeout(() => setShowSlowHint(true), 7000);
    return () => clearTimeout(t);
  }, [cameraReady, cameraError]);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('store_name')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.store_name) setStoreName(data.store_name);
      } catch {}
    })();
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const showToast = useCallback((type, text) => {
    clearTimeout(toastTimerRef.current);
    setToast({ type, text });
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // Cari produk by barcode lalu masukkan ke keranjang (dipakai scan kamera + input manual).
  const processCode = useCallback(
    async (code) => {
      const barcode = String(code || '').trim();
      if (!barcode || fetchingRef.current) return;
      fetchingRef.current = true;
      setLookingUp(true);
      try {
        const product = await fetchProductByBarcode(barcode);
        if (!product) {
          hapticError();
          showToast('error', `Barcode ${barcode} tidak terdaftar di stok.`);
          return;
        }
        addToCart(product, 'unit', 1);
        hapticSuccess();
        const price = Number(product.price_per_unit || 0);
        showToast('success', `${product.name} ditambahkan — ${formatRupiah(price)}`);
      } catch (e) {
        hapticError();
        showToast('error', e?.message || 'Gagal mencari produk.');
      } finally {
        fetchingRef.current = false;
        setLookingUp(false);
      }
    },
    [addToCart, showToast]
  );

  const handleBarcodeScanned = useCallback(
    ({ data }) => {
      // Cooldown 1,5 dtk supaya 1 barcode tidak ke-scan berkali-kali.
      const now = Date.now();
      if (now - lastScanRef.current < 1500) return;
      lastScanRef.current = now;
      processCode(data);
    },
    [processCode]
  );

  const deliverManualResult = useCallback(
    (data) => {
      // Jalur input manual: dukung onScan callback (mode pemilih produk) atau keranjang.
      if (route.params?.onScan) {
        route.params.onScan(data);
        navigation.goBack();
        return;
      }
      processCode(data);
    },
    [route.params, navigation, processCode]
  );

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) {
      Alert.alert('Kode Kosong', 'Ketik dulu kode barcode/SKU-nya.');
      return;
    }
    setManualCode('');
    deliverManualResult(code);
  };

  const handlePay = useCallback(
    async (paymentMethod) => {
      if (cartItems.length === 0) return;
      const items = cartItems.map((c) => ({
        product_id: c.product_id,
        product_name: c.name,
        quantity: c.qty,
        unit_type: c.unit_type,
        unit_label: c.unit_label,
        unit_price: c.price,
        cost: c.cost,
        subtotal: c.subtotal,
        category: c.category || 'Lainnya',
      }));
      const result = await createTransaction({
        subtotal: total,
        tax: 0,
        total,
        paymentMethod,
        items,
      });
      clearCart();
      setReceipt({
        code: result.code,
        subtotal: total,
        total,
        method: paymentMethod,
        items,
        created_at: result.created_at,
      });
    },
    [cartItems, total, clearCart]
  );

  // Status izin masih loading
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Izin belum diberikan
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.secondary} />
        <Text style={styles.permissionText}>
          Aplikasi membutuhkan izin akses kamera untuk memindai barcode.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Error native kamera — tampilkan jelas.
  if (cameraError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="videocam-off-outline" size={64} color={colors.error || '#D32F2F'} />
        <Text style={styles.permissionText}>Kamera gagal dibuka.{'\n'}{cameraError}</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={() => {
            setCameraError(null);
            setCameraReady(false);
            setCameraActive(false);
            setTimeout(() => setCameraActive(true), 300);
          }}
        >
          <Text style={styles.permissionBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permissionBtn, styles.backBtn]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanPaused = showCheckout || !!receipt;

  return (
    <View style={styles.container}>
      {cameraActive && (
        <CameraView
          style={styles.camera}
          facing="back"
          ratio="16:9"
          enableTorch={torchOn}
          onCameraReady={() => setCameraReady(true)}
          onMountError={(e) =>
            setCameraError(e?.message || 'Terjadi kesalahan pada modul kamera.')
          }
          onBarcodeScanned={scanPaused ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a'],
          }}
        />
      )}

      {!cameraReady && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#00FF66" />
          <Text style={styles.loadingText}>Menyiapkan kamera...</Text>
        </View>
      )}

      {/* Toast hasil scan */}
      {toast && (
        <View style={[styles.toastWrap, { top: insets.top + 64 }]} pointerEvents="none">
          <View style={styles.toastPill}>
            <Ionicons
              name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={toast.type === 'success' ? '#1E9E57' : '#D32F2F'}
            />
            <Text style={styles.toastText} numberOfLines={2}>
              {toast.text}
            </Text>
          </View>
        </View>
      )}

      {/* Overlay UI */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Header: tutup | judul | senter */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <TouchableOpacity
            style={[styles.iconBtn, torchOn && styles.iconBtnActive]}
            onPress={() => setTorchOn((v) => !v)}
          >
            <Ionicons
              name={torchOn ? 'flashlight' : 'flashlight-outline'}
              size={22}
              color={torchOn ? '#FFD54F' : '#FFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Kotak Target Frame */}
        <View style={styles.overlayCenter} pointerEvents="none">
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructionText}>Arahkan kamera ke barcode produk</Text>
          {lookingUp && (
            <View style={styles.lookupPill}>
              <ActivityIndicator size="small" color="#00FF66" />
              <Text style={styles.lookupText}>Mencari produk...</Text>
            </View>
          )}
        </View>

        {/* Panel bantuan: muncul kalau preview tak kunjung tampil */}
        {showSlowHint && !cameraReady && (
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Preview belum tampil?</Text>
            <Text style={styles.hintText}>
              Coba tutup app kamera lain / restart HP. Sementara itu bisa ketik kode manual:
            </Text>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="Ketik kode / SKU..."
                placeholderTextColor="#8A9A8E"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleManualSubmit}
              />
              <TouchableOpacity style={styles.manualBtn} onPress={handleManualSubmit}>
                <Text style={styles.manualBtnText}>Kirim</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom bar keranjang + Bayar Fast — selalu tampil walau belum scan */}
        <CartBar
          onPay={() => setShowCheckout(true)}
          onPayEmpty={() => showToast('error', 'Keranjang masih kosong — scan barcode dulu.')}
          onOpenCart={() => cartSheetRef.current?.present()}
          style={[styles.floatingCartBar, { bottom: insets.bottom > 0 ? insets.bottom + 12 : 20 }]}
        />
      </View>

      <CartSheet ref={cartSheetRef} onCheckout={() => setShowCheckout(true)} />

      <CheckoutModal
        visible={showCheckout}
        cartItems={cartItems}
        total={total}
        onClose={() => setShowCheckout(false)}
        onConfirmPayment={handlePay}
      />

      <ReceiptModal
        receipt={receipt}
        storeName={storeName}
        onClose={() => setReceipt(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    zIndex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 12,
    zIndex: 5,
    elevation: 5,
  },
  loadingText: {
    color: '#FFF',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 10,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  permissionBtnText: {
    color: '#FFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  backBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(255,213,79,0.25)',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginHorizontal: spacing.lg,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: {
    flex: 1,
    color: '#1A231E',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 56,
  },
  scanBox: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: '#22C55E',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 12 },
  instructionText: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    marginTop: spacing.md,
  },
  lookupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  lookupText: {
    color: '#FFF',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  hintCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(20,28,22,0.92)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 8,
  },
  hintTitle: {
    color: '#00FF66',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
  },
  hintText: {
    color: '#DDE5DD',
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: '#1A231E',
  },
  manualBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualBtnText: {
    color: '#FFF',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
  },
  floatingCartBar: {
    marginHorizontal: spacing.md,
  },
});
