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
import { ordersCreateOrderMutation } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { delay } from '@/utils';

export default function Checkout() {
  const router = useRouter();

  const { user, productId, deliveryLocation, setPaymentData } = useContext(
    Context,
  ) as ContextType;

  const [quantity, setQuantity] = useState('1');
  const [totalPrice, setTotalPrice] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

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

  useEffect(() => {
    setTotalPrice(
      (productData?.product?.amount?.value ?? 0) *
        (!quantity ? 0 : parseInt(quantity)),
    );
  }, [productData, quantity]);

  const { mutateAsync } = useMutation({
    ...ordersCreateOrderMutation(),
    onSuccess: data => {
      setPaymentData({
        entity: 'PaymentEntity_ORDER',
        entityId: data?.order?.orderNumber ?? '',
        nextScreen: '/(buyer)/(index)' as RelativePathString,
        amount: {
          value: (totalPrice ?? 0) * 1.08,
          currencyIsoCode: productData?.product?.amount?.currencyIsoCode,
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
      await mutateAsync({
        body: {
          productId: productId,
          quantity: quantity.toString(),
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
            <View style={styles.orderContainer}>
              <Text variant="titleMedium">
                {i18n.t('(buyer).(order).checkout.order')}
              </Text>
              <View style={styles.orderDetailsContainer}>
                <Image
                  source={{ uri: productData?.product?.image }}
                  style={styles.productImage}
                />
                <View style={styles.rightContainer}>
                  <Text variant="titleMedium">
                    {productData?.product?.name}
                  </Text>
                  <Text style={styles.price}>
                    {productData?.product?.amount?.currencyIsoCode}{' '}
                    {productData?.product?.amount?.value}
                    <Text style={styles.greyText}>
                      {' '}
                      {productData?.product?.unitType?.replace('per_', '/')}
                    </Text>
                  </Text>
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      disabled={parseInt(quantity) === 1}
                      onPress={() => {
                        setQuantity(prev => (parseInt(prev) - 1).toString());
                      }}
                      style={[
                        styles.quantityButton,
                        parseInt(quantity) === 1 && styles.inactiveButton,
                      ]}>
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.textCenter,
                          parseInt(quantity) === 1 && styles.inactiveText,
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
                      value={quantity}
                      onChangeText={text => setQuantity(text)}
                      inputMode="numeric"
                    />
                    <TouchableOpacity
                      onPress={() => {
                        setQuantity(prev => (parseInt(prev) + 1).toString());
                      }}
                      style={styles.quantityButton}>
                      <Text variant="titleMedium" style={styles.textCenter}>
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
                <TouchableOpacity
                  onPress={() => router.push('/(buyer)/(order)')}>
                  <Icon source={'pencil-outline'} size={24} />
                </TouchableOpacity>
              </View>
              <View style={[styles.orderDetailsContainer, styles.flexColumn]}>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t('(buyer).(order).checkout.amount')}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {productData?.product?.amount?.currencyIsoCode}{' '}
                    {formatAmount(totalPrice?.toString() ?? '', {
                      decimalPlaces: 2,
                    })}
                  </Text>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t('(buyer).(order).checkout.delivery')}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {productData?.product?.amount?.currencyIsoCode}{' '}
                    {formatAmount('0', {
                      decimalPlaces: 2,
                    })}
                  </Text>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t('(buyer).(order).checkout.transactionCharges')}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {productData?.product?.amount?.currencyIsoCode}{' '}
                    {formatAmount(
                      ((totalPrice ?? 0) * 0.03)?.toString() ?? '',
                      {
                        decimalPlaces: 2,
                      },
                    )}
                  </Text>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t('(buyer).(order).checkout.serviceCharges')}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {productData?.product?.amount?.currencyIsoCode}{' '}
                    {formatAmount(
                      ((totalPrice ?? 0) * 0.05)?.toString() ?? '',
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
                      ((totalPrice ?? 0) * 1.08)?.toString() ?? '',
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
            (loading || !quantity) && defaultStyles.greyButton,
          ]}
          loading={loading}
          disabled={loading || !quantity}
          onPress={handleCreateOrder}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            {i18n.t('(buyer).(order).checkout.confirmPayment')}{' '}
            {productData?.product?.amount?.currencyIsoCode}{' '}
            {formatAmount(((totalPrice ?? 0) * 1.08)?.toString() ?? '', {
              decimalPlaces: 2,
            })}
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
