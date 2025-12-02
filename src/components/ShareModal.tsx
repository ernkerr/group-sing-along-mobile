import React from 'react'
import { View, Modal, Pressable, Share, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import QRCode from 'react-native-qrcode-svg'
import { RocaText, GaretText } from '@/components/ui/Typography'

interface ShareModalProps {
  isVisible: boolean
  onClose: () => void
  groupId: string
}

export function ShareModal({ isVisible, onClose, groupId }: ShareModalProps) {
  const shareUrl = `https://groupsingalong.com/group/${groupId}`

  const handleNativeShare = async () => {
    try {
      const result = await Share.share({
        message: `Join my group sing-along! Use code: ${groupId} or visit ${shareUrl}`,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
        title: 'Join Group Sing Along',
      })

      if (result.action === Share.sharedAction) {
        console.log('Shared successfully')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background overlay */}
      <Pressable
        className="flex-1 bg-black/30"
        onPress={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        {/* Modal content */}
        <View className="flex-1 items-center justify-center p-4">
          <Pressable
            className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <RocaText className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Share with friends and family!
            </RocaText>

            {/* Group Code */}
            <View className="items-center justify-center mb-6">
              <GaretText className="text-sm text-gray-600">
                Group Code:{' '}
                <GaretText className="text-violet-500 font-semibold">
                  {groupId}
                </GaretText>
              </GaretText>
            </View>

            {/* Share Options */}
            <View className="flex-row items-center justify-center gap-12 mb-6">
              {/* Native Share Button */}
              <View className="items-center gap-1">
                <Pressable
                  onPress={handleNativeShare}
                  className="w-32 h-32 rounded-full overflow-hidden shadow-lg active:opacity-80"
                >
                  <LinearGradient
                    colors={['#c084fc', '#d8b4fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full h-full items-center justify-center"
                  >
                    <GaretText className="text-white text-6xl">📤</GaretText>
                  </LinearGradient>
                </Pressable>
                <GaretText className="text-sm text-gray-600">Share</GaretText>
              </View>

              {/* QR Code */}
              <View className="items-center gap-1">
                <View className="bg-white p-2 rounded-lg">
                  <QRCode
                    value={shareUrl}
                    size={128}
                    color="#a78bfa"
                    backgroundColor="white"
                  />
                </View>
                <GaretText className="text-sm text-gray-600">Scan QR Code</GaretText>
              </View>
            </View>

            {/* Done Button */}
            <Pressable
              onPress={onClose}
              className="overflow-hidden rounded-md shadow-sm active:opacity-80"
            >
              <LinearGradient
                colors={['#c084fc', '#d8b4fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-3 items-center"
              >
                <GaretText className="text-white font-semibold">Done</GaretText>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}
