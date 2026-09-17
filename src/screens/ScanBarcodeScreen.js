import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

export default function ScanBarcodeScreen({ navigation, route }) {
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

  // STEP 1 ISOLATION TEST: CameraView rendered ALONE, no overlay/sibling above it.
  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={() => console.log('CAMERA IS READY (isolated, no overlay)')}
          onMountError={(e) => console.log('CAMERA MOUNT ERROR:', e)}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a'],
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
});