import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import * as SplashScreenNative from 'expo-splash-screen';
import theme from '../theme';

// Mencegah native splash screen tersembunyi secara otomatis sebelum komponen dirender
SplashScreenNative.preventAutoHideAsync().catch(() => {
  /* mengabaikan error jika dipanggil berkali-kali */
});

export default function SplashScreen({ navigation }) {
  // Value animasi opacity untuk efek fade-in logo
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Sembunyikan native splash screen bawaan Expo setelah layout React Native siap
        await SplashScreenNative.hideAsync();

        // Jalankan animasi fade-in logo selama 1 detik
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();

        // Setelah total jeda 2.5 detik, pindah ke halaman Login
        const timer = setTimeout(() => {
          navigation.replace('Login');
        }, 2500);

        return () => clearTimeout(timer);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [fadeAnim, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors?.background || '#FFFFFF' }]}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});