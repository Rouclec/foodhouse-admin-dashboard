import { CAMEROON, Colors } from "@/constants";
import {
  defaultStyles,
  signupStyles,
  forgotPasswordIndexStyles as styles,
} from "@/styles";
import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Appbar, Button, Icon, Text, Snackbar } from "react-native-paper";
import { useRouter } from "expo-router";
import { delay } from "@/utils";
import i18n from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { usersSendSmsOtpMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import PhoneNumberInput from "@/components/general/PhoneNumberInput";

export default function ForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [callingCode, setCallingCode] = useState<string>(CAMEROON.dial_code);
  const [mobile, setMobile] = useState<string>("");

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          phoneNumber: `${callingCode}${mobile}`,
          intent: "OTP_INTENT_RESET_PASSWORD",
        },
      });
    } catch (error) {
      console.error({ error }, "handling forgot password");
    } finally {
      setLoading(false);
    }
  };

  const { mutateAsync } = useMutation({
    ...usersSendSmsOtpMutation(),
    onSuccess: (data) => {
      router.push({
        pathname: "/(auth)/(forgot-password)/verify-otp",
        params: {
          requestId: data?.requestId,
          phoneNumber: `${callingCode}${mobile}`,
        },
      });
      setMobile("");
    },
    onError: async (error) => {
      setError(
        error?.response?.data?.message ??
          i18n.t("(auth).(forgot-password).index.unknownError")
      );
      await delay(5000);
      setError(undefined);
    },
  });

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
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
              {i18n.t("(auth).(forgot-password).index.forgotPassword")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentContainer}>
              <View style={styles.illustrationImageContainer}>
                <Image
                  source={require("@/assets/images/forgot-password-illustration.png")}
                />
              </View>
              <View>
                <Text style={defaultStyles.subheaderText}>
                  {i18n.t("(auth).(forgot-password).index.enterYourPhoneNumber")}
                </Text>
              </View>
              <View style={defaultStyles.inputsContainer}>
                <PhoneNumberInput
                  setCountryCode={setCallingCode}
                  countryCode={callingCode}
                  setPhoneNumber={setMobile}
                  phoneNumber={mobile}
                  containerStyle={signupStyles.phoneNumberInputContainerStyle}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          buttonColor={Colors.primary["500"]}
          disabled={!mobile || loading}
          loading={loading}
          onPress={handleForgotPassword}
          style={defaultStyles.button}
        >
          <Text style={defaultStyles.buttonText}>
            {i18n.t("(auth).(forgot-password).index.continue")}
          </Text>
        </Button>
      </View>
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
