import React from "react";
import {
  View,
  Linking,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { Appbar, Icon, Text } from "react-native-paper";
import { router } from "expo-router";
import { defaultStyles, profileFlowStyles, signupStyles } from "@/styles";
import { ScrollView } from "react-native-gesture-handler";
import i18n from "@/i18n";
import { Colors } from "@/constants";

const email = process.env.EXPO_PUBLIC_EMAIL;
const phoneNumber = process.env.EXPO_PUBLIC_PHONE_NUMBER;
const websiteURL = process.env.EXPO_PUBLIC_WEBSITE_URL;

const ContactUsScreen = () => {
  const handleEmailPress = () => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      console.warn("Email not defined in env file.");
    }
  };

  const handlePhonePress = () => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      console.warn("Phone number not defined in env file.");
    }
  };

  const handleWhatsAppPress = () => {
    if (phoneNumber) {
      const message = "Hello, I need support.";
      Linking.openURL(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      );
    } else {
      console.warn("Phone number not defined for WhatsApp.");
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
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}
            >
              <Icon source={"arrow-left"} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t("(farmer).(profile-flow).(settings).contactUs")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={profileFlowStyles.innerContainer}>
              <TouchableOpacity
                style={profileFlowStyles.row}
                onPress={handleEmailPress}
              >
                <View style={profileFlowStyles.iconContainer}>
                  <Ionicons name="mail" size={20} color={Colors.primary[500]} />
                </View>
                <Text style={profileFlowStyles.navigationText}>
                  {email || "support@foodhouse.com"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={profileFlowStyles.row}
                onPress={handlePhonePress}
              >
                <View style={profileFlowStyles.iconContainer}>
                  <Ionicons name="call" size={20} color={Colors.primary[500]} />
                </View>
                <Text style={profileFlowStyles.navigationText}>
                  {phoneNumber || ""}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={profileFlowStyles.row}
                onPress={handleWhatsAppPress}
              >
                <View style={profileFlowStyles.iconContainer}>
                  <FontAwesome
                    name="whatsapp"
                    size={20}
                    color={Colors.primary[500]}
                  />
                </View>
                <Text style={profileFlowStyles.navigationText}>
                  {i18n.t("(farmer).(profile-flow).(settings).chat")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

export default ContactUsScreen;
