import React, { useContext, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import { imagePickerStyles, signupStyles } from "@/styles";
import { router } from "expo-router";
import { usersCompleteRegistrationMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";
import { delay, uploadImage } from "@/utils";
import { Context, ContextType } from "../_layout";
import i18n from "@/i18n";
import { ImagePicker } from "@/components";
import { defaultStyles } from "@/styles";
import { Chase } from "react-native-animated-spinkit";
import { Colors } from "@/constants";

const ProfilePage = () => {
  const { user } = useContext(Context) as ContextType;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const { role } = useContext(Context) as ContextType;

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
        if (role === "USER_TYPE_FARMER") {
          router.replace("/(farmer)/(index)");
        } else {
          router.replace("/variety");
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
          uri: profileImage,
          filename: `profile_${user?.userId}_${Date.now()}.jpg`,
          directory: "profile_images",
        });
      }

      const data = {
        firstName,
        lastName,
        email,
        address,
        profileImage: imageUrl || undefined,
      };

      await updateUserRegistration({
        body: data,
        path: {
          userId: user?.userId ?? "",
        },
      });
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
        style={signupStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <Appbar.Header dark={false}>
          <TouchableOpacity
            style={signupStyles.closeIconContainer}
            onPress={() => router.back()}
          >
            <Icon source="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text variant="headlineMedium" style={signupStyles.heading}>
            {i18n.t("(auth).profile.completeRegistration")}
          </Text>
        </Appbar.Header>
        <SafeAreaView style={signupStyles.mainConatiner}>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={signupStyles.allInput}>
              <View style={signupStyles.imageContainer}>
                <TouchableOpacity
                  onPress={() => setIsImagePickerVisible(true)}
                  style={signupStyles.imageUpload}
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
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

              <TextInput
                placeholder={i18n.t("(auth).profile.firstName")}
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                outlineStyle={signupStyles.outlineInput}
                style={signupStyles.input}
              />

              <TextInput
                placeholder={i18n.t("(auth).profile.lastName")}
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                outlineStyle={signupStyles.outlineInput}
                style={signupStyles.input}
              />

              <TextInput
                placeholder={i18n.t("(auth).profile.email")}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                outlineStyle={signupStyles.outlineInput}
                style={signupStyles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                placeholder={i18n.t("(auth).profile.address")}
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                outlineStyle={signupStyles.outlineInput}
                style={signupStyles.input}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>

        <View style={imagePickerStyles.bottomContainer}>
          <Button
            mode="outlined"
            onPress={() => router.replace("/(farmer)/(index)")}
            style={[imagePickerStyles.button1, imagePickerStyles.skipButton]}
            labelStyle={imagePickerStyles.skipButtonText}
          >
            Skip
          </Button>

          <Button
            mode="contained"
            onPress={handleComplete}
            style={imagePickerStyles.button1}
            disabled={!firstName || !lastName || !email || !address || loading}
            loading={loading}
          >
            Complete
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Image Picker Component */}
      <ImagePicker
        visible={isImagePickerVisible}
        setImage={(asset) => {
          if (asset) {
            setProfileImage(asset.uri);
          }
        }}
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
