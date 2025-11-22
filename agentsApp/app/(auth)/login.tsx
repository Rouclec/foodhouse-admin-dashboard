import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Appbar, Icon, Snackbar, TextInput } from "react-native-paper";
import { Link, router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  usersGetUserByIdOptions,
  usersSendSmsOtpMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "../_layout";
import { defaultStyles, loginstyles, signupStyles } from "@/styles";
import { CAMEROON, Colors } from "@/constants";
import i18n from "@/i18n";
import { delay, storeData, updateAuthHeader } from "@/utils";

import PhoneNumberInput from "@/components/general/PhoneNumberInput";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Login() {
  const [country, setCountry] = useState(CAMEROON);
  const [callingCode, setCallingCode] = useState(
    country?.dial_code || CAMEROON.dial_code
  );
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string>();
  const [firebaseUserId, setFirebaseUserId] = useState<string>();
  const { user, setUser } = useContext(Context) as ContextType;

  const { data: userData } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: userId ?? "",
      },
    }),
    enabled: !!userId,
  });

  useEffect(() => {
    const checkUserAndNavigate = async () => {
      if (userData?.user) {
        setUser(userData.user);

        if (userData?.user?.role === "USER_ROLE_AGENT") {
          return router.replace("/(auth)/signin-verify-otp");
        } else {
          setErrorMessage("Unauthorized, User is not an Agent");
          setError(true);
          await delay(5000);
          setError(false);
        }
      }
    };
    checkUserAndNavigate();
  }, [userData]);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          phoneNumber: `${callingCode}${mobile}`,
        },
      });
    } catch (error) {
      console.error("Error signing up: ", error);
    } finally {
      setLoading(false);
    }
  };

  const { mutateAsync } = useMutation({
    ...usersSendSmsOtpMutation(),
    onError: async (error) => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t("(auth).login.anUnknownError")
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: (data) => {
      router.push({
        pathname: "/signin-verify-otp",
        params: {
          requestId: data.requestId,
          phoneNumber: `${callingCode}${mobile}`,
        },
      });
    },
  });

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            {/* <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity> */}
            <View />
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={loginstyles.logoCircle}>
              <Text style={loginstyles.logoText}>Food House</Text>
            </View>
            <View style={defaultStyles.inputsContainer}>
              <Text style={loginstyles.loginTitle}>
                {i18n.t("(auth).login.loginTo")}
              </Text>

              <PhoneNumberInput
                setCountryCode={setCallingCode}
                countryCode={callingCode}
                setPhoneNumber={setMobile}
                phoneNumber={mobile}
                containerStyle={signupStyles.phoneNumberInputContainerStyle}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <TouchableOpacity
          style={[loginstyles.loginButton, loading && defaultStyles.greyButton]}
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={loginstyles.loginButtonText}>
              {i18n.t("(auth).login.login")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
}
