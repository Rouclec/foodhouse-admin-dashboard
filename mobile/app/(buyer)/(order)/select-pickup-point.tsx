import { Colors } from "@/constants";
import i18n from "@/i18n";
import { defaultStyles } from "@/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button, Icon, Text, TextInput } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import { ordersListDeliveryPointsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/_layout";
import { Chase } from "react-native-animated-spinkit";
import { selectPickupLocationStyles as styles } from "@/styles";

export default function SelectPickupPoint() {
  const { user, deliveryLocation, setDeliveryLocation } = useContext(
    Context
  ) as ContextType;

  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo =
    (params.returnTo as string | undefined) ?? "/(buyer)/(order)/checkout";
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState<string>();
  const [debounceQuery, setDebounceQuery] = useState<string>();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceQuery(city);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [city]);

  const { data, isLoading } = useQuery({
    ...ordersListDeliveryPointsOptions({
      query: {
        city: debounceQuery,
      },
      path: {
        userId: user?.userId ?? "",
      },
    }),
    enabled: !!debounceQuery,
  });

  if (loading) {
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
                {i18n.t(
                  "(buyer).(order).select-pickup-point.selectPickupPoint"
                )}
              </Text>
              <View />
            </Appbar.Header>
            <ScrollView
              contentContainerStyle={defaultStyles.scrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={[defaultStyles.inputsContainer, defaultStyles.center]}
              >
                <Chase size={56} color={Colors.primary[500]} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            style={[defaultStyles.button, defaultStyles.primaryButton]}
            contentStyle={[defaultStyles.center]}
            disabled
          >
            <View style={defaultStyles.innerButtonContainer}>
              <View>
                <Text variant="titleMedium" style={defaultStyles?.buttonText}>
                  {i18n.t(
                    "(buyer).(order).select-pickup-point.proceedToCheckout"
                  )}
                </Text>
              </View>

              <Icon source={"arrow-right"} color={Colors.light[10]} size={24} />
            </View>
          </Button>
        </View>
      </>
    );
  }

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
              {i18n.t("(buyer).(order).select-pickup-point.selectPickupPoint")}
            </Text>
            <View />
          </Appbar.Header>
          <View style={styles.marginVertical24}>
            <TextInput
              mode="outlined"
              label={i18n.t("(buyer).(order).select-pickup-point.enterCity")}
              value={city}
              onChangeText={(text) => setCity(text)}
              style={defaultStyles.input}
              theme={{
                colors: {
                  primary: Colors.primary[500],
                  background: Colors.grey["fa"],
                  error: Colors.error,
                },
                roundness: 10,
              }}
              outlineColor={Colors.grey["bg"]}
            />
          </View>
          <Text variant="titleMedium" style={styles.title}>
            {i18n.t("(buyer).(order).select-pickup-point.availablePickup")}
          </Text>
          {!debounceQuery ? null : isLoading && !data ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={data?.deliveryPoints}
              keyExtractor={(item, index) => item?.id ?? index.toString()}
              contentContainerStyle={styles.flatListContentContainer}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t(
                      "(buyer).(order).select-pickup-point.noPickupPointsIn"
                    )}{" "}
                    {city}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() =>
                      setDeliveryLocation({
                        description: item?.deliveryPointName ?? "",
                        address: item?.address?.address ?? "",
                        region: {
                          longitude: item?.address?.lon ?? 0,
                          latitude: item?.address?.lat ?? 0,
                          longitudeDelta: 0.01,
                          latitudeDelta: 0.01,
                        },
                      })
                    }
                  >
                    <View style={styles.checkOutterContainer}>
                      <View
                        style={[
                          styles.checkInnercontainer,
                          deliveryLocation?.description ===
                            item?.deliveryPointName && styles.checked,
                        ]}
                      />
                    </View>
                    <View style={styles.iconContainer}>
                      <Icon
                        source={"map-marker-outline"}
                        size={24}
                        color={Colors.grey["61"]}
                      />
                    </View>
                    <View style={styles.textsContainer}>
                      <Text variant="titleMedium" style={styles.text16}>
                        {item?.deliveryPointName}
                      </Text>
                      <Text style={styles.text14}>
                        {item?.address?.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          onPress={() => router.push(returnTo)}
          style={[
            defaultStyles.button,
            defaultStyles.primaryButton,
            !deliveryLocation && defaultStyles.greyButton,
          ]}
          contentStyle={[defaultStyles.center]}
          disabled={!deliveryLocation}
        >
          <View style={defaultStyles.innerButtonContainer}>
            <View>
              <Text variant="titleMedium" style={defaultStyles?.buttonText}>
                {returnTo.includes("subscription")
                  ? "Continue"
                  : i18n.t(
                      "(buyer).(order).select-pickup-point.proceedToCheckout"
                    )}
              </Text>
            </View>

            <Icon source={"arrow-right"} color={Colors.light[10]} size={24} />
          </View>
        </Button>
      </View>
    </>
  );
}
