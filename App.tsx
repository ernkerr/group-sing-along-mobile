import './global.css'
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import AppNavigator from '@/navigation/AppNavigator'

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    'Roca': require('./src/assets/fonts/Roca.ttf'),
    'Garet': require('./src/assets/fonts/Garet.ttf'),
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
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  )
}
