import React, { useContext } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, Icon, Button, Appbar } from 'react-native-paper';
import {
  useRouter,
  useLocalSearchParams,
  RelativePathString,
} from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ordersListSubscriptionPlansOptions,
  ordersSubscribeMutation,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { defaultStyles } from '@/styles';
import { subscriptionCheckoutStyles } from '@/styles/subscription-checkout';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { typesAmount } from '@/client/orders.swagger';
import i18n from '@/i18n';

export default function SubscriptionCheckout() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { user, setPaymentData, deliveryLocation } = useContext(Context) as ContextType;

  const { data: subscriptionPlansData, isLoading } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: {
        userId: user?.userId ?? '',
      },
    }),
  });

  const plan = subscriptionPlansData?.subscriptionPlans?.find(
    p => p.id === planId,
  );

  const { mutateAsync: subscribe, isPending: isSubscribing } = useMutation({
    ...ordersSubscribeMutation(),
  });

  if (isLoading) {
    return (
      <View style={[defaultStyles.flex, defaultStyles.center]}>
        <Chase size={32} color={Colors.primary[500]} />
      </View>
    );
  }

  const handleSubscribe = async () => {
    if (!plan?.id) return;
    try {
      const result = await subscribe({
        body: {
          subscriptionPlanId: plan.id,
          deliveryLocation: {
            lon: deliveryLocation?.region?.longitude || 0,
            lat: deliveryLocation?.region?.latitude || 0,
            address: deliveryLocation?.description || deliveryLocation?.address || user?.address || '6140 Sunbrook Park, PC 5679',
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
        amount: (result?.subscription?.amount ?? plan?.amount) as typesAmount,
      });
      router.push('/(payment)');
    } catch (e) {
      console.error('Error subscribing:', e);
    }
  };

  if (!plan) {
    return (
      <View style={[defaultStyles.flex, defaultStyles.center]}>
        <Text>Plan not found</Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={[defaultStyles.container, { paddingHorizontal: 8, rowGap: 8 }]}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={[defaultStyles.flex, defaultStyles.relativeContainer]}>
          <Appbar.Header
            dark={false}
            style={[defaultStyles.appHeader, defaultStyles.px12]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(subscription).(order).checkout')}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            style={subscriptionCheckoutStyles.content}
            showsVerticalScrollIndicator={false}>
            <View style={subscriptionCheckoutStyles.section}>
              <Text style={subscriptionCheckoutStyles.sectionTitle}>
                {i18n.t('(subscription).(order).order')}
              </Text>
              <View style={subscriptionCheckoutStyles.planCard}>
                <View style={subscriptionCheckoutStyles.planBadge}>
                  <Text style={subscriptionCheckoutStyles.planBadgeText}>
                    {'10% off'}
                  </Text>
                </View>
                <View style={subscriptionCheckoutStyles.summaryRow}>
                  <Text style={subscriptionCheckoutStyles.planTitle}>
                    {plan.title}
                  </Text>
                  <Text style={subscriptionCheckoutStyles.planPrice}>
                    {plan.amount?.value?.toLocaleString()}{' '}
                    {plan.amount?.currencyIsoCode}
                  </Text>
                </View>

                <View style={subscriptionCheckoutStyles.planDetail}>
                  <Icon source="check" size={16} color={Colors.primary[500]} />
                  <Text style={subscriptionCheckoutStyles.planDetailText}>
                    {plan.subscriptionItems?.length || 0} Products
                  </Text>
                </View>
                <View style={subscriptionCheckoutStyles.planDetail}>
                  <Icon
                    source="truck-delivery-outline"
                    size={16}
                    color={Colors.primary[500]}
                  />
                  <Text style={subscriptionCheckoutStyles.planDetailText}>
                    {i18n.t('(subscription).(order).freeDelivery')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={subscriptionCheckoutStyles.section}>
              <Text style={subscriptionCheckoutStyles.sectionTitle}>
                {i18n.t('(subscription).(order).Address')}
              </Text>
              <View style={subscriptionCheckoutStyles.addressCard}>
                <View style={subscriptionCheckoutStyles.addressIcon}>
                  <Icon source="home" size={20} color={Colors.light[10]} />
                </View>
                <View style={subscriptionCheckoutStyles.addressText}>
                  <Text style={subscriptionCheckoutStyles.addressTitle}>
                    {i18n.t('(subscription).(order).Home')}
                  </Text>
                  <Text style={subscriptionCheckoutStyles.addressSubtitle}>
                    {deliveryLocation?.description || deliveryLocation?.address || user?.address || '6140 Sunbrook Park, PC 5679'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(buyer)/(order)' as any,
                      params: { returnTo: '__BACK__' },
                    } as any)
                  }>
                  <Icon source="pencil" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={subscriptionCheckoutStyles.deliveryNote}>
              <Text style={subscriptionCheckoutStyles.deliveryNoteText}>
                {i18n.t('(subscription).(order).Desc1')}{' '}
                {plan.estimatedDeliveryTimeDays || 10}{' '}
                {i18n.t('(subscription).(order).desc2')}
              </Text>
            </View>

            <View style={subscriptionCheckoutStyles.section}>
              <View style={subscriptionCheckoutStyles.summaryRow}>
                <Text style={subscriptionCheckoutStyles.summaryLabel}>
                  {i18n.t('(subscription).(order).Amount')}
                </Text>
                <Text style={subscriptionCheckoutStyles.summaryValue}>
                  {plan.amount?.value?.toLocaleString()}{' '}
                  {plan.amount?.currencyIsoCode}
                </Text>
              </View>
              <View style={subscriptionCheckoutStyles.summaryRow}>
                <Text style={subscriptionCheckoutStyles.summaryLabel}>
                  {i18n.t('(subscription).(order).Delivery')}
                </Text>
                <Text style={subscriptionCheckoutStyles.summaryValue}>
                  {i18n.t('(subscription).(order).Free')}
                </Text>
              </View>
              <View style={subscriptionCheckoutStyles.summaryRow}>
                <Text style={subscriptionCheckoutStyles.summaryLabel}>
                  {i18n.t('(subscription).(order).TransactionCharges')}
                </Text>
                <Text style={subscriptionCheckoutStyles.summaryValue}>
                  {i18n.t('(subscription).(order).Free')}
                </Text>
              </View>
              <View style={subscriptionCheckoutStyles.summaryRow}>
                <Text style={subscriptionCheckoutStyles.summaryLabel}>
                  {i18n.t('(subscription).(order).ServiceFees')}
                </Text>
                <Text style={subscriptionCheckoutStyles.summaryValue}>
                  {i18n.t('(subscription).(order).Free')}
                </Text>
              </View>
              <View style={subscriptionCheckoutStyles.totalRow}>
                <Text style={subscriptionCheckoutStyles.totalLabel}>
                  {' '}
                  {i18n.t('(subscription).(order).total')}
                </Text>
                <Text style={subscriptionCheckoutStyles.totalValue}>
                  {plan.amount?.value?.toLocaleString()}{' '}
                  {plan.amount?.currencyIsoCode}
                </Text>
              </View>
            </View>
          </ScrollView>
          <View style={defaultStyles.bottomButtonContainer}>
            <Button
              mode="contained"
              style={[defaultStyles.button, defaultStyles.primaryButton, isSubscribing && defaultStyles.greyButton]}
              onPress={handleSubscribe}
              loading={isSubscribing}
              disabled={isSubscribing}>
              {i18n.t('(subscription).(order).btn1')}
            </Button>
          </View>
        </View>
        {/* </View> */}
      </KeyboardAvoidingView>
    </>
  );
}
