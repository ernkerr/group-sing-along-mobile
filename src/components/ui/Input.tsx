import React from 'react'
import { TextInput, View, Text } from 'react-native'
import { cn } from '@/utils/cn'

interface InputProps {
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
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
}

export function Input({
  placeholder,
  value,
  onChangeText,
  autoCapitalize = 'none',
  autoCorrect = false,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  maxLength,
  className,
  label,
  returnKeyType,
  onSubmitEditing
}: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'h-12 px-4 rounded-lg border-2 border-gray-300 bg-white text-base',
          !editable && 'bg-gray-100 text-gray-500',
          className
        )}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  )
}
