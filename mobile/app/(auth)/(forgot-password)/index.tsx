import { Colors } from "@/constants";
import { defaultStyles, forgotPasswordIndexStyles as styles } from "@/styles";
import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import {
  Appbar,
  Button,
  HelperText,
  Icon,
  Text,
  Snackbar,
  TextInput,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { delay } from "@/utils";
import i18n from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { usersSendEmailOtpMutation } from "@/client/users.swagger/@tanstack/react-query.gen";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          email: email,
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
    ...usersSendEmailOtpMutation(),
    onSuccess: (data) => {
      router.push({
        pathname: "/(auth)/(forgot-password)/verify-otp",
        params: {
          requestId: data?.requestId,
          email: email,
        },
      });
      setEmail("");
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
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
                    {i18n.t("(auth).(forgot-password).index.enterYourEmail")}
                  </Text>
                </View>
                <View style={defaultStyles.inputsContainer}>
                  <TextInput
                    mode="outlined"
                    label={i18n.t("(auth).(forgot-password).index.email")}
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                    error={
                      !!email &&
                      ((!!email?.length && email?.length < 3) ||
                        !emailRegex.test(email ?? ""))
                    }
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
                    left={
                      <TextInput.Icon
                        icon="email-outline"
                        color={Colors.grey["61"]}
                        size={20}
                      />
                    }
                    autoCapitalize="none"
                  />
                  {!!email && !emailRegex.test(email) && (
                    <HelperText type="error">
                      {i18n.t("(auth).(forgot-password).index.invalidEmail")}
                    </HelperText>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          buttonColor={Colors.primary["500"]}
          disabled={!email || !emailRegex.test(email ?? "") || loading}
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
