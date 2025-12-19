import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LandingScreen from '@/screens/LandingScreen'
import GroupScreen from '@/screens/GroupScreen'
import PricingScreen from '@/screens/PricingScreen'
import type { RootStackParamList } from '@/types'

const Stack = createNativeStackNavigator<RootStackParamList>()

const linking = {
  prefixes: ['groupsingalong://', 'https://groupsingalong.com'],
  config: {
    screens: {
      Landing: '',
      Group: 'group/:id',
      Pricing: 'pricing',
    },
  },
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Group" component={GroupScreen} />
        <Stack.Screen name="Pricing" component={PricingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
