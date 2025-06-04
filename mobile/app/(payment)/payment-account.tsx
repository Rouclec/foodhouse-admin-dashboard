import React, { useContext, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Appbar,
  Button,
  Dialog,
  Icon,
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
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ordersCheckPaymentStatusOptions,
  ordersInitiatePaymentMutation,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { delay } from "@/utils";
import { ordersgrpcPaymentMethodType } from "@/client/orders.swagger";

const PaymentAccountPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [failureModalVisisble, setFailureModalVisible] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [callingCode, setCallingCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, paymentData } = useContext(Context) as ContextType;

  const { paymentMethod } = params;

  const handleSubmit = async () => {
    if (!mobile.trim()) {
      setErrorMessage("Please enter your account number");
      setError(true);
      return;
    }
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          paymentEntity: paymentData?.entity,
          entityId: paymentData?.entityId,
          amount: paymentData?.amount,
          account: {
            paymentMethod: paymentMethod as ordersgrpcPaymentMethodType,
            accountNumber: `${callingCode}${mobile}`,
          },
        },
        path: {
          userId: user?.userId ?? "",
        },
      });
    } catch (error) {
      console.error("error initiating payment ", error);
    } finally {
      setLoading(false);
    }
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

  const { data: paymentStatus } = useQuery({
    ...ordersCheckPaymentStatusOptions({
      path: {
        userId: user?.userId ?? "",
        paymentId: data?.payment?.id ?? "",
      },
    }),
    enabled: !!data?.payment?.id,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!paymentStatus?.status) return;
    if (paymentStatus?.status === "PaymentStatus_INITIATED") return;
    if (paymentStatus?.status === "PaymentStatus_COMPLETED") {
      setLoadingModalVisible(false);
      setSuccessModalVisible(true);
    }
    if (paymentStatus?.status === "PaymentStatus_FAILED") {
      setLoadingModalVisible(false);
      setFailureModalVisible(true);
    }
  }, [paymentStatus]);

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
              {i18n.t("(auth).(subsciption-flow).account.heading")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView contentContainerStyle={defaultStyles.scrollContainer}>
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
        </View>
      </KeyboardAvoidingView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          textColor={Colors.light["10"]}
          buttonColor={Colors.primary["500"]}
          style={defaultStyles.button}
          disabled={!mobile.trim() || loading}
          loading={loading}
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
              {(paymentMethod as ordersgrpcPaymentMethodType) ===
              "PaymentMethodType_MOBILE_MONEY"
                ? i18n.t("(auth).(subsciption-flow).account.instructionMoMo")
                : i18n.t("(auth).(subsciption-flow).account.instructionOM")}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Success Portal */}
      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => {
            setSuccessModalVisible(false);
            router.push(paymentData?.nextScreen ?? "/(buyer)/(index)");
          }}
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
              {i18n.t("(auth).(subsciption-flow).account.paymentSuccessful")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t(
                "(auth).(subsciption-flow).account.paymentCompleteMessage"
              )}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* error Portal */}
      <Portal>
        <Dialog
          visible={failureModalVisisble}
          onDismiss={() => setFailureModalVisible(false)}
          style={defaultStyles.dialogSuccessContainer}
        >
          <Dialog.Content>
            <Image
              source={require("@/assets/images/error.png")}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.errorText}>
              {i18n.t("(auth).(subsciption-flow).account.paymentFailed")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t("(auth).(subsciption-flow).account.paymentFailedMessage")}
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
