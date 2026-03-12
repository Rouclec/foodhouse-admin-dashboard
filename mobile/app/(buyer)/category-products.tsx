import React, { useEffect, useRef, useState, useContext } from 'react';
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
import { productsListProductsOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { Chase } from 'react-native-animated-spinkit';
import { FilterBottomSheet, Product } from '@/components';
import { FilterBottomSheetRef } from '@/components/(buyer)/(index)/FilterBottomSheet';
import { Context, ContextType } from '@/app/_layout';
import { Colors } from '@/constants';
import { Text, Icon, TextInput } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import i18n from '@/i18n';

const { width } = Dimensions.get('window');

export default function CategoryProducts() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();
  
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [count, setCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState('');
  const [minAmount, setMinAmount] = useState<string>();
  const [maxAmount, setMaxAmount] = useState<string>();

  const { user } = useContext(Context) as ContextType;
  const userCurrency = 'XAF';

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const [filterSelectedMinValue, setFilterSelectedMinValue] = useState<string>();
  const [filterSelectedMaxValue, setFilterSelectedMaxValue] = useState<string>();
  const [filterSelectedRating, setFilterSelectedRating] = useState<number>();

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
        categoryId: categoryId as string,
        search: debounceQuery,
        startKey: '',
        isApproved: true,
      },
    }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <KeyboardAvoidingView
      style={defaultStyles.flex}
      behavior={'padding'}
      keyboardVerticalOffset={0}>
      <View style={[defaultStyles.flex, styles.bgWhite]}>
        <View style={styles.appHeader}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.appHeaderContent}>
              <View style={styles.appHeaderTopContainer}>
                <TouchableOpacity
                  style={defaultStyles.backButtonContainer}
                  onPress={() => router.back()}>
                  <Feather name="chevron-left" size={28} color={Colors.light[10]} />
                </TouchableOpacity>
                <Text variant="titleMedium" style={styles.categoryTitle}>
                  {categoryName}
                </Text>
                <View style={defaultStyles.backButtonContainer} />
              </View>
              <TextInput
                placeholder={i18n.t('(buyer).(index).products.searchProducts')}
                placeholderTextColor={Colors.grey['bd']}
                style={[defaultStyles.input, styles.searchInput]}
                outlineStyle={styles.searchInputOutline}
                value={searchQuery}
                onChangeText={text => setSearchQuery(text)}
                mode="outlined"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Feather name="search" size={20} color={Colors.grey['bd']} />
                    )}
                    size={24}
                    color={Colors.grey['61']}
                  />
                }
                right={
                  <TextInput.Icon
                    onPress={e => {
                      Keyboard.dismiss();
                      sheetRef.current?.open();
                    }}
                    icon={() => (
                      <Image source={require('@/assets/images/filter-icon.jpg')} />
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
              { paddingBottom: 100 },
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
            renderItem={({ item }) => (
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
            )}
            onScrollBeginDrag={() => {
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
      <FilterBottomSheet ref={sheetRef} sheetHeight={400}>
        <View style={styles.filtersContainer}>
          <Text variant="titleMedium" style={styles.title}>
            {i18n.t('(buyer).(index).products.filter')}
          </Text>
          <View style={styles.mainFilterContainer}>
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
                  <View style={[defaultStyles.relativeContainer, defaultStyles.center]}>
                    <View style={styles.tooltipContainer}>
                      <View style={styles.tooltip}>
                        <Text variant="titleMedium" style={styles.tooltipText} numberOfLines={1}>
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
          </View>
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[defaultStyles.button, defaultStyles.secondaryButton, styles.halfButton]}
              onPress={() => {
                sheetRef?.current?.close();
                setFilterSelectedMinValue(undefined);
                setFilterSelectedMaxValue(undefined);
                setFilterSelectedRating(undefined);
              }}>
              <Text style={defaultStyles.secondaryButtonText}>
                {i18n.t('(buyer).(index).products.close')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[defaultStyles.button, defaultStyles.primaryButton, styles.halfButton]}
              onPress={() => {
                setMinAmount(filterSelectedMinValue);
                setMaxAmount(filterSelectedMaxValue);
                setFilterSelectedMinValue(undefined);
                setFilterSelectedMaxValue(undefined);
                setFilterSelectedRating(undefined);
                sheetRef?.current?.close();
              }}>
              <Text style={defaultStyles.buttonText}>
                {i18n.t('(buyer).(index).products.apply')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </FilterBottomSheet>
    </KeyboardAvoidingView>
  );
}
