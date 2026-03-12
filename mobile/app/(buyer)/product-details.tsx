import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { defaultStyles, productDetailsStyles as styles } from '@/styles';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { Appbar, Button, Icon, Snackbar, Text } from 'react-native-paper';
import i18n from '@/i18n';
import { Context, ContextType } from '../_layout';
import { useQuery } from '@tanstack/react-query';
import { productsGetProductOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import { usersGetFarmerByIdOptions } from '@/client/users.swagger/@tanstack/react-query.gen';
import { formatAmount } from '@/utils/amountFormater';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

export default function ProductDetails() {
  const { user, productId, setProductId, addToCart, cartItems } = useContext(
    Context,
  ) as ContextType;
  const [errorLoadingProduct, setErrorLoadingProduct] = useState(false);

  const params = useLocalSearchParams();
  const router = useRouter();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarAction, setSnackbarAction] = useState<'success' | 'info'>(
    'success',
  );

  useEffect(() => {
    try {
      setProductId(params?.productId as string);
    } catch (error) {
      setErrorLoadingProduct(true);
      console.error('error getting product from params: ', error);
    }
  }, []);

  const { data, isError, isLoading } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: productId ?? '',
      },
    }),
    enabled: !!productId,
  });

  const { data: farmer, isLoading: _isFarmerLoading } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        farmerId: data?.product?.createdBy ?? '',
        userId: user?.userId ?? '',
      },
    }),
    enabled: !!data,
  });

  const insets = useSafeAreaInsets();

  const handleAddToCart = async () => {
    if (!data?.product) return;
    try {
      const productExists = cartItems.some(
        item => item.id === data.product!.id,
      );

      if (productExists) {
        setSnackbarMessage(i18n.t('This item is already in your cart.'));
        setSnackbarAction('info');
        setSnackbarVisible(true);
        return;
      }

      await addToCart(data.product);

      setSnackbarMessage(i18n.t('Item added to cart!'));
      setSnackbarAction('success');
      setSnackbarVisible(true);

      router.replace('/(buyer)/(index)?openCart=true');
    } catch (error) {
      setSnackbarMessage(error as string);
      setSnackbarAction('info');
      setSnackbarVisible(true);
      return;
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
            <View
              style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (isError || errorLoadingProduct) {
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
            <View
              style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
              <Text>{i18n.t('(buyer).product-details.couldNotLoad')}</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <>
      <View
        style={[
          defaultStyles.flex,
          defaultStyles.bgWhite,
          {
            paddingBottom: insets.bottom,
          },
        ]}>
        <View style={styles.imageBackground}>
          <Image
            source={{ uri: data?.product?.image }}
            style={StyleSheet.absoluteFillObject}
          />
          <Appbar.Header
            style={[defaultStyles.appHeader, styles.bgTransparent]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} color={Colors.light[10]} />
            </TouchableOpacity>
          </Appbar.Header>
        </View>
        <ScrollView
          contentContainerStyle={defaultStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <View>
              <Text variant="titleMedium" style={styles.productName}>
                {data?.product?.name}
              </Text>
              {/* <View>
                Product rating container
              </View> */}
            </View>
            <View style={styles.rowGap12}>
              <Text variant="titleMedium">
                {i18n.t('(buyer).product-details.description')}
              </Text>
              <Text style={styles.justifyText} variant="bodyLarge">
                {data?.product?.description}
              </Text>
            </View>
            <View style={styles.rowGap12}>
              <Text variant="titleMedium">
                {i18n.t('(buyer).product-details.farmer')}
              </Text>
              <View style={styles.farmerDetailscontainer}>
                <View style={styles.farmerProfileImageContainer}>
                  <Image
                    source={{ uri: farmer?.user?.profileImage }}
                    style={styles.profileImage}
                    placeholder={require('@/assets/images/avatar.png')} // Optional placeholder
                    contentFit="cover"
                    transition={500}
                  />
                </View>
                <View style={styles.nameAndCheckContainer}>
                  <Text variant="titleMedium" style={styles.farmerName}>
                    {farmer?.user?.firstName} {farmer?.user?.lastName}
                  </Text>
                </View>
              </View>
              <View style={styles.locationContainer}>
                <Icon
                  size={18}
                  color={Colors.dark['0']}
                  source={'map-marker-radius-outline'}
                />
                {farmer?.user?.address && (
                  <Text variant="titleMedium" style={styles.locationText}>
                    {farmer?.user?.address}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
        <SafeAreaView>
          <View
            style={[defaultStyles.bottomContainerWithContent, styles.flexRow]}>
            <View style={defaultStyles.flexShrink}>
              <Text style={styles.priceLabel}>
                {i18n.t('(buyer).product-details.price')}
              </Text>
              <Text style={styles.price} variant="titleMedium">
                {data?.product?.amount?.currencyIsoCode}{' '}
                {formatAmount(data?.product?.amount?.value ?? '', {
                  decimalPlaces: 2,
                })}
                <Text style={styles.greyText}>
                  {' '}
                  {data?.product?.unitType?.replace('per_', '/')}
                </Text>
              </Text>
            </View>
            <Button
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                styles.halfContainer,
              ]}
              onPress={handleAddToCart}>
              <Text style={defaultStyles.buttonText}>
                {i18n.t('(buyer).product-details.orderNow')}
              </Text>
            </Button>
          </View>
        </SafeAreaView>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={
          snackbarAction === 'success'
            ? defaultStyles.successSnackBar
            : defaultStyles.snackbar
        }>
        <Text
          style={
            snackbarAction === 'success'
              ? defaultStyles.primaryText
              : defaultStyles.errorText
          }>
          {snackbarMessage}
        </Text>
      </Snackbar>
    </>
  );
}
