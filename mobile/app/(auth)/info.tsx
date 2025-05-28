import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import CountrySelect from "@/components/general/CountrySelect";
import { CAMEROON, Colors, countries } from "@/constants";
import { Appbar, Button, Icon, TextInput, Text } from "react-native-paper";
import PhoneNumberInput from "@/components/general/PhoneNumberInput";
import { useRouter } from "expo-router";
import { usersSendSignupSmsOtpMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";
import { defaultStyles } from "@/styles";
import { signupStyles } from "@/styles";
import i18n from "@/i18n";
import { Context, ContextType } from "../_layout";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Info = () => {
  const [country, setCountry] = useState(CAMEROON);
  const [callingCode, setCallingCode] = useState(country?.dial_code || "237"); // Use country's calling code
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const router = useRouter();
 const {role, setUserRole} = useContext(Context) as ContextType;

  useEffect(() => {
    if (country?.dial_code) {
      setCallingCode(country.dial_code);
    }
  }, [country]);

  const handleSignUp = async () => {
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
    ...usersSendSignupSmsOtpMutation(),
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
      setError(false);
    },
    onSuccess: (data) => {
      router.push({
        pathname: "/verify-otp",
        params: {
          requestId: data.requestId,
          phoneNumber: `${callingCode}${mobile}`,
          email,
          password,
          role: role || "USER_ROLE_UNSPECIFIED",
        },
      });
    },
  });

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
          {/* {i18n.t("(auth).createAccount.farmerAccount")} */}
          {i18n.t(
            `(auth).createAccount.${
              role === "USER_TYPE_FARMER" ? "farmerAccount" : "buyerAccount"
            }`
          )}
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
                <CountrySelect
                  setCountry={setCountry}
                  containerStyle={signupStyles.countryCodeContainer}
                  countries={countries}
                  country={country}
                />
                <PhoneNumberInput
                  setCountryCode={setCallingCode}
                  countryCode={callingCode}
                  setPhoneNumber={setMobile}
                  phoneNumber={mobile}
                  containerStyle={signupStyles.phoneNumberInputContainerStyle}
                />

                <TextInput
                  mode="outlined"
                  label={i18n.t("(auth).createAccount.enterEmail")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={email?.length > 0 && !emailRegex.test(email)}
                  outlineStyle={signupStyles.outlineInput}
                  style={signupStyles.input}
                  theme={{ colors: { onSurfaceVariant: Colors.grey["e8"] } }}
                />

                <TextInput
                  label={i18n.t("(auth).createAccount.createPassword")}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                  mode="outlined"
                  placeholder={i18n.t("(auth).createAccount.placeholder")}
                  style={signupStyles.input}
                  outlineStyle={signupStyles.outlineInput}
                  contentStyle={signupStyles.inputContentStyle}
                  theme={{ colors: { onSurfaceVariant: Colors.grey["e8"] } }}
                  error={password.length > 0 && password.length < 12}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                      size={16}
                      color={Colors.grey["e7"]}
                    />
                  }
                />
                {password.length > 0 && password.length < 12 && (
                  <Text
                    style={[signupStyles.errorTextDark, signupStyles.margin20]}
                  >
                    {i18n.t("(auth).createAccount.passwordMustBe")}
                  </Text>
                )}
                <TextInput
                  label={i18n.t("(auth).createAccount.reEnterPassword")}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  secureTextEntry={!showConfirmPassword}
                  mode="outlined"
                  outlineStyle={signupStyles.outlineInput}
                  style={signupStyles.input}
                  theme={{ colors: { onSurfaceVariant: Colors.grey["e8"] } }}
                  error={
                    password?.length > 0 &&
                    confirmPassword?.length > 0 &&
                    confirmPassword != password
                  }
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      size={16}
                      color={Colors.grey["e7"]}
                      // style={defaultStyles.iconContainer}
                    />
                  }
                />
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <Text
                    style={[signupStyles.errorTextDark, signupStyles.margin20]}
                  >
                    {i18n.t(
                      "(forgot-password).creare-new-password.passwordsDoNot"
                    )}
                  </Text>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={handleSignUp}
            textColor={Colors.light["10"]}
            buttonColor={Colors.primary["500"]}
            style={defaultStyles.button}
            loading={loading}
            disabled={
              loading ||
              !country ||
              !mobile ||
              !email ||
              !password ||
              password.length < 12 ||
              password !== confirmPassword
            }
          >
            {i18n.t("(auth).createAccount.createAccount")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

export default Info;
