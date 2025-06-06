import React, { useContext, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { Appbar, Text, Button, TextInput, Avatar } from "react-native-paper";
import { Colors } from "@/constants";
import { defaultStyles, profileFlowStyles, signupStyles } from "@/styles";
import i18n from "@/i18n";
import { Context, ContextType } from "../_layout";
import { ImagePicker } from "@/components";
import { usersgrpcUser } from "@/client/users.swagger";

export default function PersonalInfo() {
  const router = useRouter();
  const { user, setUser } = useContext(Context) as ContextType;
  const [formData, setFormData] = useState({
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    email: user?.email || "",
    address: user?.address || "",
    profileImage: user?.profileImage || "",
  });
  // const [formData, setFormData] = useState()<usersgrpcUser>
  const [initialData, setInitialData] = useState({ ...formData });
  const [loading, setLoading] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changesDetected =
      initialData.fullName !== formData.fullName ||
      initialData.email !== formData.email ||
      initialData.address !== formData.address ||
      initialData.profileImage !== formData.profileImage;
    setHasChanges(changesDetected);
  }, [formData, initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (asset: any) => {
    if (asset) {
      setFormData((prev) => ({ ...prev, profileImage: asset.uri }));
    }
    setIsImagePickerVisible(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const [firstName, ...lastNameParts] = formData.fullName.split(" ");
      const lastName = lastNameParts.join(" ") || "";

      await setUser({
        ...user,
        firstName,
        lastName,
        email: formData.email,
        address: formData.address,
        profileImage: formData.profileImage,
      });
      setInitialData({ ...formData });
    } catch (error) {
      console.error("Error updating profile:", error);
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
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content
              title={i18n.t("(farmer).(profile-flow).(personal-info).heading")}
            />
          </Appbar.Header>

          <ScrollView contentContainerStyle={defaultStyles.scrollContainer}>
            <View style={profileFlowStyles.navigateSection}>
              <View style={signupStyles.imageContainer}>
                <TouchableOpacity
                  onPress={() => setIsImagePickerVisible(true)}
                  style={signupStyles.imageUpload}
                >
                  {formData.profileImage ? (
                    <>
                      <Image
                        source={{ uri: formData.profileImage }}
                        style={signupStyles.profileImage}
                      />
                      <Avatar.Icon
                        size={24}
                        icon="camera"
                        color="#fff"
                        style={signupStyles.cameraIcon}
                      />
                    </>
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

              <View style={profileFlowStyles.infoContainer}>
                <View style={profileFlowStyles.infoItem}>
                  <Text style={profileFlowStyles.label}>
                    {i18n.t("(farmer).(profile-flow).(personal-info).fullName")}
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={formData.fullName}
                    onChangeText={(text) => handleInputChange("fullName", text)}
                    placeholder={i18n.t(
                      "(farmer).(profile-flow).(personal-info).fullNamePlaceholder"
                    )}
                    theme={{
                      roundness: 15,
                      colors: {
                        onSurfaceVariant: Colors.grey["e8"],
                        primary: Colors.primary[500],
                      },
                    }}
                    outlineStyle={signupStyles.outlineInput}
                    style={signupStyles.input}
                  />
                </View>

                <View style={profileFlowStyles.infoItem}>
                  <Text style={profileFlowStyles.label}>
                    {i18n.t("(farmer).(profile-flow).(personal-info).email")}
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange("email", text)}
                    placeholder={i18n.t(
                      "(farmer).(profile-flow).(personal-info).emailPlaceholder"
                    )}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    theme={{
                      roundness: 15,
                      colors: {
                        onSurfaceVariant: Colors.grey["e8"],
                        primary: Colors.primary[500],
                      },
                    }}
                    outlineStyle={signupStyles.outlineInput}
                    style={signupStyles.input}
                  />
                </View>

                <View style={profileFlowStyles.infoItem}>
                  <Text style={profileFlowStyles.label}>
                    {i18n.t("(farmer).(profile-flow).(personal-info).address")}
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={formData.address}
                    onChangeText={(text) => handleInputChange("address", text)}
                    placeholder={i18n.t(
                      "(farmer).(profile-flow).(personal-info).addressPlaceholder"
                    )}
                    multiline
                    numberOfLines={3}
                    theme={{
                      roundness: 15,
                      colors: {
                        onSurfaceVariant: Colors.grey["e8"],
                        primary: Colors.primary[500],
                      },
                    }}
                    outlineStyle={signupStyles.outlineInput}
                    style={signupStyles.input}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={hasChanges ? handleSave : () => {}} 
          style={[
            defaultStyles.button,
            hasChanges
              ? defaultStyles.primaryButton
              : defaultStyles.secondaryButton,
          ]}
          buttonColor={
            hasChanges ? Colors.primary["500"] : Colors.primary["50"]
          }
          textColor={hasChanges ? "#fff" : Colors.primary["500"]}
          loading={loading}
          disabled={!hasChanges || loading}
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