import React, { useState } from 'react'
import { View, ScrollView, SafeAreaView, Pressable, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BuyButton } from '@/components/BuyButton'
import { RestoreButton } from '@/components/RestoreButton'
import { useTheme } from '@/context/ThemeContext'
import { SubscriptionTier, SubscriptionPeriod, PRICING_TIERS } from '@/types/subscription'

export default function PricingScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(SubscriptionTier.PLUS)
  const [selectedPeriods, setSelectedPeriods] = useState<Record<string, SubscriptionPeriod>>({
    [SubscriptionTier.PLUS]: SubscriptionPeriod.YEARLY,
    [SubscriptionTier.PARTY]: SubscriptionPeriod.YEARLY,
  })

  const handlePeriodToggle = (tier: SubscriptionTier, period: SubscriptionPeriod) => {
    setSelectedPeriods(prev => ({ ...prev, [tier]: period }))
  }

  const handleSuccess = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-8">
          <RocaText
            className="text-3xl font-bold text-center mb-2"
            style={{ color: colors.foreground }}
          >
            Sing together. No confusion.
          </RocaText>
          <GaretText
            className="text-base text-center"
            style={{ color: colors.mutedForeground }}
          >
            One person controls the song.{'\n'}
            Everyone stays in sync — instantly.
          </GaretText>
        </View>

        {/* Pricing tiers */}
        {PRICING_TIERS.map((tier) => {
          const isSelected = selectedTier === tier.tier
          const selectedPeriod = tier.tier !== SubscriptionTier.FREE
            ? (selectedPeriods[tier.tier] || SubscriptionPeriod.MONTHLY)
            : null
          const price = selectedPeriod === SubscriptionPeriod.YEARLY ? tier.yearlyPrice : tier.monthlyPrice

          return (
            <Pressable
              key={tier.tier}
              onPress={() => tier.tier !== SubscriptionTier.FREE && setSelectedTier(tier.tier)}
              className="mb-4"
            >
              <Card
                className="p-6"
                style={
                  isSelected && tier.tier !== SubscriptionTier.FREE
                    ? {
                        borderWidth: 2,
                        borderColor: '#A68BF7',
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
                  <GaretText className="text-4xl mr-3">{tier.emoji}</GaretText>
                  <RocaText
                    className="text-2xl font-bold"
                    style={{ color: colors.foreground }}
                  >
                    {tier.name}
                  </RocaText>
                </View>

                {/* Monthly/Yearly tabs for paid tiers */}
                {tier.tier !== SubscriptionTier.FREE && tier.monthlyPrice && tier.yearlyPrice && (
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
                )}

                {/* Price */}
                {tier.tier !== SubscriptionTier.FREE && price && (
                  <GaretText className="text-3xl font-bold mb-2" style={{ color: colors.foreground }}>
                    ${price}
                    <GaretText className="text-lg" style={{ color: colors.mutedForeground }}>
                      {selectedPeriod === SubscriptionPeriod.YEARLY ? ' / year' : ' / month'}
                    </GaretText>
                  </GaretText>
                )}

                {/* Value statement */}
                <GaretText className="text-base mb-4" style={{ color: colors.mutedForeground }}>
                  {tier.valueStatement}
                </GaretText>

                {/* Features */}
                {tier.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <GaretText className="mr-2" style={{ color: '#A68BF7' }}>✓</GaretText>
                    <GaretText className="text-base" style={{ color: colors.foreground }}>
                      {feature}
                    </GaretText>
                  </View>
                ))}

                {/* CTA button */}
                <View className="mt-4">
                  {tier.tier === SubscriptionTier.FREE ? (
                    <Button variant="outline" onPress={() => navigation.goBack()}>
                      <GaretText className="font-semibold">Start singing</GaretText>
                    </Button>
                  ) : selectedPeriod ? (
                    <BuyButton
                      tier={tier.tier}
                      period={selectedPeriod}
                      onSuccess={handleSuccess}
                      variant="gradient"
                      size="lg"
                    />
                  ) : null}
                </View>
              </Card>
            </Pressable>
          )
        })}

        {/* Event Pass section */}
        <View className="mt-6 mb-4">
          <Card className="p-6" style={{ backgroundColor: colors.card }}>
            <GaretText
              className="text-lg font-semibold mb-2"
              style={{ color: colors.foreground }}
            >
              Hosting a one-time event?
            </GaretText>
            <GaretText
              className="text-base mb-1"
              style={{ color: colors.foreground }}
            >
              <GaretText className="font-bold">$3.99</GaretText> — 24-hour pass (up to 25 people)
            </GaretText>
            <GaretText
              className="text-sm mb-4"
              style={{ color: colors.mutedForeground }}
            >
              Perfect for holidays & parties
            </GaretText>
            <BuyButton
              tier={SubscriptionTier.EVENT}
              period={SubscriptionPeriod.ONCE}
              onSuccess={handleSuccess}
              variant="gradient"
              size="lg"
            />
          </Card>
        </View>

        {/* Footer */}
        <GaretText
          className="text-sm text-center mb-4"
          style={{ color: colors.mutedForeground }}
        >
          No ads. No spam.{'\n'}
          Cancel anytime.
        </GaretText>

        {/* Restore button */}
        <View className="mb-8">
          <RestoreButton onSuccess={handleSuccess} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
