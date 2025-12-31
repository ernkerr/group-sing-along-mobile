import React from 'react'
import { View, Modal, Pressable, Share, Platform, ImageBackground, Image } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { useTheme } from '@/context/ThemeContext'

const texturedPurple = require('../../assets/texturedPurple.jpg')
const messageIcon = require('../../assets/message.png')

interface ShareModalProps {
  isVisible: boolean
  onClose: () => void
  groupId: string
}

export function ShareModal({ isVisible, onClose, groupId }: ShareModalProps) {
  const { colors } = useTheme()
  const shareUrl = `https://groupsingalong.com/group/${groupId}`

  const handleNativeShare = async () => {
    try {
      const result = await Share.share(
        Platform.OS === 'ios'
          ? {
              message: `Join my group sing-along! Use code: ${groupId}`,
              url: shareUrl,
            }
          : {
              message: `Join my group sing-along! Use code: ${groupId}\n${shareUrl}`,
            }
      )

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
      {/* Background with textured purple image */}
      <ImageBackground
        source={texturedPurple}
        className="flex-1"
        resizeMode="cover"
      >
        <Pressable
          className="flex-1"
          onPress={onClose}
        >
          {/* Modal content */}
          <View className="flex-1 items-center justify-center p-4">
            <Pressable
              className="w-full max-w-lg rounded-2xl p-6 shadow-xl"
              style={{ backgroundColor: 'white' }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Title */}
              <RocaText
                className="text-xl font-semibold mb-2 text-center"
                style={{ color: '#000' }}
              >
                Share with friends and family!
              </RocaText>

              {/* Group Code */}
              <View className="items-center justify-center mb-6">
                <GaretText className="text-sm" style={{ color: '#6b7280' }}>
                  Group Code:{' '}
                  <GaretText className="text-violet-500 font-semibold">
                    {groupId}
                  </GaretText>
                </GaretText>
              </View>

              {/* Share Options */}
              <View className="flex-row items-center justify-center gap-12 mb-6">
                {/* Native Share Button with Message Icon */}
                <View className="items-center gap-2">
                  <Pressable
                    onPress={handleNativeShare}
                    className="w-32 h-32 rounded-full items-center justify-center active:opacity-80"
                    style={{ backgroundColor: '#a78bfa' }}
                  >
                    <Image
                      source={messageIcon}
                      style={{ width: 64, height: 64, tintColor: 'white' }}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <GaretText className="text-sm font-medium" style={{ color: '#6b7280' }}>
                    Message
                  </GaretText>
                </View>

                {/* QR Code */}
                <View className="items-center gap-2">
                  <View className="p-2 rounded-lg" style={{ backgroundColor: 'white' }}>
                    <QRCode
                      value={shareUrl}
                      size={128}
                      color="#a78bfa"
                      backgroundColor="white"
                    />
                  </View>
                  <GaretText className="text-sm font-medium" style={{ color: '#6b7280' }}>
                    Scan QR Code
                  </GaretText>
                </View>
              </View>

              {/* Done Button */}
              <Pressable
                onPress={onClose}
                className="rounded-lg shadow-sm active:opacity-80 items-center py-3"
                style={{ backgroundColor: '#a78bfa' }}
              >
                <GaretText className="text-white font-semibold">Done</GaretText>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </ImageBackground>
    </Modal>
  )
}
