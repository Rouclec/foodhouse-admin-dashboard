import React, { useContext, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  Icon,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { defaultStyles, orderDetailsStyles as styles } from '@/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Context, ContextType } from '../_layout';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  ordersApproveOrderMutation,
  ordersGetOrderDetailsOptions,
  ordersRejectOrderMutation,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { productsGetProductOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import i18n from '@/i18n';
import { Chase } from 'react-native-animated-spinkit';
import { Colors } from '@/constants';
import { formatAmount } from '@/utils/amountFormater';
import { usersGetPublicUserOptions } from '@/client/users.swagger/@tanstack/react-query.gen';
import { delay } from '@/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrderDetails() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

  const { orderNumber } = useLocalSearchParams();
  const [error, setError] = useState<string>();

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>();
  const [showRejectedModal, setShowRejectedModal] = useState(false);

  const {
    data: orderDetails,
    isLoading: isOrderDetailsLoading,
    isError: errorLoadingOrder,
    refetch,
  } = useQuery({
    ...ordersGetOrderDetailsOptions({
      path: {
        userId: user?.userId ?? '',
        orderNumber: (orderNumber as string) ?? '',
      },
    }),
    enabled: !!orderNumber,
    placeholderData: keepPreviousData,
  });

  const {
    isLoading: isProductLoading,
    data: productData,
    isError: errorLoadingProduct,
  } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: orderDetails?.order?.product ?? '',
      },
    }),
    enabled: !!orderDetails?.order,
  });

  const { data: buyer } = useQuery({
    ...usersGetPublicUserOptions({
      path: {
        userId: orderDetails?.order?.createdBy ?? '',
      },
    }),
    enabled: !!orderDetails?.order?.createdBy,
  });

  const handleApproveOrder = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {},
        path: {
          orderId: orderDetails?.order?.orderNumber ?? '',
          userId: user?.userId ?? '',
        },
      });
    } catch (error) {
      console.error({ error }, 'approving order');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    try {
      setLoading(true);
      await rejectOrder({
        body: {
          reason: rejectReason,
        },
        path: {
          orderId: orderDetails?.order?.orderNumber ?? '',
          userId: user?.userId ?? '',
        },
      });
    } catch (error) {
      console.error({ error }, 'approving order');
    } finally {
      setLoading(false);
    }
  };

  const { mutateAsync: rejectOrder } = useMutation({
    ...ordersRejectOrderMutation(),
    onSuccess: async () => {
      refetch();
      setShowRejectModal(false);
      setShowRejectedModal(true);
      await delay(5000);
      setShowRejectedModal(false);
    },
    onError: async error => {
      setError(
        error?.response?.data?.message ??
          i18n.t('(farmer).order-details.unknownError'),
      );
      await delay(5000);
      setError(undefined);
    },
  });

  const { mutateAsync } = useMutation({
    ...ordersApproveOrderMutation(),
    onSuccess: async () => {
      refetch();
      setShowSuccessModal(true);
      await delay(5000);
      setShowSuccessModal(false);
    },
    onError: async error => {
      setError(
        error?.response?.data?.message ??
          i18n.t('(farmer).order-details.unknownError'),
      );
      await delay(5000);
      setError(undefined);
    },
  });

  const insets = useSafeAreaInsets();

  if (isOrderDetailsLoading || isProductLoading) {
    return (
      <>
        <KeyboardAvoidingView
          style={[
            defaultStyles.container,
            {
              paddingBottom: insets.bottom,
            },
          ]}
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
                {i18n.t('(farmer).order-details.orderDetails')}
              </Text>
              <View />
            </Appbar.Header>
            <ScrollView
              contentContainerStyle={defaultStyles.scrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled">
              <View
                style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
                <Chase size={56} color={Colors.primary[500]} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </>
    );
  }

  if (errorLoadingOrder || errorLoadingProduct) {
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
                {i18n.t('(farmer).order-details.orderDetails')}
              </Text>
              <View />
            </Appbar.Header>
            <ScrollView
              contentContainerStyle={defaultStyles.scrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled">
              <View
                style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
                <Text>{i18n.t('(farmer).order-details.couldNotLoad')}</Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </>
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
              {i18n.t('(farmer).order-details.orderDetails')}
            </Text>
            <View />
          </Appbar.Header>
          <View style={defaultStyles.card}>
            <Image
              source={{ uri: productData?.product?.image }}
              style={styles.productImage}
            />
            <View style={styles.orderDetailsContainer}>
              <Text style={styles.leftText}>
                {i18n.t('(farmer).order-details.orderNumber')}:{' '}
                <Text variant="titleMedium" style={styles.rightText}>
                  {orderDetails?.order?.orderNumber}
                </Text>
              </Text>
              <Text variant="titleMedium">{productData?.product?.name}</Text>
              <View style={styles.centerRow}>
                <Text variant="titleSmall" style={styles.primaryText}>
                  {orderDetails?.order?.price?.currencyIsoCode}{' '}
                  {formatAmount(
                    (
                      (productData?.product?.amount?.value ?? 0) *
                      parseInt(orderDetails?.order?.quantity ?? '0', 10) *
                      0.9
                    ).toString(),
                    { decimalPlaces: 2 },
                  )}
                </Text>
              </View>
            </View>
          </View>
          <ScrollView
            contentContainerStyle={[
              defaultStyles.scrollContainer,
              styles.mainContainer,
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t('(farmer).order-details.customersName')}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {buyer?.name}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t('(farmer).order-details.quantity')}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {formatAmount(orderDetails?.order?.quantity ?? '')}{' '}
                  {(productData?.product?.unitType ?? '').replace('per_', '')}
                  {(parseInt(orderDetails?.order?.quantity ?? '') ?? 0) > 1 &&
                    's'}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t('(farmer).order-details.deliveryAddress')}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {orderDetails?.order?.deliveryLocation?.address}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      {orderDetails?.order?.status === 'OrderStatus_PAYMENT_SUCCESSFUL' && (
        <View style={defaultStyles.bottomContainerWithContent}>
          <Button
            style={[
              defaultStyles.secondaryButton,
              styles.errorButton,
              loading && defaultStyles.greyButton,
            ]}
            disabled={loading}
            onPress={() => setShowRejectModal(true)}>
            <Text style={defaultStyles.buttonText}>
              {i18n.t('(farmer).order-details.rejectOrder')}
            </Text>
          </Button>
          <Button
            style={[
              defaultStyles.primaryButton,
              loading && defaultStyles.greyButton,
            ]}
            loading={loading}
            disabled={loading}
            onPress={handleApproveOrder}>
            <Text style={defaultStyles.buttonText}>
              {i18n.t('(farmer).order-details.approveOrder')}
            </Text>
          </Button>
        </View>
      )}
      <Portal>
        <Dialog
          visible={showSuccessModal}
          onDismiss={() => setShowSuccessModal(false)}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Image
              source={require('@/assets/images/success.png')}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t('(farmer).order-details.congratulations')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(farmer).order-details.youHaveApproved')}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={showRejectedModal}
          onDismiss={() => setShowRejectedModal(false)}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t('(farmer).order-details.orderRejected')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(farmer).order-details.youHaveRejected')}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={showRejectModal}
          onDismiss={() => setShowRejectModal(false)}
          style={[
            defaultStyles.dialogSuccessContainer,
            styles.dialogContainer,
          ]}>
          <Dialog.Content style={styles.selfCenter}>
            <Text
              variant="titleLarge"
              style={[defaultStyles.errorText, defaultStyles.textCenter]}>
              {i18n.t('(farmer).order-details.rejectOrder')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text>{i18n.t('(farmer).order-details.enterAReason')}</Text>
          </Dialog.Content>
          <Dialog.Content style={styles.widthFull}>
            <View style={styles.inputContainer}>
              <TextInput
                label={i18n.t('(farmer).order-details.reason')}
                mode="outlined"
                value={rejectReason}
                onChangeText={setRejectReason}
                style={defaultStyles.input}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: Colors.grey['fa'],
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                outlineColor={Colors.grey['bg']}
                multiline
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions style={styles.actionContainer}>
            <Button
              style={[
                defaultStyles.secondaryButton,
                styles.errorButton,
                (loading || !rejectReason) && defaultStyles.greyButton,
                styles.widthFull,
              ]}
              disabled={loading && !rejectReason}
              loading={loading}
              onPress={handleRejectOrder}>
              <Text style={defaultStyles.buttonText}>
                {i18n.t('(farmer).order-details.reject')}
              </Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={[defaultStyles.snackbar, defaultStyles.marginHorizontal24]}>
        <Text style={defaultStyles.errorText}>{error}</Text>
      </Snackbar>
    </>
  );
}
