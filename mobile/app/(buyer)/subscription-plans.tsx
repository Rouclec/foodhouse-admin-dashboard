import React, { useContext } from 'react';
import {
  FlatList,
  ImageBackground,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';
import { defaultStyles } from '@/styles';
import { useQuery } from '@tanstack/react-query';
import {
  ordersListSubscriptionPlansOptions,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { ordersgrpcSubscription } from '@/client/orders.swagger';
import { Context, ContextType } from '@/app/_layout';
import {
  Card,
  Text,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { Feather } from '@expo/vector-icons';
import i18n from '@/i18n';

function isCustomSubscriptionPlan(plan?: ordersgrpcSubscription): boolean {
  const title = (plan?.title ?? '').trim();
  const description = plan?.description ?? '';
  return (
    title.toLowerCase() === 'custom subscription' &&
    description.startsWith('Custom subscription for user ')
  );
}

function getPlanDiscountPercent(plan?: ordersgrpcSubscription): number | null {
  const amount = plan?.amount?.value ?? 0;
  if (!amount || amount <= 0) return null;

  const base = (plan?.subscriptionItems ?? []).reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 0);
    const unit = item?.productUnitPrice?.value ?? 0;
    if (!Number.isFinite(qty) || !Number.isFinite(unit)) return sum;
    return sum + unit * qty;
  }, 0);

  if (!base || base <= 0) return null;
  if (amount >= base) return null;

  const pct = Math.round(((base - amount) / base) * 100);
  return pct >= 1 ? pct : null;
}

function getPlanDeliveryCount(plan?: ordersgrpcSubscription): number {
  const maxIndex = (plan?.subscriptionItems ?? []).reduce((max, item) => {
    const idx = item?.orderIndex ?? 0;
    return idx > max ? idx : max;
  }, 0);
  return Math.max(1, maxIndex + 1);
}

export default function SubscriptionPlans() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

  const {
    data: subscriptionPlansData,
    isLoading: isSubscriptionPlansLoading,
  } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: {
        userId: user?.userId ?? '',
      },
    }),
  });

  const handleCreateCustom = () => {
    router.push('/(buyer)/create-custom-subscription');
  };

  const visiblePlans = React.useMemo(() => {
    const plans = subscriptionPlansData?.subscriptionPlans ?? [];
    return plans.filter((p) => !isCustomSubscriptionPlan(p));
  }, [subscriptionPlansData?.subscriptionPlans]);

  if (isSubscriptionPlansLoading) {
    return (
      <SafeAreaView style={[defaultStyles.container, defaultStyles.center]}>
        <Chase size={56} color={Colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[defaultStyles.flex, { backgroundColor: Colors.light['bg'] }]}>
      {/* Fixed (non-scrollable) hero header */}
      <ImageBackground
        source={require('@/assets/images/background-overlay-image.png')}
        resizeMode="cover"
        style={{
          height: 220,
          paddingHorizontal: 16,
          paddingTop: 16,
          justifyContent: 'flex-end',
        }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
        />
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 16, left: 16, padding: 8 }}>
          <Feather name="arrow-left" size={24} color={Colors.light[10]} />
        </TouchableOpacity>

        <View style={{ paddingBottom: 16 }}>
          <Text
            variant="titleLarge"
            style={{ color: Colors.light[10], fontWeight: '800' }}>
            Subscription Plans
          </Text>
          <Text
            variant="bodyLarge"
            style={{ color: 'rgba(255,255,255,0.85)' }}>
            Pick a plan or build your own.
          </Text>
        </View>
      </ImageBackground>

      <FlatList
        data={visiblePlans}
        keyExtractor={(item, index) => item?.id ?? index.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            {/* Custom plan CTA */}
            <TouchableOpacity onPress={handleCreateCustom} activeOpacity={0.9}>
              <Card
                style={{
                  marginTop: -28,
                  marginBottom: 16,
                  backgroundColor: Colors.light[10],
                  borderWidth: 1.5,
                  borderColor: Colors.primary[500],
                }}>
                <Card.Content>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="titleMedium"
                        style={{ color: Colors.primary[500] }}>
                        Create a custom plan
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                        Choose your budget and we’ll split it into deliveries.
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={22}
                      color={Colors.primary[500]}
                    />
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Available plans
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={defaultStyles.noItemsContainer}>
            <Text style={defaultStyles.noItems}>No subscription plans</Text>
          </View>
        }
        renderItem={({ item }) => {
          const plan = item as ordersgrpcSubscription;
          const discountPct = getPlanDiscountPercent(plan);
          const productsCount = plan?.subscriptionItems?.length ?? 0;
          const deliveriesCount = getPlanDeliveryCount(plan);

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/(buyer)/subscription-plan-details',
                  params: { planId: plan?.id },
                })
              }>
              <Card
                style={{
                  marginBottom: 12,
                  backgroundColor: Colors.light[10],
                  borderWidth: 1,
                  borderColor: Colors.grey['f8'],
                }}>
                <Card.Content>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}>
                    <Text
                      variant="titleMedium"
                      style={{ flex: 1 }}
                      numberOfLines={1}>
                      {plan?.title ?? 'Plan'}
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={22}
                      color={Colors.dark[10]}
                    />
                  </View>

                  <Text
                    variant="bodySmall"
                    style={{ color: Colors.light['10.87'], marginTop: 4 }}
                    numberOfLines={2}>
                    Up to {productsCount} product{productsCount === 1 ? '' : 's'} •{' '}
                    {deliveriesCount} deliver
                    {deliveriesCount === 1 ? 'y' : 'ies'}
                    {plan?.duration ? ` • ${plan.duration} weeks` : ''}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 12,
                    }}>
                    <Text
                      variant="titleLarge"
                      style={{ color: Colors.primary[500] }}>
                      {plan?.amount?.currencyIsoCode ?? 'XAF'}{' '}
                      {(plan?.amount?.value ?? 0).toLocaleString()}
                    </Text>

                    {discountPct !== null && (
                      <View
                        style={{
                          backgroundColor: Colors.primary[50],
                          borderColor: Colors.primary[500],
                          borderWidth: 1,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                        }}>
                        <Text
                          variant="bodySmall"
                          style={{
                            color: Colors.primary[500],
                            fontWeight: '800',
                          }}>
                          Save {discountPct}%
                        </Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

