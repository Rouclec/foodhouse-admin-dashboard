import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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
} from "react-native-paper";
import * as ExpoImagePicker from "expo-image-picker";
import { defaultStyles, createProductStyles as styles } from "@/styles";
import i18n from "@/i18n";
import { CurrencySelect, Dropdown, ImagePicker } from "@/components";
import { CAMEROON } from "@/constants";
import { Country } from "@/interface";
import { delay, uploadImage } from "@/utils";
import moment from "moment";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  productsCreateProductMutation,
  productsListCategoriesOptions,
  productsListPriceTypesByCategoryOptions,
  productsListProductNamesByCategoryOptions,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "../_layout";

export default function ForgotPasswordEmailOtp() {
  const { user } = useContext(Context) as ContextType;
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [productCategory, setProductCateogry] = useState<string>();
  const [priceType, setPriceType] = useState<string>();
  const [productName, setProductName] = useState<string>();
  const [price, setPrice] = useState<string>();
  const [currencyCountry, setCurrencyCountry] = useState<Country>(CAMEROON);
  const [description, setDescription] = useState<string>();
  const [image, setImage] = useState<ExpoImagePicker.ImagePickerAsset>();
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationError, setValidationError] = useState({
    productCategory: "",
    productName: "",
    priceType: "",
    price: "",
    description: "",
  });

  const onImagePickerClose = () => {
    setIsImagePickerVisible(false);
  };

  const handleCreateProduct = async () => {
    try {
      if (!productCategory) {
        setValidationError((prev) => {
          return {
            ...prev,
            productCategory: i18n.t(
              "(farmer).create-product.pleaseSelectACategory"
            ),
          };
        });
      }
      if (!productName) {
        setValidationError((prev) => {
          return {
            ...prev,
            productName: i18n.t(
              "(farmer).create-product.pleaseEnterAProductName"
            ),
          };
        });
      }
      if (!priceType) {
        setValidationError((prev) => {
          return {
            ...prev,
            priceType: i18n.t("(farmer).create-product.pleaseEnterAPriceType"),
          };
        });
      }
      if (!price) {
        setValidationError((prev) => {
          return {
            ...prev,
            price: i18n.t("(farmer).create-product.pleaseEnterThePrice"),
          };
        });
      }
      if (!description) {
        setValidationError((prev) => {
          return {
            ...prev,
            description: i18n.t(
              "(farmer).create-product.pleaseEnterADescription"
            ),
          };
        });
      }

      if (!image?.uri) {
        setError(i18n.t("(farmer).create-product.pleaseSelectAnImage"));
        await delay(5000);
        setError(undefined);
      }

      if (
        !image?.uri ||
        !productCategory ||
        !productName ||
        !priceType ||
        !price ||
        !description
      )
        return;

      setLoading(true);
      const downloadURL = await uploadImage({
        uri: image.uri,
        directory: "/products",
        filename: `${
          image?.fileName ?? "product"
        }-${moment().toLocaleString()}`,
      });

      await mutateAsync({
        body: {
          categoryId: productCategory,
          name: productName,
          unitType: priceType,
          amount: {
            value: price,
            currencyIsoCode: currencyCountry.currency_code,
          },
          description: description,
          image: downloadURL,
          wholeSale: false,
        },
        path: {
          userId: user?.userId ?? "",
        },
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const resetInputs = () => {
    setValidationError({
      productCategory: "",
      productName: "",
      priceType: "",
      price: "",
      description: "",
    });
    setProductCateogry("undefined");
    setProductName("");
    setPrice("");
    setImage(undefined);
    setPriceType("");
    setDescription("");
  };

  const { mutateAsync } = useMutation({
    ...productsCreateProductMutation(),
    onSuccess: async () => {
      setShowSuccessModal(true);
      resetInputs();
      await delay(3000);
      setShowSuccessModal(false);
    },
    onError: async (error) => {
      setError(
        error?.response?.data?.message ??
          i18n.t("(farmer).create-product.unknownError")
      );
      await delay(5000);
      setError(undefined);
    },
  });
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions(),
  });

  const { data: priceTypes, isLoading: isPriceTypesLoading } = useQuery({
    ...productsListPriceTypesByCategoryOptions({
      path: {
        categoryId: productCategory ?? "",
      },
    }),
    enabled: !!productCategory,
  });

  const { data: productNames, isLoading: isProductNamesLoading } = useQuery({
    ...productsListProductNamesByCategoryOptions({
      path: {
        categoryId: productCategory ?? "",
      },
    }),
    enabled: !!productCategory,
  });

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        // behavior={Platform.OS === "ios" ? "padding" : undefined}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <View style={defaultStyles.flex}>
            <Appbar.Header dark={false} style={defaultStyles.appHeader}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={defaultStyles.backButtonContainer}
              >
                <Icon source={"arrow-left"} size={24} />
              </TouchableOpacity>
              <Text variant="titleMedium" style={defaultStyles.heading}>
                {i18n.t("(farmer).create-product.addNewProduct")}
              </Text>
              <View />
            </Appbar.Header>
            <ScrollView
              contentContainerStyle={defaultStyles.scrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={[defaultStyles.inputsContainer, styles.inputsContainer]}
              >
                <Dropdown
                  label={i18n.t("(farmer).create-product.productCategory")}
                  value={productCategory}
                  onSelect={(value) => setProductCateogry(value)}
                  data={(categories?.categories ?? [])?.map((category) => {
                    return {
                      label: category.name ?? "",
                      value: category.id ?? "",
                    };
                  })}
                  loading={isCategoriesLoading}
                  onFocus={() => {
                    setValidationError((prev) => {
                      return {
                        ...prev,
                        productCategory: "",
                      };
                    });
                  }}
                  error={validationError.productCategory}
                />
                <Dropdown
                  label={i18n.t("(farmer).create-product.productName")}
                  value={productName}
                  onSelect={(value) => setProductName(value)}
                  data={(productNames?.productNames ?? [])?.map(
                    (productName) => {
                      return {
                        label: productName.name ?? "",
                        value: productName.name ?? "",
                      };
                    }
                  )}
                  loading={isProductNamesLoading}
                  onFocus={() => {
                    setValidationError((prev) => {
                      return {
                        ...prev,
                        productName: "",
                      };
                    });
                  }}
                  error={validationError.productName}
                />
                <Dropdown
                  label={i18n.t("(farmer).create-product.priceType")}
                  value={priceType}
                  onSelect={(value) => setPriceType(value)}
                  data={(priceTypes?.priceTypes ?? [])?.map((priceType) => {
                    return {
                      label: priceType.name ?? "",
                      value: priceType.id ?? "",
                    };
                  })}
                  loading={isPriceTypesLoading}
                  onFocus={() => {
                    setValidationError((prev) => {
                      return {
                        ...prev,
                        priceType: "",
                      };
                    });
                  }}
                  error={validationError.priceType}
                />
                <CurrencySelect
                  setCountry={setCurrencyCountry}
                  country={currencyCountry}
                />
                <View>
                  <TextInput
                    label={i18n.t("(farmer).create-product.price")}
                    mode="outlined"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={(text) => setPrice(text)}
                    style={defaultStyles.input}
                    theme={{
                      colors: {
                        primary: Colors.primary[500],
                        background: Colors.grey["fa"],
                        error: Colors.error,
                      },
                      roundness: 10,
                    }}
                    outlineColor={Colors.grey["bg"]}
                    error={!!validationError.price}
                    onFocus={() => {
                      setValidationError((prev) => {
                        return {
                          ...prev,
                          price: "",
                        };
                      });
                    }}
                  />
                  <HelperText type="error" style={defaultStyles.errorText}>
                    {validationError.price}
                  </HelperText>
                </View>
                <View>
                  <TextInput
                    label={i18n.t("(farmer).create-product.description")}
                    mode="outlined"
                    multiline
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                    style={[defaultStyles.input, styles.textArea]}
                    theme={{
                      colors: {
                        primary: Colors.primary[500],
                        background: Colors.grey["fa"],
                        error: Colors.error,
                      },
                      roundness: 10,
                    }}
                    outlineColor={Colors.grey["bg"]}
                    error={!!validationError.description}
                    onFocus={() => {
                      setValidationError((prev) => {
                        return {
                          ...prev,
                          description: "",
                        };
                      });
                    }}
                  />
                  <HelperText type="error" style={defaultStyles.errorText}>
                    {validationError.description}
                  </HelperText>
                </View>
                <View style={styles.addImageContainer}>
                  <Text variant="titleLarge" style={styles.addImageTitle}>
                    {i18n.t("(farmer).create-product.productImage")}
                  </Text>
                  <View style={styles.addImageBox}>
                    {image?.uri ? (
                      <View style={styles.imageContainer}>
                        <TouchableOpacity
                          style={styles.deleteImageButton}
                          onPress={() => setImage(undefined)}
                        >
                          <Icon
                            source={"close"}
                            size={24}
                            color={Colors.light[10]}
                          />
                        </TouchableOpacity>
                        <Image
                          source={{ uri: image?.uri }}
                          style={styles.image}
                        />
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.addIcon}
                          onPress={() => setIsImagePickerVisible(true)}
                        >
                          <Icon
                            source={"plus"}
                            size={48}
                            color={Colors.light[10]}
                          />
                        </TouchableOpacity>
                        <Text style={styles.uploadImageText}>
                          {i18n.t("(farmer).create-product.uploadImage")}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
        <View style={defaultStyles.bottomButtonContainer}>
          <View style={styles.flexButtonContainer}>
            <Button
              mode="contained"
              textColor={Colors.primary["500"]}
              buttonColor={Colors.primary["50"]}
              style={[defaultStyles.button, styles.button]}
              disabled={loading}
              onPress={() => router.back()}
            >
              <Text style={defaultStyles.secondaryButtonText}>
                {i18n.t("(farmer).create-product.cancel")}
              </Text>
            </Button>
            <Button
              mode="contained"
              textColor={Colors.light["0"]}
              buttonColor={Colors.primary["500"]}
              style={[defaultStyles.button, styles.button]}
              loading={loading}
              disabled={loading}
              onPress={handleCreateProduct}
            >
              <Text style={defaultStyles.buttonText}>
                {i18n.t("(farmer).create-product.post")}
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
      <Portal>
        <Dialog
          visible={showSuccessModal}
          onDismiss={() => {}}
          style={defaultStyles.dialogSuccessContainer}
        >
          <Dialog.Content>
            <Image
              source={require("@/assets/images/success.png")}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t("(farmer).create-product.congratulations")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t("(farmer).create-product.yourProductHasBeenUploaded")}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}
      >
        <Text style={defaultStyles.errorText}>{error}</Text>
      </Snackbar>
    </>
  );
}
