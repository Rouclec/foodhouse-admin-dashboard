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
  Alert,
  Linking,
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
import * as Camera from "expo-camera";
import { signupStyles } from "@/styles";
import { router } from "expo-router";
import { Colors } from "@/constants";
import { usersCompleteRegistrationMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";
import { delay } from "@/utils";
import { Context, ContextType } from "../_layout";
import { getDownloadURL, ref, storage, uploadBytes } from "@/firebase";
import i18n from "@/i18n";
import { ImagePicker } from "@/components";
import { defaultStyles } from "@/styles";

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

  const uploadImageToFirebase = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profile_${user?.userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile_images/${filename}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const { mutateAsync: updateUserRegistration } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onError: async (error) => {
      setErrorMessage(() => {
        const errorData = error?.response?.data;
        if (errorData?.message) {
          return errorData?.message;
        }
        let message = "An unknown error occurred";
        if (typeof errorData === "string") {
          try {
            const firstObject = JSON.parse(
              (errorData as string).match(/\{.*?\}/s)?.[0] || "{}"
            );
            if (firstObject?.message) message = `${firstObject.message}`;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
        }
        return message;
      });
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
          router.replace("/(buyer)/two");
          
        }
      }, 3000);
    },
  });

  console.log(user);

  const handleComplete = async () => {
    try {
      setLoading(true);
      let imageUrl = null;
      if (profileImage) {
        imageUrl = await uploadImageToFirebase(profileImage);
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
      Alert.alert("Error", "Failed to complete registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      <KeyboardAvoidingView
        style={signupStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <SafeAreaView style={signupStyles.mainConatiner}>
            <ScrollView
              style={signupStyles.scrollContainer}
              showsVerticalScrollIndicator={false}
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
        </TouchableWithoutFeedback>

        <View style={styles.bottomContainer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={[styles.button, styles.skipButton]}
            labelStyle={styles.skipButtonText}
          >
            Skip
          </Button>

          <Button
            mode="contained"
            onPress={handleComplete}
            style={styles.button}
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

      {/* Success Modal */}
      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => setSuccessModalVisible(false)}
          style={styles.dialogContainer}
        >
          <Dialog.Content>
            <Image
              source={require("@/assets/images/success.png")}
              style={styles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={styles.dialogTitle}>
              {i18n.t("(auth).profile.congratulations")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={styles.dialogContent}>
              {i18n.t("(auth).profile.registrationCompleteMessage")}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Error Snackbar */}
      <Snackbar
        visible={error}
        onDismiss={() => setError(false)}
        duration={3000}
        style={defaultStyles.snackbar}
      >
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "white",
  },
  outlineInput: {
    borderRadius: 8,
    borderWidth: 1,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 4,
    height: 50,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary[500],
  },
  skipButton: {
    borderColor: "#e8e8e8",
    backgroundColor: Colors.primary[300],
  },
  skipButtonText: {
    color: "black",
  },
  dialogContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  successImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  dialogTitle: {
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  dialogContent: {
    textAlign: "center",
    marginBottom: 20,
  },
});
