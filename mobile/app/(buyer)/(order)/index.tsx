import i18n from "@/i18n";
import { defaultStyles } from "@/styles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { View, KeyboardAvoidingView } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Appbar, Button, Icon, Text } from "react-native-paper";
import { deliveryMethodStyles as styles } from "@/styles";
import { Colors } from "@/constants";

export default function DeliveryMethod() {
  const router = useRouter();
  const [deliveryOption, setDeliveryOption] = useState<
    "pickup" | "home-delivery"
  >("pickup");

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
              {i18n.t("(buyer).(order).index.deliveryMethod")}
            </Text>
            <View />
          </Appbar.Header>
          <View style={styles.marginVertical12}>
            <Text variant="bodyLarge">
              {i18n.t("(buyer).(order).index.chooseDeliveryMethod")}
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={defaultStyles.inputsContainer}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => setDeliveryOption("pickup")}
              >
                <View style={defaultStyles.checkOutterContainer}>
                  <View
                    style={[
                      defaultStyles.checkInnercontainer,
                      deliveryOption === "pickup" && defaultStyles.blueChecked,
                    ]}
                  />
                </View>
                <View style={styles.iconContainer}>
                  <Icon
                    source={"truck-outline"}
                    size={24}
                    color={Colors.blue}
                  />
                </View>
                <View style={styles.textsContainer}>
                  <Text variant="titleMedium">
                    {i18n.t("(buyer).(order).index.pickupPoint")}
                  </Text>
                  <Text>{i18n.t("(buyer).(order).index.collectFrom")}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={() => setDeliveryOption("home-delivery")}
              >
                <View
                  style={[
                    defaultStyles.checkOutterContainer,
                    defaultStyles.checkPrimaryOutterContainer,
                  ]}
                >
                  <View
                    style={[
                      defaultStyles.checkInnercontainer,
                      deliveryOption === "home-delivery" &&
                        defaultStyles.primaryChecked,
                    ]}
                  />
                </View>
                <View style={[styles.iconContainer, styles.primaryBg]}>
                  <Icon
                    source={"home-outline"}
                    size={24}
                    color={Colors.primary[500]}
                  />
                </View>
                <View style={styles.textsContainer}>
                  <Text variant="titleMedium">
                    {i18n.t("(buyer).(order).index.homeDelivery")}
                  </Text>
                  <Text>{i18n.t("(buyer).(order).index.deliveredTo")}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          style={[defaultStyles.button, defaultStyles.primaryButton]}
          contentStyle={[defaultStyles.center]}
          onPress={() =>
            deliveryOption === "home-delivery"
              ? router.push("/(buyer)/(order)/delivery-address")
              : router.push("/(buyer)/(order)/select-pickup-point")
          }
        >
          <View style={defaultStyles.innerButtonContainer}>
            <View>
              <Text variant="titleMedium" style={defaultStyles?.buttonText}>
                {i18n.t("(buyer).(order).index.continue")}
              </Text>
            </View>

            <Icon source={"arrow-right"} color={Colors.light[10]} size={24} />
          </View>
        </Button>
      </View>
    </>
  );
}
