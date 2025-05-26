import Colors from "@/constants/Colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Appbar, Button, Icon, Snackbar, Text } from "react-native-paper";
import { PaperOtpInput } from "react-native-paper-otp-input";

import {
  usersSendEmailOtpMutation,
  usersVerifyOtpMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import {
  defaultStyles,
  forgotPasswordVerifyOtpStyles as styles,
} from "@/styles";
import { delay } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import i18n from "@/i18n";

export default function ForgotPasswordEmailOtp() {
  const { requestId, email } = useLocalSearchParams();

  const [requestIdState, setRequestIdState] = useState<string>(
    (requestId as string) ?? ""
  );

  const [emailState] = useState(email);

  const router = useRouter();
  const [currentTimeLeft, setCurrentTimeLeft] = useState(120);
  const [retries, setReties] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentTimeLeft);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          authFactor: {
            id: requestIdState,
            type: "FACTOR_TYPE_EMAIL_OTP",
            secretValue: otp,
          },
        },
      });
      router.push({
        pathname: "/(auth)/(forgot-password)/create-new-password",
        params: {
          requestId: requestIdState,
          otp,
        },
      });
    } catch (error) {
      console.error("Error verifying otp", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setCurrentTimeLeft((prev) => prev + (retries + 1) * 60);
      setReties((prev) => prev + 1);
      setLoading(true);
      await resendOtp({
        body: {
          email: emailState as string,
          intent: "OTP_INTENT_RESET_PASSWORD",
        },
      });
    } catch (error) {
      console.error("Error sending email otp: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft < 1) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, [timeLeft]);

  const { mutateAsync } = useMutation({
    ...usersVerifyOtpMutation(),
    onError: async (error) => {
      setErrorMessage(() => {
        const errorData = error?.response?.data;

        if (errorData?.message) {
          return errorData?.message;
        }

        let message = "An unknown error occurred";

        if (typeof errorData === "string") {
          try {
            // Extract only the first JSON object
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
    onSuccess: () => {
      setTimeLeft(0);
    },
  });

  useEffect(() => {
    setTimeLeft((prev) => (prev === currentTimeLeft ? prev : currentTimeLeft));
  }, [currentTimeLeft]);

  const { mutateAsync: resendOtp } = useMutation({
    ...usersSendEmailOtpMutation(),
    onError: async (error) => {
      setErrorMessage(() => {
        const errorData = error?.response?.data;

        if (errorData?.message) {
          return errorData?.message;
        }

        let message = "An unknown error occurred";

        if (typeof errorData === "string") {
          try {
            // Extract only the first JSON object
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
    onSuccess: (data) => {
      setRequestIdState(data?.requestId ?? "");
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
                {i18n.t("(auth).(forgot-password).verify-otp.forgotPassword")}
              </Text>
              <View />
            </Appbar.Header>
            <View style={styles.directionContainer}>
              <Text style={styles.direction}>
                {i18n.t(
                  "(auth).(forgot-password).verify-otp.aCodeHasBeenSentTo"
                )}{" "}
                {email}
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={defaultStyles.scrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.otpContainer}>
                <PaperOtpInput
                  maxLength={4}
                  onPinChange={(pin) => {
                    setOtp(pin);
                    if (pin.length === 6) {
                      Keyboard.dismiss();
                    }
                  }}
                  otpTextStyle={styles.otpText}
                  otpBoxStyle={styles.otpBox}
                  otpBorderFocusedColor={Colors.primary[300]}
                  otpBorderColor={Colors.grey["border"]}
                />
                <View style={styles.resendTextContainer}>
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={timeLeft > 0}
                  >
                    <Text style={timeLeft > 0 ? styles.text : styles.link}>
                      {i18n.t("(auth).(forgot-password).verify-otp.resendCode")}
                      {timeLeft > 0 && (
                        <Text style={styles.link}>
                          {" "}
                          {i18n.t(
                            "(auth).(forgot-password).verify-otp.in"
                          )}{" "}
                          {Math.floor(timeLeft / 60).toLocaleString("en-US", {
                            minimumIntegerDigits: 2,
                            useGrouping: false,
                          })}
                          :
                          {Math.ceil(timeLeft % 60).toLocaleString("en-US", {
                            minimumIntegerDigits: 2,
                            useGrouping: false,
                          })}
                        </Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            textColor={Colors.light["0"]}
            buttonColor={Colors.primary["500"]}
            style={defaultStyles.button}
            disabled={otp.length < 4 || loading}
            loading={loading}
            onPress={handleVerifyOtp}
          >
            <Text style={defaultStyles.buttonText}>
              {i18n.t("(auth).(forgot-password).verify-otp.verifyOtp")}
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={error}
        testID="otp_error_toast"
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}
      >
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
}
