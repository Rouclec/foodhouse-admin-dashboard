import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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
import { useContext } from 'react';
import { Context, ContextType } from '@/app/_layout';
import {
  ActivityIndicator,
  Button,
  Icon,
  Text,
  TextInput,
} from 'react-native-paper';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';
import { CAMEROON, Colors, countries } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { FilterBottomSheet, Product } from '@/components';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FilterBottomSheetRef } from '@/components/(buyer)/(index)/FilterBottomSheet';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import * as Location from 'expo-location';

const HOUR_OF_DAY = new Date().getHours();
const { width } = Dimensions.get('window');

export default function BuyerProducts() {
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState('');
  const [count, setCount] = useState(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const [minAmount, setMinAmount] = useState<string>();
  const [maxAmount, setMaxAmount] = useState<string>();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const userCurrency =
    countries.find(country => country.code === user?.residenceCountryIsoCode)
      ?.currency_code ?? CAMEROON.currency_code;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setUserLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch (error) {
        console.warn('Error getting location:', error);
        setLocationError('Could not get location');
      }
    })();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions(),
    placeholderData: keepPreviousData,
  });
  const {
    isLoading: isProductsLoading,
    data,
    refetch,
  } = useQuery({
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

       
          'userLocation.lat': userLocation?.lat,
          'userLocation.lon': userLocation?.lon,

        categoryId: selectedCategoryId,
        search: debounceQuery,
        startKey: '',
        isApproved: true,
      },
    }),
    enabled: !!userLocation,
    placeholderData: keepPreviousData,
  });

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

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
                  {/* <TouchableOpacity style={styles.iconContainer}>
                    <View style={defaultStyles.relativeContainer}>
                      <Icon
                        source={'bell-outline'}
                        size={24}
                        color={Colors.dark[10]}
                      />
                      <View style={styles.noticiatonIndicator} />
                    </View>
                  </TouchableOpacity> */}
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
          {isProductsLoading && !data ? (
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
                onValuesChangeStart={() => {}}
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
    </>
  );
}
