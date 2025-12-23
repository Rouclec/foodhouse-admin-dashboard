import React, { useContext } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Icon, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ordersListSubscriptionPlansOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { defaultStyles } from '@/styles';
import { subscriptionCheckoutStyles } from '@/styles/subscription-checkout';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';

export default function SubscriptionCheckout() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { user } = useContext(Context) as ContextType;

  const { data: subscriptionPlansData, isLoading } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: {
        adminUserId: user?.userId ?? '',
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
    <View style={subscriptionCheckoutStyles.container}>
      <View style={subscriptionCheckoutStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon source="arrow-left" size={24} color={Colors.dark[10]} />
        </TouchableOpacity>
        <Text style={subscriptionCheckoutStyles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView
        style={subscriptionCheckoutStyles.content}
        showsVerticalScrollIndicator={false}>
        <View style={subscriptionCheckoutStyles.section}>
          <Text style={subscriptionCheckoutStyles.sectionTitle}>Order</Text>
          <View style={subscriptionCheckoutStyles.planCard}>
            <View style={subscriptionCheckoutStyles.planBadge}>
              <Text style={subscriptionCheckoutStyles.planBadgeText}>
                {plan.description || '10% off'}
              </Text>
            </View>
            <Text style={subscriptionCheckoutStyles.planTitle}>
              {plan.title}
            </Text>
            <Text style={subscriptionCheckoutStyles.planPrice}>
              {plan.amount?.value?.toLocaleString()}{' '}
              {plan.amount?.currencyIsoCode}
            </Text>
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
          <Text style={subscriptionCheckoutStyles.sectionTitle}>
            Shipping Address
          </Text>
          <View style={subscriptionCheckoutStyles.addressCard}>
            <View style={subscriptionCheckoutStyles.addressIcon}>
              <Icon source="home" size={20} color={Colors.light[10]} />
            </View>
            <View style={subscriptionCheckoutStyles.addressText}>
              <Text style={subscriptionCheckoutStyles.addressTitle}>Home</Text>
              <Text style={subscriptionCheckoutStyles.addressSubtitle}>
                {user?.address || '6140 Sunbrook Park, PC 5679'}
              </Text>
            </View>
            <TouchableOpacity>
              <Icon source="pencil" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={subscriptionCheckoutStyles.deliveryNote}>
          <Text style={subscriptionCheckoutStyles.deliveryNoteText}>
            Your order will be delivered within{' '}
            {plan.estimatedDeliveryTimeDays || 10} days after placement
          </Text>
        </View>

        <View style={subscriptionCheckoutStyles.section}>
          <View style={subscriptionCheckoutStyles.summaryRow}>
            <Text style={subscriptionCheckoutStyles.summaryLabel}>Amount</Text>
            <Text style={subscriptionCheckoutStyles.summaryValue}>
              {plan.amount?.value?.toLocaleString()}{' '}
              {plan.amount?.currencyIsoCode}
            </Text>
          </View>
          <View style={subscriptionCheckoutStyles.summaryRow}>
            <Text style={subscriptionCheckoutStyles.summaryLabel}>
              Delivery
            </Text>
            <Text style={subscriptionCheckoutStyles.summaryValue}>Free</Text>
          </View>
          <View style={subscriptionCheckoutStyles.summaryRow}>
            <Text style={subscriptionCheckoutStyles.summaryLabel}>
              Transaction Charges
            </Text>
            <Text style={subscriptionCheckoutStyles.summaryValue}>Free</Text>
          </View>
          <View style={subscriptionCheckoutStyles.summaryRow}>
            <Text style={subscriptionCheckoutStyles.summaryLabel}>
              Service Fee
            </Text>
            <Text style={subscriptionCheckoutStyles.summaryValue}>Free</Text>
          </View>
          <View style={subscriptionCheckoutStyles.totalRow}>
            <Text style={subscriptionCheckoutStyles.totalLabel}>Total</Text>
            <Text style={subscriptionCheckoutStyles.totalValue}>
              {plan.amount?.value?.toLocaleString()}{' '}
              {plan.amount?.currencyIsoCode}
            </Text>
          </View>
        </View>

        <Button
          mode="contained"
          style={subscriptionCheckoutStyles.confirmButton}
          labelStyle={subscriptionCheckoutStyles.confirmButtonLabel}
          onPress={() => {
            // Handle payment confirmation
            console.log('Confirm payment for plan:', plan.id);
          }}>
          Confirm Payment
        </Button>
      </ScrollView>
    </View>
  );
}
