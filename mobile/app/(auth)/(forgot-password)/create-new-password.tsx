import { Colors } from "@/constants";
import { defaultStyles, createNewPasswordStyles as styles } from "@/styles";
import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Appbar,
  Button,
  Icon,
  Text,
  Snackbar,
  TextInput,
  Portal,
  Dialog,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { delay } from "@/utils";
import i18n from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { usersChangePasswordMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { Chase } from "react-native-animated-spinkit";

export default function CreateNewPassword() {
  const { otp, requestId } = useLocalSearchParams();

  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(false);

  const handleChangePassword = async () => {
    try {
      setError(false);
      setLoading(true);
      await changePassword({
        body: {
          newPassword: password,
          emailFactor: {
            type: "FACTOR_TYPE_EMAIL_OTP",
            id: requestId as string,
            secretValue: otp as string,
          },
        },
      });
    } catch (error) {
      console.error({ error }, "logging in");
    } finally {
      setLoading(false);
    }
  };

  const { mutateAsync: changePassword } = useMutation({
    ...usersChangePasswordMutation(),
    onError: async (error) => {
      setErrorMessage(
        error?.response?.data?.message ??
          i18n.t("(auth).(forgot-password).create-new-password.unknownError")
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async () => {
      setShowModal(true);
      await delay(5000);
      setShowModal(false);
      router.push("/(auth)/login");
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}
            >
              <Icon source={"arrow-left"} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t(
                "(auth).(forgot-password).create-new-password.createNewPassword"
              )}
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
                  source={require("@/assets/images/create-new-password-illustration.png")}
                />
              </View>
              <View style={defaultStyles.inputsContainer}>
                <TextInput
                  mode="outlined"
                  label={i18n.t(
                    "(auth).(forgot-password).create-new-password.password"
                  )}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  error={!!password && password.length < 12}
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
                {!!password && password?.length < 12 ? (
                  <Text style={defaultStyles.errorText}>
                    {i18n.t(
                      "(auth).(forgot-password).create-new-password.passwordMustBe"
                    )}
                  </Text>
                ) : null}
                <TextInput
                  mode="outlined"
                  label={i18n.t(
                    "(auth).(forgot-password).create-new-password.confirmPassword"
                  )}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={(text) => setConfirmPassword(text)}
                  error={!!confirmPassword && confirmPassword !== password}
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
                {!!confirmPassword && confirmPassword !== password ? (
                  <Text style={defaultStyles.errorText}>
                    {i18n.t(
                      "(auth).(forgot-password).create-new-password.passwordsDoNot"
                    )}
                  </Text>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          buttonColor={Colors.primary["500"]}
          disabled={
            !password ||
            password.length < 12 ||
            password !== confirmPassword ||
            loading
          }
          loading={loading}
          onPress={handleChangePassword}
          style={defaultStyles.button}
        >
          <Text style={defaultStyles.buttonText}>
            {i18n.t("(auth).(forgot-password).create-new-password.continue")}
          </Text>
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showModal}
          onDismiss={() => {}}
          style={defaultStyles.dialogSuccessContainer}
        >
          <Dialog.Content>
            <Image
              source={require("@/assets/images/success.png")}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t(
                "(auth).(forgot-password).create-new-password.passwordReset"
              )}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t(
                "(auth).(forgot-password).create-new-password.yourPasswordHasBeenReset"
              )}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Chase size={56} color={Colors.primary[500]} />
          </Dialog.Content>
        </Dialog>
      </Portal>

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
