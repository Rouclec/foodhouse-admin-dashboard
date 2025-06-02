import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { Icon, TextInput } from "react-native-paper";
import { Link, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  usersAuthenticateMutation,
  usersGetUserByIdOptions,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "../_layout";
import { defaultStyles, loginstyles } from "@/styles";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { delay, storeData, updateAuthHeader } from "@/utils";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string>();
  const { user, setUser } = useContext(Context) as ContextType;

 
  // Fetch user data if userId exists
  const { data: userData } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: userId ?? "",
      },
    }),
    enabled: !!userId, 
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
        const role = userData?.user?.role;

        if (role === "USER_TYPE_FARMER") {
          router.replace("/(farmer)/(index)");
          
        } else {
          router.replace("/(buyer)/(index)");
          
        }
    }
  }, [userData]);

  const { mutateAsync: authenticate } = useMutation({
    ...usersAuthenticateMutation(),
    onError: async (error) => {
      setErrorMessage(
              error?.response?.data?.message ??
                i18n.t("(auth).login.anUnknownError")
            );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async (data) => {
      try {
          updateAuthHeader(data?.tokens?.accessToken ?? "")
          await storeData("@refreshToken", data?.tokens?.refreshToken);
          storeData("@userId", data?.userId);
          setUserId(data?.userId ?? "")
      } catch (err) {
        console.error("Error handling login success:", err);
      }
    },
  });

  const handleInputChange = (name: string, value: string) => {
    setFields({ ...fields, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateFields = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!fields.email.trim()) {
      newErrors.email = i18n.t("(auth).login.emailRequired");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      newErrors.email = i18n.t("(auth).login.invalidEmail");
      isValid = false;
    }

    if (!fields.password.trim()) {
      newErrors.password = i18n.t("(auth).login.passwordRequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogIn = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      await authenticate({
        body: {
          factors: [
            {
              type: "FACTOR_TYPE_EMAIL_PASSWORD",
              id: fields.email,
              secretValue: fields.password,
            },
          ],
        },
      });
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={loginstyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={loginstyles.container}>
          <View style={loginstyles.header}>
            <TouchableOpacity
              style={loginstyles.backButton}
              onPress={() => router.replace("/onboarding")}
            >
              <Icon source="arrow-left" size={24} color={Colors.dark[0]} />
            </TouchableOpacity>

            <View style={loginstyles.logoCircle}>
              <Text style={loginstyles.logoText}>Food House</Text>
            </View>
          </View>
           <ScrollView
                      contentContainerStyle={defaultStyles.scrollContainer}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                    >
          <View style={loginstyles.content}>
            <Text style={loginstyles.loginTitle}>
              {i18n.t("(auth).login.loginTo")}
            </Text>

            {error && (
              <Text style={loginstyles.errorMessage}>{errorMessage}</Text>
            )}

              <TextInput
                mode="outlined"
                label={i18n.t("(auth).login.email")}
                value={fields.email}
                onChangeText={(text) => handleInputChange("email", text)}
                error={!!errors.email}
                style={loginstyles.input}
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
              />
              {errors.email ? (
                <Text style={loginstyles.errorText}>{errors.email}</Text>
              ) : null}

            <TextInput
              mode="outlined"
              label={i18n.t("(auth).login.password")}
              secureTextEntry={!showPassword}
              value={fields.password}
              onChangeText={(text) => handleInputChange("password", text)}
              error={!!errors.password}
              style={loginstyles.input}
              theme={{
                colors: {
                  primary: Colors.primary[500],
                  background: "#FAFAFA",
                  error: Colors.error,
                },
                roundness: 10,
              }}
              outlineColor={Colors.grey["bg"]}
              left={
                <TextInput.Icon
                  icon="lock-outline"
                  color={Colors.grey["61"]}
                  size={20}
                />
              }
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                  color={Colors.grey[61]}
                  size={20}
                />
              }
            />
            {errors.password ? (
              <Text style={loginstyles.errorText}>{errors.password}</Text>
            ) : null}

            <Link
              style={loginstyles.forgotPassword}
              href={"/(auth)/(forgot-password)"}
            >
              <Text style={loginstyles.forgotPasswordText}>
                {i18n.t("(auth).login.forgotPassword")}
              </Text>
            </Link>

            <TouchableOpacity
              style={loginstyles.loginButton}
              onPress={handleLogIn}
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

            <View style={loginstyles.dividerContainer}>
              <View style={loginstyles.dividerLine} />
              <Text style={loginstyles.dividerText}>
                {i18n.t("(auth).login.orContinueWith")}
              </Text>
              <View style={loginstyles.dividerLine} />
            </View>

            <View style={loginstyles.socialIconsContainer}>
              <TouchableOpacity style={loginstyles.socialIcon}>
                <MaterialCommunityIcons
                  name="facebook"
                  size={24}
                  color={Colors.primary[100]}
                />
              </TouchableOpacity>
              <TouchableOpacity style={loginstyles.socialIcon}>
                <MaterialCommunityIcons
                  name="google"
                  size={24}
                  color={Colors.primary[200]}
                />
              </TouchableOpacity>
              <TouchableOpacity style={loginstyles.socialIcon}>
                <MaterialCommunityIcons name="apple" size={24} />
              </TouchableOpacity>
            </View>

              <View style={loginstyles.registerContainer}>
                <Text style={loginstyles.registerText}>
                  {i18n.t("(auth).login.dontHaveAnAccount")}{" "}
                </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
                  <Text style={loginstyles.registerLink}>
                    {i18n.t("(auth).login.registerNow")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          </View>
      </KeyboardAvoidingView>
    </>
  );
}
