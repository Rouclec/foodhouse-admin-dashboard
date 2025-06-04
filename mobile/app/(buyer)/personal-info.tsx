import React, { useContext, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Appbar, Text, Button, TextInput, Avatar } from "react-native-paper";
import { Colors } from "@/constants";
import {
  defaultStyles,
  imagePickerStyles,
  profileFlowStyles,
  signupStyles,
} from "@/styles";
import i18n from "@/i18n";
import { Context, ContextType } from "../_layout";
import { ImagePicker } from "@/components";

export default function PersonalInfo() {
  const router = useRouter();
  const { user, setUser } = useContext(Context) as ContextType;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    email: user?.email || "",
    address: user?.address || "",
    profileImage: user?.profileImage || null,
  });
  const [loading, setLoading] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setFormData({
        fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        email: user?.email || "",
        address: user?.address || "",
        profileImage: user?.profileImage || null,
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      email: user?.email || "",
      address: user?.address || "",
      profileImage: user?.profileImage || null,
    });
    setIsEditing(false);
  };
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

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={i18n.t("(farmer).(profile-flow).(personal-info).heading")}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={defaultStyles.scrollContainer}>
        <View style={signupStyles.allInput}>
          <View style={signupStyles.imageContainer}>
            <TouchableOpacity
              onPress={() => setIsImagePickerVisible(true)}
              disabled={!isEditing}
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
                {i18n.t("(farmer).(profile-flow).(personal-info).fullName")}{" "}
              </Text>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  value={formData.fullName}
                  onChangeText={(text) => handleInputChange("fullName", text)}
                  placeholder={i18n.t(
                    "(farmer).(profile-flow).(personal-info).fullNamePlaceholder"
                  )}
                  theme={{
                    roundness: 15,
                    colors: { onSurfaceVariant: Colors.grey["e8"] },
                  }}
                  outlineStyle={signupStyles.outlineInput}
                  style={signupStyles.input}
                />
              ) : (
                <Text style={profileFlowStyles.value}>
                  {`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                </Text>
              )}
            </View>

            <View style={profileFlowStyles.infoItem}>
              <Text style={profileFlowStyles.label}>
                {i18n.t("(farmer).(profile-flow).(personal-info).email")}
              </Text>
              {isEditing ? (
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
                    colors: { onSurfaceVariant: Colors.grey["e8"] },
                  }}
                  outlineStyle={signupStyles.outlineInput}
                  style={signupStyles.input}
                />
              ) : (
                <Text style={profileFlowStyles.value}>{user?.email}</Text>
              )}
            </View>

            <View style={profileFlowStyles.infoItem}>
              <Text style={profileFlowStyles.label}>
                {i18n.t("(farmer).(profile-flow).(personal-info).address")}
              </Text>
              {isEditing ? (
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
                    colors: { onSurfaceVariant: Colors.grey["e8"] },
                  }}
                  outlineStyle={signupStyles.outlineInput}
                  style={signupStyles.input}
                />
              ) : (
                <Text style={profileFlowStyles.value}>{user?.address}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {isEditing ? (
        <>
          <View style={imagePickerStyles.bottomContainer}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={imagePickerStyles.button1}
              labelStyle={imagePickerStyles.skipButtonText}
            >
              {i18n.t("(farmer).(profile-flow).(personal-info).cancel")}
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={imagePickerStyles.button1}
              loading={loading}
              disabled={loading}
            >
              {i18n.t("(farmer).(profile-flow).(personal-info).save")}
            </Button>
          </View>
        </>
      ) : (
        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={handleEditToggle}
            style={defaultStyles.button}
          >
            {i18n.t("(farmer).(profile-flow).(personal-info).edit")}
          </Button>
        </View>
      )}

      <ImagePicker
        visible={isImagePickerVisible}
        setImage={handleImageSelect}
        onClose={() => setIsImagePickerVisible(false)}
        aspect={[1, 1]}
      />
    </>
  );
}
