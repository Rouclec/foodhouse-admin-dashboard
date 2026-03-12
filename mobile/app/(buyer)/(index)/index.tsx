import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { defaultStyles, buyerProductsStyles as styles } from '@/styles';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  productsListCategoriesOptions,
} from '@/client/products.swagger/@tanstack/react-query.gen';
import { ordersListSubscriptionPlansOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { ordersgrpcSubscription } from '@/client/orders.swagger';
import { useContext } from 'react';
import { Context, ContextType } from '@/app/_layout';
import {
  Button,
  Dialog,
  Portal,
  Text,
  Icon,
  TextInput,
} from 'react-native-paper';
import i18n from '@/i18n';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { CategoryCard } from '@/components/(buyer)/(index)/CategoryCard';
import { CartBottomSheet, CartBottomSheetRef } from '@/components/(buyer)/(index)/CartBottomSheet';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const params = useLocalSearchParams();
  // const [settingUp, setSettingUp] = useState(true);

  // const [userLocation, setUserLocation] = useState<{
  //   lat: number;
  //   lon: number;
  // } | null>(null);
  // const [locationError, setLocationError] = useState<string | null>(null);

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
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (params.openCart === 'true') {
      cartSheetRef.current?.open();
      router.setParams({ openCart: undefined });
    }
  }, [params.openCart]);

  const router = useRouter();

  const { user, cartItems } = useContext(Context) as ContextType;
  const cartCount = cartItems.length;

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions(),
    placeholderData: keepPreviousData,
  });

  // Filter out categories with no products (uncomment after deployment when productCount is populated)
  // const filteredCategories = categories?.categories?.filter(cat =>
  //   (cat.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
  //   (Number(cat.productCount) || 0) > 0
  // ) || [];
  
  const filteredCategories = categories?.categories?.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Fetch subscription plans for the slider
  const { data: subscriptionPlansData, isLoading: isSubscriptionPlansLoading } =
    useQuery({
      ...ordersListSubscriptionPlansOptions({
        path: {
          userId: user?.userId ?? '',
        },
      }),
    });

  // control variables for filter container.
  const cartSheetRef = useRef<CartBottomSheetRef>(null);

  const plans = subscriptionPlansData?.subscriptionPlans || [];

  const PackageCard = ({ item }: { item: ordersgrpcSubscription }) => (
    <TouchableOpacity
      key={item.id}
      // style={styles.planCard}
      onPress={() =>
        router.push({
          pathname: '/(payment)/package-details',
          params: { planId: item.id },
        })
      }>
      <View style={styles.packageContainer}>
        <Text style={styles.packageTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>

        <View style={styles.packageRight}>
          <Text style={[styles.packageAmount, { color: Colors.primary['500'] }]}>
            {item.amount?.value != null
              ? `${item.amount.value.toLocaleString()} ${item.amount.currencyIsoCode ?? ''
                }`.trim()
              : ''}
          </Text>
          <Icon source="chevron-right" size={20} color={Colors.primary[500]} />
        </View>
      </View>
    </TouchableOpacity>
  );

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
                  <View style={styles.iconContainer} />

                  <TouchableOpacity
                    style={styles.iconContainer}
                    onPress={() => {
                      if (cartItems.length === 0) {
                        return;
                      }

                      cartSheetRef.current?.open();
                    }}>
                    <View style={defaultStyles.relativeContainer}>
                      <Icon
                        source={'cart'}
                        size={32}
                        color={Colors.primary[500]}
                      />

                      {cartCount > 0 && (
                        <View style={defaultStyles.cardContainer}>
                          <Text style={defaultStyles.cardText}>
                            {cartCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.searchContainer, { marginTop: 12 }]}>
                <TextInput
                  placeholder={i18n.t('(buyer).(index).products.searchCategories') || 'Search categories...'}
                  placeholderTextColor={Colors.grey['bd']}
                  style={[styles.searchInput]}
                  outlineStyle={styles.searchInputOutline}
                  value={searchQuery}
                  onChangeText={text => setSearchQuery(text)}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <Icon source="magnify" size={20} color={Colors.grey['bd']} />
                      )}
                    />
                  }
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey['fa'],
                    },
                    roundness: 16,
                  }}
                />
              </View>
            </SafeAreaView>
          </View>

          <View style={styles.subscriptionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text
                variant="titleMedium"
                style={[styles.title, styles.sectionHeaderTitle]}>
                {i18n.t('(subscription).OurPackages')}
              </Text>
              <View style={styles.sectionHeaderRight}>
                <TouchableOpacity
                  onPress={() => router.push('../(payment)/subscription')}>
                  <Text style={[styles.title1, styles.sectionHeaderLink]}>
                    {i18n.t('(subscription).SeeAll')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              horizontal
              data={plans}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              keyExtractor={(item, index) => item.id ?? index.toString()}
              renderItem={({ item }) => <PackageCard item={item} />}
            />
          </View>

          <View style={styles.categoriesContainer}>
            <View style={[styles.sectionHeaderRow, styles.sectionHeaderRowTight]}>
              <Text
                variant="titleMedium"
                style={[styles.title, styles.sectionHeaderTitle]}>
                {i18n.t('(buyer).(index).products.categories')}
              </Text>
            </View>

            {isCategoriesLoading && !categories ? (
              <View style={defaultStyles.center}>
                <Chase size={24} color={Colors.primary[500]} />
              </View>
            ) : (
              <FlatList
                data={filteredCategories}
                contentContainerStyle={[
                  styles.categoriesGridContent,
                  { paddingBottom: 100 },
                ]}
                numColumns={2}
                columnWrapperStyle={styles.categoriesRow}
                keyExtractor={(item, index) => item?.id ?? index.toString()}
                renderItem={({ item }) => (
                  <CategoryCard
                    category={item}
                    isSelected={false}
                    productCount={Number(item.productCount) || 0}
                    onPress={() =>
                      router.push({
                        pathname: '/(buyer)/category-products',
                        params: { categoryId: item?.id, categoryName: item?.name },
                      })
                    }
                  />
                )}
                ListEmptyComponent={
                  searchQuery ? (
                    <View style={defaultStyles.noItemsContainer}>
                      <Text style={defaultStyles.noItems}>
                        No categories found
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
      <CartBottomSheet ref={cartSheetRef} />
    </>
  );
}
