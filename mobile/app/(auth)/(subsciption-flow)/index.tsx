import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {Button, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { defaultStyles, imagePickerStyles, selectionSubscriptionStyles } from "@/styles";
import i18n from "@/i18n";

export default function Index() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
//userscreateSubscriptionOptions has the subscriptionid in it
//usersCreateSubscriptionMutation

//after selecting a payment method, we call usersSubscribeMutation, after payment has been innitiated

// when we collect the data, we call the usersSubcribeMutation which will collect the repsonse body of the plan , u will pass the userid. all this is when the subcribe  now body is clicked
// still tricky, on success, we rather pass the amount and the country isocode to the payment method page
//on the payment method page
//now is instead on the payment page that we call users subscribe mutation
// the response body is the payment id
  const plans = [
    {
      duration: "1 Month",
      amount: "16.99",
      description: "Pay once, cancel any time",
    },
    {
      duration: "6 Months",
      amount: "66.99",
      description: "Pay once, cancel any time",
    },
    {
      duration: "12 Months",
      amount: " 116.99 ",
      description: "Pay once, cancel any time",
    },
  ];

  const handleSubscribe = () => {
  if (selectedPlan) {
    const selectedPlanData = plans.find(plan => plan.duration === selectedPlan);
    router.push({
      pathname: "/payment-method",
      params: { 
        planDuration: selectedPlan,
        planAmount: selectedPlanData?.amount,
        planDescription: selectedPlanData?.description
      }
    });
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
            <Text style={selectionSubscriptionStyles.mainTitle}> {i18n.t("(auth).(subsciption-flow).index.heading")}</Text>
            <Text style={selectionSubscriptionStyles.subTitle}>{i18n.t("(auth).(subsciption-flow).index.subtitle")}</Text>

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
                <Text style={selectionSubscriptionStyles.benefitText}>{i18n.t("(auth).(subsciption-flow).index.benefit3")}</Text>
              </View>
            </View>

            <View style={selectionSubscriptionStyles.plansContainer}>
              {plans.map((plan, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    selectionSubscriptionStyles.planCard,
                    selectedPlan === plan.duration
                      ? selectionSubscriptionStyles.selectedPlanCard
                      : null,
                  ]}
                  onPress={() => setSelectedPlan(plan.duration)}
                >
                  <View style={selectionSubscriptionStyles.planSelector}>
                    <View style={[selectionSubscriptionStyles.selectionCircle]}>
                      {selectedPlan === plan.duration && (
                        <View style={selectionSubscriptionStyles.innerCircle} />
                      )}
                    </View>
                  </View>

                  <View style={selectionSubscriptionStyles.planDetails}>
                    <Text style={selectionSubscriptionStyles.planDuration}>{plan.duration}</Text>
                    <Text style={selectionSubscriptionStyles.planDescription}>
                      {plan.description}
                    </Text>
                  </View>

                  <View style={selectionSubscriptionStyles.planPriceContainer}>
                    <Text style={selectionSubscriptionStyles.currencyText}>FCFA</Text>
                    <Text style={selectionSubscriptionStyles.priceValue}>{plan.amount}</Text>
                    <Text style={selectionSubscriptionStyles.priceDuration}>/m</Text>
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
          >
            {i18n.t("(auth).(subsciption-flow).index.button1")}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubscribe}
            style={imagePickerStyles.button1}
            disabled={!selectedPlan}
          >
           {i18n.t("(auth).(subsciption-flow).index.button2")}
          </Button>
        </View>
      </ImageBackground>
    </>
  );
}
