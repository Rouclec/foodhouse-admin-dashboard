import Colors from '@/constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useContext, useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  HelperText,
  Icon,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { defaultStyles, createProductStyles as styles } from '@/styles';
import i18n from '@/i18n';
import { CurrencySelect, Dropdown, ImagePicker } from '@/components';
import { CAMEROON } from '@/constants';
import { Country } from '@/interface';
import { delay, uploadImage } from '@/utils';
import moment from 'moment';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  productsUpdateProductMutation,
  productsGetProductOptions,
  productsListCategoriesOptions,
  productsListPriceTypesOptions,
  productsListProductNamesOptions,
} from '@/client/products.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '../_layout';

export default function UpdateProduct() {
  const { user } = useContext(Context) as ContextType;
  const router = useRouter();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [errorLoadingProduct, setErrorLoadingProduct] = useState(false);

  const [productCategory, setProductCategory] = useState<string>();
  const [priceType, setPriceType] = useState<string>();
  const [productName, setProductName] = useState<string>();
  const [price, setPrice] = useState<string>();
  const [currencyCountry, setCurrencyCountry] = useState<Country>(CAMEROON);
  const [description, setDescription] = useState<string>();
  const [image, setImage] = useState<ExpoImagePicker.ImagePickerAsset>();
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>();
  const [validationError, setValidationError] = useState({
    productCategory: '',
    productName: '',
    priceType: '',
    price: '',
    description: '',
  });

  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (params?.productId) {
        setProductId(params.productId as string);
      } else {
        setErrorLoadingProduct(true);
        setError(i18n.t('(farmer).update-product.noProductIdFound'));
      }
    } catch (error) {
      setErrorLoadingProduct(true);
      console.error('error getting product from params: ', error);
      setError(i18n.t('(farmer).update-product.errorLoadingProduct'));
    }
  }, [params?.productId]);

  const { data: productData, refetch } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: productId ?? '',
      },
    }),
    enabled: !!productId,
  });

  useEffect(() => {
    if (productData?.product) {
      const product = productData.product;
      setProductCategory(product.category?.id ?? '');
      setProductName(product.name ?? '');
      setPriceType(product.unitType ?? '');
      setPrice(product.amount?.value?.toString() ?? '');
      setDescription(product.description ?? '');
      if (product.image) {
        setImage({
          uri: product.image,
          fileName: 'product_image',
        } as ExpoImagePicker.ImagePickerAsset);
      } else {
        setImage(undefined);
      }
      if (product.amount?.currencyIsoCode) {
        setCurrencyCountry(
          product.amount.currencyIsoCode === CAMEROON.currency_code
            ? CAMEROON
            : CAMEROON,
        );
      }
    }
  }, [productData]);

  const onImagePickerClose = () => {
    setIsImagePickerVisible(false);
  };

  const handleUpdateProduct = async () => {
    try {
      if (!productCategory) {
        setValidationError(prev => ({
          ...prev,
          productCategory: i18n.t(
            '(farmer).create-product.pleaseSelectACategory',
          ),
        }));
      }
      if (!productName) {
        setValidationError(prev => ({
          ...prev,
          productName: i18n.t(
            '(farmer).create-product.pleaseEnterAProductName',
          ),
        }));
      }
      if (!priceType) {
        setValidationError(prev => ({
          ...prev,
          priceType: i18n.t('(farmer).create-product.pleaseEnterAPriceType'),
        }));
      }
      if (!price) {
        setValidationError(prev => ({
          ...prev,
          price: i18n.t('(farmer).create-product.pleaseEnterThePrice'),
        }));
      }
      if (!description) {
        setValidationError(prev => ({
          ...prev,
          description: i18n.t(
            '(farmer).create-product.pleaseEnterADescription',
          ),
        }));
      }

      if (!image?.uri) {
        setError(i18n.t('(farmer).create-product.pleaseSelectAnImage'));
        await delay(5000);
        setError(undefined);
      }

      if (
        !image?.uri ||
        !productCategory ||
        !productName ||
        !priceType ||
        !price ||
        !description ||
        !productId
      ) {
        return;
      }

      setLoading(true);
      let downloadURL = image.uri;
      if (image.uri !== productData?.product?.image) {
        downloadURL = await uploadImage({
          uri: image.uri,
          directory: '/products',
          filename: `${image?.fileName ?? 'product'}-${moment()}`,
        });
      }

      await updateMutation.mutateAsync({
        body: {
          categoryId: productCategory,
          name: productName,
          unitType: priceType,
          amount: {
            value: parseFloat(price ?? ''),
            currencyIsoCode: currencyCountry.currency_code,
          },
          description: description,
          image: downloadURL,
          wholeSale: false,
        },
        path: {
          userId: user?.userId ?? '',
          productId: productId,
        },
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const updateMutation = useMutation({
    ...productsUpdateProductMutation(),
    onSuccess: async () => {
    setSuccessMessage(i18n.t('(farmer).create-product.message'));
    await delay(3000);
    setSuccessMessage(undefined);
    refetch();
    router.back();
  },
    onError: async error => {
      setError(
        error?.response?.data?.message ??
          i18n.t('(farmer).update-product.unknownError'),
      );
      await delay(5000);
      setError(undefined);
    },
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions(),
  });

  const { data: priceTypes, isLoading: isPriceTypesLoading } = useQuery({
    ...productsListPriceTypesOptions({
      query: {
        categoryId: productCategory ?? '',
      },
    }),
    enabled: !!productCategory,
  });

  const { data: productNames, isLoading: isProductNamesLoading } = useQuery({
    ...productsListProductNamesOptions({
      query: {
        categoryId: productCategory ?? '',
      },
    }),
    enabled: !!productCategory,
  });

  const handleFieldPress = (fieldName: string) => {
    setEditingField(fieldName);
  };

  const handleFieldBlur = () => {
    setEditingField(null);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={[defaultStyles.container]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(farmer).create-product.editProduct')}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View
              style={[defaultStyles.inputsContainer, styles.inputsContainer]}>
              {/* Product Category */}
              {editingField === 'productCategory' ? (
                <Dropdown
                  label={i18n.t('(farmer).create-product.productCategory')}
                  value={productCategory}
                  onSelect={value => {
                    setProductCategory(value);
                    setEditingField(null);
                  }}
                  data={(categories?.categories ?? []).map(category => ({
                    label: category.name ?? '',
                    value: category.id ?? '',
                  }))}
                  loading={isCategoriesLoading}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditingField('productCategory');
                    if (!categories) {
                      refetch();
                    }
                  }}
                  style={styles.inputContainer}
                  activeOpacity={0.7}>
                  <Text style={styles.inputLabel}>
                    {i18n.t('(farmer).create-product.productCategory')}
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      editingField === 'productCategory'
                        ? styles.editableField
                        : null,
                    ]}>
                    {categories?.categories?.find(c => c.id === productCategory)
                      ?.name || 'Select category'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Product Name */}
              {editingField === 'productName' ? (
                <Dropdown
                  label={i18n.t('(farmer).create-product.productName')}
                  value={productName}
                  onSelect={value => {
                    setProductName(value);
                    setEditingField(null);
                  }}
                  data={(productNames?.productNames ?? []).map(product => ({
                    label: product.name ?? '',
                    value: product.name ?? '',
                  }))}
                  loading={isProductNamesLoading}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditingField('productName');
                    if (!productNames && productCategory) {
                      refetch();
                    }
                  }}
                  style={styles.inputContainer}
                  activeOpacity={0.7}>
                  <Text style={styles.inputLabel}>
                    {i18n.t('(farmer).create-product.productName')}
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      editingField === 'productName'
                        ? styles.editableField
                        : null,
                    ]}>
                    {productName || 'Select product name'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Price Type */}
              {editingField === 'priceType' ? (
                <Dropdown
                  label={i18n.t('(farmer).create-product.priceType')}
                  value={priceType}
                  onSelect={value => {
                    setPriceType(value);
                    setEditingField(null);
                  }}
                  data={(priceTypes?.priceTypes ?? []).map(type => ({
                    label: `Per ${type.slug?.replace('per_', '') ?? ''}`,
                    value: type.slug ?? '',
                  }))}
                  loading={isPriceTypesLoading}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => handleFieldPress('priceType')}
                  style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {i18n.t('(farmer).create-product.priceType')}
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      editingField === 'priceType'
                        ? styles.editableField
                        : null,
                    ]}>
                    {priceTypes?.priceTypes
                      ?.find(pt => pt.slug === priceType)
                      ?.slug?.replace('per_', 'Per ') || 'Select price type'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Currency */}
              {editingField === 'currency' ? (
                <CurrencySelect
                  setCountry={country => {
                    setCurrencyCountry(country);
                    setEditingField(null);
                  }}
                  country={currencyCountry}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => handleFieldPress('currency')}
                  style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {i18n.t('(farmer).create-product.currency')}
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      editingField === 'currency' ? styles.editableField : null,
                    ]}>
                    {currencyCountry.currency_code ?? 'N/A'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Price */}
              {editingField === 'price' ? (
                <View>
                  <TextInput
                    label={i18n.t('(farmer).create-product.price')}
                    mode="outlined"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={text => setPrice(text)}
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
                    error={!!validationError.price}
                    onFocus={() => {
                      setValidationError(prev => ({
                        ...prev,
                        price: '',
                      }));
                    }}
                    onBlur={handleFieldBlur}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleFieldPress('price')}
                  style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {i18n.t('(farmer).create-product.price')}
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      editingField === 'price' ? styles.editableField : null,
                    ]}>
                    {price ? ` ${price}` : 'N/A'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Description */}
              {editingField === 'description' ? (
                <View>
                  <TextInput
                    label={i18n.t('(farmer).create-product.description')}
                    mode="outlined"
                    multiline
                    value={description}
                    onChangeText={text => setDescription(text)}
                    style={[defaultStyles.input, styles.textArea]}
                    theme={{
                      colors: {
                        primary: Colors.primary[500],
                        background: Colors.grey['fa'],
                        error: Colors.error,
                      },
                      roundness: 10,
                    }}
                    outlineColor={Colors.grey['bg']}
                    error={!!validationError.description}
                    onFocus={() => {
                      setValidationError(prev => ({
                        ...prev,
                        description: '',
                      }));
                    }}
                    onBlur={handleFieldBlur}
                  />
                  <HelperText type="error" style={defaultStyles.errorText}>
                    {validationError.description}
                  </HelperText>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleFieldPress('description')}
                  style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {i18n.t('(farmer).create-product.description')}
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      styles.textAreaValue,
                      editingField === 'description'
                        ? styles.editableField
                        : null,
                    ]}>
                    {description ?? 'N/A'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Image */}
              <View style={styles.addImageContainer}>
                <Text variant="titleLarge" style={styles.addImageTitle}>
                  {i18n.t('(farmer).create-product.productImage')}
                </Text>
                <View style={styles.addImageBox}>
                  {image?.uri ? (
                    <TouchableOpacity
                      onPress={() => setIsImagePickerVisible(true)}
                      style={styles.imageContainer}>
                      <TouchableOpacity
                        style={styles.deleteImageButton}
                        onPress={() => setImage(undefined)}>
                        <Icon
                          source={'close'}
                          size={24}
                          color={Colors.light[10]}
                        />
                      </TouchableOpacity>
                      <Image
                        source={{ uri: image?.uri }}
                        style={styles.image}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.addIcon}
                      onPress={() => setIsImagePickerVisible(true)}>
                      <Icon
                        source={'plus'}
                        size={48}
                        color={Colors.light[10]}
                      />
                      <Text style={styles.uploadImageText}>
                        {i18n.t('(farmer).create-product.uploadImage')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
        <View style={defaultStyles.bottomButtonContainer}>
          <View style={styles.flexButtonContainer}>
            <Button
              mode="contained"
              textColor={Colors.primary['500']}
              buttonColor={Colors.primary['50']}
              style={[defaultStyles.button, styles.button]}
              disabled={loading}
              onPress={() => {
                router.back();
              }}>
              <Text style={defaultStyles.secondaryButtonText}>
                {i18n.t('(farmer).create-product.cancel')}
              </Text>
            </Button>
            <Button
              mode="contained"
              textColor={Colors.light['0']}
              buttonColor={Colors.primary['500']}
              style={[defaultStyles.button, styles.button]}
              loading={loading}
              disabled={loading}
              onPress={handleUpdateProduct}>
              <Text style={defaultStyles.buttonText}>
                {i18n.t('(farmer).create-product.save')}
              </Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImagePicker
        setImage={setImage}
        onClose={onImagePickerClose}
        visible={isImagePickerVisible}
        aspect={[16, 9]}
      />
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage(undefined)}
        duration={3000}
        style={defaultStyles.snackbarSuccess}>
        <Text style={defaultStyles.successText}>{successMessage}</Text>
      </Snackbar>

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
