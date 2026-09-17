import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth, AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MainTabs from './MainTabs';
import InventoryScreen from '../screens/InventoryScreen';
import RiwayatScreen from '../screens/RiwayatScreen';
import DetailProdukScreen from '../screens/DetailProdukScreen';
import TambahBarangScreen from '../screens/TambahBarangScreen';
import DetailStrukScreen from '../screens/DetailStrukScreen';
import ScanBarcodeScreen from '../screens/ScanBarcodeScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <CartProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Inventory" component={InventoryScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Riwayat" component={RiwayatScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="DetailProduk" component={DetailProdukScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="TambahBarang" component={TambahBarangScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="DetailStruk" component={DetailStrukScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="ScanBarcode" component={ScanBarcodeScreen} options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </CartProvider>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <ActivityIndicator
        style={styles.loader}
        size="large"
        color={colors.primary}
      />
    );
  }

  return user ? <AppStack /> : <AuthStack />;
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: colors.background },
});