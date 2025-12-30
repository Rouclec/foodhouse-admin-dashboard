import 'react-native-get-random-values';

import { Context, ContextType } from '@/app/_layout';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { defaultStyles } from '@/styles';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  LayoutChangeEvent,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import MapView, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import * as Location from 'expo-location';

import { Appbar, Button, Checkbox, Icon, Text } from 'react-native-paper';
import { FilterBottomSheetRef } from '@/components/(buyer)/(index)/FilterBottomSheet';
import { deliveryAddressStyles as styles } from '@/styles';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INITIAL_REGION = {
  latitude: 4.1594, // Latitude of Buea
  longitude: 9.2481, // Longitude of Buea
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const { height } = Dimensions.get('window');

export default function DeliveryAddress() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const googlePlacesAutoCompleteRef = useRef<GooglePlacesAutocompleteRef>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo =
    (params.returnTo as string | undefined) ?? '/(buyer)/(order)/checkout';

  const sheetRef = useRef<FilterBottomSheetRef>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(414);

  const onBottomSheetLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setSheetHeight(height + insets.bottom);
  };

  const { deliveryLocation, setDeliveryLocation } = useContext(
    Context,
  ) as ContextType;

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [addressQuery, setAddressQuery] = useState<string>(
    deliveryLocation?.description ?? '',
  );
  const [lastSelectedDescription, setLastSelectedDescription] = useState<
    string | null
  >(deliveryLocation?.description ?? null);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, e => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [currentLocation, setCurrentLocation] = useState<{
    description: string;
    region: Region;
  }>();

  useEffect(() => {
    const handleUseCurrentLocation = async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert(
            i18n.t('(buyer).(order).delivery-address.pleaseAcceptPermissions'),
          );
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});

        const address = await Location.reverseGeocodeAsync(
          currentLocation.coords,
        );

        setCurrentLocation({
          description: `${address[0].name}, ${address[0].city}, ${address[0].country}`,
          region: {
            ...currentLocation.coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
        });
      } catch (error) {
        console.error('Error getting location: ', error);
        alert(i18n.t('(buyer).(order).delivery-address.errorGettingLocation'));
      } finally {
        setLoadingLocation(false);
      }
    };
    sheetRef.current?.open();
    handleUseCurrentLocation();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      if (deliveryLocation?.region) {
        mapRef.current.animateToRegion(deliveryLocation.region, 1000);
      } else if (currentLocation?.region) {
        mapRef.current.animateToRegion(currentLocation.region, 1000);
      }
    }
  }, [deliveryLocation, currentLocation]);

  useEffect(() => {
    // Keep the controlled input in sync if deliveryLocation is set externally
    // (e.g., current location checkbox).
    if (deliveryLocation?.description && deliveryLocation.description !== addressQuery) {
      setAddressQuery(deliveryLocation.description);
      setLastSelectedDescription(deliveryLocation.description);
    }
    if (!deliveryLocation && addressQuery !== '' && lastSelectedDescription !== null) {
      setLastSelectedDescription(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryLocation?.description]);

  return (
    <>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={defaultStyles.flex} // keep your padding/margins
      >
        <View style={defaultStyles.flex}>
          <Appbar.Header
            dark={false}
            style={[defaultStyles.appHeader, defaultStyles.px12]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(buyer).(order).delivery-address.deliveryAddress')}
            </Text>
            <View />
          </Appbar.Header>
          <MapView
            key={'map-instance'}
            style={{
              height: height - (sheetHeight - insets.bottom),
            }}
            pointerEvents="none"
            ref={mapRef}
            initialRegion={INITIAL_REGION}
            showsUserLocation
            showsMyLocationButton
            paddingAdjustmentBehavior="automatic"
            provider={PROVIDER_GOOGLE} // use this in production
            mapType="standard" // Choose 'standard', 'satellite', or 'hybrid' as desired
            scrollEnabled={true}>
            {(deliveryLocation || currentLocation)?.region ? (
              <Marker
                key={`${
                  (deliveryLocation || currentLocation)?.region?.latitude
                },${(deliveryLocation || currentLocation)?.region?.longitude}`}
                coordinate={{
                  latitude:
                    (deliveryLocation || currentLocation)?.region?.latitude ??
                    0,
                  longitude:
                    (deliveryLocation || currentLocation)?.region.longitude ??
                    0,
                }}
                draggable
                onDragEnd={async e => {
                  const newCoordinates = e.nativeEvent.coordinate;
                  // const address = await Location.reverseGeocodeAsync({
                  //   latitude: newCoordinates.latitude,
                  //   longitude: newCoordinates.longitude,
                  // });
                }}
                title={(deliveryLocation || currentLocation)?.description}
                description={
                  (deliveryLocation || currentLocation)?.description
                }>
                <Callout>
                  <Text>
                    {(deliveryLocation || currentLocation)?.description}
                  </Text>
                </Callout>
              </Marker>
            ) : null}
          </MapView>
        </View>
        <View
          style={[styles.sheetContainer, { bottom: keyboardHeight }]}
          onLayout={onBottomSheetLayout}>
          <View style={styles.notch} />

          <Text
            variant="titleMedium"
            style={[defaultStyles.textCenter, styles.marginTop12]}>
            {i18n.t('(buyer).(order).delivery-address.addressDetails')}
          </Text>
          <View style={styles.bottomSheetContent}>
            <View style={styles.z99}>
              <Text variant="titleMedium" style={defaultStyles.text16}>
                {i18n.t('(buyer).(order).delivery-address.enterYourAddress')}
              </Text>
              <GooglePlacesAutocomplete
                ref={googlePlacesAutoCompleteRef}
                placeholder={i18n.t(
                  '(buyer).(order).delivery-address.addressHere',
                )}
                styles={{
                  textInput: styles.googlePlacesAutocompleteTextInput,
                  listView: styles.listView,
                }}
                textInputProps={{
                  placeholderTextColor: Colors.grey['3c'],
                  value: addressQuery,
                  onChangeText: text => {
                    setAddressQuery(text);
                    if (lastSelectedDescription && text !== lastSelectedDescription) {
                      setLastSelectedDescription(null);
                      setDeliveryLocation(undefined);
                    }
                  },
                }}
                onPress={(data, details = null) => {
                  setLoadingLocation(false);
                  setAddressQuery(data.description);
                  setLastSelectedDescription(data.description);
                  setDeliveryLocation({
                    description: data.description,
                    address: data?.description,
                    region: {
                      latitude: details?.geometry.location.lat ?? 0,
                      longitude: details?.geometry.location.lng ?? 0,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    },
                  });
                }}
                fetchDetails={true}
                nearbyPlacesAPI="GooglePlacesSearch"
                debounce={200}
                timeout={20000}
                minLength={3}
                predefinedPlaces={[]}
                enablePoweredByContainer={false}
                query={{
                  key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_AUTOCOMPLETE_KEY,
                  language: 'en',
                }}
                keyboardShouldPersistTaps="always"
              />
              <View style={[styles.flexRow, styles.marginTop12]}>
                {loadingLocation ? (
                  <ActivityIndicator color={Colors.primary[500]} />
                ) : (
                  <Checkbox.Android
                    color={Colors.primary[500]}
                    style={styles.checkBox}
                    status={
                      currentLocation?.description ===
                      deliveryLocation?.description
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() => {
                      if (
                        currentLocation?.description ===
                        deliveryLocation?.description
                      ) {
                        setDeliveryLocation(undefined);
                        setLastSelectedDescription(null);
                        setAddressQuery('');
                      } else if (currentLocation) {
                        setDeliveryLocation({
                          description: currentLocation?.description,
                          address: currentLocation?.description,
                          region: currentLocation?.region,
                        });
                        setLastSelectedDescription(currentLocation.description);
                        setAddressQuery(currentLocation.description);
                      }
                    }}
                  />
                )}
                <View style={styles.flexRowSmall}>
                  <Text variant="titleMedium" style={defaultStyles.text16}>
                    {i18n.t(
                      '(buyer).(order).delivery-address.useCurrentLocation',
                    )}
                  </Text>
                  <View style={styles.iconContainer}>
                    <Icon
                      source={'map-marker-outline'}
                      size={12}
                      color={Colors.grey['61']}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View
            style={[
              defaultStyles.bottomButtonContainer,
              defaultStyles.bgLight10,
              {
                paddingBottom: insets.bottom,
              },
            ]}>
            <Button
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                !deliveryLocation && defaultStyles.greyButton,
              ]}
              disabled={!deliveryLocation}
              contentStyle={[defaultStyles.center]}
              onPress={() => router.push(returnTo)}>
              <View style={defaultStyles.innerButtonContainer}>
                <View>
                  <Text variant="titleMedium" style={defaultStyles?.buttonText}>
                    {returnTo.includes('subscription')
                      ? 'Continue'
                      : i18n.t(
                          '(buyer).(order).delivery-address.proceedToCheckout',
                        )}
                  </Text>
                </View>

                <Icon
                  source={'arrow-right'}
                  color={Colors.light[10]}
                  size={24}
                />
              </View>
            </Button>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}
