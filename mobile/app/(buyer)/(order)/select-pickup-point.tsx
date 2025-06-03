import { Colors } from "@/constants";
import i18n from "@/i18n";
import { defaultStyles } from "@/styles";
import { useRouter } from "expo-router";
import React, { use, useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button, Icon, Text, TextInput } from "react-native-paper";
import * as Location from "expo-location";
import { Region } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import {
  ordersListDeliveryCitiesOptions,
  ordersListDeliveryPointsOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/_layout";
import { Chase } from "react-native-animated-spinkit";
import { selectPickupLocationStyles as styles } from "@/styles";

export default function SelectPickupPoint() {
  const { user } = useContext(Context) as ContextType;

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState<string>();

  const [deliveryLocation, setDeliveryLocation] = useState<{
    description: string;
    region: Region;
  }>();
  // const [userCurrentCity, setUserCurrentCity] = useState<string>();

  // useEffect(() => {
  //   const handleUseCurrentLocation = async () => {
  //     try {
  //       setLoading(true);
  //       const { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== "granted") {
  //         alert(i18n.t("(buyer).(order).checkout.pleaseAcceptPermissions"));
  //         return;
  //       }

  //       const currentLocation = await Location.getCurrentPositionAsync({});

  //       const address = await Location.reverseGeocodeAsync(
  //         currentLocation.coords
  //       );

  //       setUserCurrentCity(address[0]?.city + "," + address[0]?.country);

  //       setCurrentLocation({
  //         description: `${address[0].name}, ${address[0].city}, ${address[0].country}`,
  //         region: {
  //           ...currentLocation.coords,
  //           latitudeDelta: 0.01,
  //           longitudeDelta: 0.01,
  //         },
  //       });
  //     } catch (error) {
  //       console.error("Error getting location: ", error);
  //       alert(i18n.t("(buyer).(order).checkout.errorGettingLocation"));
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   handleUseCurrentLocation();
  // }, []);

  // const { data: deliveryCities, isLoading } = useQuery({
  //   ...ordersListDeliveryCitiesOptions({
  //     path: {
  //       userId: user?.userId ?? "",
  //     },
  //   }),
  // });

  const { data, isLoading } = useQuery({
    ...ordersListDeliveryPointsOptions({
      query: {
        city,
      },
      path: {
        userId: user?.userId ?? "",
      },
    }),
    enabled: !!city,
  });

  console.log({ data });
  
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
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={defaultStyles.inputsContainer}>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          style={[defaultStyles.button, defaultStyles.primaryButton]}
          contentStyle={[defaultStyles.center]}
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
