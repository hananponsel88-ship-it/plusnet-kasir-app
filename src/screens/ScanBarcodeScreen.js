import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { BackButton } from '../components/UI';

export default function ScanBarcodeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    if (route.params?.onScan) {
      route.params.onScan(data);
      navigation.goBack();
    } else {
      Alert.alert('Barcode Terdeteksi', `Hasil: ${data}`, [
        { text: 'Scan Lagi', onPress: () => setScanned(false) },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  // Status izin masih loading
  if (!permission) {
    return <View style={styles.centerContainer} />;
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

  return (
    <View style={styles.container}>
      {/* Kamera hanya aktif jika layar sedang dalam fokus */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a'],
          }}
        />
      )}

      {/* Overlays UI */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
          <BackButton />
          <Text style={styles.headerTitle}>Pemindai Barcode Modern</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setScanned(false)}>
            <Ionicons name="refresh-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Kotak Target Frame */}
        <View style={styles.overlayCenter}>
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructionText}>Arahkan kamera ke Barcode / QR Code</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00FF66',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  instructionText: {
    color: '#FFF',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});