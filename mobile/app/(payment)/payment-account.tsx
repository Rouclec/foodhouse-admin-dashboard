import React, { useContext, useState } from "react";
import { View, ScrollView, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
} from "react-native-paper";
import { Chase } from "react-native-animated-spinkit";
import { Colors } from "@/constants";
import { defaultStyles, loginstyles, signupStyles } from "@/styles";
import i18n from "@/i18n";
import PhoneNumberInput from "@/components/general/PhoneNumberInput";
import { Context, ContextType } from "../_layout";
import { useMutation } from "@tanstack/react-query";
import { ordersInitiatePaymentMutation } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { delay } from "@/utils";

const PaymentAccountPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [callingCode, setCallingCode] = useState("");
  const [mobile, setMobile] = useState("");

  const { user, paymentData } = useContext(Context) as ContextType;

  const { paymentMethod } = params;

  const handleSubmit = () => {
    if (!mobile.trim()) {
      setErrorMessage("Please enter your account number");
      setError(true);
      return;
    }
    setLoadingModalVisible(true);
    setTimeout(() => {
      setLoadingModalVisible(false);
      setSuccessModalVisible(true);
      setTimeout(() => {
        router.push({
          pathname: "/(buyer)/(index)",
          params: {
            ...params,
            mobile,
            expiryDate: expiryDate?.toISOString(),
          },
        });
      }, 2000);
    }, 2000);
  };

  const { mutateAsync, data } = useMutation({
    ...ordersInitiatePaymentMutation(),
    onSuccess: () => {
      setLoadingModalVisible(true);
    },
    onError: async (error) => {
      setErrorMessage(
        error?.response?.data?.message ??
          i18n.t("(buyer).(order).checkout.unknownError")
      );
      setError(true);
      await delay(5000);
      setError(false);
      setErrorMessage("");
    },
  });

  return (
    <>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={i18n.t("(auth).(subsciption-flow).account.heading")}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={defaultStyles.container}>
        <Text>
          {paymentMethod === "orange"
            ? i18n.t("(auth).(subsciption-flow).account.orange")
            : paymentMethod === "mtn"
            ? i18n.t("(auth).(subsciption-flow).account.mtn")
            : ""}
        </Text>

        <PhoneNumberInput
          setCountryCode={setCallingCode}
          countryCode={callingCode}
          setPhoneNumber={setMobile}
          phoneNumber={mobile}
          containerStyle={signupStyles.phoneNumberInputContainerStyle}
        />
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          textColor={Colors.light["10"]}
          buttonColor={Colors.primary["500"]}
          style={defaultStyles.button}
          disabled={!mobile.trim()}
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
