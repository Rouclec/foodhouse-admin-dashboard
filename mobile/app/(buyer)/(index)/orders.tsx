import { Context, ContextType } from '@/app/_layout';
import {
  ordersgrpcOrder,
  ordersgrpcOrderStatus,
} from '@/client/orders.swagger';
import { ordersListUserOrdersOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { productsGetProductOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import { usersReviewFarmerMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import {
  FilterBottomSheet,
  FilterBottomSheetRef,
} from '@/components/(buyer)/(index)/FilterBottomSheet';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { defaultStyles, ordersStyles as styles } from '@/styles';
import { delay } from '@/utils';
import {  formatCurrency } from '@/utils/amountFormater';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  ActivityIndicator,
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

const { width } = Dimensions.get('window');

const PENDING_ORDER_STATUSES: Array<ordersgrpcOrderStatus> = [
  'OrderStatus_PAYMENT_SUCCESSFUL',
  'OrderStatus_APPROVED',
  'OrderStatus_IN_TRANSIT',
];

const { height } = Dimensions.get('window');
interface OrderItemProps {
  item: ordersgrpcOrder | undefined;
  onPress?: () => void;
}
const OrderItem: FC<OrderItemProps> = ({ item, onPress }) => {
  if (!item) return;

  const {
    isLoading: isProductLoading,
    data: productData,
    isError,
  } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: item?.product ?? '',
      },
    }),
  });

  if (isProductLoading)
    return (
      <View style={defaultStyles.center}>
        <Chase size={16} color={Colors.primary[500]} />
      </View>
    );

  if (isError) {
    return (
      <View style={defaultStyles.center}>
        <Text>{i18n.t('(buyer).(index).orders.couldNotLoadProduct')}</Text>
      </View>
    );
  }
  return (
    <View style={defaultStyles.card}>
      <Image
        source={{ uri: productData?.product?.image }}
        style={styles.productImage}
      />
      <View style={styles.orderDetailsContainer}>
        <Text variant="titleMedium">{productData?.product?.name}</Text>
        <View style={styles.centerRow}>
          <Text variant="titleSmall" style={styles.primaryText}>
            {item?.price?.currencyIsoCode} {item?.price?.currencyIsoCode}{' '}
            {formatCurrency(
              (
                Number(item?.price?.value ?? 0) +
                Number(item?.deliveryFee?.value ?? 0)
              ).toFixed(2),
              item?.price?.currencyIsoCode ?? '',
            )}
          </Text>
        </View>
        {!!onPress && (
          <Button style={defaultStyles.primaryButton} onPress={onPress}>
            <Text style={defaultStyles.buttonText}>
              {item?.status === 'OrderStatus_DELIVERED'
                ? i18n.t('(buyer).(index).orders.writeReview')
                : i18n.t('(buyer).(index).orders.trackOrder')}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
};

export default function Orders() {
  const TAB_ITEMS: Array<{
    name: string;
    value: Array<ordersgrpcOrderStatus>;
  }> = [
    {
      name: i18n.t('(buyer).(index).orders.pending'),
      value: PENDING_ORDER_STATUSES,
    },
    {
      name: i18n.t('(buyer).(index).orders.completed'),
      value: ['OrderStatus_DELIVERED'],
    },
  ];

  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ordersgrpcOrder>();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState('');
  const [count, setCount] = useState(10);
  const [tabItem, setTabItem] = useState<{
    name: string;
    value: Array<ordersgrpcOrderStatus>;
  }>(TAB_ITEMS[0]);

  const slideAnim = useRef(new Animated.Value(width)).current;

  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();

  const toggleSearch = () => {
    if (searchVisible) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setSearchVisible(false));
      setSearchQuery('');
      setDebounceQuery('');
    } else {
      setSearchVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    ...ordersListUserOrdersOptions({
      path: {
        userId: user?.userId ?? '',
      },
      query: {
        count: count,
        startKey: '',
        statuses: tabItem.value,
      },
    }),
  });

  const { mutateAsync } = useMutation({
    ...usersReviewFarmerMutation(),
    onSuccess: () => {
      setRating(0);
      setComment('');
      sheetRef?.current?.close();
    },
    onError: async error => {
      setError(
        error?.response?.data?.message ?? i18n.t('(auth).login.anUnknownError'),
      );
      await delay(5000);
      setError(undefined);
    },
  });

  const handleReview = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          farmerId: selectedOrder?.productOwner ?? '',
          orderId: selectedOrder?.orderNumber ?? '',
          productId: selectedOrder?.product ?? '',
          rating: rating,
          comment: comment,
        },
        path: {
          userId: user?.userId ?? '',
        },
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={[defaultStyles.flex, defaultStyles.relativeContainer]}>
          <Appbar.Header dark={false} style={[defaultStyles.appHeader]}>
            {!searchVisible && (
              <Text variant="titleMedium" style={styles.title}>
                {i18n.t('(buyer).(index).orders.myOrders')}
              </Text>
            )}

            {!searchVisible && (
              <TouchableOpacity onPress={toggleSearch} style={styles.icon}>
                <Feather name="search" size={24} />
              </TouchableOpacity>
            )}

            {searchVisible && (
              <Animated.View
                style={[
                  styles.searchContainer,
                  { transform: [{ translateX: slideAnim }] },
                ]}>
                <TextInput
                  label={i18n.t('(buyer).(index).orders.searchOrder')}
                  style={[defaultStyles.input, styles.searchInput]}
                  autoFocus
                  value={searchQuery}
                  onChangeText={text => setSearchQuery(text)}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey['fa'],
                      error: Colors.error,
                    },
                    roundness: 10,
                  }}
                />
                <TouchableOpacity
                  onPress={toggleSearch}
                  style={styles.closeIcon}>
                  <Icon source={'close'} size={24} color={Colors.dark[0]} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </Appbar.Header>
          <View style={styles.tabItemsMainContainer}>
            {TAB_ITEMS.map(item => {
              return (
                <TouchableOpacity
                  key={item?.value[0]}
                  onPress={() => setTabItem(item)}
                  style={[
                    styles.tabItemContainer,
                    tabItem.value === item?.value &&
                      styles.tabItemActiveContainer,
                  ]}>
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.tabItemText,
                      tabItem.value === item?.value && styles.tabItemActiveText,
                    ]}>
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {isLoading && !data ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={data?.orders}
              keyExtractor={(item, index) =>
                item.orderNumber ?? index.toString()
              }
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t('(buyer).(index).orders.noOrdersFound')}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (!hasReachedEnd) {
                  setHasReachedEnd(true);
                }
              }}
              renderItem={({ item }) => {
                return (
                  <OrderItem
                    item={item}
                    onPress={
                      item?.status === 'OrderStatus_DELIVERED'
                        ? () => {
                            setSelectedOrder(item);
                            sheetRef?.current?.open();
                          }
                        : PENDING_ORDER_STATUSES.includes(
                            item?.status as ordersgrpcOrderStatus,
                          )
                        ? () => {
                            router.push({
                              pathname: '/(buyer)/track-order',
                              params: {
                                orderNumber: item?.orderNumber,
                              },
                            });
                          }
                        : () => {}
                    }
                  />
                );
              }}
              onScrollBeginDrag={() => {
                // Reset flag when user starts dragging
                setHasReachedEnd(false);
              }}
              onScrollEndDrag={() => {
                if (hasReachedEnd && data?.nextKey) {
                  setCount(prev => prev + 10);
                  setHasReachedEnd(false);
                }
              }}
              ListFooterComponent={() =>
                data?.nextKey ? (
                  <View style={defaultStyles.listFooterComponent}>
                    {hasReachedEnd && (
                      <ActivityIndicator
                        color={Colors.primary[500]}
                        style={defaultStyles.listFooterIndicator}
                      />
                    )}
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
      <FilterBottomSheet
        ref={sheetRef}
        sheetHeight={height * 0.9 > 643 ? 643 : height * 0.9}>
        <View style={styles.ratingTitleContainer}>
          <Text
            variant="titleMedium"
            style={[styles.ratingTitle, defaultStyles.textCenter]}>
            {i18n.t('(buyer).(index).orders.leaveAReview')}
          </Text>
        </View>
        <View style={styles.ratingTitleContainer}>
          <OrderItem item={selectedOrder} />
        </View>
        <View
          style={{
            rowGap: 24,
            paddingVertical: 24,
            borderBottomWidth: 1,
            borderColor: Colors.grey['border'],
          }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              rowGap: 12,
            }}>
            <Text variant="titleMedium" style={defaultStyles.textCenter}>
              {i18n.t('(buyer).(index).orders.howWasYourProduct')}
            </Text>
            <Text
              style={[
                defaultStyles.textCenter,
                { fontSize: 16, color: Colors.grey['61'] },
              ]}
              variant="bodyLarge">
              {i18n.t('(buyer).(index).orders.pleaseGiveYourRating')}
            </Text>
          </View>
          <View
            style={[
              defaultStyles.center,
              {
                flexDirection: 'row',
                columnGap: 24,
              },
            ]}>
            {Array(5)
              .fill('a')
              .map((_item, index) => {
                return (
                  <TouchableOpacity
                    onPress={() => setRating(index + 1)}
                    key={index}>
                    <Icon
                      size={32}
                      source={rating >= index + 1 ? 'star' : 'star-outline'}
                      color={
                        rating >= index + 1
                          ? Colors.primary[500]
                          : Colors.dark[10]
                      }
                    />
                  </TouchableOpacity>
                );
              })}
          </View>
          <View>
            <TextInput
              // style={defaultStyles.input}
              mode="outlined"
              label={i18n.t('(buyer).(index).orders.review')}
              value={comment}
              onChangeText={setComment}
              theme={{
                colors: {
                  primary: Colors.primary[500],
                  background: Colors.grey['fa'],
                  error: Colors.error,
                },
                roundness: 10,
              }}
              outlineColor={Colors.grey['bg']}
            />
          </View>
        </View>
        <View style={styles.ratingsButtonsContainer}>
          <Button
            style={[
              defaultStyles.button,
              defaultStyles.secondaryButton,
              styles.halfButton,
            ]}
            onPress={() => {
              setRating(0);
              setComment('');
              sheetRef?.current?.close();
            }}>
            <Text style={defaultStyles.secondaryButtonText}>
              {i18n.t('(buyer).(index).orders.cancel')}
            </Text>
          </Button>
          <Button
            style={[
              defaultStyles.button,
              defaultStyles.primaryButton,
              styles.halfButton,
              (!rating || !comment || loading) && defaultStyles.greyButton,
            ]}
            disabled={!rating || !comment || loading}
            loading={loading}
            onPress={handleReview}>
            <Text style={defaultStyles.buttonText}>
              {i18n.t('(buyer).(index).orders.submit')}
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
      </FilterBottomSheet>
    </>
  );
}
