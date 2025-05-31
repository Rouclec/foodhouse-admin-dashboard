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
import { defaultStyles, styles } from "@/styles";

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
    {
      id: "card",
      name: "Mastercard / Visa",
      icon: require("@/assets/images/mastercard_visa.png"),
    },
  ];


  const handleNext = () => {
    if (selectedMethod) {
      router.push({
        pathname: "/payment-account",
        params: {
          ...params, 
          paymentMethod: selectedMethod
        }
      });
    }
  };

  return (
    <>
      <Appbar.Header dark={false}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Payment Methods" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={defaultStyles.container}>
        <Text style={defaultStyles.subheaderText}>
          To proceed, please add your payment methods.
        </Text>

        <View style={styles.plansContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.planCard, 
                styles.methodCard
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <Image source={method.icon} style={styles.methodIcon} />
              <Text style={styles.planPrice}>{method.name}</Text>
              <View style={styles.planSelector}>
                                  <View style={[styles.selectionCircle]}>
                                    {selectedMethod === method.id && (
                                      <View style={styles.innerCircle} />
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
