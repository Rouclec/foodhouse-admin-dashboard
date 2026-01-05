import React, { useContext } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, Icon, Button, Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ordersListSubscriptionPlansOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { buyerProductsStyles, defaultStyles } from '@/styles';
import { subscriptionCheckoutStyles } from '@/styles/subscription-checkout';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import i18n from '@/i18n';

export default function SubscriptionCheckout() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { user } = useContext(Context) as ContextType;

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

  if (isLoading) {
    return (
      <View style={[defaultStyles.flex, defaultStyles.center]}>
        <Chase size={32} color={Colors.primary[500]} />
      </View>
    );
  }

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
        style={[defaultStyles.container, { paddingHorizontal: 12, rowGap: 8 }]}
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
              {i18n.t('(subscription).(packageDetails).header')}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            style={subscriptionCheckoutStyles.content}
            showsVerticalScrollIndicator={false}>
            <View style={subscriptionCheckoutStyles.section}>
              <Text style={subscriptionCheckoutStyles.sectionTitle}> {i18n.t('(subscription).(packageDetails).order')}</Text>
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
                    {plan.subscriptionItems?.length || 0} Categories
                  </Text>
                </View>
                <View style={subscriptionCheckoutStyles.planDetail}>
                  <Icon
                    source="truck-delivery-outline"
                    size={16}
                    color={Colors.primary[500]}
                  />
                  <Text style={subscriptionCheckoutStyles.planDetailText}>
                    1 Free Delivery
                  </Text>
                </View>
              </View>
            </View>

            <View style={subscriptionCheckoutStyles.section}>
              <Text>
                {i18n.t('(subscription).(packageDetails).desc1')}{''}
                {plan.amount?.value?.toLocaleString()}{' '}
                {plan.amount?.currencyIsoCode} /{i18n.t('(subscription).(packageDetails).desc2')}
              </Text>
            </View>

            <Text style={subscriptionCheckoutStyles.sectionTitle}>
              {i18n.t('(subscription).(packageDetails).Categories')}
            </Text>

            {plan.subscriptionItems?.map((item, index) => (
              <View style={subscriptionCheckoutStyles.summaryRow}>
                <Text
                  key={index}
                  style={subscriptionCheckoutStyles.summaryLabel}>
                  {item.productName}
                </Text>
                <Text
                  key={item.productId}

                  style={subscriptionCheckoutStyles.summaryValue}>
                  {item.quantity}
                  {''} {item.unitType}
                </Text>
              </View>
            ))}

            <View style={subscriptionCheckoutStyles.deliveryNote}>
              <Text style={subscriptionCheckoutStyles.deliveryNoteText}>
                  {i18n.t('(subscription).(packageDetails).desc3')}
              </Text>
            </View>
            <View
              style={
                (defaultStyles.bottomButtonContainer, defaultStyles.actions)
              }>
              <Button
                mode="contained"
                style={[
                  defaultStyles.button,
                  defaultStyles.dangerButton,
                  buyerProductsStyles.halfButton,
                ]}
                onPress={() => {
                   router.push({
                    pathname: '/(payment)/subscription',
                    
                  })
                }}>
                   {i18n.t('(subscription).(packageDetails).btn1')}
              </Button>
              <Button
                mode="contained"
                style={[
                  defaultStyles.button,
                  defaultStyles.primaryButton,
                  buyerProductsStyles.halfButton,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/(payment)/subscription-checkout',
                    params: { planId: plan.id },
                  })
                }>
                {i18n.t('(subscription).(packageDetails).btn2')}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
