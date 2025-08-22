import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import {
  Appbar,
  Icon,
  TextInput,
  Button,
  Dialog,
  Portal,
  Text,
  Avatar,
  Snackbar,
} from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { imagePickerStyles, signupStyles, defaultStyles } from '@/styles';
import { router } from 'expo-router';
import { usersCompleteRegistrationMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { delay, uploadImage } from '@/utils';
import { Context, ContextType } from '../_layout';
import i18n from '@/i18n';
import { ImagePicker } from '@/components';
import { Chase } from 'react-native-animated-spinkit';
import { Colors, emailRegex } from '@/constants';

import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
  GooglePlaceData,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';

import { UsersCompleteRegistrationBody } from '@/client/users.swagger';

const ProfilePage = () => {
  const { user, setUser } = useContext(Context) as ContextType;
  const [firstName, setFirstName] = useState(user?.firstName);
  const [lastName, setLastName] = useState(user?.lastName);
  const [email, setEmail] = useState(user?.email);
  const [address, setAddress] = useState(user?.address);
  const [locationCoordinates, setLocationCoordinates] = useState(
    user?.locationCoordinates,
  );
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<
    ExpoImagePicker.ImagePickerAsset | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);

  const googlePlacesAutoCompleteRef = useRef<GooglePlacesAutocompleteRef>(null);

  const [referralCode, setReferralCode] = useState<string>();

  const { mutateAsync: updateUserRegistration } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onError: async error => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).profile.unknownError'),
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async () => {
      setSuccessModalVisible(true);
      setTimeout(() => {
        if (user?.role === 'USER_ROLE_FARMER') {
          router.replace('/(farmer)/(index)');
        } else {
          router.replace('/(buyer)/(index)');
        }
      }, 3000);
    },
  });

  const handleComplete = async () => {
    try {
      setLoading(true);
      let imageUrl = user?.profileImage || null;

      if (profileImage) {
        imageUrl = await uploadImage({
          uri: profileImage.uri,
          filename: `profile_${user?.userId}_${Date.now()}.jpg`,
          directory: 'profile_images',
        });
      }

      const data: UsersCompleteRegistrationBody = {
        firstName,
        lastName,
        email,
        address,
        profileImage: imageUrl || undefined,

        locationCoordinates: locationCoordinates ?? undefined,
        referredBy: referralCode,
      };

      await updateUserRegistration({
        body: data,
        path: {
          userId: user?.userId ?? '',
        },
      });
      setUser({ ...data });
    } catch (error) {
      console.error('Error completing registration:', error);
      setErrorMessage(i18n.t('(auth).profile.uploadError'));
      setError(true);
      await delay(5000);
      setError(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (
    data: GooglePlaceData,
    details: GooglePlaceDetail | null,
  ) => {
    setAddress(data.description);
    if (details?.geometry?.location) {
      setLocationCoordinates({
        lat: details.geometry.location.lat,
        lon: details.geometry.location.lng,
        address: data.description,
      });
    } else {
      setLocationCoordinates(undefined);
    }
  };

  useEffect(() => {
    if (
      user?.locationCoordinates?.address &&
      googlePlacesAutoCompleteRef?.current
    ) {
      googlePlacesAutoCompleteRef.current.setAddressText(
        user?.locationCoordinates?.address,
      );
    }
  }, [user, googlePlacesAutoCompleteRef]);

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(auth).profile.completeRegistration')}
            </Text>
            <View />
          </Appbar.Header>
          <View style={signupStyles.imageContainer}>
            <TouchableOpacity
              onPress={() => setIsImagePickerVisible(true)}
              style={signupStyles.imageUpload}>
              {profileImage?.uri ? (
                <Image
                  source={{ uri: profileImage.uri }}
                  style={signupStyles.profileImage}
                />
              ) : (
                <View style={signupStyles.addImageContainer}>
                  <Avatar.Icon
                    size={120}
                    icon="account"
                    style={signupStyles.account}
                  />
                  <Avatar.Icon
                    size={24}
                    icon="camera"
                    color="#fff"
                    style={signupStyles.cameraIcon}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled>
            <View style={signupStyles.allInput}>
              <TextInput
                label={i18n.t('(auth).profile.firstName')}
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={defaultStyles.input}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: Colors.grey['fa'],
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                outlineColor={Colors.grey['bg']}
              />

              <TextInput
                label={i18n.t('(auth).profile.lastName')}
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={defaultStyles.input}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: Colors.grey['fa'],
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                outlineColor={Colors.grey['bg']}
              />

              <TextInput
                mode="outlined"
                label={i18n.t('(auth).profile.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!email && email?.length > 0 && !emailRegex.test(email)}
                outlineColor={Colors.grey['bg']}
                style={defaultStyles.input}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: Colors.grey['fa'],
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
              />

              <View style={defaultStyles.flex}>
                <GooglePlacesAutocomplete
                  ref={googlePlacesAutoCompleteRef}
                  placeholder={i18n.t(
                    '(farmer).(profile-flow).(personal-info).address',
                  )}
                  query={{
                    key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_AUTOCOMPLETE_KEY,
                    language: 'en',
                  }}
                  styles={{
                    textInput: {
                      ...defaultStyles.input,
                      backgroundColor: Colors.light[10],
                      height: 56,
                      borderRadius: 15,
                      borderColor: Colors.grey['bg'],
                      borderWidth: 1,
                      paddingLeft: 28,
                      fontWeight: '500',
                    },
                    listView: {
                      backgroundColor: Colors.light[10],
                      borderRadius: 15,
                      marginTop: 5,
                      elevation: 3,
                      maxHeight: 200, // scroll instead of pushing UI
                      zIndex: 9999,
                    },
                    row: {
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    },
                  }}
                  renderRow={data => (
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                      <Text
                        style={{
                          flexShrink: 1, // critical for wrapping
                          flexGrow: 1,
                          fontSize: 14,
                          lineHeight: 18,
                          color: Colors.grey['3c'],
                        }}
                        numberOfLines={0} // unlimited wrapping
                      >
                        {data.description}
                      </Text>
                    </View>
                  )}
                  textInputProps={{
                    placeholderTextColor: Colors.grey['3c'],
                    value: address,
                    onChangeText: setAddress,
                  }}
                  onPress={(data, details) =>
                    handleAddressSelect(data, details)
                  }
                  fetchDetails={true}
                  nearbyPlacesAPI="GooglePlacesSearch"
                  debounce={200}
                  timeout={20000}
                  minLength={3}
                  enablePoweredByContainer={false}
                  predefinedPlaces={[]}
                />
              </View>

              {user?.role === 'USER_ROLE_BUYER' && (
                <TextInput
                  label={i18n.t('(auth).profile.referralCode')}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  mode="outlined"
                  style={defaultStyles.input}
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey['fa'],
                      error: Colors.error,
                    },
                    roundness: 10,
                  }}
                  outlineColor={Colors.grey['bg']}
                />
              )}
            </View>
          </ScrollView>
        </View>
        <View style={defaultStyles.bottomButtonContainer}>
          <View style={signupStyles.flexButtonContainer}>
            {user?.role === 'USER_ROLE_BUYER' && (
              <Button
                mode="contained"
                textColor={Colors.primary['500']}
                buttonColor={Colors.primary['50']}
                onPress={() => {
                  router.replace('/(buyer)/(index)');
                }}
                style={[defaultStyles.button, signupStyles.button]}
                disabled={loading}>
                <Text style={defaultStyles.secondaryButtonText}>Skip</Text>
              </Button>
            )}

            <Button
              mode="contained"
              textColor={Colors.light['0']}
              buttonColor={Colors.primary['500']}
              style={[
                defaultStyles.button,
                signupStyles.button,
                user?.role === 'USER_ROLE_FARMER' && signupStyles.fullWidth,
              ]}
              loading={loading}
              disabled={
                !firstName || !lastName || !locationCoordinates || loading
              }
              onPress={handleComplete}>
              <Text style={defaultStyles.buttonText}>Complete</Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImagePicker
        visible={isImagePickerVisible}
        setImage={setProfileImage}
        onClose={() => setIsImagePickerVisible(false)}
        aspect={[1, 1]}
      />

      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => {}}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Image
              source={require('@/assets/images/success.png')}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t('(auth).profile.congratulations')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(auth).profile.registrationCompleteMessage')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Chase size={56} color={Colors.primary[500]} />
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};

export default ProfilePage;
