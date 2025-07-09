import React, { useContext, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Appbar,
  Text,
  Button,
  TextInput,
  Avatar,
  Icon,
} from "react-native-paper";
import { Colors } from "@/constants";
import {
  defaultStyles,
  loginstyles,
  profileFlowStyles,
  signupStyles,
} from "@/styles";
import i18n from "@/i18n";
import { Context, ContextType } from "../_layout";
import { ImagePicker } from "@/components";
import { usersCompleteRegistrationMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { delay, uploadImage } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PersonalInfo() {
  const router = useRouter();
  const { user, setUser } = useContext(Context) as ContextType;

  const [originalProfileImage, setOriginalProfileImage] = useState(
    user?.profileImage || ""
  );
  const [profileImage, setProfileImage] = useState(originalProfileImage);

  const [formData, setFormData] = useState({
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    address: user?.address || "",
    email: user?.email || "",
  });

  const [loading, setLoading] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    const changesDetected =
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() !==
        formData.fullName ||
      user?.address !== formData.address ||
      user?.email !== formData.email ||
      profileImage !== originalProfileImage;

    setHasChanges(changesDetected);
  }, [formData, profileImage]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (asset: any) => {
    if (asset && asset.uri !== originalProfileImage) {
      setProfileImage(asset.uri);
      setHasChanges(true);
    }
    setIsImagePickerVisible(false);
  };

  const { mutateAsync: updateProfile } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onError: async (error) => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t("(auth).profile.unknownError")
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      let imageUrl = originalProfileImage;

      if (profileImage !== originalProfileImage) {
        imageUrl = await uploadImage({
          uri: profileImage,
          filename: `profile_${user?.userId}_${Date.now()}.jpg`,
          directory: "profile_images",
        });
      }

      const firstNameSplit = formData.fullName.split(" ")[0];
      const lastNameSplit = formData.fullName.split(" ").slice(1).join(" ");

      const data = {
        firstName: firstNameSplit,
        lastName: lastNameSplit,
        email: formData.email,
        address: formData.address,
        profileImage: imageUrl,
      };

      await updateProfile({ body: data, path: { userId: user?.userId || "" } });

      setUser({ ...data });
      setOriginalProfileImage(imageUrl);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile");
      setError(true);
      await delay(5000);
      setError(false);
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <>
      <KeyboardAvoidingView
         style={[
          defaultStyles.container,
          {
            paddingBottom: insets.bottom,
          },
        ]}
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
              {i18n.t("(farmer).(profile-flow).(personal-info).heading")}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView contentContainerStyle={defaultStyles.scrollContainer}>
            <View style={profileFlowStyles.navigateSection}>
              <View style={signupStyles.imageContainer}>
                <TouchableOpacity
                  style={signupStyles.imageUpload}
                  onPress={() => setIsImagePickerVisible(true)}
                >
                  <View style={signupStyles.addImageContainer}>
                    {profileImage || user?.profileImage ? (
                      <Image
                        source={{ uri: profileImage ?? user?.profileImage }}
                        style={signupStyles.profileImage}
                      />
                    ) : (
                      <Image
                        source={require("@/assets/images/avatar.png")}
                        style={signupStyles.avatar}
                      />
                    )}
                    <View style={signupStyles.cameraIcon}>
                      <Icon
                        size={16}
                        source="camera"
                        color={Colors.light[10]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={profileFlowStyles.infoContainer}>
                <TextInput
                  mode="outlined"
                  value={formData.fullName}
                  onChangeText={(text) => handleInputChange("fullName", text)}
                  label={i18n.t(
                    "(farmer).(profile-flow).(personal-info).fullName"
                  )}
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey["e8"],
                      primary: Colors.primary[500],
                    },
                  }}
                  outlineColor={Colors.grey["bg"]}
                  style={loginstyles.input}
                />

                <TextInput
                  mode="outlined"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange("email", text)}
                  label={i18n.t(
                    "(farmer).(profile-flow).(personal-info).email"
                  )}
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey["e8"],
                      primary: Colors.primary[500],
                    },
                  }}
                  outlineColor={Colors.grey["bg"]}
                  style={loginstyles.input}
                />

                <TextInput
                  mode="outlined"
                  value={formData.address}
                  onChangeText={(text) => handleInputChange("address", text)}
                  label={i18n.t(
                    "(farmer).(profile-flow).(personal-info).address"
                  )}
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey["e8"],
                      primary: Colors.primary[500],
                    },
                  }}
                  outlineColor={Colors.grey["bg"]}
                  style={loginstyles.input}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={hasChanges ? handleSave : () => {}}
          loading={loading}
          disabled={!hasChanges || loading}
          buttonColor={Colors.primary["500"]}
          style={defaultStyles.button}
        >
          {hasChanges
            ? i18n.t("(farmer).(profile-flow).(personal-info).save")
            : i18n.t("(farmer).(profile-flow).(personal-info).edit")}
        </Button>
      </View>

      <ImagePicker
        visible={isImagePickerVisible}
        setImage={handleImageSelect}
        onClose={() => setIsImagePickerVisible(false)}
        aspect={[1, 1]}
      />
    </>
  );
}
