import React, { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import {
  Appbar,
  Icon,
  TextInput,
  Button,
  Dialog,
  Portal,
  Text,
  Avatar,
  Snackbar,
} from "react-native-paper";
import * as ExpoImagePicker from "expo-image-picker";
import { imagePickerStyles, signupStyles, defaultStyles } from "@/styles";
import { router } from "expo-router";
import { usersCompleteRegistrationMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";
import { delay, uploadImage } from "@/utils";
import { Context, ContextType } from "../_layout";
import i18n from "@/i18n";
import { ImagePicker } from "@/components";
import { Chase } from "react-native-animated-spinkit";
import { Colors } from "@/constants";

const ProfilePage = () => {
  const { user, setUser } = useContext(Context) as ContextType;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  //const [email, setEmail] = useState(user?.email);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] =
    useState<ExpoImagePicker.ImagePickerAsset>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);

  const { mutateAsync: updateUserRegistration } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onError: async (error) => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t("(auth).profile.unknownError")
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async () => {
      setSuccessModalVisible(true);

      setTimeout(() => {
        if (user?.role === "USER_ROLE_AGENT") {
          router.replace("/(tabs)/(index)");
        } else {
          console.error("not found");
        }
      }, 3000);
    },
  });

  const handleComplete = async () => {
    try {
      setLoading(true);
      let imageUrl = null;

      if (profileImage) {
        imageUrl = await uploadImage({
          uri: profileImage.uri,
          filename: `profile_${user?.userId}_${Date.now()}.jpg`,
          directory: "profile_images",
        });
      }

      const data = {
        firstName,
        lastName,
        email: user?.email,
        address,
        profileImage: imageUrl || undefined,
      };

      await updateUserRegistration({
        body: data,
        path: {
          userId: user?.userId ?? "",
        },
      });
      setUser({ ...data });
    } catch (error) {
      console.error("Error completing registration:", error);
      setErrorMessage(i18n.t("(auth).profile.uploadError"));
      setError(true);
      await delay(5000);
      setError(false);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={"padding"}
        keyboardVerticalOffset={0}
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
              {i18n.t("(auth).profile.completeRegistration")}
            </Text>
            <View />
          </Appbar.Header>
          <View style={signupStyles.imageContainer}>
            <TouchableOpacity
              onPress={() => setIsImagePickerVisible(true)}
              style={signupStyles.imageUpload}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage.uri }}
                  style={signupStyles.profileImage}
                />
              ) : (
                <View style={signupStyles.addImageContainer}>
                  <Avatar.Icon
                    size={120}
                    icon="account"
                    style={signupStyles.account}
                  />
                  <Avatar.Icon
                    size={24}
                    icon="camera"
                    color="#fff"
                    style={signupStyles.cameraIcon}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={signupStyles.allInput}>
              <TextInput
                label={i18n.t("(auth).profile.firstName")}
                value={firstName}
                onChangeText={setFirstName}
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
                label={i18n.t("(auth).profile.lastName")}
                value={lastName}
                onChangeText={setLastName}
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
                label={i18n.t("(auth).profile.address")}
                value={address}
                onChangeText={setAddress}
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
            </View>
          </ScrollView>
        </View>
        <View style={defaultStyles.bottomButtonContainer}>
          <View style={signupStyles.flexButtonContainer}>
            <Button
              mode="contained"
              textColor={Colors.primary["500"]}
              buttonColor={Colors.primary["50"]}
              onPress={() => router.replace("/(tabs)/(index)")}
              style={[defaultStyles.button, signupStyles.button]}
              disabled={loading}
            >
              <Text style={defaultStyles.secondaryButtonText}>Skip</Text>
            </Button>

            <Button
              mode="contained"
              textColor={Colors.light["0"]}
              buttonColor={Colors.primary["500"]}
              style={[defaultStyles.button, signupStyles.button]}
              loading={loading}
              disabled={!firstName || !lastName || !address || loading}
              onPress={handleComplete}
            >
              <Text style={defaultStyles.buttonText}>Complete</Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImagePicker
        visible={isImagePickerVisible}
        setImage={setProfileImage}
        onClose={() => setIsImagePickerVisible(false)}
        aspect={[1, 1]}
      />

      <Portal>
        <Dialog
          visible={successModalVisible}
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
              {i18n.t("(auth).profile.congratulations")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t("(auth).profile.registrationCompleteMessage")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Chase size={56} color={Colors.primary[500]} />
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}
      >
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};

export default ProfilePage;
