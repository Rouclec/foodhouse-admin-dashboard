import React, { useContext, useMemo } from 'react';
import { FlatList, ImageBackground, SafeAreaView, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, Button, Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { Colors } from '@/constants';
import { defaultStyles } from '@/styles';
import { Context, ContextType } from '@/app/_layout';
import {
  ordersListSubscriptionPlansOptions,
  ordersSubscribeMutation,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { ordersgrpcSubscription, ordersgrpcSubscriptionItem } from '@/client/orders.swagger';
import { RelativePathString } from 'expo-router';

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

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getFirstDeliveryDate(now: Date) {
  const today = startOfDay(now);
  const day = today.getDay(); // 0=Sun ... 6=Sat
  const daysUntilSaturday = (6 - day + 7) % 7;
  const comingSaturday = addDays(today, daysUntilSaturday);
  const firstDelivery = daysUntilSaturday <= 3 ? comingSaturday : addDays(comingSaturday, 7);
  return { firstDelivery, daysUntilSaturday };
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function groupItemsByDelivery(items: ordersgrpcSubscriptionItem[]) {
  const groups = new Map<number, ordersgrpcSubscriptionItem[]>();
  for (const item of items) {
    const idx = item?.orderIndex ?? 0;
    const arr = groups.get(idx) ?? [];
    arr.push(item);
    groups.set(idx, arr);
  }
  const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  return sorted.map(([orderIndex, groupItems]) => ({ orderIndex, items: groupItems }));
}

export default function SubscriptionPlanDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, deliveryLocation, setPaymentData } = useContext(Context) as ContextType;
  const planId = (params.planId as string | undefined) ?? '';

  const { data, isLoading } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: { userId: user?.userId ?? '' },
    }),
    enabled: !!user?.userId,
  });

  const plan = useMemo(() => {
    const plans = data?.subscriptionPlans ?? [];
    return plans.find(p => p?.id === planId) as ordersgrpcSubscription | undefined;
  }, [data?.subscriptionPlans, planId]);

  const discountPct = useMemo(() => getPlanDiscountPercent(plan), [plan]);
  const deliveryGroups = useMemo(() => groupItemsByDelivery(plan?.subscriptionItems ?? []), [plan?.subscriptionItems]);
  const { firstDelivery, daysUntilSaturday } = useMemo(() => getFirstDeliveryDate(new Date()), []);

  const { mutateAsync: subscribe, isPending: isSubscribing } = useMutation({
    ...ordersSubscribeMutation(),
  });

  const handleSubscribe = async () => {
    if (!plan?.id) return;
    if (!deliveryLocation?.region) {
      router.push('/(buyer)/(order)/select-pickup-point');
      return;
    }
    try {
      const result = await subscribe({
        body: {
          subscriptionPlanId: plan.id,
          deliveryLocation: {
            lon: deliveryLocation.region.longitude,
            lat: deliveryLocation.region.latitude,
            address: deliveryLocation.address || deliveryLocation.description,
          },
        },
        path: { userId: user?.userId ?? '' },
      });

      const publicId = result?.subscription?.publicId ?? '';
      if (!publicId) return;

      setPaymentData({
        entity: 'PaymentEntity_SUBSCRIPTION',
        entityId: publicId,
        nextScreen: '/(buyer)/(index)' as RelativePathString,
        amount: result?.subscription?.amount ?? plan?.amount,
      });
      router.push('/(payment)');
    } catch (e) {
      console.error('Error subscribing:', e);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[defaultStyles.container, defaultStyles.center]}>
        <Text>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={[defaultStyles.container, defaultStyles.center]}>
        <Text>Plan not found.</Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 12 }}>
          Go back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[defaultStyles.flex, { backgroundColor: Colors.light['bg'] }]}>
      <ImageBackground
        source={require('@/assets/images/background-overlay-image.png')}
        resizeMode="cover"
        style={{
          height: 200,
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
          <Text variant="titleLarge" style={{ color: Colors.light[10], fontWeight: '800' }} numberOfLines={2}>
            {plan.title ?? 'Subscription plan'}
          </Text>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={2}>
            {plan.description ?? ''}
          </Text>
        </View>
      </ImageBackground>

      <FlatList
        data={deliveryGroups}
        keyExtractor={(g) => String(g.orderIndex)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            <Card style={{ marginTop: -24, marginBottom: 16, backgroundColor: Colors.light[10] }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleLarge" style={{ color: Colors.primary[500] }}>
                      {plan.amount?.currencyIsoCode ?? 'XAF'} {(plan.amount?.value ?? 0).toLocaleString()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: Colors.light['10.87'] }}>
                      {discountPct !== null ? `Save ${discountPct}% • ` : ''}
                      {plan.duration ? `${plan.duration} weeks • ` : ''}
                      {deliveryGroups.length} deliver{deliveryGroups.length === 1 ? 'y' : 'ies'}
                    </Text>
                  </View>
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
                      <Text variant="bodySmall" style={{ color: Colors.primary[500], fontWeight: '800' }}>
                        -{discountPct}%
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>

            <Card style={{ marginBottom: 16, backgroundColor: Colors.light[10] }}>
              <Card.Content>
                <Text variant="titleMedium">Delivery schedule</Text>
                <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                  Rule: if there are 3 days or less until Saturday, your first delivery is this Saturday; otherwise it’s next Saturday.
                </Text>
                <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 8 }}>
                  Today → Saturday in {daysUntilSaturday} day{daysUntilSaturday === 1 ? '' : 's'} • First delivery:{' '}
                  {formatShortDate(firstDelivery)}
                </Text>
              </Card.Content>
            </Card>

            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              What you’ll receive
            </Text>
          </>
        }
        renderItem={({ item }) => {
          const deliveryDate = addDays(firstDelivery, item.orderIndex * 7);
          return (
            <Card style={{ marginBottom: 12, backgroundColor: Colors.light[10] }}>
              <Card.Content>
                <Text variant="titleMedium">
                  Delivery #{item.orderIndex + 1} • {formatShortDate(deliveryDate)}
                </Text>
                <View style={{ marginTop: 8 }}>
                  {item.items.map((it, idx) => (
                    <View key={`${it.productId ?? ''}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                      <Text variant="bodySmall" style={{ flex: 1 }}>
                        {it.productName ?? 'Product'}
                      </Text>
                      <Text variant="bodySmall" style={{ color: Colors.light['10.87'] }}>
                        x{it.quantity ?? '0'}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListFooterComponent={
          <>
            <Card style={{ marginBottom: 12, backgroundColor: Colors.light[10] }}>
              <Card.Content>
                <Text variant="titleMedium">Pickup point</Text>
                <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                  {deliveryLocation?.description
                    ? `${deliveryLocation.description}${deliveryLocation.address ? ` • ${deliveryLocation.address}` : ''}`
                    : 'Choose where you want your deliveries to arrive.'}
                </Text>
                <Button
                  mode="outlined"
                  style={{ marginTop: 10, borderRadius: 12 }}
                  textColor={Colors.primary[500]}
                  onPress={() => router.push('/(buyer)/(order)/select-pickup-point')}>
                  {deliveryLocation?.description ? 'Change pickup point' : 'Select pickup point'}
                </Button>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              buttonColor={Colors.primary[500]}
              style={{ borderRadius: 12, marginTop: 8 }}
              loading={isSubscribing}
              disabled={isSubscribing || !deliveryLocation?.region}
              onPress={handleSubscribe}>
              Subscribe & Pay
            </Button>
          </>
        }
      />
    </SafeAreaView>
  );
}


