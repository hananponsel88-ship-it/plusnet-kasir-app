import React from 'react';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

// Suppress dev-only warning yang tampil sebagai banner menumpuk di bawah layar
// (calling setLayoutAnimationEnabledExperimental is a no-op pada New Architecture).
LogBox.ignoreLogs([
  'setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.',
]);

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}