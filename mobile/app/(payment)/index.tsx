import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Appbar, Button, Icon, Text } from "react-native-paper";
import { Colors } from "@/constants";
import { defaultStyles, selectionSubscriptionStyles } from "@/styles";

const PaymentMethodsPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // // Extract the plan details from params
  // const { planDuration, planAmount, planDescription } = params;

  const paymentMethods = [
    {
      id: "mtn",
      name: "MTN Mobile Money",
      icon: require("@/assets/images/mtn-momo.png"),
    },
    {
      id: "orange",
      name: "Orange Money",
      icon: require("@/assets/images/orange-money.png"),
    },
  ];

  const handleNext = () => {
    if (selectedMethod) {
      router.push({
        pathname: "/(payment)/paymentAccount",
        params: {
          ...params,
          paymentMethod: selectedMethod,
        },
      });
    }
  };

  return (
    <>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Payment Methods" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={defaultStyles.container}>
        <Text style={defaultStyles.subheaderText}>
          To proceed, please add your payment methods.
        </Text>

        <View style={selectionSubscriptionStyles.plansContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                selectionSubscriptionStyles.planCard,
                selectionSubscriptionStyles.methodCard,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <Image
                source={method.icon}
                style={selectionSubscriptionStyles.methodIcon}
              />
              <Text style={selectionSubscriptionStyles.planPrice}>
                {method.name}
              </Text>
              <View style={selectionSubscriptionStyles.planSelector}>
                <View style={[selectionSubscriptionStyles.selectionCircle]}>
                  {selectedMethod === method.id && (
                    <View style={selectionSubscriptionStyles.innerCircle} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={handleNext}
          textColor={Colors.light["10"]}
          buttonColor={Colors.primary["500"]}
          style={defaultStyles.button}
          disabled={!selectedMethod}
        >
          Next
        </Button>
      </View>
    </>
  );
};
export default PaymentMethodsPage;
