import './global.css'
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import AppNavigator from '@/navigation/AppNavigator'
import { ThemeProvider } from '@/context/ThemeContext'

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

  if (!fontsLoaded && !fontsError) {
    return null
  }

  return (
    <ThemeProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
