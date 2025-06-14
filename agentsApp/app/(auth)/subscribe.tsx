import React, { useContext, useState } from "react";
import {
  View,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from "react-native";
import { RelativePathString, useRouter } from "expo-router";
import { Button, Snackbar, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import {
  defaultStyles,
  imagePickerStyles,
  selectionSubscriptionStyles,
} from "@/styles";
import i18n from "@/i18n";
import {
  usersListSubscriptionsOptions,
  usersSubscribeMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "../_layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatAmount } from "@/utils/amountFormater";
import { usersgrpcSubscription } from "@/client/users.swagger";
import { Colors } from "@/constants";

export default function Index() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<usersgrpcSubscription>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const { user, setPaymentData } = useContext(Context) as ContextType;

  const { data: subscriptionData } = useQuery(
    usersListSubscriptionsOptions({
      path: {
        userId: user?.userId ?? "",
      },
    })
  );

  const subscriptions = subscriptionData?.subscriptions ?? [];

  const { mutateAsync: subscribe } = useMutation({
    ...usersSubscribeMutation(),
    onSuccess: (responseData) => {
      if (!selectedPlan) return;

      setPaymentData({
        entity: "PaymentEntity_SUBSCRIPTION",
        entityId: responseData?.userSubscription?.id ?? "",
        nextScreen: "/(buyer)/(index)" as RelativePathString,
        amount: {
          value: selectedPlan.amount?.value ?? 0,
          currencyIsoCode: selectedPlan.amount?.currencyIsoCode ?? " ",
        },
      });
      router.push("/(payment)");
    },
    onError: (error: any) => {
      setError(
        error?.response?.data?.message ??
          i18n.t("(buyer).(order).checkout.unknownError")
      );
      setTimeout(() => setError(undefined), 5000);
    },
  });

  const handleSubscribe = async () => {
    if (!selectedPlan?.id || !user?.userId) return;

    try {
      setLoading(true);
      await subscribe({
        path: { userId: user.userId },
        body: {
          subscriptionId: selectedPlan.id,
          amount: selectedPlan.amount?.value,
          currencyIsoCode: selectedPlan.amount?.currencyIsoCode ?? " ",
        },
      });
    } catch (err) {
      setError(
        (err as Error)?.message ??
          i18n.t("(buyer).(order).checkout.unknownError")
      );
      setTimeout(() => setError(undefined), 5000);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <ImageBackground
        source={require("@/assets/images/background-overlay-image.png")}
        style={selectionSubscriptionStyles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.8)",
            "rgba(255,255,255,1)",
          ]}
          locations={[0, 0.5, 2]}
          style={selectionSubscriptionStyles.gradientOverlay}
        />

        <ScrollView
          contentContainerStyle={defaultStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={selectionSubscriptionStyles.contentContainer}>
            <Text style={selectionSubscriptionStyles.mainTitle}>
              {i18n.t("(auth).(subsciption-flow).index.heading")}
            </Text>
            <Text style={selectionSubscriptionStyles.subTitle}>
              {i18n.t("(auth).(subsciption-flow).index.subtitle")}
            </Text>

            {error && (
              <Text
                style={{
                  color: "red",
                  textAlign: "center",
                  marginVertical: 10,
                }}
              >
                {error}
              </Text>
            )}

            <View style={selectionSubscriptionStyles.benefitsContainer}>
              <View style={selectionSubscriptionStyles.benefitItem}>
                <View style={selectionSubscriptionStyles.bulletPoint} />
                <Text style={selectionSubscriptionStyles.benefitText}>
                  {i18n.t("(auth).(subsciption-flow).index.benefit1")}
                </Text>
              </View>
              <View style={selectionSubscriptionStyles.benefitItem}>
                <View style={selectionSubscriptionStyles.bulletPoint} />
                <Text style={selectionSubscriptionStyles.benefitText}>
                  {i18n.t("(auth).(subsciption-flow).index.benefit2")}
                </Text>
              </View>
              <View style={selectionSubscriptionStyles.benefitItem}>
                <View style={selectionSubscriptionStyles.bulletPoint} />
                <Text style={selectionSubscriptionStyles.benefitText}>
                  {i18n.t("(auth).(subsciption-flow).index.benefit3")}
                </Text>
              </View>
            </View>

            <View style={selectionSubscriptionStyles.plansContainer}>
              {subscriptions.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    selectionSubscriptionStyles.planCard,
                    selectedPlan?.title === plan.title &&
                      selectionSubscriptionStyles.selectedPlanCard,
                  ]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <View style={selectionSubscriptionStyles.planSelector}>
                    <View style={selectionSubscriptionStyles.selectionCircle}>
                      {selectedPlan?.title === plan.title && (
                        <View style={selectionSubscriptionStyles.innerCircle} />
                      )}
                    </View>
                  </View>

                  <View style={selectionSubscriptionStyles.planDetails}>
                    <Text style={selectionSubscriptionStyles.planDuration}>
                      {plan.title}
                    </Text>
                    <Text style={selectionSubscriptionStyles.planDescription}>
                      {plan.description}
                    </Text>
                  </View>

                  <View style={selectionSubscriptionStyles.planPriceContainer}>
                    <Text style={selectionSubscriptionStyles.currencyText}>
                      FCFA
                    </Text>
                    <Text style={selectionSubscriptionStyles.priceValue}>
                      {plan.amount?.value
                        ? formatAmount(plan.amount.value)
                        : ""}
                    </Text>
                    <Text style={selectionSubscriptionStyles.priceDuration}>
                      /m
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={imagePickerStyles.bottomContainer}>
          <Button
            mode="outlined"
            onPress={() => router.replace("/(buyer)/(index)")}
            style={[imagePickerStyles.button1, imagePickerStyles.skipButton]}
            labelStyle={imagePickerStyles.skipButtonText}
            loading={loading}
          >
            {i18n.t("(auth).(subsciption-flow).index.button1")}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubscribe}
            style={imagePickerStyles.button1}
            disabled={!selectedPlan}
            loading={loading}
            textColor={Colors.light["10"]}
          >
            {i18n.t("(auth).(subsciption-flow).index.button2")}
          </Button>
        </View>
      </ImageBackground>
      <Snackbar
        visible={!!error}
        testID="signup_error_toast"
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}
      >
        <Text style={defaultStyles.errorText}>{error}</Text>
      </Snackbar>
    </>
  );
}
