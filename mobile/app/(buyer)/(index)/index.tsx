import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';
import { defaultStyles, buyerProductsStyles as styles } from '@/styles';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  productsListCategoriesOptions,
  productsListProductsOptions,
} from '@/client/products.swagger/@tanstack/react-query.gen';
import {
  ordersListSubscriptionPlansOptions,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { ordersgrpcSubscription } from '@/client/orders.swagger';
import { useContext } from 'react';
import { Context, ContextType } from '@/app/_layout';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Icon,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';
import { CAMEROON, Colors, countries } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { FilterBottomSheet, Product } from '@/components';
import { Feather } from '@expo/vector-icons';
import { FilterBottomSheetRef } from '@/components/(buyer)/(index)/FilterBottomSheet';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const HOUR_OF_DAY = new Date().getHours();
const { width } = Dimensions.get('window');

function getPlanDiscountPercent(plan?: ordersgrpcSubscription): number | null {
  const amount = plan?.amount?.value ?? 0;
  if (!amount || amount <= 0) return null;

  const base = (plan?.subscriptionItems ?? []).reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 0);
    const unit = item?.productUnitPrice?.value ?? 0;
    if (!Number.isFinite(qty) || !Number.isFinite(unit)) return sum;
    return sum + unit * qty;
  }, 0);

  if (!base || base <= 0) return null;
  if (amount >= base) return null;

  const pct = Math.round(((base - amount) / base) * 100);
  return pct >= 1 ? pct : null;
}

function isCustomSubscriptionPlan(plan?: ordersgrpcSubscription): boolean {
  const title = (plan?.title ?? '').trim();
  const description = plan?.description ?? '';
  return (
    title.toLowerCase() === 'custom subscription' &&
    description.startsWith('Custom subscription for user ')
  );
}

export default function BuyerProducts() {
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState('');
  const [count, setCount] = useState(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const [minAmount, setMinAmount] = useState<string>();
  const [maxAmount, setMaxAmount] = useState<string>();
  const [showLocationModal, setShowLocationModal] = useState(false);
  // const [settingUp, setSettingUp] = useState(true);

  // const [userLocation, setUserLocation] = useState<{
  //   lat: number;
  //   lon: number;
  // } | null>(null);
  // const [locationError, setLocationError] = useState<string | null>(null);
  const userCurrency =
    countries.find(country => country.code === user?.residenceCountryIsoCode)
      ?.currency_code ?? CAMEROON.currency_code;

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       setSettingUp(true);
  //       const { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== 'granted') {
  //         setLocationError(i18n.t('(buyer).(index).products.permissionDenied'));
  //         setShowLocationModal(true);

  //         return;
  //       }

  //       const location = await Location.getCurrentPositionAsync({
  //         accuracy: Location.Accuracy.High,
  //       });

  //       setUserLocation({
  //         lat: location.coords.latitude,
  //         lon: location.coords.longitude,
  //       });
  //     } catch (error) {
  //       console.warn('Error getting location:', error);
  //       setLocationError(
  //         i18n.t('(buyer).i(ndex).products.couldNotGetLocation'),
  //       );
  //     } finally {
  //       setSettingUp(false);
  //     }
  //   })();
  // }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const router = useRouter();

  const { user, cartItems } = useContext(Context) as ContextType;
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions(),
    placeholderData: keepPreviousData,
  });

  // Fetch subscription plans for the slider
  const {
    data: subscriptionPlansData,
    isLoading: isSubscriptionPlansLoading,
  } = useQuery({
    ...ordersListSubscriptionPlansOptions({
      path: {
        userId: user?.userId ?? '',
      },
    }),
  });

  const visibleSubscriptionPlans = React.useMemo(() => {
    const plans = subscriptionPlansData?.subscriptionPlans ?? [];
    return plans.filter((p) => !isCustomSubscriptionPlan(p));
  }, [subscriptionPlansData?.subscriptionPlans]);
  const { isLoading: isProductsLoading, data } = useQuery({
    ...productsListProductsOptions({
      path: {
        userId: user?.userId ?? '',
      },
      query: {
        count: count,
        'maxAmount.currencyIsoCode': userCurrency,
        'maxAmount.value': maxAmount ? parseFloat(maxAmount ?? '') : undefined,
        'minAmount.currencyIsoCode': userCurrency,
        'minAmount.value': minAmount ? parseFloat(minAmount ?? '') : undefined,

        'userLocation.lat': 1.1,
        'userLocation.lon': 1.1,

        categoryId: selectedCategoryId,
        search: debounceQuery,
        startKey: '',
        isApproved: true,
      },
    }),
    // enabled: !!userLocation,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // control variables for filter container.
  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const [filterSelectedCategoryId, setFilterSelectedCategoryId] =
    useState<string>();
  const [filterSelectedMinValue, setFilterSelectedMinValue] =
    useState<string>();
  const [filterSelectedMaxValue, setFilterSelectedMaxValue] =
    useState<string>();
  const [filterSelectedRating, setFilterSelectedRating] = useState<number>();

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.flex}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View
          style={[
            defaultStyles.flex,
            styles.bgWhite,
            defaultStyles.relativeContainer,
          ]}>
          <View style={styles.appHeader}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.appHeaderContent}>
                <View style={styles.appHeaderTopContainer}>
                  <View style={styles.appHeaderLeftContainer}>
                    <TouchableOpacity
                      style={styles.iconContainer}
                      onPress={() => router.push('/(buyer)/(index)/profile')}>
                      {user?.profileImage ? (
                        <Image
                          source={{ uri: user?.profileImage }}
                          style={styles.profileImage}
                        />
                      ) : (
                        <Image
                          source={require('@/assets/images/avatar.png')}
                          style={styles.avatarImage}
                        />
                      )}
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.greetingsText} variant="bodyLarge">
                        {HOUR_OF_DAY < 12
                          ? i18n.t('(buyer).(index).products.goodMorning')
                          : HOUR_OF_DAY < 17
                            ? i18n.t('(buyer).(index).products.goodAfternoon')
                            : i18n.t('(buyer).(index).products.goodEvening')}{' '}
                        👋
                      </Text>
                      <Text style={styles.nameText} variant="titleLarge">
                        {user?.firstName} {user?.lastName}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.iconContainer}
                    onPress={() => {
                      if (cartItems.length === 0) {
                        return;
                      }

                      router.push('/(buyer)/(order)');
                    }}>
                    <View style={defaultStyles.relativeContainer}>
                      <Icon
                        source={'cart'}
                        size={32}
                        color={Colors.primary[500]}
                      />

                      {cartCount > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            top: -14,
                            right: -14,
                            backgroundColor: Colors.primary[500],
                            borderRadius: 28,
                            width: 24,
                            height: 24,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: 'white',
                          }}>
                          <Text
                            style={{
                              color: Colors.light[10],
                              fontSize: 14,
                              fontWeight: 'bold',
                              textAlign: 'center',
                            }}>
                            {cartCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder={i18n.t(
                    '(buyer).(index).products.searchProducts',
                  )}
                  placeholderTextColor={Colors.grey['bd']}
                  style={[defaultStyles.input, styles.searchInput]}
                  outlineStyle={styles.searchInputOutline}
                  value={searchQuery}
                  onChangeText={text => setSearchQuery(text)}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <Feather
                          name="search"
                          size={20}
                          color={Colors.grey['bd']}
                        />
                      )}
                      size={24}
                      color={Colors.grey['61']}
                    />
                  }
                  right={
                    <TextInput.Icon
                      onPress={e => {
                        Keyboard.dismiss(); // pressing the text input opens the keyboard, so we dismiss it at once, since that is not what we want here
                        sheetRef.current?.open();
                      }}
                      icon={() => (
                        <Image
                          source={require('@/assets/images/filter-icon.jpg')}
                        />
                      )}
                    />
                  }
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey['fa'],
                      error: Colors.error,
                    },
                    roundness: 16,
                  }}
                />
              </View>
            </SafeAreaView>
          </View>
          {/* Subscription Plans Slider */}
          {visibleSubscriptionPlans.length > 0 && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 24,
                    marginTop: 16,
                  }}>
                  <Text variant="titleMedium" style={[styles.title]}>
                    Subscription Plans
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(buyer)/subscription-plans')}>
                    <Text
                      style={{
                        color: Colors.primary[500],
                        fontSize: 14,
                        fontWeight: '600',
                      }}>
                      More
                    </Text>
                  </TouchableOpacity>
                </View>
                {isSubscriptionPlansLoading ? (
                  <View style={defaultStyles.center}>
                    <Chase size={24} color={Colors.primary[500]} />
                  </View>
                ) : (
                  <View style={[styles.flatListContainer, { marginBottom: 8 }]}>
                    <FlatList
                      horizontal
                      data={visibleSubscriptionPlans.slice(0, 2)}
                      contentContainerStyle={[
                        { columnGap: 12, alignItems: 'flex-start', height: '100%' },
                        styles.paddingRight24,
                      ]}
                      showsHorizontalScrollIndicator={false}
                      style={[styles.horizontalFlatList, styles.paddingLeft24]}
                      keyExtractor={(item, index) =>
                        item?.id ?? index.toString()
                      }
                      renderItem={({ item }) => {
                        const plan = item as ordersgrpcSubscription;
                        const discountPct = getPlanDiscountPercent(plan);
                        const cardWidth = Math.min(220, Math.round(width * 0.46));
                        return (
                          <TouchableOpacity
                            style={[
                              {
                                backgroundColor: Colors.light[10],
                                borderRadius: 12,
                                padding: 12,
                                width: cardWidth,
                                borderWidth: 1,
                                borderColor: Colors.grey['f8'],
                              },
                            ]}
                            onPress={() =>
                              router.push({
                                pathname: '/(buyer)/subscription-plan-details',
                                params: { planId: plan?.id },
                              })
                            }>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 8,
                              }}>
                              <Text
                                variant="bodyLarge"
                                style={{ flex: 1, color: Colors.dark[10] }}
                                numberOfLines={2}>
                                {plan?.title ?? 'Subscription'}
                              </Text>
                              {discountPct !== null && (
                                <View
                                  style={{
                                    backgroundColor: Colors.primary[50],
                                    borderColor: Colors.primary[500],
                                    borderWidth: 1,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 999,
                                  }}>
                                  <Text
                                    variant="bodySmall"
                                    style={{
                                      color: Colors.primary[500],
                                      fontWeight: '700',
                                    }}>
                                    -{discountPct}%
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text
                              variant="titleMedium"
                              style={{ color: Colors.primary[500] }}
                              numberOfLines={1}>
                              {plan?.amount?.currencyIsoCode ?? 'XAF'}{' '}
                              {(plan?.amount?.value ?? 0).toLocaleString()}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                )}
              </>
            )}
          <Text
            variant="titleMedium"
            style={[styles.title, styles.marginHorizontal24]}>
            {i18n.t('(buyer).(index).products.categories')}
          </Text>
          {isCategoriesLoading && !categories ? (
            <View style={defaultStyles.center}>
              <Chase size={24} color={Colors.primary[500]} />
            </View>
          ) : (
            <View style={styles.flatListContainer}>
              <FlatList
                horizontal
                data={categories?.categories}
                contentContainerStyle={[
                  styles.horizontailFlatListContent,
                  styles.paddingRight24,
                ]}
                showsHorizontalScrollIndicator={false}
                style={[styles.horizontalFlatList, styles.paddingLeft24]}
                keyExtractor={(item, index) => item?.id ?? index.toString()}
                ListHeaderComponent={() => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      !selectedCategoryId && styles.selectedCategoryItem,
                    ]}
                    onPress={() => setSelectedCategoryId(undefined)}>
                    <Text
                      style={{
                        color: !selectedCategoryId
                          ? Colors.light[10]
                          : Colors.dark[10],
                      }}>
                      {i18n.t('(buyer).(index).products.all')}
                    </Text>
                  </TouchableOpacity>
                )}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        selectedCategoryId === item?.id &&
                        styles.selectedCategoryItem,
                      ]}
                      onPress={() => setSelectedCategoryId(item?.id)}>
                      <Text
                        style={{
                          color:
                            selectedCategoryId === item?.id
                              ? Colors.light[10]
                              : Colors.dark[10],
                        }}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
          <Text
            variant="titleMedium"
            style={[styles.title, styles.marginHorizontal24]}>
            {i18n.t('(buyer).(index).products.products')}
          </Text>
          {isProductsLoading ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={data?.products}
              keyExtractor={(item, index) => item?.id ?? index.toString()}
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t('(buyer).(index).products.noProductsFound')}
                  </Text>
                </View>
              }
              numColumns={2}
              columnWrapperStyle={styles.flatListColumnWrapper}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (!hasReachedEnd) {
                  setHasReachedEnd(true);
                }
              }}
              renderItem={({ item }) => {
                return (
                  <Product
                    product={item}
                    OnPress={() =>
                      router.push({
                        pathname: '/(buyer)/product-details',
                        params: {
                          productId: item?.id,
                        },
                      })
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
      <FilterBottomSheet ref={sheetRef} sheetHeight={548}>
        <View style={styles.filtersContainer}>
          <Text variant="titleMedium" style={styles.title}>
            {i18n.t('(buyer).(index).products.filter')}
          </Text>
          <View style={styles.mainFilterContainer}>
            <View>
              <Text variant="titleMedium" style={styles.title}>
                {i18n.t('(buyer).(index).products.categories')}
              </Text>
              {isCategoriesLoading ? (
                <View style={defaultStyles.center}>
                  <Chase size={24} color={Colors.primary[500]} />
                </View>
              ) : (
                <View style={styles.flatListContainer}>
                  <FlatList
                    horizontal
                    data={categories?.categories}
                    contentContainerStyle={styles.horizontailFlatListContent}
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalFlatList}
                    keyExtractor={(item, index) => item?.id ?? index.toString()}
                    ListHeaderComponent={() => (
                      <TouchableOpacity
                        style={[
                          styles.categoryItem,
                          !filterSelectedCategoryId &&
                          styles.selectedCategoryItem,
                        ]}
                        onPress={() => setFilterSelectedCategoryId(undefined)}>
                        <Text
                          style={{
                            color: !filterSelectedCategoryId
                              ? Colors.light[10]
                              : Colors.dark[10],
                          }}>
                          {i18n.t('(buyer).(index).products.all')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    renderItem={({ item }) => {
                      return (
                        <TouchableOpacity
                          style={[
                            styles.categoryItem,
                            filterSelectedCategoryId === item?.id &&
                            styles.selectedCategoryItem,
                          ]}
                          onPress={() => setFilterSelectedCategoryId(item?.id)}>
                          <Text
                            style={{
                              color:
                                filterSelectedCategoryId === item?.id
                                  ? Colors.light[10]
                                  : Colors.dark[10],
                            }}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}
            </View>
            <View>
              <Text variant="titleMedium" style={styles.title}>
                {i18n.t('(buyer).(index).products.priceRange')}
              </Text>
              <MultiSlider
                onValuesChangeStart={() => { }}
                onValuesChangeFinish={e => {
                  setFilterSelectedMinValue(e[0].toString());
                  setFilterSelectedMaxValue(e[1].toString());
                }}
                values={[2000, 200000]}
                isMarkersSeparated
                min={500}
                max={200000}
                containerStyle={styles.silderContainer}
                trackStyle={styles.sliderTrack}
                selectedStyle={styles.sliderSelectedStyle}
                sliderLength={width - 72}
                customMarkerLeft={e => (
                  <View style={defaultStyles.relativeContainer}>
                    <View style={styles.tooltipContainer}>
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{e.currentValue}</Text>
                        <View style={styles.tooltipArrow} />
                      </View>
                    </View>
                    <View style={styles.marker} />
                  </View>
                )}
                customMarkerRight={e => (
                  <View
                    style={[
                      defaultStyles.relativeContainer,
                      defaultStyles.center,
                    ]}>
                    <View style={styles.tooltipContainer}>
                      <View style={styles.tooltip}>
                        <Text
                          variant="titleMedium"
                          style={styles.tooltipText}
                          numberOfLines={1}>
                          {e.currentValue}
                        </Text>
                        <View style={styles.tooltipArrow} />
                      </View>
                    </View>
                    <View style={styles.marker} />
                  </View>
                )}
              />
            </View>
            <View>
              <Text variant="titleMedium" style={styles.title}>
                {i18n.t('(buyer).(index).products.ratings')}
              </Text>
              <View style={styles.flatListContainer}>
                <FlatList
                  horizontal
                  data={[1, 2, 3, 4, 5]}
                  contentContainerStyle={styles.horizontailFlatListContent}
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalFlatList}
                  keyExtractor={(_item, index) => index.toString()}
                  ListHeaderComponent={() => (
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        !filterSelectedRating && styles.selectedCategoryItem,
                      ]}
                      onPress={() => setFilterSelectedRating(undefined)}>
                      <Icon
                        source={'star'}
                        size={24}
                        color={
                          !filterSelectedRating
                            ? Colors.light[10]
                            : Colors.dark[10]
                        }
                      />
                      <Text
                        style={{
                          color: !filterSelectedRating
                            ? Colors.light[10]
                            : Colors.dark[10],
                        }}>
                        {i18n.t('(buyer).(index).products.all')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  renderItem={({ item }) => {
                    return (
                      <TouchableOpacity
                        style={[
                          styles.categoryItem,
                          filterSelectedRating === item &&
                          styles.selectedCategoryItem,
                        ]}
                        onPress={() => setFilterSelectedRating(item)}>
                        <Icon
                          source={'star'}
                          size={24}
                          color={
                            filterSelectedRating === item
                              ? Colors.light[10]
                              : Colors.dark[10]
                          }
                        />
                        <Text
                          variant="titleMedium"
                          style={[
                            {
                              color:
                                filterSelectedRating === item
                                  ? Colors.light[10]
                                  : Colors.dark[10],
                            },
                            styles.ratingText,
                          ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
          <View style={styles.bottomButtonContainer}>
            <Button
              style={[
                defaultStyles.button,
                defaultStyles.secondaryButton,
                styles.halfButton,
              ]}
              onPress={() => {
                sheetRef?.current?.close();

                // clear the states
                setFilterSelectedCategoryId(undefined);
                setFilterSelectedMinValue(undefined);
                setFilterSelectedMaxValue(undefined);
                setFilterSelectedRating(undefined);
              }}>
              <Text style={defaultStyles.secondaryButtonText}>
                {i18n.t('(buyer).(index).products.close')}
              </Text>
            </Button>
            <Button
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                styles.halfButton,
              ]}
              onPress={() => {
                setSelectedCategoryId(filterSelectedCategoryId);
                // set the rating
                setMinAmount(filterSelectedMinValue);
                setMaxAmount(filterSelectedMaxValue);

                // clear the states
                setFilterSelectedCategoryId(undefined);
                setFilterSelectedMinValue(undefined);
                setFilterSelectedMaxValue(undefined);
                setFilterSelectedRating(undefined);

                // close the sheet
                sheetRef?.current?.close();
              }}>
              <Text style={defaultStyles.buttonText}>
                {i18n.t('(buyer).(index).products.apply')}
              </Text>
            </Button>
          </View>
        </View>
      </FilterBottomSheet>
      <Portal>
        <Dialog
          visible={showLocationModal}
          onDismiss={() => setShowLocationModal(false)}
          style={defaultStyles.location}>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.headText}>
              {i18n.t('(auth).location.title')}
            </Text>
          </Dialog.Content>

          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(auth).location.body')}
            </Text>
          </Dialog.Content>

          <Dialog.Actions style={defaultStyles.actions}>
            <Button
              style={[defaultStyles.button, defaultStyles.halfContainer]}
              textColor={Colors.light['10']}
              onPress={() => setShowLocationModal(false)}>
              {i18n.t('(auth).location.button1')}
            </Button>
            <Button
              style={[defaultStyles.button, defaultStyles.primaryButton]}
              textColor={Colors.light['10']}
              onPress={() => {
                Linking.openSettings();
                setShowLocationModal(false);
              }}>
              {i18n.t('(auth).location.button2')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
