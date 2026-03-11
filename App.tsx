import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { loadAllSounds, unloadAllSounds } from './src/utils/soundManager';
import { initBGM, unloadBGM } from './src/utils/bgmManager';

export default function App() {
  useEffect(() => {
    loadAllSounds();
    initBGM();
    return () => {
      unloadAllSounds();
      unloadBGM();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
