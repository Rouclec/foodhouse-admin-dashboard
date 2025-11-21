import {
  ordersConfirmDeliveryMutation,
  ordersGetOrderDetailsOptions,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import i18n from '@/i18n';
import { defaultStyles, trackOrderStyles } from '@/styles';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appbar, Button, Icon, Snackbar, Text } from 'react-native-paper';
import { Context, ContextType } from '../_layout';
import { Chase } from 'react-native-animated-spinkit';
import { Colors } from '@/constants';
import { trackOrderStyles as styles } from '@/styles';
import { formatCurrency } from '@/utils/amountFormater';
import { ordersgrpcOrderAuditLog } from '@/client/orders.swagger';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { delay } from '@/utils';

export default function TrackOrder() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;
  const [filteredLogs, setFilterdLogs] = useState<ordersgrpcOrderAuditLog[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const { orderNumber } = useLocalSearchParams();

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
  });

  const handleConfirmDelivery = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {},
        path: {
          secretKey: orderDetails?.order?.secretKey ?? '',
          userId: user?.userId ?? '',
        },
      });
    } catch (error) {
      console.error({ error }, 'confirming delivery');
    } finally {
      setLoading(false);
    }
  };

  const { mutateAsync } = useMutation({
    ...ordersConfirmDeliveryMutation(),
    onSuccess: () => {
      refetch();
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

  useEffect(() => {
    if (!orderDetails?.auditLog) return;
    const latestByAction = Object.values(
      orderDetails?.auditLog?.reduce(
        (acc: Record<string, ordersgrpcOrderAuditLog>, item) => {
          const key = item.action;
          if (!key) return acc; // Skip if action is undefined or empty
          if (
            !acc[key] ||
            new Date(item.timestamp ?? '') > new Date(acc[key].timestamp ?? '')
          ) {
            acc[key] = item;
          }
          return acc;
        },
        {},
      ),
    )
      .filter(item => item.action !== 'CreateOrder') // filter create order logs are they are not neccesary
      .sort(
        (a, b) =>
          new Date(a.timestamp ?? '').getTime() -
          new Date(b.timestamp ?? '').getTime(),
      );
    setFilterdLogs(latestByAction);
  }, [orderDetails]);

  const insets = useSafeAreaInsets();

  if (isOrderDetailsLoading) {
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
                {i18n.t('(buyer).track-order.trackOrder')}
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

  if (errorLoadingOrder) {
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
                {i18n.t('(buyer).track-order.trackOrder')}
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
                <Text>{i18n.t('(buyer).track-order.couldNotLoad')}</Text>
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
          {/* Header */}
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(buyer).track-order.trackOrder')}
            </Text>
            <View />
          </Appbar.Header>

          {/* TOP SECTION — 60% height */}
          <View style={{ flex: 0.6, overflow: 'hidden' }}>
            <FlatList
              data={orderDetails?.order?.orderItems ?? []}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[defaultStyles.card, { marginBottom: 16 }]}>
                  {/* Product Image */}
                  <Image
                    source={{ uri: item?.productImage }}
                    style={styles.productImage}
                  />

                  {/* Product Details */}
                  <View style={styles.orderDetailsContainer}>
                    <Text style={styles.leftText}>
                      {i18n.t('(buyer).track-order.orderNumber')}:{' '}
                      <Text variant="titleMedium" style={styles.rightText}>
                        {orderDetails?.order?.orderNumber}
                      </Text>
                    </Text>

                    <Text variant="titleSmall" style={styles.text20}>
                      {item.productName}
                    </Text>

                    <Text variant="titleSmall" style={defaultStyles.text14}>
                      {item.quantity} {item.unitType?.replace('per_', '')}
                      {parseInt(item?.quantity ?? '0') > 1 && 's'}
                    </Text>

                    <View style={styles.centerRow}>
                      <Text variant="titleSmall" style={styles.primaryText}>
                        {formatCurrency(
                          (
                            Number(item?.productUnitPrice?.value ?? 0) +
                            Number(orderDetails?.order?.deliveryFee?.value ?? 0)
                          ).toFixed(2),
                          orderDetails?.order?.sumTotal?.currencyIsoCode ?? '',
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Horizontal Progress Tracker */}
                  <FlatList
                    horizontal
                    data={filteredLogs}
                    keyExtractor={(log, index) =>
                      log?.action ?? index.toString()
                    }
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.flatListContainer,
                      { paddingVertical: 10 },
                    ]}
                    renderItem={({ item, index }) => {
                      const isLast = index === (filteredLogs?.length ?? 0) - 1;

                      const getIcon = () => {
                        switch (item?.action) {
                          case 'ConfirmOrderPayment':
                            return (
                              <MaterialIcons
                                name="paid"
                                size={36}
                                color={Colors.primary[500]}
                              />
                            );
                          case 'ApproveOrder':
                            return (
                              <Icon
                                source="timer-sand"
                                size={36}
                                color={Colors.primary[500]}
                              />
                            );
                          case 'DispatchOrder':
                            return (
                              <Icon
                                source="truck"
                                size={36}
                                color={Colors.primary[500]}
                              />
                            );
                          default:
                            return (
                              <Icon
                                source="package-variant-closed"
                                size={36}
                                color={Colors.primary[500]}
                              />
                            );
                        }
                      };

                      return (
                        <View style={styles.flatListIconContainer}>
                          {getIcon()}

                          <View style={styles.relativeContainer}>
                            <Icon
                              source="check-circle"
                              color={Colors.primary[500]}
                              size={20}
                            />

                            {/* Connector */}
                            {!isLast && <View style={styles.dashedConnector} />}
                          </View>
                        </View>
                      );
                    }}
                  />
                </View>
              )}
            />
          </View>

          {/* Divider */}
          <View style={trackOrderStyles.divider} />

          {/* BOTTOM SECTION — 40% height */}
          <View style={{ flex: 0.4 }}>
            <FlatList
              data={filteredLogs ?? []}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={[
                defaultStyles.scrollContainer,
                trackOrderStyles.padding,
                { paddingBottom: 24 },
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const getTitle = () => {
                  switch (item?.action) {
                    case 'ConfirmOrderPayment':
                      return [
                        i18n.t('(buyer).track-order.orderPlaced'),
                        i18n.t('(buyer).track-order.paymentDone'),
                      ];
                    case 'ApproveOrder':
                      return [
                        i18n.t('(buyer).track-order.orderConfirmed'),
                        i18n.t('(buyer).track-order.farmerReceived'),
                      ];
                    case 'DispatchOrder':
                      return [
                        i18n.t('(buyer).track-order.orderDispatched'),
                        i18n.t('(buyer).track-order.orderInTransit'),
                      ];
                    case 'ConfirmDelivery':
                      return [
                        i18n.t('(buyer).track-order.orderDelivered'),
                        i18n.t('(buyer).track-order.orderCompleted'),
                      ];
                    default:
                      return [
                        i18n.t('(buyer).track-order.unknownOrderStatus'),
                        i18n.t('(buyer).track-order.unknownState'),
                      ];
                  }
                };

                return (
                  <View style={styles.filterLogsContainer}>
                    <View style={defaultStyles.relativeContainer}>
                      <View
                        style={[
                          defaultStyles.checkOutterContainer,
                          defaultStyles.checkPrimaryOutterContainer,
                        ]}>
                        <View
                          style={[
                            defaultStyles.checkInnercontainer,
                            defaultStyles.primaryChecked,
                          ]}
                        />
                      </View>

                      {index !== (filteredLogs?.length ?? 0) - 1 && (
                        <View style={styles.verticalDivider} />
                      )}
                    </View>

                    <View style={styles.filterLogConentContainer}>
                      <View style={styles.rowGap6}>
                        <Text
                          variant="titleMedium"
                          style={defaultStyles.text16}>
                          {getTitle()[0]} -{' '}
                          {moment(item?.timestamp).format('MMMM DD')}
                        </Text>

                        <Text style={styles.bodyText}>{getTitle()[1]}</Text>
                      </View>

                      <Text style={styles.timeText}>
                        {moment(item?.timestamp).format('hh:mm A')}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
        {orderDetails?.order?.status === 'OrderStatus_IN_TRANSIT' && (
          <View style={defaultStyles.bottomButtonContainer}>
            <Button
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                loading && defaultStyles.greyButton,
              ]}
              onPress={handleConfirmDelivery}
              loading={loading}
              disabled={loading}>
              <Text style={[defaultStyles.buttonText]}>
                {i18n.t('(buyer).track-order.confirmDelivery')}
              </Text>
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Snackbar Error */}
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
