import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import KasirScreen from '../screens/KasirScreen';
import WarnetScreen from '../screens/WarnetScreen';
import InventoryScreen from '../screens/InventoryScreen';
import LaporanScreen from '../screens/LaporanScreen';
import PengaturanScreen from '../screens/PengaturanScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Beranda: 'storefront',
  Kasir: 'cart',
  Warnet: 'desktop',
  Stok: 'cube',
  Laporan: 'stats-chart',
  Pengaturan: 'settings',
};

// Animasi transisi antar tab: fade + sedikit slide + scale halus (200-300ms)
function withTabTransition(Component) {
  return function TabScene(props) {
    const isFocused = useIsFocused();
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isFocused) {
        progress.setValue(0);
        Animated.parallel([
          Animated.timing(progress, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [isFocused, progress]);

    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.985, 1],
              }),
            },
          ],
        }}
      >
        <Component {...props} />
      </Animated.View>
    );
  };
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: 'rgba(22,29,24,0.05)',
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', fontFamily: 'Manrope_700Bold' },
        tabBarIcon: ({ focused, color, size }) => {
          const name = ICONS[route.name] || 'ellipse';
          return (
            <Ionicons
              name={focused ? name : name + '-outline'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Beranda" component={withTabTransition(HomeScreen)} />
      <Tab.Screen name="Kasir" component={withTabTransition(KasirScreen)} />
      <Tab.Screen name="Warnet" component={withTabTransition(WarnetScreen)} />
      <Tab.Screen name="Stok" component={withTabTransition(InventoryScreen)} />
      <Tab.Screen name="Laporan" component={withTabTransition(LaporanScreen)} />
      <Tab.Screen name="Pengaturan" component={withTabTransition(PengaturanScreen)} />
    </Tab.Navigator>
  );
}