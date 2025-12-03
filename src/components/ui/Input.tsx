import React from 'react'
import { TextInput, View, Text, Platform } from 'react-native'
import { cn } from '@/utils/cn'
import { useTheme } from '@/context/ThemeContext'

interface InputProps {
  placeholder?: string
  value: string
  onChangeText?: (text: string) => void
  onChange?: (e: { target: { value: string } }) => void // Web-style onChange
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  secureTextEntry?: boolean
  editable?: boolean
  maxLength?: number
  className?: string
  label?: string
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send'
  onSubmitEditing?: () => void
  onKeyDown?: (e: any) => void
  type?: string // For web compatibility
}

// Enhanced shadow styles for lg shadow effect
const shadowStyles = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  android: {
    elevation: 4,
  },
})

export function Input({
  placeholder,
  value,
  onChangeText,
  onChange,
  autoCapitalize = 'none',
  autoCorrect = false,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  maxLength,
  className,
  label,
  returnKeyType,
  onSubmitEditing,
  onKeyDown,
  type,
}: InputProps) {
  const { colors, colorScheme } = useTheme()

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text)
    }
    if (onChange) {
      onChange({ target: { value: text } })
    }
  }

  // Handle secureTextEntry from type prop
  const isSecure = secureTextEntry || type === 'password'

  return (
    <View className="w-full">
      {label && (
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.foreground }}
        >
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'h-11 w-full rounded-md border px-3 py-2 text-base transition-colors',
          'placeholder:text-gray-400',
          !editable && 'opacity-50',
          className
        )}
        style={[
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.foreground,
          },
          shadowStyles,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
        value={value}
        onChangeText={handleChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        secureTextEntry={isSecure}
        editable={editable}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  )
}
