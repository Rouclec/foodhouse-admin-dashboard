import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Appbar, Button, Icon, Text } from "react-native-paper";
import { Colors } from "@/constants";
import { defaultStyles, selectionSubscriptionStyles } from "@/styles";
import { ordersgrpcPaymentMethodType } from "@/client/orders.swagger";
import { KeyboardAvoidingView } from "react-native";

const PaymentMethodsPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] =
    useState<ordersgrpcPaymentMethodType>();


  const paymentMethods: Array<{
    id: ordersgrpcPaymentMethodType;
    name: string;
    icon: ImageSourcePropType;
  }> = [
    {
      id: "PaymentMethodType_MOBILE_MONEY",
      name: "MTN Mobile Money",
      icon: require("@/assets/images/icons/momo.png"),
    },
    {
      id: "PaymentMethodType_ORANGE_MONEY",
      name: "Orange Money",
      icon: require("@/assets/images/icons/orangeMoney.png"),
    },
  ];

  const handleNext = () => {
    if (selectedMethod) {
      router.push({
        pathname: "/(payment)/payment-account",
        params: {
          ...params,
          paymentMethod: selectedMethod,
        },
      });
    }
  };

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
              Payment Methods
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <Text>
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
        </View>
      </KeyboardAvoidingView>

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
