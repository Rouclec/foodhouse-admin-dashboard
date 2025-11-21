import { productsGetProductOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { defaultStyles } from '@/styles';
import { useMutation, useQuery } from '@tanstack/react-query';
import { RelativePathString, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import {
  Appbar,
  Button,
  Icon,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { checkoutStyles as styles } from '@/styles';
import { formatAmount } from '@/utils/amountFormater';
import {
  ordersCreateOrderMutation,
  ordersEstimateDeliveryFeeOptions,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { delay } from '@/utils';
import { CartItem, LocalOrderItem } from '@/utils/types';
import { ordersEstimateDeliveryFee } from '@/client/orders.swagger';

export default function Checkout() {
  const router = useRouter();

  const { user, productId, deliveryLocation, setPaymentData, cartItems } =
    useContext(Context) as ContextType & { cartItems: CartItem[] };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [subtotal, setSubtotal] = useState<number>(0);

  const currency = cartItems[0]?.currency || 'XAF';
  const [orderItems, setOrderItems] = useState<LocalOrderItem[]>(
    cartItems.map(item => ({
      ...(item as CartItem),
      quantity: item.quantity.toString(),
    })),
  );

  const handleQuantityChange = (
    index: number,
    type: 'increase' | 'decrease' | 'input',
    value?: string,
  ) => {
    setOrderItems(prevItems => {
      const newItems = [...prevItems];
      const currentItem = newItems[index];
      const currentQty = parseInt(currentItem.quantity) || 0;

      if (type === 'increase') {
        newItems[index].quantity = (currentQty + 1).toString();
      } else if (type === 'decrease' && currentQty > 1) {
        newItems[index].quantity = (currentQty - 1).toString();
      } else if (type === 'input' && value !== undefined) {
        const numericValue = value.replace(/[^0-9]/g, '');
        newItems[index].quantity = numericValue || '1';
      }

      return newItems;
    });
  };
  useEffect(() => {
    const total = orderItems.reduce(
      (sum, item) => sum + item.price * (parseInt(item.quantity) || 0),
      0,
    );
    setSubtotal(total);
  }, [orderItems]);

  const totalQuantityForFee = orderItems.reduce(
    (sum, item) => sum + (parseInt(item.quantity) || 0),
    0,
  );

  useEffect(() => {
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    setSubtotal(total);
  }, [cartItems]);

  const {
    data: productData,
    isError,
    isLoading,
  } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: productId ?? '',
      },
    }),
    enabled: !!productId,
  });

  const { mutate: estimateDeliveryFee, data: estimatedDeliveryFee } =
    useMutation({
      mutationFn: () =>
        ordersEstimateDeliveryFee({
          path: {
            userId: user?.userId ?? '',
          },
          body: {
            deliveryLocation: {
              lon: deliveryLocation?.region?.longitude,
              lat: deliveryLocation?.region?.latitude,
              address: deliveryLocation?.description,
            },

            orderItems: orderItems.map(item => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          },
        }),
    });

  useEffect(() => {
    if (!user?.userId) return;
    if (!deliveryLocation) return;
    if (orderItems.length === 0) return;

    estimateDeliveryFee();
  }, [user?.userId, deliveryLocation, orderItems, estimateDeliveryFee]);

  const { mutateAsync } = useMutation({
    ...ordersCreateOrderMutation(),
    onSuccess: data => {
      setPaymentData({
        entity: 'PaymentEntity_ORDER',
        entityId: data?.order?.orderNumber ?? '',
        nextScreen: '/(buyer)/(index)' as RelativePathString,

        amount: {
          value:
            subtotal +
            (estimatedDeliveryFee?.data?.estimatedDeliveryFee?.value ?? 0),
          currencyIsoCode: currency,
        },
      });
      router.push('/(payment)');
    },
    onError: async error => {
      setError(
        error?.response?.data?.message ??
          i18n.t('(buyer).(order).checkout.unknownError'),
      );
      await delay(5000);
      setError(undefined);
    },
  });

  const handleCreateOrder = async () => {
    try {
      setLoading(true);

      const itemsPayload = orderItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      await mutateAsync({
        body: {
          orderItems: itemsPayload,
          deliveryLocation: {
            address: deliveryLocation?.description,
            lon: deliveryLocation?.region?.longitude,
            lat: deliveryLocation?.region?.latitude,
          },
        },
        path: {
          userId: user?.userId ?? '',
        },
      });
    } catch (error) {
      console.error('error creating order ', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} color={Colors.dark[0]} />
            </TouchableOpacity>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={[defaultStyles.center, styles.notFoundContainer]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (isError) {
    return (
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(buyer).(order).checkout.checkout')}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={[defaultStyles.center, styles.notFoundContainer]}>
              <Text>{i18n.t('(buyer).(order).checkout.couldNotLoad')}</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(buyer).(order).checkout.checkout')}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <Text variant="titleMedium">
              {i18n.t('(buyer).(order).checkout.shippingAddress')}
            </Text>

            <View style={[styles.orderDetailsContainer, styles.flexRow]}>
              <View style={styles.outterLocationIconContainer}>
                <View style={styles.innerLocationIconContainer}>
                  <Icon
                    source={'map-marker'}
                    size={24}
                    color={Colors.light[10]}
                  />
                </View>
              </View>

              <View style={styles.rowGap8}>
                <Text variant="titleMedium" style={styles.text16}>
                  {deliveryLocation?.description}
                </Text>
                <Text style={styles.textSmall}>
                  {deliveryLocation?.address}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(buyer)/(order)')}>
                <Icon source={'pencil-outline'} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.orderContainer}>
              <Text variant="titleMedium" style={{ marginBottom: 16 }}>
                {i18n.t('(buyer).(order).checkout.order')} ({cartItems.length}{' '}
                items)
              </Text>

              {orderItems.map((item, index) => (
                <View key={item.id} style={[styles.orderDetailsContainer]}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                  />
                  <View style={styles.rightContainer}>
                    <Text variant="titleMedium" numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Text style={styles.price}>
                      {currency} {item.price}
                      <Text style={styles.greyText}>
                        {' '}
                        {productData?.product?.unitType?.replace('per_', '/')}
                      </Text>
                    </Text>
                    <View style={styles.buttonsContainer}>
                      <TouchableOpacity
                        // Use item.quantity
                        disabled={parseInt(item.quantity) === 1}
                        onPress={() => handleQuantityChange(index, 'decrease')}
                        style={[
                          styles.quantityButton,
                          parseInt(item.quantity) === 1 &&
                            styles.inactiveButton,
                        ]}>
                        <Text
                          variant="titleMedium"
                          style={[
                            styles.textCenter,
                            parseInt(item.quantity) === 1 &&
                              styles.inactiveText,
                          ]}>
                          -
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.quantityInput}
                        theme={{
                          colors: {
                            primary: Colors.primary[500],
                            background: Colors.grey['fa'],
                            error: Colors.error,
                          },
                          roundness: 10,
                        }}
                        contentStyle={styles.quantityInputContent}
                        mode="outlined"
                        // Use item.quantity
                        value={item.quantity}
                        // Use handler specific to this item's index
                        onChangeText={text =>
                          handleQuantityChange(index, 'input', text)
                        }
                        inputMode="numeric"
                      />
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(index, 'increase')}
                        style={styles.quantityButton}>
                        <Text variant="titleMedium" style={styles.textCenter}>
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              <View style={[styles.orderDetailsContainer, styles.flexColumn]}>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t('(buyer).(order).checkout.amount')}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {productData?.product?.amount?.currencyIsoCode} {currency}{' '}
                    {formatAmount(subtotal.toString(), { decimalPlaces: 2 })}
                  </Text>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t('(buyer).(order).checkout.delivery')}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {
                      estimatedDeliveryFee?.data?.estimatedDeliveryFee
                        ?.currencyIsoCode
                    }{' '}
                    {formatAmount(
                      estimatedDeliveryFee?.data?.estimatedDeliveryFee?.value ??
                        0,

                      {
                        decimalPlaces: 2,
                      },
                    )}
                  </Text>
                </View>
                <View style={[styles.rowItem, styles.lastRowItem]}>
                  <Text style={styles.textSmall}>
                    {i18n.t('(buyer).(order).checkout.total')}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {productData?.product?.amount?.currencyIsoCode}{' '}
                    {formatAmount(
                      (
                        (subtotal ?? 0) +
                        (estimatedDeliveryFee?.data?.estimatedDeliveryFee
                          ?.value ?? 0)
                      )?.toString() ?? '',
                      {
                        decimalPlaces: 2,
                      },
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          style={[
            defaultStyles.button,
            defaultStyles.primaryButton,
            (loading || totalQuantityForFee === 0) && defaultStyles.greyButton,
          ]}
          loading={loading}
          disabled={loading || totalQuantityForFee === 0}
          onPress={handleCreateOrder}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            {i18n.t('(buyer).(order).checkout.confirmPayment')}{' '}
            {productData?.product?.amount?.currencyIsoCode}{' '}
            {formatAmount(
              (
                (subtotal ?? 0) +
                (estimatedDeliveryFee?.data?.estimatedDeliveryFee?.value ?? 0)
              )?.toString() ?? '',
              {
                decimalPlaces: 2,
              },
            )}
          </Text>
        </Button>
      </View>
      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{error}</Text>
      </Snackbar>
    </>
  );
}
