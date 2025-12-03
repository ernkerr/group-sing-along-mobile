import React from 'react'
import { TextInput, View, Text } from 'react-native'
import { cn } from '@/utils/cn'

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
      {label && <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>}
      <TextInput
        className={cn(
          'h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors',
          'placeholder:text-gray-400',
          !editable && 'opacity-50',
          className
        )}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
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
