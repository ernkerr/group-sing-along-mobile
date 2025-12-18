import './global.css'
import React, { useEffect } from 'react'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import AppNavigator from '@/navigation/AppNavigator'
import { ThemeProvider } from '@/context/ThemeContext'
import { MusicLoader } from '@/components/ui/MusicLoader'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
})

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    'Roca': require('./src/assets/fonts/Roca.ttf'),
    'Garet': require('./src/assets/fonts/Garet.ttf'),
    'Inter': require('./src/assets/fonts/Inter-Regular.ttf'),
    'Bricolage': require('./src/assets/fonts/BricolageGrotesque-Bold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontsError])

  return (
    <ThemeProvider>
      {!fontsLoaded && !fontsError ? (
        <View style={{
          flex: 1,
          backgroundColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MusicLoader size="large" color="#A68BF7" />
        </View>
      ) : (
        <>
          <AppNavigator />
          <StatusBar style="auto" />
        </>
      )}
    </ThemeProvider>
  )
}
