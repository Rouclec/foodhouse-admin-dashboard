import { SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import React, { useContext } from 'react';
import { defaultStyles, summaryStyles as styles } from '@/styles';
import { Text, Button, Icon, Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ordersCreateCustomSubscriptionMutation } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { Colors } from '@/constants';
import { typesAmount } from '@/client/orders.swagger';
import i18n from '@/i18n';

export default function Summary() {
  const router = useRouter();
  const { budget, deliveries, selectedProducts, selectedProductsByDelivery, subscriptionItems } = useLocalSearchParams<{
    budget: string;
    deliveries: string;
    selectedProducts: string;
    selectedProductsByDelivery?: string;
    subscriptionItems: string;
  }>();
  const { user, setPaymentData } = useContext(Context) as ContextType;

  const totalBudget = parseInt(budget || '75000');
  const numDeliveries = parseInt(deliveries || '2');
  const budgetPerDelivery = Math.floor(totalBudget / numDeliveries);
  const productsFallback = selectedProducts ? JSON.parse(selectedProducts) : [];

  const productsByDelivery: Record<number, any[]> = (() => {
    if (selectedProductsByDelivery) {
      try {
        const raw = JSON.parse(selectedProductsByDelivery) as Record<string, any[]>;
        const next: Record<number, any[]> = {};
        Object.entries(raw ?? {}).forEach(([k, v]) => {
          next[Number(k)] = Array.isArray(v) ? v : [];
        });
        return next;
      } catch {
        // fall through to fallback
      }
    }
    // Backward-compat: old flow only had a single list, treat it as delivery 1.
    return { 1: productsFallback };
  })();

  const allProducts = Object.values(productsByDelivery).flat();

  const computedSubscriptionItems = Object.entries(productsByDelivery).flatMap(([deliveryNum, products]) => {
    const orderIndex = Math.max(0, Number(deliveryNum) - 1);
    return (products ?? []).map((p: any) => ({
      productId: p.id,
      quantity: (p.quantity ?? 0).toString(),
      productName: p.name,
      productUnitPrice: { value: p.price, currencyIsoCode: 'XAF' },
      unitType: p.unit,
      orderIndex,
    }));
  });

  const items = subscriptionItems ? JSON.parse(subscriptionItems) : computedSubscriptionItems;

  const { mutateAsync: createCustomSubscription, isPending } = useMutation({
    ...ordersCreateCustomSubscriptionMutation(),
  });

  const amount = allProducts.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0);
  const discount = amount * 0.1;
  const total = amount - discount;

  const handleConfirmPayment = async () => {
    try {
      const result = await createCustomSubscription({
        body: {
          budget: { value: totalBudget, currencyIsoCode: 'XAF' },
          subscriptionItems: items,
          // Backend expects this value in cents (XAF * 100)
          maxAmountPerOrder: (budgetPerDelivery * 100).toString(),
          estimatedDeliveryTimeDays: '7',
        },
        path: { userId: user?.userId ?? '' },
      });

      const publicId = result?.subscription?.publicId ?? '';
      if (!publicId) return;

      setPaymentData({
        entity: 'PaymentEntity_SUBSCRIPTION',
        entityId: publicId,
        nextScreen: '/(buyer)/(index)' as RelativePathString,
        amount: { value: total, currencyIsoCode: 'XAF' } as typesAmount,
      });
      router.push('/(payment)');
    } catch (e) {
      console.error('Error creating custom subscription:', e);
    }
  };

  const deliveriesData = Array.from({ length: numDeliveries }, (_, i) => {
    const id = i + 1;
    const deliveryProducts = productsByDelivery[id] ?? [];
    const deliveryAmount = deliveryProducts.reduce(
      (sum: number, p: any) => sum + p.price * p.quantity,
      0,
    );
    return {
      id,
      items: deliveryProducts.map((p: any) => ({
        name: p.name,
        unit: `${p.quantity} ${p.unit.replace("per_", "")}${parseInt(p.quantity ?? '0') > 1 ? 's' : ''}`,
        price: p.price * p.quantity,
      })),
      total: deliveryAmount,
    };
  });

  return (
    <View style={defaultStyles.flex}>
      <Appbar.Header style={styles.appHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}>
          <Icon source={'arrow-left'} size={24} color={Colors.dark[0]} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          {i18n.t('(subscription).(summary).header')}
        </Text>
        <View style={{ width: 64 }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.packageCard}>
          <Text style={styles.packageTitle}>{i18n.t('(subscription).(summary).customPackage')}</Text>
          <View style={styles.packageDetails}>
            <Text style={styles.packageDetailText}>{allProducts.reduce((sum: number, p: any) => sum + p.quantity, 0)} {i18n.t('(subscription).(summary).items')}</Text>
            <View style={styles.packageDivider} />
            <Icon source="truck-delivery" size={16} color={Colors.light[10]} />
            <Text style={styles.packageDetailText}>{numDeliveries} {i18n.t('(subscription).(summary).deliveries')}</Text>
          </View>
        </View>

        {deliveriesData.map(delivery => (
          <View key={delivery.id} style={styles.deliverySection}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryTitle}>{i18n.t('(subscription).(summary).delivery')} {delivery.id}</Text>
              <Text style={styles.deliveryTotal}>
                {delivery.total.toLocaleString()} XAF
              </Text>
            </View>
            {delivery.items.map((item: { name: string; unit: string; price: number }, index: number) => (
              <View key={index} style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {item.price.toLocaleString()} XAF
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>{i18n.t('(subscription).(summary).paymentSummary')}</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{i18n.t('(subscription).(summary).amount')}</Text>
            <Text style={styles.paymentValue}>
              {amount.toLocaleString()} XAF
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{i18n.t('(subscription).(order).Delivery')}</Text>
            <Text style={styles.paymentValueFree}>{i18n.t('(subscription).(summary).free')}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{i18n.t('(subscription).(summary).discount')}</Text>
            <Text style={styles.paymentValueDiscount}>
              -{discount.toLocaleString()} XAF
            </Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{i18n.t('(subscription).(summary).total')}</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} XAF</Text>
          </View>
        </View>
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          style={[defaultStyles.button, defaultStyles.primaryButton, isPending && defaultStyles.greyButton]}
          contentStyle={[defaultStyles.center]}
          onPress={handleConfirmPayment}
          loading={isPending}
          disabled={isPending}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            {i18n.t('(subscription).(summary).confirmPayment')}
          </Text>
        </Button>
      </View>
    </View>
  );
}
