import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';
import { defaultStyles } from '@/styles';
import i18n from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import {
  productsListProductsOptions,
} from '@/client/products.swagger/@tanstack/react-query.gen';
import { productsgrpcProduct } from '@/client/products.swagger';
import {
  ordersCreateCustomSubscriptionMutation,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import {
  Button,
  Card,
  ProgressBar,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { RelativePathString, useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const { width } = Dimensions.get('window');
const MAX_BUDGET_XAF = 1_000_000;
const DEFAULT_BUDGET_XAF = 75_000;
const MAX_PER_DELIVERY_XAF = 50_000;
const MAX_AMOUNT_PER_ORDER_CENTS = MAX_PER_DELIVERY_XAF * 100;

type Step = 'budget' | 'builder' | 'summary';

type DeliveryAllocation = Map<
  string,
  {
    product: productsgrpcProduct;
    quantity: number;
  }
>;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

function minDeliveriesForBudget(budgetXaf: number) {
  return Math.max(1, Math.ceil(budgetXaf / MAX_PER_DELIVERY_XAF));
}

export default function CreateCustomSubscription() {
  const router = useRouter();
  const { user, deliveryLocation, setPaymentData } = useContext(Context) as ContextType;
  const [step, setStep] = useState<Step>('budget');
  const [budgetXaf, setBudgetXaf] = useState<number>(DEFAULT_BUDGET_XAF);
  const [budgetText, setBudgetText] = useState<string>(String(DEFAULT_BUDGET_XAF));
  const [deliveriesCount, setDeliveriesCount] = useState<number>(
    minDeliveriesForBudget(DEFAULT_BUDGET_XAF),
  );
  const [activeDeliveryIdx, setActiveDeliveryIdx] = useState(0);
  const [allocations, setAllocations] = useState<DeliveryAllocation[]>(
    Array.from({ length: minDeliveriesForBudget(DEFAULT_BUDGET_XAF) }, () => new Map()),
  );
  const [snack, setSnack] = useState<string | null>(null);

  // Fetch products
  const {
    data: productsData,
    isLoading: isProductsLoading,
  } = useQuery({
    ...productsListProductsOptions({
      path: {
        userId: user?.userId ?? '',
      },
      query: {
        count: 100,
        isApproved: true,
        'userLocation.address': '',
        'userLocation.lat': 999.0,
        'userLocation.lon': 999.0,
      },
    }),
  });

  const { mutateAsync: createCustomSubscription, isPending: isCreating } =
    useMutation({
      ...ordersCreateCustomSubscriptionMutation(),
    });

  const totals = useMemo(() => {
    const deliveryTotals = allocations.map((delivery) => {
      let total = 0;
      delivery.forEach(({ product, quantity }) => {
        total += (product.amount?.value ?? 0) * quantity;
      });
      return total;
    });
    const used = deliveryTotals.reduce((s, x) => s + x, 0);
    const remaining = budgetXaf - used;
    return { deliveryTotals, used, remaining };
  }, [allocations, budgetXaf]);

  const setBudgetAndEnsureDeliveries = (nextBudget: number) => {
    const next = clamp(Math.round(nextBudget), 0, MAX_BUDGET_XAF);
    setBudgetXaf(next);
    const minDel = minDeliveriesForBudget(next);
    setDeliveriesCountSafe(Math.max(deliveriesCount, minDel), next);
  };

  const setDeliveriesCountSafe = (nextCount: number, budgetOverride?: number) => {
    const minDel = minDeliveriesForBudget(budgetOverride ?? budgetXaf);
    const next = clamp(nextCount, minDel, 60);
    setDeliveriesCount(next);
    setAllocations((prev) => {
      const nextArr = [...prev];
      if (nextArr.length < next) {
        while (nextArr.length < next) nextArr.push(new Map());
      } else if (nextArr.length > next) {
        nextArr.length = next;
      }
      return nextArr;
    });
    setActiveDeliveryIdx((prev) => clamp(prev, 0, next - 1));
  };

  useEffect(() => {
    setBudgetText(String(budgetXaf));
  }, [budgetXaf]);

  const updateQtyForActiveDelivery = (product: productsgrpcProduct, nextQty: number) => {
    const productId = product.id ?? '';
    if (!productId) return;
    const unit = product.amount?.value ?? 0;
    if (!unit || unit <= 0) return;

    setAllocations((prev) => {
      const getDeliveryTotal = (delivery: DeliveryAllocation) => {
        let total = 0;
        delivery.forEach(({ product, quantity }) => {
          total += (product.amount?.value ?? 0) * quantity;
        });
        return total;
      };
      const getOverallTotal = (all: DeliveryAllocation[]) => all.reduce((sum, d) => sum + getDeliveryTotal(d), 0);

      const next = [...prev];
      const delivery = new Map(next[activeDeliveryIdx]);
      const existing = delivery.get(productId);
      const prevQty = existing?.quantity ?? 0;

      const newQty = Math.max(0, Math.floor(nextQty));
      const deliveryTotalBefore = getDeliveryTotal(delivery);
      const overallBefore = getOverallTotal(prev);
      const deliveryTotalAfter = deliveryTotalBefore - prevQty * unit + newQty * unit;
      const overallAfter = overallBefore - prevQty * unit + newQty * unit;

      if (deliveryTotalAfter > MAX_PER_DELIVERY_XAF) {
        setSnack(
          i18n.t('(subscription).(customPackage).maxPerDeliverySnack', {
            currency: i18n.t('common.currency'),
            amount: MAX_PER_DELIVERY_XAF.toLocaleString(),
          }),
        );
        return prev;
      }
      if (overallAfter > budgetXaf) {
        setSnack(
          i18n.t('(subscription).(customPackage).totalBudgetSnack', {
            currency: i18n.t('common.currency'),
            amount: budgetXaf.toLocaleString(),
          }),
        );
        return prev;
      }

      if (newQty === 0) {
        delivery.delete(productId);
      } else {
        delivery.set(productId, { product, quantity: newQty });
      }
      next[activeDeliveryIdx] = delivery;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (budgetXaf <= 0) return;
    if (totals.used <= 0) return;
    if (totals.remaining !== 0) return;

    try {
      // Delivery location is required for subscriptions (reuse the order flow:
      // pickup vs home delivery).
      if (!deliveryLocation?.region) {
        router.push({
          pathname: '/(buyer)/(order)/delivery-address' as any,
          params: { returnTo: '__BACK__' },
        } as any);
        return;
      }

      // Convert selected products to subscription items with order_index
      const subscriptionItems = allocations.flatMap((delivery, orderIndex) => {
        const items: Array<{ productId: string; quantity: number; orderIndex: number }> = [];
        delivery.forEach(({ product, quantity }) => {
          items.push({
            productId: product.id ?? '',
            quantity,
            orderIndex,
          });
        });
        return items;
      });

      const result = await createCustomSubscription({
        body: {
          budget: {
            value: budgetXaf,
            currencyIsoCode: 'XAF', // Default currency
          },
          subscriptionItems: subscriptionItems as any,
          maxAmountPerOrder: MAX_AMOUNT_PER_ORDER_CENTS.toString(),
          deliveryLocation: {
            lat: deliveryLocation.region.latitude,
            lon: deliveryLocation.region.longitude,
            address: deliveryLocation.address || deliveryLocation.description,
          },
        },
        path: {
          userId: user?.userId ?? '',
        },
      });

      // Navigate to payment
      const publicId = result?.subscription?.publicId ?? '';
      if (!publicId) return;

      setPaymentData({
        entity: 'PaymentEntity_SUBSCRIPTION',
        entityId: publicId,
        nextScreen: '/(buyer)/(index)' as RelativePathString,
        amount: result?.subscription?.amount ?? {
          value: budgetXaf,
          currencyIsoCode: 'XAF',
        },
      });
      router.push('/(payment)');
    } catch (error) {
      console.error('Error creating custom subscription:', error);
    }
  };

  return (
    <SafeAreaView style={[defaultStyles.flex, { backgroundColor: Colors.light['bg'] }]}>
      {/* Fixed (non-scrollable) hero header */}
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
          onPress={() => (step === 'budget' ? router.back() : setStep('budget'))}
          style={{ position: 'absolute', top: 16, left: 16, padding: 8 }}>
          <Feather name="arrow-left" size={24} color={Colors.light[10]} />
        </TouchableOpacity>
        <View style={{ paddingBottom: 16 }}>
          <Text variant="titleLarge" style={{ color: Colors.light[10], fontWeight: '800' }}>
            {i18n.t('(subscription).(customPackage).title')}
          </Text>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {i18n.t('(subscription).(customPackage).maxPerDeliveryHero', {
              currency: i18n.t('common.currency'),
              amount: MAX_PER_DELIVERY_XAF.toLocaleString(),
            })}
          </Text>
        </View>
      </ImageBackground>

      {step === 'budget' && (
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Card style={{ marginTop: -24, backgroundColor: Colors.light[10] }}>
            <Card.Content>
              <Text variant="titleMedium">
                {i18n.t('(subscription).(customPackage).budgetStepTitle')}
              </Text>
              <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                {i18n.t('(subscription).(customPackage).budgetMeta', {
                  currency: i18n.t('common.currency'),
                  max: MAX_BUDGET_XAF.toLocaleString(),
                  default: DEFAULT_BUDGET_XAF.toLocaleString(),
                })}
              </Text>

              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setBudgetAndEnsureDeliveries(budgetXaf - 5_000)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Colors.grey['f8'],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text variant="titleMedium">-</Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <TextInput
                      mode="outlined"
                      label={i18n.t('(subscription).(customPackage).monthlyBudget')}
                      value={budgetText}
                      onChangeText={(t) => setBudgetText(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      returnKeyType="done"
                      dense
                      onEndEditing={() => {
                        const parsed = Number(budgetText || '0');
                        setBudgetAndEnsureDeliveries(parsed);
                      }}
                      outlineStyle={{ borderRadius: 14 }}
                    />
                    <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 6 }}>
                      {i18n.t('(subscription).(customPackage).budgetTip')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setBudgetAndEnsureDeliveries(budgetXaf + 5_000)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Colors.primary[500],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text variant="titleMedium" style={{ color: Colors.light[10] }}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>

                <MultiSlider
                  values={[budgetXaf]}
                  min={0}
                  max={MAX_BUDGET_XAF}
                  step={1_000}
                  sliderLength={width - 64}
                  onValuesChangeFinish={(v) => setBudgetAndEnsureDeliveries(v[0] ?? 0)}
                  selectedStyle={{ backgroundColor: Colors.primary[500] }}
                  trackStyle={{ height: 8, borderRadius: 999 }}
                  markerStyle={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 5,
                    borderColor: Colors.primary[500],
                    backgroundColor: Colors.light[10],
                  }}
                />
              </View>
            </Card.Content>
          </Card>

          <Card style={{ marginTop: 12, backgroundColor: Colors.light[10] }}>
            <Card.Content>
              <Text variant="titleMedium">
                {i18n.t('(subscription).(customPackage).deliveries')}
              </Text>
              <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                {i18n.t('(subscription).(customPackage).minimumDeliveries', {
                  min: minDeliveriesForBudget(budgetXaf),
                  currency: i18n.t('common.currency'),
                  maxPerDelivery: MAX_PER_DELIVERY_XAF.toLocaleString(),
                })}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => setDeliveriesCountSafe(deliveriesCount - 1)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.grey['f8'],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text variant="titleMedium">-</Text>
                </TouchableOpacity>

                <Text variant="titleLarge" style={{ color: Colors.dark[10] }}>
                  {deliveriesCount}
                </Text>

                <TouchableOpacity
                  onPress={() => setDeliveriesCountSafe(deliveriesCount + 1)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.primary[500],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text variant="titleMedium" style={{ color: Colors.light[10] }}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            buttonColor={Colors.primary[500]}
            style={{ borderRadius: 12, marginTop: 16 }}
            disabled={budgetXaf <= 0}
            onPress={() => {
              // Ensure allocations array matches deliveriesCount before continuing
              setAllocations((prev) => {
                const next = [...prev];
                if (next.length < deliveriesCount) while (next.length < deliveriesCount) next.push(new Map());
                if (next.length > deliveriesCount) next.length = deliveriesCount;
                return next;
              });
              setActiveDeliveryIdx(0);
              setStep('builder');
            }}>
            {i18n.t('common.continue')}
          </Button>
        </View>
      )}

      {step === 'builder' && (
        <View style={{ padding: 16, paddingBottom: 32, flex: 1 }}>
          <Card style={{ marginTop: -24, backgroundColor: Colors.light[10] }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium">
                    {i18n.t('(subscription).(selectProducts).budgetUsed')}
                  </Text>
                  <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                    {i18n.t('(subscription).(customPackage).usedLeft', {
                      currency: i18n.t('common.currency'),
                      used: totals.used.toLocaleString(),
                      left: Math.max(0, totals.remaining).toLocaleString(),
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDeliveriesCountSafe(deliveriesCount + 1)}
                  style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.primary[50], borderWidth: 1, borderColor: Colors.primary[500] }}>
                  <Text variant="bodySmall" style={{ color: Colors.primary[500], fontWeight: '800' }}>
                    {i18n.t('(subscription).(customPackage).addDelivery')}
                  </Text>
                </TouchableOpacity>
              </View>
              <ProgressBar
                progress={budgetXaf <= 0 ? 0 : clamp(totals.used / budgetXaf, 0, 1)}
                color={Colors.primary[500]}
                style={{ marginTop: 12, height: 10, borderRadius: 999, backgroundColor: Colors.grey['f8'] }}
              />
            </Card.Content>
          </Card>

          {/* Deliveries tabs */}
          <View style={{ marginTop: 12 }}>
            <FlatList
              horizontal
              data={Array.from({ length: deliveriesCount }, (_, i) => i)}
              keyExtractor={(i) => String(i)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ columnGap: 8 }}
              renderItem={({ item: idx }) => {
                const isActive = idx === activeDeliveryIdx;
                const spent = totals.deliveryTotals[idx] ?? 0;
                return (
                  <TouchableOpacity
                    onPress={() => setActiveDeliveryIdx(idx)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: isActive ? Colors.primary[500] : Colors.grey['f8'],
                      borderWidth: 1,
                      borderColor: isActive ? Colors.primary[500] : Colors.grey['f8'],
                    }}>
                    <Text variant="bodySmall" style={{ color: isActive ? Colors.light[10] : Colors.dark[10], fontWeight: '800' }}>
                      {idx + 1}
                    </Text>
                    <Text variant="bodySmall" style={{ color: isActive ? 'rgba(255,255,255,0.85)' : Colors.light['10.87'] }}>
                      {spent.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 8 }}>
              {i18n.t('(subscription).(selectProducts).deliveryBudgetLine', {
                index: activeDeliveryIdx + 1,
                currency: i18n.t('common.currency'),
                total: (totals.deliveryTotals[activeDeliveryIdx] ?? 0).toLocaleString(),
                max: MAX_PER_DELIVERY_XAF.toLocaleString(),
              })}
            </Text>
          </View>

          {/* Products list for active delivery */}
          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 12 }}>
            {i18n.t('(subscription).(selectProducts).selectProductsForDelivery', {
              index: activeDeliveryIdx + 1,
            })}
          </Text>

          {isProductsLoading ? (
            <View style={defaultStyles.center}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={productsData?.products ?? []}
              keyExtractor={(item, index) => item?.id ?? index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t('(subscription).(selectProducts).noProductsAvailable')}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const product = item as productsgrpcProduct;
                const productId = product.id ?? '';
                const qty = allocations[activeDeliveryIdx]?.get(productId)?.quantity ?? 0;
                const unit = product.amount?.value ?? 0;
                const lineTotal = unit * qty;
                return (
                  <Card style={{ marginBottom: 12, backgroundColor: Colors.light[10] }}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text variant="titleMedium" numberOfLines={1}>
                            {product.name}
                          </Text>
                          <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 2 }}>
                            {product.amount?.currencyIsoCode ?? 'XAF'} {unit.toLocaleString()}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => updateQtyForActiveDelivery(product, qty - 1)}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              backgroundColor: Colors.grey['f8'],
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Text variant="titleMedium">-</Text>
                          </TouchableOpacity>
                          <Text variant="titleMedium" style={{ minWidth: 20, textAlign: 'center' }}>
                            {qty}
                          </Text>
                          <TouchableOpacity
                            onPress={() => updateQtyForActiveDelivery(product, qty + 1)}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              backgroundColor: Colors.primary[500],
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Text variant="titleMedium" style={{ color: Colors.light[10] }}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {qty > 0 && (
                        <Text variant="bodySmall" style={{ color: Colors.primary[500], fontWeight: '800', marginTop: 10 }}>
                          {i18n.t('(subscription).(selectProducts).lineTotal', {
                            currency: i18n.t('common.currency'),
                            amount: lineTotal.toLocaleString(),
                          })}
                        </Text>
                      )}
                    </Card.Content>
                  </Card>
                );
              }}
            />
          )}

          <Card style={{ marginTop: 8, backgroundColor: Colors.light[10] }}>
            <Card.Content>
              <Text variant="bodySmall" style={{ color: totals.remaining === 0 ? Colors.primary[500] : Colors.light['10.87'] }}>
                {totals.remaining === 0
                  ? i18n.t('(subscription).(selectProducts).budgetAllocatedPerfect')
                  : i18n.t('(subscription).(selectProducts).budgetRemainingToAllocate', {
                      currency: i18n.t('common.currency'),
                      amount: Math.max(0, totals.remaining).toLocaleString(),
                    })}
              </Text>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            buttonColor={Colors.primary[500]}
            style={{ borderRadius: 12, marginTop: 12 }}
            disabled={totals.remaining !== 0 || totals.used <= 0}
            onPress={() => setStep('summary')}>
            {i18n.t('(subscription).(selectProducts).viewSummary')}
          </Button>
        </View>
      )}

      {step === 'summary' && (
        <View style={{ padding: 16, paddingBottom: 32, flex: 1 }}>
          <Card style={{ marginTop: -24, marginBottom: 12, backgroundColor: Colors.light[10] }}>
            <Card.Content>
              <Text variant="titleMedium">{i18n.t('(subscription).(summary).header')}</Text>
              <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                {i18n.t('(subscription).(summary).budgetDeliveriesLine', {
                  currency: i18n.t('common.currency'),
                  budget: budgetXaf.toLocaleString(),
                  deliveries: deliveriesCount,
                })}
              </Text>
            </Card.Content>
          </Card>

          <Card style={{ marginBottom: 12, backgroundColor: Colors.light[10] }}>
            <Card.Content>
              {(() => {
                const { firstDelivery, daysUntilSaturday } = getFirstDeliveryDate(new Date());
                return (
                  <>
                    <Text variant="titleMedium">
                      {i18n.t('(subscription).(summary).deliveryDatesTitle')}
                    </Text>
                    <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                      {i18n.t('(subscription).(summary).deliveryDatesRule')}
                    </Text>
                    <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 8 }}>
                      {i18n.t('(subscription).(summary).deliveryDatesTodayLine', {
                        daysUntilSaturday,
                        dayLabel: i18n.t('common.day', { count: daysUntilSaturday }),
                        firstDelivery: formatShortDate(firstDelivery),
                      })}
                    </Text>
                    <View style={{ marginTop: 12 }}>
                      {Array.from({ length: deliveriesCount }, (_, idx) => {
                        const date = addDays(firstDelivery, idx * 7);
                        const spent = totals.deliveryTotals[idx] ?? 0;
                        return (
                          <Text key={idx} variant="bodySmall" style={{ marginBottom: 4 }}>
                            {i18n.t('(subscription).(summary).deliveryDatesItem', {
                              index: idx + 1,
                              date: formatShortDate(date),
                              currency: i18n.t('common.currency'),
                              amount: spent.toLocaleString(),
                            })}
                          </Text>
                        );
                      })}
                    </View>
                  </>
                );
              })()}
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            {i18n.t('(subscription).(summary).productsPerDeliveryTitle')}
          </Text>

          <FlatList
            data={allocations.map((_, idx) => idx)}
            keyExtractor={(idx) => String(idx)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item: idx }) => {
              const delivery = allocations[idx] ?? new Map();
              const items = [...delivery.values()];
              const { firstDelivery } = getFirstDeliveryDate(new Date());
              const date = addDays(firstDelivery, idx * 7);
              return (
                <Card style={{ marginBottom: 12, backgroundColor: Colors.light[10] }}>
                  <Card.Content>
                    <Text variant="titleMedium">
                      {i18n.t('(subscription).(summary).deliveryCardTitle', {
                        index: idx + 1,
                        date: formatShortDate(date),
                      })}
                    </Text>
                    {items.length === 0 ? (
                      <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 6 }}>
                        {i18n.t('(subscription).(summary).noProductsSelected')}
                      </Text>
                    ) : (
                      <View style={{ marginTop: 8 }}>
                        {items.map(({ product, quantity }, itemIdx) => (
                          <View
                            key={`${product.id ?? product.name ?? 'product'}-${itemIdx}`}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                            <Text variant="bodySmall" style={{ flex: 1 }}>
                              {product.name}
                            </Text>
                            <Text variant="bodySmall" style={{ color: Colors.light['10.87'] }}>
                              x{quantity}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            }}
          />

          <Card style={{ marginTop: 4, marginBottom: 12, backgroundColor: Colors.light[10] }}>
            <Card.Content>
              <Text variant="titleMedium">
                {i18n.t('(subscription).(summary).deliveryMethodTitle')}
              </Text>
              <Text variant="bodySmall" style={{ color: Colors.light['10.87'], marginTop: 4 }}>
                {deliveryLocation?.description
                  ? i18n.t('(subscription).(summary).deliveryMethodSelected', {
                      selection: `${deliveryLocation.description}${
                        deliveryLocation.address ? ` • ${deliveryLocation.address}` : ''
                      }`,
                    })
                  : i18n.t('(subscription).(summary).deliveryMethodChoose')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Button
                  mode="outlined"
                  style={{ flex: 1, borderRadius: 12 }}
                  textColor={Colors.primary[500]}
                  onPress={() =>
                    router.push({
                      pathname: '/(buyer)/(order)/select-pickup-point' as any,
                      params: { returnTo: '/(buyer)/create-custom-subscription' },
                    } as any)
                  }>
                  {i18n.t('(subscription).(summary).pickupPoint')}
                </Button>
                <Button
                  mode="outlined"
                  style={{ flex: 1, borderRadius: 12 }}
                  textColor={Colors.primary[500]}
                  onPress={() =>
                    router.push({
                      pathname: '/(buyer)/(order)/delivery-address' as any,
                      params: { returnTo: '/(buyer)/create-custom-subscription' },
                    } as any)
                  }>
                  {i18n.t('(subscription).(summary).homeDelivery')}
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            buttonColor={Colors.primary[500]}
            style={{ borderRadius: 12, marginTop: 8 }}
            loading={isCreating}
            disabled={
              isCreating ||
              totals.remaining !== 0 ||
              totals.used <= 0 ||
              !deliveryLocation?.region
            }
            onPress={handleSubmit}>
            {i18n.t('(subscription).(summary).proceedToPay')}
          </Button>
        </View>
      )}

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

