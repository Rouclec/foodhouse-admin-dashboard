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
import { defaultStyles, imagePickerStyles, profileFlowStyles, signupStyles } from "@/styles";
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
    // Reset form data when cancelling edit
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
    // Reset form data
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
      <Appbar.Header dark={false}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={i18n.t("personalInfo.title")} />
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
              <Text style={profileFlowStyles.label}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  value={formData.fullName}
                  onChangeText={(text) => handleInputChange("fullName", text)}
                  placeholder="Enter your full name"
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

            {/* Email */}
            <View style={profileFlowStyles.infoItem}>
              <Text style={profileFlowStyles.label}>Email</Text>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange("email", text)}
                  placeholder="Email"
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
              <Text style={profileFlowStyles.label}>Address</Text>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  value={formData.address}
                  onChangeText={(text) => handleInputChange("address", text)}
                  placeholder="Address"
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
      <View style={defaultStyles.bottomButtonContainer}>
            {isEditing ? (
              <>
                <View style={imagePickerStyles.bottomContainer}>
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    style={defaultStyles.button}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    style={defaultStyles.button}
                    loading={loading}
                    disabled={loading}
                  >
                    Save changes
                  </Button>
                </View>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={handleEditToggle}
                style={defaultStyles.button}
              >
                Edit
              </Button>
            )}
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


