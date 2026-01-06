import React, { useState } from 'react'
import { View, Modal, Pressable, ScrollView, Platform } from 'react-native'
import { X } from 'lucide-react-native'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BuyButton } from '@/components/BuyButton'
import { useTheme } from '@/context/ThemeContext'
import { SubscriptionTier, SubscriptionPeriod, PRICING_TIERS } from '@/types/subscription'

interface PaywallModalProps {
  visible: boolean
  onClose: () => void
  currentMemberCount: number
  userRole: 'host' | 'singer'
}

export function PaywallModal({ visible, onClose, currentMemberCount, userRole }: PaywallModalProps) {
  const { colors } = useTheme()
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(SubscriptionTier.PLUS)
  const [selectedPeriods, setSelectedPeriods] = useState<Record<string, SubscriptionPeriod>>({
    [SubscriptionTier.PLUS]: SubscriptionPeriod.YEARLY,
    [SubscriptionTier.PARTY]: SubscriptionPeriod.YEARLY,
  })

  const handlePeriodToggle = (tier: SubscriptionTier, period: SubscriptionPeriod) => {
    setSelectedPeriods(prev => ({ ...prev, [tier]: period }))
  }

  const paidTiers = PRICING_TIERS.filter(t => t.tier !== SubscriptionTier.FREE)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="items-center justify-center p-4"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              className="w-full max-w-2xl rounded-2xl p-6"
              style={{ backgroundColor: colors.card }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <Pressable
                onPress={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.muted }}
              >
                <X size={20} color={colors.mutedForeground} />
              </Pressable>

              {/* Title */}
              <RocaText
                className="text-2xl font-bold mb-2 text-center"
                style={{ color: colors.foreground }}
              >
                Keep everyone in sync
              </RocaText>

              {/* Body */}
              <GaretText
                className="text-base mb-6 text-center"
                style={{ color: colors.mutedForeground }}
              >
                Free groups support up to 3 people. Bigger groups need one host controlling the song so no one gets lost.
              </GaretText>

              {userRole === 'singer' ? (
                /* Singer view: Ask host to upgrade */
                <View className="items-center py-8">
                  <GaretText
                    className="text-lg font-semibold mb-4 text-center"
                    style={{ color: colors.foreground }}
                  >
                    Ask the host to upgrade
                  </GaretText>
                  <GaretText
                    className="text-sm text-center"
                    style={{ color: colors.mutedForeground }}
                  >
                    Only the host can upgrade the group. Let them know you'd like to join!
                  </GaretText>
                </View>
              ) : (
                /* Host view: Show pricing tiers */
                <>
                  {paidTiers.map((tier) => {
                    const isSelected = selectedTier === tier.tier
                    const selectedPeriod = selectedPeriods[tier.tier] || SubscriptionPeriod.YEARLY
                    const price = selectedPeriod === SubscriptionPeriod.YEARLY ? tier.yearlyPrice : tier.monthlyPrice

                    return (
                      <Pressable
                        key={tier.tier}
                        onPress={() => setSelectedTier(tier.tier)}
                        className="mb-4"
                      >
                        <View
                          style={
                            isSelected
                              ? {
                                  borderWidth: 2,
                                  borderColor: '#A68BF7',
                                  borderRadius: 8,
                                  ...Platform.select({
                                    ios: {
                                      shadowColor: '#A68BF7',
                                      shadowOffset: { width: 0, height: 4 },
                                      shadowOpacity: 0.3,
                                      shadowRadius: 8,
                                    },
                                    android: {
                                      elevation: 8,
                                    },
                                  }),
                                }
                              : {}
                          }
                        >
                          <Card className="p-4">
                          {/* Most Popular badge */}
                          {tier.isPopular && (
                            <View
                              className="absolute -top-3 right-4 px-3 py-1 rounded-full"
                              style={{ backgroundColor: '#A68BF7' }}
                            >
                              <GaretText className="text-white text-xs font-semibold">
                                Most Popular
                              </GaretText>
                            </View>
                          )}

                          {/* Tier name & emoji */}
                          <View className="flex-row items-center mb-2">
                            <GaretText className="text-3xl mr-2">{tier.emoji}</GaretText>
                            <RocaText
                              className="text-xl font-bold"
                              style={{ color: colors.foreground }}
                            >
                              {tier.name}
                            </RocaText>
                          </View>

                          {/* Monthly/Yearly tabs */}
                          <View className="flex-row mb-3 p-1 rounded-lg" style={{ backgroundColor: colors.muted }}>
                            <Pressable
                              onPress={() => handlePeriodToggle(tier.tier, SubscriptionPeriod.MONTHLY)}
                              className="flex-1 py-2 rounded-md"
                              style={{
                                backgroundColor: selectedPeriod === SubscriptionPeriod.MONTHLY ? colors.card : 'transparent',
                              }}
                            >
                              <GaretText
                                className="text-center text-sm font-semibold"
                                style={{
                                  color: selectedPeriod === SubscriptionPeriod.MONTHLY ? colors.foreground : colors.mutedForeground,
                                }}
                              >
                                Monthly
                              </GaretText>
                            </Pressable>
                            <Pressable
                              onPress={() => handlePeriodToggle(tier.tier, SubscriptionPeriod.YEARLY)}
                              className="flex-1 py-2 rounded-md"
                              style={{
                                backgroundColor: selectedPeriod === SubscriptionPeriod.YEARLY ? colors.card : 'transparent',
                              }}
                            >
                              <View>
                                <GaretText
                                  className="text-center text-sm font-semibold"
                                  style={{
                                    color: selectedPeriod === SubscriptionPeriod.YEARLY ? colors.foreground : colors.mutedForeground,
                                  }}
                                >
                                  Yearly
                                </GaretText>
                                {selectedPeriod === SubscriptionPeriod.YEARLY && (
                                  <GaretText className="text-center text-xs" style={{ color: '#A68BF7' }}>
                                    Best value
                                  </GaretText>
                                )}
                              </View>
                            </Pressable>
                          </View>

                          {/* Price */}
                          <GaretText className="text-2xl font-bold mb-2" style={{ color: colors.foreground }}>
                            ${price}
                            <GaretText className="text-base" style={{ color: colors.mutedForeground }}>
                              {selectedPeriod === SubscriptionPeriod.YEARLY ? ' / year' : ' / month'}
                            </GaretText>
                          </GaretText>

                          {/* Value statement */}
                          <GaretText className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
                            {tier.valueStatement}
                          </GaretText>

                          {/* Features */}
                          {tier.features.map((feature, index) => (
                            <View key={index} className="flex-row items-center mb-2">
                              <GaretText className="mr-2" style={{ color: '#A68BF7' }}>✓</GaretText>
                              <GaretText className="text-sm" style={{ color: colors.foreground }}>
                                {feature}
                              </GaretText>
                            </View>
                          ))}

                          {/* Buy button - only show for selected tier */}
                          {isSelected && (
                            <View className="mt-4">
                              <BuyButton
                                tier={tier.tier}
                                period={selectedPeriod}
                                onSuccess={onClose}
                                variant="gradient"
                                size="lg"
                              />
                            </View>
                          )}
                        </Card>
                        </View>
                      </Pressable>
                    )
                  })}
                </>
              )}

              {/* Footer */}
              <GaretText
                className="text-sm text-center mt-4"
                style={{ color: colors.mutedForeground }}
              >
                Only one person needs Plus — everyone else joins free.
              </GaretText>

              {/* Not now button */}
              {userRole === 'host' && (
                <Button
                  onPress={onClose}
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                >
                  <GaretText className="text-sm" style={{ color: colors.mutedForeground }}>
                    Not now
                  </GaretText>
                </Button>
              )}
            </Pressable>
          </ScrollView>
        </Pressable>
      </View>
    </Modal>
  )
}
