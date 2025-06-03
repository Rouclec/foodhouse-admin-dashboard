import React, { useContext, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Appbar, Button, Text, TextInput } from "react-native-paper";
import { Link, router } from "expo-router";
import { defaultStyles, loginstyles, signupStyles } from "@/styles";
import { useMutation } from "@tanstack/react-query";
import { usersChangePasswordMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { delay } from "@/utils";
import i18n from "@/i18n";
import { Colors } from "@/constants"; // Make sure to import Colors
import { Context, ContextType } from "../_layout";

const ChangePasswordScreen = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const { user } = useContext(Context) as ContextType;

  const { mutateAsync: updatePassword } = useMutation({
    ...usersChangePasswordMutation(),
    onError: async (error) => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t("(auth).login.anUnknownError")
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async (data) => {
      router.back();
    },
  });

  const handleSaveChanges = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      setError(true);
      await delay(5000);
      setError(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords don't match");
      setError(true);
      await delay(5000);
      setError(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      setError(true);
      await delay(5000);
      setError(false);
      return;
    }

    try {
      await updatePassword({
        body: {
          newPassword,
          emailFactor: {
            id: user?.email,
            type: "FACTOR_TYPE_EMAIL_PASSWORD",
            secretValue: currentPassword,
          },
        },
      });
    } catch (err) {}
  };

  return (
    <>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Change password" />
      </Appbar.Header>
      <SafeAreaView style={defaultStyles.scrollContainer}>
        <ScrollView contentContainerStyle={styles.innerContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          <View style={signupStyles.allInput}>
            <View>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                mode="outlined"
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                autoCapitalize="none"
                style={loginstyles.input}
                outlineColor={Colors.grey["bg"]}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: "#FAFAFA",
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                right={
                  <TextInput.Icon
                    icon={showCurrent ? "eye-off" : "eye"}
                    onPress={() => setShowCurrent(!showCurrent)}
                    color={Colors.grey["61"]}
                    size={20}
                  />
                }
              />
            </View>

            <View>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                mode="outlined"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                autoCapitalize="none"
                style={loginstyles.input}
                outlineColor={Colors.grey["bg"]}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: "#FAFAFA",
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                right={
                  <TextInput.Icon
                    icon={showNew ? "eye-off" : "eye"}
                    onPress={() => setShowNew(!showNew)}
                    color={Colors.grey["61"]}
                    size={20}
                  />
                }
              />
            </View>

            <View>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                mode="outlined"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                autoCapitalize="none"
                style={loginstyles.input}
                outlineColor={Colors.grey["bg"]}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: "#FAFAFA",
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                right={
                  <TextInput.Icon
                    icon={showConfirm ? "eye-off" : "eye"}
                    onPress={() => setShowConfirm(!showConfirm)}
                    color={Colors.grey["61"]}
                    size={20}
                  />
                }
              />
            </View>

            

            <Link
              style={loginstyles.forgotPassword}
              href={"/(auth)/(forgot-password)"}
            >
              <Text style={loginstyles.forgotPasswordText}>
                Forgot password?
              </Text>
            </Link>

           
          </View>
         
        </ScrollView>
         <View style={defaultStyles.bottomButtonContainer}>
            <Button
              mode="contained"
              onPress={handleSaveChanges}
              style={defaultStyles.button}
            >
              Save changes
            </Button>
          </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    padding: 20,
  },

  label: {
    marginBottom: 6,
    fontWeight: "500",
    color: "#333",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 40,
  },
  forgotPasswordText: {
    color: "#1db954",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#1db954",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
  },
});

export default ChangePasswordScreen;
