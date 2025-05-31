import React, { useState } from "react";
import { View, ScrollView, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import { Chase } from "react-native-animated-spinkit";
import { Colors } from "@/constants";
import { defaultStyles, loginstyles, signupStyles, styles } from "@/styles";
import i18n from "@/i18n";
;

const PaymentAccountPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [accountNumber, setAccountNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get the selected payment method from params
  const { paymentMethod } = params;

  const handleSubmit = () => {
    // Validate account number
    if (!accountNumber.trim()) {
      setErrorMessage("Please enter your account number");
      setError(true);
      return;
    }

    // Validate expiry date if card payment
    if (paymentMethod === "card" && !expiryDate) {
      setErrorMessage("Please select expiry date");
      setError(true);
      return;
    }

    // Show loading state
    setLoadingModalVisible(true);

    // Simulate payment processing delay (2 seconds)
    setTimeout(() => {
      setLoadingModalVisible(false);
      setSuccessModalVisible(true);

      // Navigate after showing success for 2 seconds
      setTimeout(() => {
        router.push({
          pathname: "../login",
          params: {
            ...params,
            accountNumber,
            expiryDate: expiryDate?.toISOString(),
          },
        });
      }, 2000);
    }, 2000);
  };

  return (
    <>
      <Appbar.Header dark={false}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={i18n.t("(auth).(subsciption-flow).account.heading")}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={defaultStyles.container}>
        <View style={loginstyles.content}>
        <Text style={defaultStyles.subheaderText}>
          {paymentMethod === "orange"
            ? i18n.t("(auth).(subsciption-flow).account.orange")
            : paymentMethod === "mtn"
            ? i18n.t("(auth).(subsciption-flow).account.mtn")
            : i18n.t("(auth).(subsciption-flow).account.cardNumber")}
        </Text>
        
          <TextInput
          mode="outlined"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            style={loginstyles.input}
            theme={{
              colors: {
                primary: Colors.primary[500],
                background: Colors.primary[500],
                error: Colors.error,
              },
              roundness: 10,
            }}
            outlineColor={Colors.grey["bg"]}
          />
        </View>
          
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          textColor={Colors.light["10"]}
          buttonColor={Colors.primary["500"]}
          style={defaultStyles.button}
          disabled={
            !accountNumber.trim() || (paymentMethod === "card" && !expiryDate)
          }
        >
          {i18n.t("(auth).(subsciption-flow).account.button")}
        </Button>
      </View>

      {/* Loading Portal */}
      <Portal>
        <Dialog
          visible={loadingModalVisible}
          onDismiss={() => setLoadingModalVisible(false)}
          style={defaultStyles.dialogSuccessContainer}
        >
          <Dialog.Content>
            <Chase size={56} color={Colors.primary[500]} />
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t("(auth).(subsciption-flow).account.approval")}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Success Portal */}
      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => setSuccessModalVisible(false)}
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
              {i18n.t("(auth).profile.congratulations")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t(
                "(auth).(subsciption-flow).account.paymentcompleteMessage"
              )}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Snackbar
        visible={error}
        onDismiss={() => setError(false)}
        duration={3000}
        style={defaultStyles.snackbar}
      >
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};

export default PaymentAccountPage;
