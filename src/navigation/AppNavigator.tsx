import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LandingScreen from '@/screens/LandingScreen'
import GroupScreen from '@/screens/GroupScreen'
import type { RootStackParamList } from '@/types'

const Stack = createNativeStackNavigator<RootStackParamList>()

const linking = {
  prefixes: ['groupsingalong://', 'https://groupsingalong.com'],
  config: {
    screens: {
      Landing: '',
      Group: 'group/:id',
    },
  },
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Group" component={GroupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
