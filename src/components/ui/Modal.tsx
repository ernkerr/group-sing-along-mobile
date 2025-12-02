import React from 'react'
import { Modal as RNModal, View, Text, Pressable, ScrollView } from 'react-native'
import { cn } from '@/utils/cn'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ visible, onClose, title, children, className }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center p-4"
        onPress={onClose}
      >
        <Pressable
          className={cn('bg-white rounded-lg w-full max-w-lg max-h-3/4', className)}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <View className="px-6 pt-6 pb-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">{title}</Text>
            </View>
          )}
          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  )
}
