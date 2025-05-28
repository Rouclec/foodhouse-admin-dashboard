import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
  Icon,
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
import { uploadImage } from "@/utils";
import moment from "moment";

export default function ForgotPasswordEmailOtp() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [productCategory, setProductCateogry] = useState<string>();
  const [currencyCountry, setCurrencyCountry] = useState<Country>(CAMEROON);
  const [image, setImage] = useState<ExpoImagePicker.ImagePickerAsset>();
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);

  const onImagePickerClose = () => {
    setIsImagePickerVisible(false);
  };

  const handleImageUpload = async () => {
    if (image?.uri) {
      setLoading(true);
      try {
        const downloadURL = await uploadImage({
          uri: image.uri,
          directory: "/products",
          filename: `${
            image?.fileName ?? "product"
          }-${moment().toLocaleString()}`,
        });
        console.log("Image uploaded successfully:", downloadURL);
        // Use the downloadURL to display the image or store it in your database
      } catch (error) {
        console.error("Image upload failed:", error);
      } finally {
        setLoading(false);
      }
    }
  };

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
                  data={[
                    {
                      label: "Foo",
                      value: "baa",
                    },
                    {
                      label: "Foo",
                      value: "baa",
                    },
                    {
                      label: "Foo",
                      value: "baa",
                    },
                  ]}
                />
                <Dropdown
                  label={i18n.t("(farmer).create-product.productName")}
                  value={productCategory}
                  onSelect={(value) => setProductCateogry(value)}
                  data={[
                    {
                      label: "Foo",
                      value: "baa",
                    },
                    {
                      label: "Foo",
                      value: "baa",
                    },
                    {
                      label: "Foo",
                      value: "baa",
                    },
                  ]}
                />
                <Dropdown
                  label={i18n.t("(farmer).create-product.priceType")}
                  value={productCategory}
                  onSelect={(value) => setProductCateogry(value)}
                  data={[
                    {
                      label: "Foo",
                      value: "baa",
                    },
                    {
                      label: "Foo",
                      value: "baa",
                    },
                    {
                      label: "Foo",
                      value: "baa",
                    },
                  ]}
                />
                <CurrencySelect
                  setCountry={setCurrencyCountry}
                  country={currencyCountry}
                />
                <TextInput
                  label={i18n.t("(farmer).create-product.price")}
                  mode="outlined"
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
                />
                <TextInput
                  label={i18n.t("(farmer).create-product.description")}
                  mode="outlined"
                  multiline
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
                />
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
              onPress={handleImageUpload}
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
