import React, { useState } from 'react'
import { View, ScrollView, SafeAreaView, Pressable, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { X } from 'lucide-react-native'
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

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12
    const savings = Math.round(((monthlyCost - yearlyPrice) / monthlyCost) * 100)
    return savings
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Close button - top right */}
      <View className="flex-row justify-end px-4 pt-2">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <X size={24} color={colors.foreground} />
        </Pressable>
      </View>

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
              <View
                style={
                  isSelected && tier.tier !== SubscriptionTier.FREE
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
                <Card className="p-6">
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

                {/* Tier name */}
                <View className="mb-3">
                  <RocaText
                    className="text-3xl font-bold"
                    style={{ color: colors.foreground }}
                  >
                    {tier.name}
                  </RocaText>
                  <GaretText className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                    {tier.valueStatement}
                  </GaretText>
                </View>

                {/* Monthly/Yearly toggle for paid tiers */}
                {tier.tier !== SubscriptionTier.FREE && tier.monthlyPrice && tier.yearlyPrice && (
                  <View className="mb-3">
                    <View
                      className="flex-row p-1 rounded-lg"
                      style={{
                        backgroundColor: colors.muted,
                        borderWidth: 1,
                        borderColor: colors.border
                      }}
                    >
                      <Pressable
                        onPress={() => handlePeriodToggle(tier.tier, SubscriptionPeriod.MONTHLY)}
                        className="flex-1 py-3 rounded-md"
                        style={[
                          {
                            backgroundColor: selectedPeriod === SubscriptionPeriod.MONTHLY
                              ? colors.card : 'transparent',
                          },
                          selectedPeriod === SubscriptionPeriod.MONTHLY && Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                            },
                            android: {
                              elevation: 2,
                            },
                          }),
                        ]}
                      >
                        <GaretText
                          className="text-center text-sm font-semibold"
                          style={{
                            color: selectedPeriod === SubscriptionPeriod.MONTHLY
                              ? colors.foreground : colors.mutedForeground,
                          }}
                        >
                          Monthly
                        </GaretText>
                      </Pressable>

                      <Pressable
                        onPress={() => handlePeriodToggle(tier.tier, SubscriptionPeriod.YEARLY)}
                        className="flex-1 py-3 rounded-md"
                        style={[
                          {
                            backgroundColor: selectedPeriod === SubscriptionPeriod.YEARLY
                              ? colors.card : 'transparent',
                          },
                          selectedPeriod === SubscriptionPeriod.YEARLY && Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                            },
                            android: {
                              elevation: 2,
                            },
                          }),
                        ]}
                      >
                        <GaretText
                          className="text-center text-sm font-semibold"
                          style={{
                            color: selectedPeriod === SubscriptionPeriod.YEARLY
                              ? colors.foreground : colors.mutedForeground,
                          }}
                        >
                          Yearly
                        </GaretText>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Price */}
                {tier.tier !== SubscriptionTier.FREE && price && tier.monthlyPrice && tier.yearlyPrice && (
                  <View className="mb-4">
                    <View className="flex-row items-baseline">
                      <GaretText className="text-4xl font-bold" style={{ color: colors.foreground }}>
                        ${price}
                      </GaretText>
                      <GaretText className="text-lg ml-1" style={{ color: colors.mutedForeground }}>
                        {selectedPeriod === SubscriptionPeriod.YEARLY ? '/year' : '/month'}
                      </GaretText>
                    </View>
                    {selectedPeriod === SubscriptionPeriod.YEARLY && (
                      <View className="flex-row items-center mt-1">
                        <View
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          <GaretText className="text-white text-xs font-semibold">
                            Save {calculateSavings(tier.monthlyPrice, tier.yearlyPrice)}%
                          </GaretText>
                        </View>
                        <GaretText className="text-sm ml-2" style={{ color: colors.mutedForeground }}>
                          ${(tier.monthlyPrice * 12 - tier.yearlyPrice).toFixed(2)} vs monthly
                        </GaretText>
                      </View>
                    )}
                  </View>
                )}

                {tier.tier === SubscriptionTier.FREE && (
                  <View className="mb-4">
                    <GaretText className="text-4xl font-bold" style={{ color: colors.foreground }}>
                      Free
                    </GaretText>
                  </View>
                )}

                {/* Features */}
                <View className="mb-4">
                  {tier.features.map((feature, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <View
                        className="mt-1 mr-2"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: '#A68BF7',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <GaretText className="text-white text-xs font-bold">✓</GaretText>
                      </View>
                      <GaretText className="text-base flex-1" style={{ color: colors.foreground }}>
                        {feature}
                      </GaretText>
                    </View>
                  ))}
                </View>

                {/* CTA button */}
                <View>
                  {tier.tier === SubscriptionTier.FREE ? (
                    <Button variant="default" onPress={() => navigation.goBack()}>
                      <GaretText className="font-semibold" style={{ color: colors.primaryForeground }}>
                        Start singing
                      </GaretText>
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
              </View>
            </Pressable>
          )
        })}

        {/* Event Pass section */}
        <View className="mt-6 mb-4">
          <Card className="p-6">
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
