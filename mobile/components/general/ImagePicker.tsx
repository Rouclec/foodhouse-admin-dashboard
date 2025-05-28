import React, { Dispatch, FC, SetStateAction } from "react";
import { Alert, TouchableOpacity } from "react-native";
import { Dialog, Portal, Text } from "react-native-paper";
import * as ExpoImagePicker from "expo-image-picker";
import { imagePickerStyles as styles } from "@/styles";
import i18n from "@/i18n";

interface Props {
  visible: boolean;
  setImage: Dispatch<
    SetStateAction<ExpoImagePicker.ImagePickerAsset | undefined>
  >;
  onClose: () => void;
  aspect?: [number, number];
}

export const ImagePicker: FC<Props> = ({
  visible,
  setImage,
  onClose,
  aspect = [4, 4],
}) => {
  const pickImage = async () => {
    // Request permission to access media library
    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        i18n.t("components.ImagePicker.permissionDenied"),
        i18n.t("components.ImagePicker.allowAccessToGallery")
      );
      return;
    }

    // Open image picker
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
    onClose();
  };

  const takePhoto = async () => {
    // Request camera permission
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        i18n.t("components.ImagePicker.permissionDenied"),
        i18n.t("components.ImagePicker.allowAccessToCamera")
      );
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={visible} style={styles.dialog}>
        <Dialog.Content style={styles.content}>
          <TouchableOpacity
            style={[styles.innerContent, styles.button, styles.bottomBorder]}
            onPress={pickImage}
          >
            <Text style={styles.buttonText} variant="titleMedium">
              {i18n.t("components.ImagePicker.photoGalery")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.innerContent, styles.button]}
            onPress={takePhoto}
          >
            <Text style={styles.buttonText} variant="titleMedium">
              {i18n.t("components.ImagePicker.camera")}
            </Text>
          </TouchableOpacity>
        </Dialog.Content>
        <Dialog.Content style={styles.content}>
          <TouchableOpacity
            style={[styles.innerContent, styles.button]}
            onPress={onClose}
          >
            <Text style={styles.buttonText} variant="titleMedium">
              {i18n.t("components.ImagePicker.cancel")}
            </Text>
          </TouchableOpacity>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};
